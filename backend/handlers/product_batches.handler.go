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

type createProductBatchReq struct {
	BatchNumber       string `json:"batch_number" binding:"required"`
	ManufacturingDate string `json:"manufacturing_date"`
	ExpiryDate        string `json:"expiry_date"`
	Quantity          int32  `json:"quantity" binding:"required"`
	Notes             string `json:"notes"`
}

func ListProductBatches(c *gin.Context) {
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

	ctx, cancel := context.WithTimeout(c.Request.Context(), 5*time.Second)
	defer cancel()

	_, err = utils.Queries.GetProduct(ctx, db.GetProductParams{
		ID:      productID,
		StoreID: storeID,
	})
	if err != nil {
		utils.ErrorResponse(c, http.StatusNotFound, "product not found", err)
		return
	}

	batches, err := utils.Queries.GetBatchesByProductWithStore(ctx, db.GetBatchesByProductWithStoreParams{
		ProductID: productID,
		StoreID:   storeID,
	})
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "failed to fetch batches", err)
		return
	}

	if batches == nil {
		batches = []db.GetBatchesByProductWithStoreRow{}
	}

	utils.SuccessResponse(c, "batches fetched successfully", batches)
}

func CreateProductBatch(c *gin.Context) {
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

	var req createProductBatchReq
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "invalid request body", err)
		return
	}

	if req.Quantity < 0 {
		utils.ErrorResponse(c, http.StatusBadRequest, "quantity cannot be negative", nil)
		return
	}

	ctx, cancel := context.WithTimeout(c.Request.Context(), 10*time.Second)
	defer cancel()

	_, err = utils.Queries.GetProduct(ctx, db.GetProductParams{
		ID:      productID,
		StoreID: storeID,
	})
	if err != nil {
		utils.ErrorResponse(c, http.StatusNotFound, "product not found", err)
		return
	}

	var manufacturingDate pgtype.Date
	if req.ManufacturingDate != "" {
		t, err := time.Parse("2006-01-02", req.ManufacturingDate)
		if err != nil {
			utils.ErrorResponse(c, http.StatusBadRequest, "invalid manufacturing date format, use YYYY-MM-DD", err)
			return
		}
		manufacturingDate = pgtype.Date{Time: t, Valid: true}
	}

	var expiryDate pgtype.Date
	if req.ExpiryDate != "" {
		t, err := time.Parse("2006-01-02", req.ExpiryDate)
		if err != nil {
			utils.ErrorResponse(c, http.StatusBadRequest, "invalid expiry date format, use YYYY-MM-DD", err)
			return
		}
		expiryDate = pgtype.Date{Time: t, Valid: true}
	}

	batch, err := utils.Queries.CreateProductBatch(ctx, db.CreateProductBatchParams{
		ProductID:         productID,
		BatchNumber:       req.BatchNumber,
		ManufacturingDate: manufacturingDate,
		ExpiryDate:        expiryDate,
		Quantity:          req.Quantity,
		Notes:             utils.OptionalText(req.Notes),
	})
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "failed to create batch", err)
		return
	}

	utils.SuccessResponse(c, "batch created successfully", batch)
}

func UpdateProductBatch(c *gin.Context) {
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

	batchID, err := utils.ParseUUID(c.Param("batchId"))
	if err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "invalid batch id", err)
		return
	}

	var req createProductBatchReq
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "invalid request body", err)
		return
	}

	if req.Quantity < 0 {
		utils.ErrorResponse(c, http.StatusBadRequest, "quantity cannot be negative", nil)
		return
	}

	ctx, cancel := context.WithTimeout(c.Request.Context(), 10*time.Second)
	defer cancel()

	_, err = utils.Queries.GetProduct(ctx, db.GetProductParams{
		ID:      productID,
		StoreID: storeID,
	})
	if err != nil {
		utils.ErrorResponse(c, http.StatusNotFound, "product not found", err)
		return
	}

	var manufacturingDate pgtype.Date
	if req.ManufacturingDate != "" {
		t, err := time.Parse("2006-01-02", req.ManufacturingDate)
		if err != nil {
			utils.ErrorResponse(c, http.StatusBadRequest, "invalid manufacturing date format, use YYYY-MM-DD", err)
			return
		}
		manufacturingDate = pgtype.Date{Time: t, Valid: true}
	}

	var expiryDate pgtype.Date
	if req.ExpiryDate != "" {
		t, err := time.Parse("2006-01-02", req.ExpiryDate)
		if err != nil {
			utils.ErrorResponse(c, http.StatusBadRequest, "invalid expiry date format, use YYYY-MM-DD", err)
			return
		}
		expiryDate = pgtype.Date{Time: t, Valid: true}
	}

	batch, err := utils.Queries.UpdateProductBatch(ctx, db.UpdateProductBatchParams{
		ID:                batchID,
		BatchNumber:       req.BatchNumber,
		ManufacturingDate: manufacturingDate,
		ExpiryDate:        expiryDate,
		Quantity:          req.Quantity,
		Notes:             utils.OptionalText(req.Notes),
		StoreID:           storeID,
	})
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "failed to update batch", err)
		return
	}

	utils.SuccessResponse(c, "batch updated successfully", batch)
}

func DeleteProductBatch(c *gin.Context) {
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

	batchID, err := utils.ParseUUID(c.Param("batchId"))
	if err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "invalid batch id", err)
		return
	}

	ctx, cancel := context.WithTimeout(c.Request.Context(), 5*time.Second)
	defer cancel()

	_, err = utils.Queries.GetProduct(ctx, db.GetProductParams{
		ID:      productID,
		StoreID: storeID,
	})
	if err != nil {
		utils.ErrorResponse(c, http.StatusNotFound, "product not found", err)
		return
	}

	err = utils.Queries.DeleteProductBatch(ctx, db.DeleteProductBatchParams{
		ID:        batchID,
		StoreID:   storeID,
	})
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "failed to delete batch", err)
		return
	}

	utils.SuccessResponse(c, "batch deleted successfully", nil)
}
