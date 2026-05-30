package handlers

import (
	"context"
	"net/http"
	"time"

	db "storemanagement/db/sqlc"
	"storemanagement/utils"

	"github.com/gin-gonic/gin"
)

func GetInventoryValuation(c *gin.Context) {
	storeID, ok := utils.GetStoreID(c)
	if !ok {
		utils.ErrorResponse(c, http.StatusUnauthorized, "Store not found", nil)
		return
	}

	ctx, cancel := context.WithTimeout(c.Request.Context(), 10*time.Second)
	defer cancel()

	valuation, err := utils.Queries.GetInventoryValuation(ctx, storeID)
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to fetch valuation", err)
		return
	}

	if valuation == nil {
		valuation = []db.GetInventoryValuationRow{}
	}

	summary, err := utils.Queries.GetInventoryValuationSummary(ctx, storeID)
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to fetch summary", err)
		return
	}

	byCategory, err := utils.Queries.GetInventoryValuationByCategory(ctx, storeID)
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to fetch category breakdown", err)
		return
	}

	if byCategory == nil {
		byCategory = []db.GetInventoryValuationByCategoryRow{}
	}

	utils.SuccessResponse(c, "Inventory valuation fetched successfully", gin.H{
		"summary":     summary,
		"by_category": byCategory,
		"products":    valuation,
	})
}

func GetLowStockReport(c *gin.Context) {
	storeID, ok := utils.GetStoreID(c)
	if !ok {
		utils.ErrorResponse(c, http.StatusUnauthorized, "Store not found", nil)
		return
	}

	ctx, cancel := context.WithTimeout(c.Request.Context(), 10*time.Second)
	defer cancel()

	lowStock, err := utils.Queries.GetLowStockReport(ctx, storeID)
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to fetch low stock report", err)
		return
	}

	if lowStock == nil {
		lowStock = []db.GetLowStockReportRow{}
	}

	var totalReorderCost float64
	for _, item := range lowStock {
		cost, _ := item.ReorderCost.Float64Value()
		totalReorderCost += cost.Float64
	}

	utils.SuccessResponse(c, "Low stock report fetched successfully", gin.H{
		"items":              lowStock,
		"total_reorder_cost": totalReorderCost,
		"count":              len(lowStock),
	})
}

func GetExpiringProductsReport(c *gin.Context) {
	storeID, ok := utils.GetStoreID(c)
	if !ok {
		utils.ErrorResponse(c, http.StatusUnauthorized, "Store not found", nil)
		return
	}

	ctx, cancel := context.WithTimeout(c.Request.Context(), 10*time.Second)
	defer cancel()

	expiring, err := utils.Queries.GetExpiringProductsReport(ctx, storeID)
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to fetch expiring products", err)
		return
	}

	if expiring == nil {
		expiring = []db.GetExpiringProductsReportRow{}
	}

	var totalCapitalAtRisk float64
	for _, item := range expiring {
		capital, _ := item.CapitalAtRisk.Float64Value()
		totalCapitalAtRisk += capital.Float64
	}

	utils.SuccessResponse(c, "Expiring products report fetched successfully", gin.H{
		"items":                 expiring,
		"total_capital_at_risk": totalCapitalAtRisk,
		"count":                 len(expiring),
	})
}
