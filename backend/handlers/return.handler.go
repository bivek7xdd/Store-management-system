package handlers

import (
	"context"
	"log"
	"net/http"
	"strconv"
	db "storemanagement/db/sqlc"
	"storemanagement/utils"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
)

type createReturnItemReq struct {
	SaleItemID string `json:"sale_item_id" binding:"required"`
	Quantity   int32  `json:"quantity" binding:"required"`
	Reason     string `json:"reason" binding:"required"`
	Condition  string `json:"condition" binding:"required"`
}

type createReturnReq struct {
	SaleID       string                `json:"sale_id" binding:"required"`
	RefundAmount string                `json:"refund_amount" binding:"required"`
	RefundMethod string                `json:"refund_method" binding:"required"`
	Items        []createReturnItemReq `json:"items" binding:"required"`
}

type syncReturnReq struct {
	OfflineID    string                `json:"offline_id"`
	SaleID       string                `json:"sale_id" binding:"required"`
	RefundAmount string                `json:"refund_amount" binding:"required"`
	RefundMethod string                `json:"refund_method" binding:"required"`
	CreatedAt    string                `json:"created_at"`
	Items        []createReturnItemReq `json:"items" binding:"required"`
}

type syncReturnsReq struct {
	Returns []syncReturnReq `json:"returns" binding:"required"`
}

func CreateReturn(c *gin.Context) {
	var req createReturnReq
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "invalid request body", err)
		return
	}

	storeID := c.MustGet("store_id").(pgtype.UUID)

	saleUUID, err := uuid.Parse(req.SaleID)
	if err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "invalid sale id", err)
		return
	}

	ctx, cancel := context.WithTimeout(c.Request.Context(), 5*time.Second)
	defer cancel()

	// Parse refund amount
	refundAmount, err := utils.StringToNumeric(req.RefundAmount)
	if err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "invalid refund amount", err)
		return
	}

	// This should ideally be wrapped in a transaction, but we will use individual queries here for simplicity
	ret, err := utils.Queries.CreateReturn(ctx, db.CreateReturnParams{
		SaleID:       pgtype.UUID{Bytes: saleUUID, Valid: true},
		StoreID:      storeID,
		RefundAmount: refundAmount,
		RefundMethod: req.RefundMethod,
	})
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "failed to create return", err)
		return
	}

	for _, item := range req.Items {
		saleItemUUID, _ := uuid.Parse(item.SaleItemID)
		_, err = utils.Queries.CreateReturnItem(ctx, db.CreateReturnItemParams{
			ReturnID:   ret.ID,
			SaleItemID: pgtype.UUID{Bytes: saleItemUUID, Valid: true},
			Quantity:   item.Quantity,
			Reason:     item.Reason,
			Condition:  item.Condition,
		})

		if err == nil {
			// Adjust stock based on condition
			handleStockAdjustment(ctx, storeID, saleItemUUID, item.Quantity, item.Condition)
		}
	}

	utils.SuccessResponse(c, "Return processed successfully", ret)
}

func SyncReturns(c *gin.Context) {
	var req syncReturnsReq
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "invalid request body", err)
		return
	}

	storeID := c.MustGet("store_id").(pgtype.UUID)
	ctx, cancel := context.WithTimeout(c.Request.Context(), 10*time.Second)
	defer cancel()

	var synced []string
	var failed []map[string]interface{}

	for _, retReq := range req.Returns {
		saleUUID, err := uuid.Parse(retReq.SaleID)
		if err != nil {
			failed = append(failed, map[string]interface{}{"offline_id": retReq.OfflineID, "error": "invalid sale id"})
			continue
		}

		refundAmount, _ := utils.StringToNumeric(retReq.RefundAmount)

		ret, err := utils.Queries.CreateReturn(ctx, db.CreateReturnParams{
			SaleID:       pgtype.UUID{Bytes: saleUUID, Valid: true},
			StoreID:      storeID,
			RefundAmount: refundAmount,
			RefundMethod: retReq.RefundMethod,
		})
		
		if err != nil {
			failed = append(failed, map[string]interface{}{"offline_id": retReq.OfflineID, "error": "failed to create return"})
			continue
		}

		for _, item := range retReq.Items {
			saleItemUUID, _ := uuid.Parse(item.SaleItemID)
			_, err := utils.Queries.CreateReturnItem(ctx, db.CreateReturnItemParams{
				ReturnID:   ret.ID,
				SaleItemID: pgtype.UUID{Bytes: saleItemUUID, Valid: true},
				Quantity:   item.Quantity,
				Reason:     item.Reason,
				Condition:  item.Condition,
			})

			if err == nil {
				handleStockAdjustment(ctx, storeID, saleItemUUID, item.Quantity, item.Condition)
			}
		}
		
		synced = append(synced, retReq.OfflineID)
	}

	c.JSON(http.StatusOK, gin.H{
		"synced": synced,
		"failed": failed,
	})
}

func ListReturns(c *gin.Context) {
	storeID := c.MustGet("store_id").(pgtype.UUID)

	limitStr := c.DefaultQuery("limit", "50")
	offsetStr := c.DefaultQuery("offset", "0")

	limit, _ := strconv.Atoi(limitStr)
	offset, _ := strconv.Atoi(offsetStr)

	ctx, cancel := context.WithTimeout(c.Request.Context(), 5*time.Second)
	defer cancel()

	returns, err := utils.Queries.ListReturns(ctx, db.ListReturnsParams{
		StoreID: storeID,
		Limit:   int32(limit),
		Offset:  int32(offset),
	})
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to list returns", err)
		return
	}

	utils.SuccessResponse(c, "Returns fetched successfully", returns)
}

func GetReturnDetails(c *gin.Context) {
	returnIDParam := c.Param("id")
	returnUUID, err := uuid.Parse(returnIDParam)
	if err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Invalid return ID", err)
		return
	}

	ctx, cancel := context.WithTimeout(c.Request.Context(), 5*time.Second)
	defer cancel()

	items, err := utils.Queries.GetReturnItems(ctx, pgtype.UUID{Bytes: returnUUID, Valid: true})
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to fetch return items", err)
		return
	}

	utils.SuccessResponse(c, "Return details fetched successfully", items)
}

func handleStockAdjustment(ctx context.Context, storeID pgtype.UUID, saleItemID uuid.UUID, quantity int32, condition string) {
	saleItem, err := utils.Queries.GetSaleItem(ctx, pgtype.UUID{Bytes: saleItemID, Valid: true})
	if err != nil {
		log.Printf("[Returns] Failed to fetch sale item %s: %v", saleItemID, err)
		return
	}

	if condition == "damaged" || condition == "defective" {
		// Increase damaged quantity
		if saleItem.VariantID.Valid {
			utils.Queries.AddDamagedVariantStock(ctx, db.AddDamagedVariantStockParams{
				ID:           saleItem.VariantID,
				DamagedStockLevel: quantity,
			})
		} else {
			utils.Queries.AddDamagedProductStock(ctx, db.AddDamagedProductStockParams{
				ID:              saleItem.ProductID,
				DamagedQuantity: quantity,
				StoreID:         storeID,
			})
		}
	} else {
		// Resellable: Increase normal stock level
		if saleItem.VariantID.Valid {
			utils.Queries.ReturnVariantStock(ctx, db.ReturnVariantStockParams{
				ID:         saleItem.VariantID,
				StockLevel: quantity,
			})
		} else {
			utils.Queries.ReturnProductStock(ctx, db.ReturnProductStockParams{
				ID:            saleItem.ProductID,
				StockQuantity: quantity,
				StoreID:       storeID,
			})
		}
	}
}
