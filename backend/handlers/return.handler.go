package handlers

import (
	"context"
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

	storeID, ok := utils.GetStoreID(c)
	if !ok {
		utils.ErrorResponse(c, http.StatusUnauthorized, "Store not found", nil)
		return
	}

	saleUUID, err := uuid.Parse(req.SaleID)
	if err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "invalid sale id", err)
		return
	}

	ctx, cancel := context.WithTimeout(c.Request.Context(), 5*time.Second)
	defer cancel()

	refundAmount, err := utils.StringToNumeric(req.RefundAmount)
	if err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "invalid refund amount", err)
		return
	}

	txItems := make([]db.CreateReturnItemTxParams, len(req.Items))
	for i, item := range req.Items {
		saleItemUUID, _ := uuid.Parse(item.SaleItemID)
		saleItem, err := utils.Queries.GetSaleItem(ctx, db.GetSaleItemParams{
			ID:      pgtype.UUID{Bytes: saleItemUUID, Valid: true},
			StoreID: storeID,
		})
		if err != nil {
			utils.ErrorResponse(c, http.StatusInternalServerError, "failed to fetch sale item", err)
			return
		}

		txItems[i] = db.CreateReturnItemTxParams{
			SaleItemID: pgtype.UUID{Bytes: saleItemUUID, Valid: true},
			Quantity:   item.Quantity,
			Reason:     item.Reason,
			Condition:  item.Condition,
			ProductID:  saleItem.ProductID,
			VariantID:  saleItem.VariantID,
		}
	}

	ret, err := utils.Store.CreateReturnTx(ctx, db.CreateReturnTxParams{
		SaleID:       pgtype.UUID{Bytes: saleUUID, Valid: true},
		StoreID:      storeID,
		RefundAmount: refundAmount,
		RefundMethod: req.RefundMethod,
		Items:        txItems,
	})
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "failed to create return", err)
		return
	}

	utils.SuccessResponse(c, "Return processed successfully", ret)
}

func SyncReturns(c *gin.Context) {
	var req syncReturnsReq
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "invalid request body", err)
		return
	}

	storeID, ok := utils.GetStoreID(c)
	if !ok {
		utils.ErrorResponse(c, http.StatusUnauthorized, "Store not found", nil)
		return
	}
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

		txItems := make([]db.CreateReturnItemTxParams, len(retReq.Items))
		var parseErr bool
		for i, item := range retReq.Items {
			saleItemUUID, pErr := uuid.Parse(item.SaleItemID)
			if pErr != nil {
				parseErr = true
				break
			}
			saleItem, gErr := utils.Queries.GetSaleItem(ctx, db.GetSaleItemParams{
				ID:      pgtype.UUID{Bytes: saleItemUUID, Valid: true},
				StoreID: storeID,
			})
			if gErr != nil {
				parseErr = true
				break
			}
			txItems[i] = db.CreateReturnItemTxParams{
				SaleItemID: pgtype.UUID{Bytes: saleItemUUID, Valid: true},
				Quantity:   item.Quantity,
				Reason:     item.Reason,
				Condition:  item.Condition,
				ProductID:  saleItem.ProductID,
				VariantID:  saleItem.VariantID,
			}
		}
		if parseErr {
			failed = append(failed, map[string]interface{}{"offline_id": retReq.OfflineID, "error": "failed to fetch sale items"})
			continue
		}

		_, err = utils.Store.CreateReturnTx(ctx, db.CreateReturnTxParams{
			SaleID:       pgtype.UUID{Bytes: saleUUID, Valid: true},
			StoreID:      storeID,
			RefundAmount: refundAmount,
			RefundMethod: retReq.RefundMethod,
			Items:        txItems,
		})

		if err != nil {
			failed = append(failed, map[string]interface{}{"offline_id": retReq.OfflineID, "error": "failed to create return"})
			continue
		}

		synced = append(synced, retReq.OfflineID)
	}

	c.JSON(http.StatusOK, gin.H{
		"synced": synced,
		"failed": failed,
	})
}

func ListReturns(c *gin.Context) {
	storeID, ok := utils.GetStoreID(c)
	if !ok {
		utils.ErrorResponse(c, http.StatusUnauthorized, "Store not found", nil)
		return
	}

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
