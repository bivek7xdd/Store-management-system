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

type CreateStockChangeRequest struct {
	ProductID  string `json:"product_id" binding:"required,uuid"`
	ChangeType string `json:"change_type" binding:"required,oneof=restock sale return spoiled adjustment"`
	Quantity   int32  `json:"quantity" binding:"required"`
	Notes      string `json:"notes"`
}

func CreateStockChangeHandler(c *gin.Context) {
	var req CreateStockChangeRequest
	userID := c.GetString("user_id")

	if err := c.ShouldBindJSON(&req); err != nil {
		if errs, ok := err.(validator.ValidationErrors); ok {
			for _, fieldErr := range errs {
				var errMsg string
				switch fieldErr.Field() {
				case "ProductID":
					errMsg = "Valid product ID is required"
				case "ChangeType":
					errMsg = "Change type must be: restock, sale, return, spoiled, or adjustment"
				case "Quantity":
					errMsg = "Quantity is required"
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

	// Get current product stock
	product, err := utils.Queries.GetProductById(context.Background(), uuid.MustParse(req.ProductID))
	if err != nil {
		utils.ErrorResponse(c, http.StatusNotFound, "Product not found", err)
		return
	}

	previousQuantity := product.StockQuantity
	newQuantity := previousQuantity

	// Calculate new quantity based on change type
	switch req.ChangeType {
	case "restock", "return":
		newQuantity = previousQuantity + req.Quantity
	case "sale", "spoiled":
		newQuantity = previousQuantity - req.Quantity
		if newQuantity < 0 {
			utils.ErrorResponse(c, http.StatusBadRequest, "Insufficient stock", nil)
			return
		}
	case "adjustment":
		newQuantity = req.Quantity
	}

	// Create stock change record
	stockChange, err := utils.Queries.CreateStockChange(context.Background(), db.CreateStockChangeParams{
		ProductID:        uuid.MustParse(req.ProductID),
		UserID:           pgtype.UUID{Bytes: uuid.MustParse(userID), Valid: true},
		ChangeType:       req.ChangeType,
		Quantity:         req.Quantity,
		PreviousQuantity: previousQuantity,
		NewQuantity:      newQuantity,
		Notes:            pgtype.Text{String: req.Notes, Valid: req.Notes != ""},
	})

	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to create stock change", err)
		return
	}

	// Update product stock
	_, err = utils.Queries.UpdateProductStock(context.Background(), db.UpdateProductStockParams{
		ID:            uuid.MustParse(req.ProductID),
		StockQuantity: newQuantity,
	})

	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to update product stock", err)
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message":      "Stock change recorded successfully",
		"stock_change": stockChange,
	})
}

func GetStockChangeHandler(c *gin.Context) {
	stockChangeID := c.Param("id")

	id, err := uuid.Parse(stockChangeID)
	if err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Invalid stock change ID", err)
		return
	}

	stockChange, err := utils.Queries.GetStockChangeById(context.Background(), id)
	if err != nil {
		utils.ErrorResponse(c, http.StatusNotFound, "Stock change not found", err)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"stock_change": stockChange,
	})
}

func ListStockChangesHandler(c *gin.Context) {
	storeID := c.GetString("store_id")
	limitStr := c.DefaultQuery("limit", "50")
	offsetStr := c.DefaultQuery("offset", "0")

	limit, _ := strconv.Atoi(limitStr)
	offset, _ := strconv.Atoi(offsetStr)

	stockChanges, err := utils.Queries.ListStockChanges(context.Background(), db.ListStockChangesParams{
		StoreID: uuid.MustParse(storeID),
		Limit:   int32(limit),
		Offset:  int32(offset),
	})

	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to fetch stock changes", err)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"stock_changes": stockChanges,
		"count":         len(stockChanges),
		"limit":         limit,
		"offset":        offset,
	})
}

func ListStockChangesByProductHandler(c *gin.Context) {
	productID := c.Param("product_id")

	id, err := uuid.Parse(productID)
	if err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Invalid product ID", err)
		return
	}

	stockChanges, err := utils.Queries.ListStockChangesByProduct(context.Background(), id)
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to fetch stock changes", err)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"stock_changes": stockChanges,
		"count":         len(stockChanges),
	})
}

func ListStockChangesByTypeHandler(c *gin.Context) {
	storeID := c.GetString("store_id")
	changeType := c.Param("type")
	limitStr := c.DefaultQuery("limit", "50")
	offsetStr := c.DefaultQuery("offset", "0")

	limit, _ := strconv.Atoi(limitStr)
	offset, _ := strconv.Atoi(offsetStr)

	stockChanges, err := utils.Queries.ListStockChangesByType(context.Background(), db.ListStockChangesByTypeParams{
		StoreID:    uuid.MustParse(storeID),
		ChangeType: changeType,
		Limit:      int32(limit),
		Offset:     int32(offset),
	})

	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to fetch stock changes", err)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"stock_changes": stockChanges,
		"count":         len(stockChanges),
		"change_type":   changeType,
	})
}

func ListStockChangesByDateRangeHandler(c *gin.Context) {
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

	stockChanges, err := utils.Queries.ListStockChangesByDateRange(context.Background(), db.ListStockChangesByDateRangeParams{
		StoreID:    uuid.MustParse(storeID),
		ChangeDate: pgtype.Timestamptz{Time: start, Valid: true},
		ChangeDate_2: pgtype.Timestamptz{Time: end, Valid: true},
	})

	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to fetch stock changes", err)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"stock_changes": stockChanges,
		"count":         len(stockChanges),
		"start_date":    startDate,
		"end_date":      endDate,
	})
}
