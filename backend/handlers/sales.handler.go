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
	Quantity  int32   `json:"quantity" binding:"required"`
	UnitPrice float64 `json:"unit_price" binding:"required"`
}

type createSaleReq struct {
	SalesType       string        `json:"sales_type" binding:"required"`
	AmountPaid      float64       `json:"amount_paid"`
	Note            string        `json:"note"`
	DiscountApplied float64       `json:"discount_applied"`
	CustomerID      string        `json:"customer_id"`
	CustomerName    string        `json:"customer_name"`
	CustomerPhone   string        `json:"customer_phone"`
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

	// Calculate total amount
	var totalAmount float64
	for _, item := range req.Items {
		totalAmount += float64(item.Quantity) * item.UnitPrice
	}
	totalAmount -= req.DiscountApplied

	// Validate AmountPaid
	if req.AmountPaid < 0 {
		utils.ErrorResponse(c, http.StatusBadRequest, "Amount paid cannot be negative", nil)
		return
	}

	// Determine effective sales type and debt status
	isDebt := false
	if req.AmountPaid < totalAmount {
		isDebt = true
		req.SalesType = "credit" // Force credit if partial payment
		if req.CustomerName == "" && req.CustomerPhone == "" && req.CustomerID == "" {
			utils.ErrorResponse(c, http.StatusBadRequest, "Customer details required for partial payment/credit", nil)
			return
		}
	}

	var customerID pgtype.UUID

	// Handle Customer Creation/Lookup if needed
	if req.SalesType == "credit" || req.CustomerPhone != "" || req.CustomerID != "" {
		if req.CustomerID != "" {
			custUUID, _ := uuid.Parse(req.CustomerID)
			customerID = pgtype.UUID{Bytes: custUUID, Valid: true}
		} else if req.CustomerPhone != "" {
			// Look up customer by phone
			cust, err := utils.Queries.GetCustomerByPhone(ctx, db.GetCustomerByPhoneParams{
				Phone:   req.CustomerPhone,
				StoreID: storeID,
			})
			if err == nil {
				customerID = cust.ID
			} else {
				// Create new customer
				newCust, err := utils.Queries.CreateCustomer(ctx, db.CreateCustomerParams{
					Name:    req.CustomerName,
					Phone:   req.CustomerPhone,
					StoreID: storeID,
				})
				if err != nil {
					utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to create customer", err)
					return
				}
				customerID = newCust.ID
			}
		}
	}

	var totalAmountNum pgtype.Numeric
	totalAmountNum.Scan(fmt.Sprintf("%f", totalAmount))

	var discountNum pgtype.Numeric
	discountNum.Scan(fmt.Sprintf("%f", req.DiscountApplied))

	// Prepare Transaction Arguments
	createSaleParams := db.CreateSaleParams{
		SalesType:       db.SalesTypes(req.SalesType),
		TotalAmount:     totalAmountNum,
		DiscountApplied: discountNum,
		StoreID:         storeID,
		CustomerID:      customerID,
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

		saleItems = append(saleItems, db.CreateSaleItemParams{
			ProductID:  pgtype.UUID{Bytes: prodUUID, Valid: true},
			Quantity:   item.Quantity,
			UnitPrice:  unitPriceNum,
			TotalPrice: totalPriceNum,
		})
	}

	var createDebtParams *db.CreateDebtParams
	if isDebt {
		amountOwed := totalAmount - req.AmountPaid

		var amountOwedNum pgtype.Numeric
		amountOwedNum.Scan(fmt.Sprintf("%f", amountOwed))

		var amountPaidNum pgtype.Numeric
		amountPaidNum.Scan(fmt.Sprintf("%f", req.AmountPaid))

		// Default due date to 30 days from now
		// TODO: Allow frontend to pass due date
		dueDate := pgtype.Timestamptz{
			Time:  time.Now().AddDate(0, 0, 30),
			Valid: true,
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
	result, err := utils.Store.CreateSaleTx(c.Request.Context(), db.CreateSaleTxParams{
		CreateSaleParams: createSaleParams,
		Items:            saleItems,
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
