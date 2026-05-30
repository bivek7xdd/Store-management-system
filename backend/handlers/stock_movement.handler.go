package handlers

import (
	"context"
	"errors"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5"

	db "storemanagement/db/sqlc"
	"storemanagement/utils"
)

func ListStockMovements(c *gin.Context) {
	storeID, ok := utils.GetStoreID(c)
	if !ok {
		utils.ErrorResponse(c, http.StatusUnauthorized, "store not found", nil)
		return
	}

	pg := utils.ParsePagination(c)

	ctx, cancel := context.WithTimeout(c.Request.Context(), 5*time.Second)
	defer cancel()

	movements, err := utils.Queries.ListStockMovements(ctx, db.ListStockMovementsParams{
		StoreID: storeID,
		Limit:   int32(pg.Limit),
		Offset:  int32(pg.Offset),
	})
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "failed to fetch movements", err)
		return
	}

	if movements == nil {
		movements = []db.ListStockMovementsRow{}
	}

	utils.SuccessResponse(c, "Stock movements fetched successfully", movements)
}

func GetStockMovementsByProduct(c *gin.Context) {
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

	movements, err := utils.Queries.GetStockMovementsByProduct(ctx, db.GetStockMovementsByProductParams{
		StoreID:   storeID,
		ProductID: productID,
		Limit:     int32(pg.Limit),
		Offset:    int32(pg.Offset),
	})
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "failed to fetch movements", err)
		return
	}

	if movements == nil {
		movements = []db.GetStockMovementsByProductRow{}
	}

	utils.SuccessResponse(c, "Stock movements fetched successfully", movements)
}

func GetStockMovementSummary(c *gin.Context) {
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

	summary, err := utils.Queries.GetStockMovementSummary(ctx, db.GetStockMovementSummaryParams{
		StoreID:   storeID,
		ProductID: productID,
	})
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			utils.SuccessResponse(c, "stock movement summary fetched successfully", db.GetStockMovementSummaryRow{
				ProductID:     productID,
				TotalInbound:  0,
				TotalOutbound: 0,
				MovementCount: 0,
			})
			return
		}
		utils.ErrorResponse(c, http.StatusInternalServerError, "failed to fetch summary", err)
		return
	}

	utils.SuccessResponse(c, "stock movement summary fetched successfully", summary)
}
