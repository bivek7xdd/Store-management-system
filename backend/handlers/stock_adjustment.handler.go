package handlers

import (
	"context"
	"log"
	"net/http"
	"strconv"
	"time"

	db "storemanagement/db/sqlc"
	"storemanagement/utils"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgtype"
)

type createStockAdjustmentReq struct {
	ProductID          string `json:"product_id" binding:"required"`
	VariantID          string `json:"variant_id"`
	AdjustmentQuantity int32  `json:"adjustment_quantity" binding:"required"`
	Reason             string `json:"reason" binding:"required"`
	Notes              string `json:"notes"`
}

func CreateStockAdjustment(c *gin.Context) {
	storeID, ok := utils.GetStoreID(c)
	if !ok {
		utils.ErrorResponse(c, http.StatusUnauthorized, "Store not found", nil)
		return
	}

	var userID pgtype.UUID
	if uid, exists := c.Get("user_id"); exists {
		userID, _ = uid.(pgtype.UUID)
	}

	var req createStockAdjustmentReq
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Invalid request body", err)
		return
	}

	if req.AdjustmentQuantity == 0 {
		utils.ErrorResponse(c, http.StatusBadRequest, "Adjustment quantity cannot be zero", nil)
		return
	}

	validReasons := map[string]bool{
		"physical_count": true, "damaged": true, "expired": true,
		"theft": true, "correction": true, "return": true, "other": true,
	}
	if !validReasons[req.Reason] {
		utils.ErrorResponse(c, http.StatusBadRequest, "Invalid reason", nil)
		return
	}

	ctx, cancel := context.WithTimeout(c.Request.Context(), 10*time.Second)
	defer cancel()

	productUUID, err := utils.ParseUUID(req.ProductID)
	if err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Invalid product ID", err)
		return
	}

	variantUUID, err := utils.ParseUUID(req.VariantID)
	if err != nil {
		variantUUID = pgtype.UUID{}
	}

	product, err := utils.Queries.GetProduct(ctx, db.GetProductParams{
		ID:      productUUID,
		StoreID: storeID,
	})
	if err != nil {
		utils.ErrorResponse(c, http.StatusNotFound, "Product not found", err)
		return
	}

	previousQuantity := product.StockQuantity
	newQuantity := previousQuantity + req.AdjustmentQuantity

	if newQuantity < 0 {
		utils.ErrorResponse(c, http.StatusBadRequest, "Adjustment would result in negative stock", nil)
		return
	}

	adjustment, err := utils.Queries.CreateStockAdjustment(ctx, db.CreateStockAdjustmentParams{
		StoreID:            storeID,
		ProductID:          productUUID,
		VariantID:          variantUUID,
		AdjustmentQuantity: req.AdjustmentQuantity,
		PreviousQuantity:   previousQuantity,
		NewQuantity:        newQuantity,
		Reason:             db.StockAdjustmentReason(req.Reason),
		Notes:              utils.OptionalText(req.Notes),
		AdjustedBy:         userID,
	})
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to create adjustment", err)
		return
	}

	_, err = utils.Queries.UpdateProduct(ctx, db.UpdateProductParams{
		ID:                productUUID,
		StockQuantity:     newQuantity,
		StoreID:           storeID,
		Name:              product.Name,
		Barcode:           product.Barcode,
		Price:             product.Price,
		CostPrice:         product.CostPrice,
		MarketPrice:       product.MarketPrice,
		LowStockThreshold: product.LowStockThreshold,
		ExpiresAt:         product.ExpiresAt,
		Status:            product.Status,
		CategoryID:        product.CategoryID,
		SupplierID:        product.SupplierID,
		ImageUrl:          product.ImageUrl,
		IsTracked:         product.IsTracked,
		DamagedQuantity:   product.DamagedQuantity,
		WarrantyDays:      product.WarrantyDays,
	})
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to update stock", err)
		return
	}

	_, err = utils.Queries.CreateStockMovement(ctx, db.CreateStockMovementParams{
		StoreID:        storeID,
		ProductID:      productUUID,
		VariantID:      variantUUID,
		MovementType:   db.StockMovementTypeAdjustment,
		QuantityChange: req.AdjustmentQuantity,
		ReferenceID:    adjustment.ID,
		ReferenceType:  db.NullStockReferenceType{StockReferenceType: db.StockReferenceTypeAdjustment, Valid: true},
		Notes:          utils.OptionalText(req.Notes),
	})
	if err != nil {
		log.Printf("Warning: failed to create stock movement record: %v", err)
	}

	utils.Queries.CheckAndNotifyLowStock(ctx, storeID, product)

	utils.SuccessResponse(c, "Stock adjustment created successfully", adjustment)
}

func ListStockAdjustments(c *gin.Context) {
	storeID, ok := utils.GetStoreID(c)
	if !ok {
		utils.ErrorResponse(c, http.StatusUnauthorized, "Store not found", nil)
		return
	}

	limitStr := c.DefaultQuery("limit", "50")
	offsetStr := c.DefaultQuery("offset", "0")
	limit, _ := strconv.Atoi(limitStr)
	offset, _ := strconv.Atoi(offsetStr)
	if limit <= 0 || limit > 100 {
		limit = 50
	}
	if offset < 0 {
		offset = 0
	}

	ctx, cancel := context.WithTimeout(c.Request.Context(), 5*time.Second)
	defer cancel()

	adjustments, err := utils.Queries.ListStockAdjustments(ctx, db.ListStockAdjustmentsParams{
		StoreID: storeID,
		Limit:   int32(limit),
		Offset:  int32(offset),
	})
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to fetch adjustments", err)
		return
	}

	if adjustments == nil {
		adjustments = []db.ListStockAdjustmentsRow{}
	}

	utils.SuccessResponse(c, "Stock adjustments fetched successfully", adjustments)
}

func GetStockAdjustmentsByProduct(c *gin.Context) {
	storeID, ok := utils.GetStoreID(c)
	if !ok {
		utils.ErrorResponse(c, http.StatusUnauthorized, "Store not found", nil)
		return
	}

	productID, err := utils.ParseUUID(c.Param("id"))
	if err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Invalid product ID", err)
		return
	}

	limitStr := c.DefaultQuery("limit", "50")
	offsetStr := c.DefaultQuery("offset", "0")
	limit, _ := strconv.Atoi(limitStr)
	offset, _ := strconv.Atoi(offsetStr)
	if limit <= 0 || limit > 100 {
		limit = 50
	}
	if offset < 0 {
		offset = 0
	}

	ctx, cancel := context.WithTimeout(c.Request.Context(), 5*time.Second)
	defer cancel()

	adjustments, err := utils.Queries.GetStockAdjustmentsByProduct(ctx, db.GetStockAdjustmentsByProductParams{
		StoreID:   storeID,
		ProductID: productID,
		Limit:     int32(limit),
		Offset:    int32(offset),
	})
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to fetch adjustments", err)
		return
	}

	if adjustments == nil {
		adjustments = []db.GetStockAdjustmentsByProductRow{}
	}

	utils.SuccessResponse(c, "Stock adjustments fetched successfully", adjustments)
}
