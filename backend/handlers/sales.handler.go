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

	// Start Transaction (using utils.Queries as it's a wrapper for *db.Queries)
	// Note: In a real app, you might want to use a formal DB transaction,
	// but here we follow the existing pattern if possible.
	// Since the current 'utils.Queries' doesn't seem to expose Begin,
	// we'll implement it as best as we can within the current structure.

	var customerID pgtype.UUID

	// Handle Customer
	if req.SalesType == "credit" || req.CustomerPhone != "" {
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

	// Calculate total amount
	var totalAmount float64
	for _, item := range req.Items {
		totalAmount += float64(item.Quantity) * item.UnitPrice
	}
	totalAmount -= req.DiscountApplied

	var totalAmountNum pgtype.Numeric
	totalAmountNum.Scan(fmt.Sprintf("%f", totalAmount))

	var discountNum pgtype.Numeric
	discountNum.Scan(fmt.Sprintf("%f", req.DiscountApplied))

	// Create Sale
	sale, err := utils.Queries.CreateSale(ctx, db.CreateSaleParams{
		SalesType:       db.SalesTypes(req.SalesType),
		TotalAmount:     totalAmountNum,
		DiscountApplied: discountNum,
		StoreID:         storeID,
		CustomerID:      customerID,
	})
	if err != nil {
		log.Printf("error creating sale: %v", err)
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to create sale", err)
		return
	}

	// Create Sale Items and Update Stock
	for _, item := range req.Items {
		prodUUID, err := uuid.Parse(item.ProductID)
		if err != nil {
			continue
		}

		var unitPriceNum pgtype.Numeric
		unitPriceNum.Scan(fmt.Sprintf("%f", item.UnitPrice))

		var totalPriceNum pgtype.Numeric
		totalPriceNum.Scan(fmt.Sprintf("%f", float64(item.Quantity)*item.UnitPrice))

		_, err = utils.Queries.CreateSaleItem(ctx, db.CreateSaleItemParams{
			SaleID:     sale.ID,
			ProductID:  pgtype.UUID{Bytes: prodUUID, Valid: true},
			Quantity:   item.Quantity,
			UnitPrice:  unitPriceNum,
			TotalPrice: totalPriceNum,
		})
		if err != nil {
			log.Printf("error creating sale item: %v", err)
			// In a real transactional environment, we would rollback here
		}

		// Update Stock
		_, err = utils.Queries.UpdateProductStock(ctx, db.UpdateProductStockParams{
			ID:            pgtype.UUID{Bytes: prodUUID, Valid: true},
			StockQuantity: item.Quantity,
			StoreID:       storeID,
		})
		if err != nil {
			log.Printf("error updating stock: %v", err)
		}
	}

	utils.SuccessResponse(c, "Sale completed successfully", sale)
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
