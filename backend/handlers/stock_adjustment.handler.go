package handlers

import (
	"context"
	"net/http"
	"time"

	db "storemanagement/db/sqlc"
	"storemanagement/utils"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgtype"
)

type createStockAdjustmentReq struct {
	ProductID          string `json:"product_id" binding:"required"`
	VariantID          string `json:"variant_id"`
	AdjustmentQuantity int32  `json:"adjustment_quantity"`
	Reason             string `json:"reason" binding:"required"`
	Notes              string `json:"notes"`
}

func CreateStockAdjustment(c *gin.Context) {
	storeID, ok := utils.GetStoreID(c)
	if !ok {
		utils.ErrorResponse(c, http.StatusUnauthorized, "store not found", nil)
		return
	}

	uid, exists := c.Get("user_id")
	if !exists {
		utils.ErrorResponse(c, http.StatusUnauthorized, "user not authenticated", nil)
		return
	}
	userID, ok := uid.(pgtype.UUID)
	if !ok || !userID.Valid {
		utils.ErrorResponse(c, http.StatusUnauthorized, "invalid user id", nil)
		return
	}

	var req createStockAdjustmentReq
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "invalid request body", err)
		return
	}

	if req.AdjustmentQuantity == 0 {
		utils.ErrorResponse(c, http.StatusBadRequest, "adjustment quantity cannot be zero", nil)
		return
	}

	const maxAdjustmentQuantity int32 = 100000
	if req.AdjustmentQuantity < -maxAdjustmentQuantity || req.AdjustmentQuantity > maxAdjustmentQuantity {
		utils.ErrorResponse(c, http.StatusBadRequest, "adjustment quantity exceeds allowed range", nil)
		return
	}

	validReasons := map[string]bool{
		"physical_count": true, "damaged": true, "expired": true,
		"theft": true, "correction": true, "return": true, "other": true,
	}
	if !validReasons[req.Reason] {
		utils.ErrorResponse(c, http.StatusBadRequest, "invalid reason", nil)
		return
	}

	ctx, cancel := context.WithTimeout(c.Request.Context(), 10*time.Second)
	defer cancel()

	productUUID, err := utils.ParseUUID(req.ProductID)
	if err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "invalid product id", err)
		return
	}

	var variantUUID pgtype.UUID
	if req.VariantID != "" {
		variantUUID, err = utils.ParseUUID(req.VariantID)
		if err != nil {
			utils.ErrorResponse(c, http.StatusBadRequest, "invalid variant id", err)
			return
		}
	}

	product, err := utils.Queries.GetProduct(ctx, db.GetProductParams{
		ID:      productUUID,
		StoreID: storeID,
	})
	if err != nil {
		utils.ErrorResponse(c, http.StatusNotFound, "product not found", err)
		return
	}

	previousQuantity := product.StockQuantity
	newQuantity := previousQuantity + req.AdjustmentQuantity

	if newQuantity < 0 {
		utils.ErrorResponse(c, http.StatusBadRequest, "adjustment would result in negative stock", nil)
		return
	}

	var adjustment db.StockAdjustment
	err = utils.Store.ExecTx(ctx, func(q *db.Queries) error {
		var err error

		adjustment, err = q.CreateStockAdjustment(ctx, db.CreateStockAdjustmentParams{
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
			return err
		}

		_, err = q.UpdateProduct(ctx, db.UpdateProductParams{
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
			return err
		}

		_, err = q.CreateStockMovement(ctx, db.CreateStockMovementParams{
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
			return err
		}

		q.CheckAndNotifyLowStock(ctx, storeID, product)

		return nil
	})
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "failed to create adjustment", err)
		return
	}

	utils.SuccessResponse(c, "stock adjustment created successfully", adjustment)
}

func ListStockAdjustments(c *gin.Context) {
	storeID, ok := utils.GetStoreID(c)
	if !ok {
		utils.ErrorResponse(c, http.StatusUnauthorized, "store not found", nil)
		return
	}

	pg := utils.ParsePagination(c)

	ctx, cancel := context.WithTimeout(c.Request.Context(), 5*time.Second)
	defer cancel()

	adjustments, err := utils.Queries.ListStockAdjustments(ctx, db.ListStockAdjustmentsParams{
		StoreID: storeID,
		Limit:   int32(pg.Limit),
		Offset:  int32(pg.Offset),
	})
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "failed to fetch adjustments", err)
		return
	}

	if adjustments == nil {
		adjustments = []db.ListStockAdjustmentsRow{}
	}

	utils.SuccessResponse(c, "stock adjustments fetched successfully", adjustments)
}

func GetStockAdjustmentsByProduct(c *gin.Context) {
	storeID, ok := utils.GetStoreID(c)
	if !ok {
		utils.ErrorResponse(c, http.StatusUnauthorized, "store not found", nil)
		return
	}

	productID, err := utils.ParseUUID(c.Param("id"))
	if err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "invalid product id", err)
		return
	}

	pg := utils.ParsePagination(c)

	ctx, cancel := context.WithTimeout(c.Request.Context(), 5*time.Second)
	defer cancel()

	adjustments, err := utils.Queries.GetStockAdjustmentsByProduct(ctx, db.GetStockAdjustmentsByProductParams{
		StoreID:   storeID,
		ProductID: productID,
		Limit:     int32(pg.Limit),
		Offset:    int32(pg.Offset),
	})
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "failed to fetch adjustments", err)
		return
	}

	if adjustments == nil {
		adjustments = []db.GetStockAdjustmentsByProductRow{}
	}

	utils.SuccessResponse(c, "stock adjustments fetched successfully", adjustments)
}
