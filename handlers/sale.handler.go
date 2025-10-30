package handlers

import (
	"context"
	"errors"
	"net/http"
	"strconv"
	"time"

	db "storemanagement/db/sqlc"
	"storemanagement/utils"

	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
)

type SaleItemRequest struct {
	ProductID   string  `json:"product_id" binding:"required,uuid"`
	ProductName string  `json:"product_name" binding:"required"`
	Quantity    int32   `json:"quantity" binding:"required,gt=0"`
	UnitPrice   float64 `json:"unit_price" binding:"required,gt=0"`
	Discount    float64 `json:"discount" binding:"omitempty,gte=0"`
}

type CreateSaleRequest struct {
	CustomerID      string            `json:"customer_id" binding:"omitempty,uuid"`
	SaleType        string            `json:"sale_type" binding:"required,oneof=cash credit card mobile_money"`
	Items           []SaleItemRequest `json:"items" binding:"required,min=1"`
	DiscountApplied float64           `json:"discount_applied" binding:"omitempty,gte=0"`
	TaxAmount       float64           `json:"tax_amount" binding:"omitempty,gte=0"`
	Notes           string            `json:"notes"`
}

func CreateSaleHandler(c *gin.Context) {
	var req CreateSaleRequest
	storeID := c.GetString("store_id")
	userID := c.GetString("user_id")

	if err := c.ShouldBindJSON(&req); err != nil {
		if errs, ok := err.(validator.ValidationErrors); ok {
			for _, fieldErr := range errs {
				var errMsg string
				switch fieldErr.Field() {
				case "SaleType":
					errMsg = "Sale type must be: cash, credit, card, or mobile_money"
				case "Items":
					errMsg = "At least one item is required"
				default:
					errMsg = fieldErr.Error()
				}
				utils.ErrorResponse(c, http.StatusBadRequest, "Validation failed", errors.New(errMsg))
				return
			}
		}
		utils.ErrorResponse(c, http.StatusBadRequest, "Invalid request", err)
		return
	}

	// Calculate totals
	var totalAmount float64
	for _, item := range req.Items {
		subtotal := (item.UnitPrice * float64(item.Quantity)) - item.Discount
		totalAmount += subtotal
	}

	finalAmount := totalAmount - req.DiscountApplied + req.TaxAmount

	// Create sale
	var customerID pgtype.UUID
	if req.CustomerID != "" {
		customerID = pgtype.UUID{Bytes: uuid.MustParse(req.CustomerID), Valid: true}
	}

	sale, err := utils.Queries.CreateSale(context.Background(), db.CreateSaleParams{
		StoreID:         uuid.MustParse(storeID),
		UserID:          pgtype.UUID{Bytes: uuid.MustParse(userID), Valid: true},
		CustomerID:      customerID,
		SaleType:        req.SaleType,
		TotalAmount:     totalAmount,
		DiscountApplied: req.DiscountApplied,
		TaxAmount:       req.TaxAmount,
		FinalAmount:     finalAmount,
		ReceiptNumber:   pgtype.Text{String: generateReceiptNumber(), Valid: true},
		Notes:           pgtype.Text{String: req.Notes, Valid: req.Notes != ""},
	})

	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to create sale", err)
		return
	}

	// Create sale items
	var saleItems []db.SaleItem
	for _, item := range req.Items {
		subtotal := (item.UnitPrice * float64(item.Quantity)) - item.Discount

		saleItem, err := utils.Queries.CreateSaleItem(context.Background(), db.CreateSaleItemParams{
			SaleID:      sale.ID,
			ProductID:   uuid.MustParse(item.ProductID),
			ProductName: item.ProductName,
			Quantity:    item.Quantity,
			UnitPrice:   item.UnitPrice,
			Subtotal:    subtotal,
			Discount:    item.Discount,
		})

		if err != nil {
			utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to create sale item", err)
			return
		}

		saleItems = append(saleItems, saleItem)

		// Update product stock
		product, _ := utils.Queries.GetProductById(context.Background(), uuid.MustParse(item.ProductID))
		newStock := product.StockQuantity - item.Quantity
		utils.Queries.UpdateProductStock(context.Background(), db.UpdateProductStockParams{
			ID:            uuid.MustParse(item.ProductID),
			StockQuantity: newStock,
		})
	}

	c.JSON(http.StatusCreated, gin.H{
		"message":    "Sale created successfully",
		"sale":       sale,
		"sale_items": saleItems,
	})
}

func GetSaleHandler(c *gin.Context) {
	saleID := c.Param("id")
	storeID := c.GetString("store_id")

	id, err := uuid.Parse(saleID)
	if err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Invalid sale ID", err)
		return
	}

	sale, err := utils.Queries.GetSaleById(context.Background(), db.GetSaleByIdParams{
		ID:      id,
		StoreID: uuid.MustParse(storeID),
	})

	if err != nil {
		utils.ErrorResponse(c, http.StatusNotFound, "Sale not found", err)
		return
	}

	// Get sale items
	items, _ := utils.Queries.GetSaleItems(context.Background(), id)

	c.JSON(http.StatusOK, gin.H{
		"sale":  sale,
		"items": items,
	})
}

func ListSalesHandler(c *gin.Context) {
	storeID := c.GetString("store_id")
	limitStr := c.DefaultQuery("limit", "20")
	offsetStr := c.DefaultQuery("offset", "0")

	limit, _ := strconv.Atoi(limitStr)
	offset, _ := strconv.Atoi(offsetStr)

	sales, err := utils.Queries.ListSales(context.Background(), db.ListSalesParams{
		StoreID: uuid.MustParse(storeID),
		Limit:   int32(limit),
		Offset:  int32(offset),
	})

	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to fetch sales", err)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"sales":  sales,
		"count":  len(sales),
		"limit":  limit,
		"offset": offset,
	})
}

func GetSalesByDateRangeHandler(c *gin.Context) {
	storeID := c.GetString("store_id")
	startDate := c.Query("start_date")
	endDate := c.Query("end_date")

	if startDate == "" || endDate == "" {
		utils.ErrorResponse(c, http.StatusBadRequest, "start_date and end_date are required", nil)
		return
	}

	start, err := time.Parse("2006-01-02", startDate)
	if err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Invalid start_date format (use YYYY-MM-DD)", err)
		return
	}

	end, err := time.Parse("2006-01-02", endDate)
	if err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Invalid end_date format (use YYYY-MM-DD)", err)
		return
	}

	sales, err := utils.Queries.ListSalesByDateRange(context.Background(), db.ListSalesByDateRangeParams{
		StoreID:  uuid.MustParse(storeID),
		SaleDate: pgtype.Timestamptz{Time: start, Valid: true},
		SaleDate_2: pgtype.Timestamptz{Time: end, Valid: true},
	})

	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to fetch sales", err)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"sales":      sales,
		"count":      len(sales),
		"start_date": startDate,
		"end_date":   endDate,
	})
}

func GetSalesTotalHandler(c *gin.Context) {
	storeID := c.GetString("store_id")
	startDate := c.Query("start_date")
	endDate := c.Query("end_date")

	if startDate == "" || endDate == "" {
		utils.ErrorResponse(c, http.StatusBadRequest, "start_date and end_date are required", nil)
		return
	}

	start, _ := time.Parse("2006-01-02", startDate)
	end, _ := time.Parse("2006-01-02", endDate)

	total, err := utils.Queries.GetSalesTotalByDateRange(context.Background(), db.GetSalesTotalByDateRangeParams{
		StoreID:  uuid.MustParse(storeID),
		SaleDate: pgtype.Timestamptz{Time: start, Valid: true},
		SaleDate_2: pgtype.Timestamptz{Time: end, Valid: true},
	})

	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to calculate totals", err)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"total_sales":   total.TotalSales,
		"total_revenue": total.TotalRevenue,
		"start_date":    startDate,
		"end_date":      endDate,
	})
}

// Helper function to generate receipt number
func generateReceiptNumber() string {
	return "RCP-" + time.Now().Format("20060102-150405")
}
