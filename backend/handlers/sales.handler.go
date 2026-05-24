package handlers

import (
	"context"
	"fmt"
	"log"
	"net/http"
	db "storemanagement/db/sqlc"
	"storemanagement/utils"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
)

type saleItemReq struct {
	ProductID string  `json:"product_id" binding:"required"`
	VariantID string  `json:"variant_id"`
	Quantity  int32   `json:"quantity" binding:"required"`
	UnitPrice float64 `json:"unit_price" binding:"required"`
}

type paymentReq struct {
	Amount      float64 `json:"amount" binding:"required"`
	PaymentType string  `json:"payment_type" binding:"required"`
	Provider    string  `json:"provider"`
}

type createSaleReq struct {
	SalesType       string        `json:"sales_type"`
	Payments        []paymentReq  `json:"payments"`
	Note            string        `json:"note"`
	DueDate         string        `json:"due_date"`
	DiscountApplied float64       `json:"discount_applied"`
	CustomerID      string        `json:"customer_id" binding:"required"`
	Items           []saleItemReq `json:"items" binding:"required"`
}

func CreateSale(c *gin.Context) {
	var req createSaleReq
	storeID := c.MustGet("store_id").(pgtype.UUID)

	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Invalid request body", err)
		return
	}

	ctx, cancel := context.WithTimeout(c.Request.Context(), 10*time.Second)
	defer cancel()

	// Validate items
	for _, item := range req.Items {
		if item.Quantity <= 0 {
			utils.ErrorResponse(c, http.StatusBadRequest, "Item quantity must be greater than 0", nil)
			return
		}
		if item.UnitPrice < 0 {
			utils.ErrorResponse(c, http.StatusBadRequest, "Item unit price must be non-negative", nil)
			return
		}
	}

	// Calculate total amount from items
	var totalAmount float64
	for _, item := range req.Items {
		totalAmount += float64(item.Quantity) * item.UnitPrice
	}
	totalAmount -= req.DiscountApplied

	// Calculate total payments received (excluding credit which is debt)
	var sumPayments float64
	var paymentsParams []db.CreatePaymentRecordParams
	for _, p := range req.Payments {
		var amountNum pgtype.Numeric
		amountNum.Scan(fmt.Sprintf("%f", p.Amount))
		
		paymentsParams = append(paymentsParams, db.CreatePaymentRecordParams{
			Amount:      amountNum,
			PaymentType: db.SalesTypes(p.PaymentType),
			Provider:    pgtype.Text{String: p.Provider, Valid: p.Provider != ""},
		})
		
		if p.PaymentType != "credit" {
			sumPayments += p.Amount
		}
	}

	// Determine effective sales type and debt status
	isDebt := false
	effectiveSalesType := "cash"
	if len(req.Payments) > 1 {
		effectiveSalesType = "mixed"
	} else if len(req.Payments) == 1 {
		effectiveSalesType = req.Payments[0].PaymentType
	}

	if sumPayments < totalAmount {
		isDebt = true
		effectiveSalesType = "credit"
	}

	var customerID pgtype.UUID
	if req.CustomerID != "" {
		custUUID, err := uuid.Parse(req.CustomerID)
		if err != nil {
			utils.ErrorResponse(c, http.StatusBadRequest, "Invalid customer ID", err)
			return
		}
		customerID = pgtype.UUID{Bytes: custUUID, Valid: true}
	}

	var totalAmountNum pgtype.Numeric
	totalAmountNum.Scan(fmt.Sprintf("%f", totalAmount))

	var discountNum pgtype.Numeric
	discountNum.Scan(fmt.Sprintf("%f", req.DiscountApplied))

	// Prepare Transaction Arguments
	createSaleParams := db.CreateSaleParams{
		SalesType:       db.SalesTypes(effectiveSalesType),
		TotalAmount:     totalAmountNum,
		DiscountApplied: discountNum,
		StoreID:         storeID,
		CustomerID:      customerID,
		SaleDate:        pgtype.Timestamptz{Time: time.Now(), Valid: true},
	}

	var saleItems []db.CreateSaleItemParams
	for _, item := range req.Items {
		prodUUID, err := uuid.Parse(item.ProductID)
		if err != nil {
			continue
		}

		var unitPriceNum pgtype.Numeric
		unitPriceNum.Scan(fmt.Sprintf("%f", item.UnitPrice))

		var totalPriceNum pgtype.Numeric
		totalPriceNum.Scan(fmt.Sprintf("%f", float64(item.Quantity)*item.UnitPrice))

		var variantID pgtype.UUID
		if item.VariantID != "" {
			vUUID, err := uuid.Parse(item.VariantID)
			if err == nil {
				variantID = pgtype.UUID{Bytes: vUUID, Valid: true}
			}
		}

		saleItems = append(saleItems, db.CreateSaleItemParams{
			SaleID:     pgtype.UUID{}, // Will be set in transaction
			ProductID:  pgtype.UUID{Bytes: prodUUID, Valid: true},
			VariantID:  variantID,
			Quantity:   item.Quantity,
			UnitPrice:  unitPriceNum,
			TotalPrice: totalPriceNum,
		})
	}

	var createDebtParams *db.CreateDebtParams
	if isDebt {
		// AmountOwed should be the TOTAL amount, not the remaining amount
		// Outstanding is calculated as: amount_owed - amount_paid
		var amountOwedNum pgtype.Numeric
		amountOwedNum.Scan(fmt.Sprintf("%f", totalAmount))

		var amountPaidNum pgtype.Numeric
		amountPaidNum.Scan(fmt.Sprintf("%f", sumPayments))

		// Handle Due Date
		var dueDate pgtype.Timestamptz
		if req.DueDate != "" {
			parsedDate, err := time.Parse("2006-01-02", req.DueDate)
			if err == nil {
				dueDate = pgtype.Timestamptz{Time: parsedDate, Valid: true}
			} else {
				// Fallback to 30 days if parsing fails
				dueDate = pgtype.Timestamptz{Time: time.Now().AddDate(0, 0, 30), Valid: true}
			}
		} else {
			dueDate = pgtype.Timestamptz{Time: time.Now().AddDate(0, 0, 30), Valid: true}
		}

		createDebtParams = &db.CreateDebtParams{
			StoreID:    storeID,
			CustomerID: customerID,
			// SaleID will be linked in CreateSaleTx
			AmountOwed: amountOwedNum,
			AmountPaid: amountPaidNum,
			DueDate:    dueDate,
			Status:     db.DebtStatusPartial,
			Notes:      pgtype.Text{String: req.Note, Valid: req.Note != ""},
		}
	}

	// Execute Transaction
	result, err := utils.Store.CreateSaleTx(ctx, db.CreateSaleTxParams{
		CreateSaleParams: createSaleParams,
		Items:            saleItems,
		Payments:         paymentsParams,
		CreateDebtParams: createDebtParams,
	})

	if err != nil {
		log.Printf("error process sale transaction: %v", err)
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to complete sale transaction", err)
		return
	}

	utils.SuccessResponse(c, "Sale completed successfully", result.Sale)
}

func ListSales(c *gin.Context) {
	storeID := c.MustGet("store_id").(pgtype.UUID)

	ctx, cancel := context.WithTimeout(c.Request.Context(), 5*time.Second)
	defer cancel()

	sales, err := utils.Queries.ListSales(ctx, storeID)
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to fetch sales", err)
		return
	}

	if sales == nil {
		sales = []db.ListSalesRow{}
	}

	utils.SuccessResponse(c, "Sales fetched successfully", sales)
}

func GetSaleDetails(c *gin.Context) {
	storeID := c.MustGet("store_id").(pgtype.UUID)
	saleIDParam := c.Param("id")

	saleUUID, err := uuid.Parse(saleIDParam)
	if err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Invalid sale ID", err)
		return
	}

	ctx, cancel := context.WithTimeout(c.Request.Context(), 5*time.Second)
	defer cancel()

	sale, err := utils.Queries.GetSale(ctx, db.GetSaleParams{
		ID:      pgtype.UUID{Bytes: saleUUID, Valid: true},
		StoreID: storeID,
	})
	if err != nil {
		utils.ErrorResponse(c, http.StatusNotFound, "Sale not found", err)
		return
	}

	items, err := utils.Queries.GetSaleItems(ctx, sale.ID)
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to fetch sale items", err)
		return
	}

	utils.SuccessResponse(c, "Sale details fetched successfully", gin.H{
		"sale":  sale,
		"items": items,
	})
}
