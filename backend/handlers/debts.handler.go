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

func GetDebts(c *gin.Context) {
	storeID := c.MustGet("store_id").(pgtype.UUID)

	ctx, cancel := context.WithTimeout(c.Request.Context(), 5*time.Second)
	defer cancel()

	debts, err := utils.Queries.GetDebts(ctx, storeID)
	if err != nil {
		log.Printf("error getting debts: %v", err)
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to get debts", err)
		return
	}

	utils.SuccessResponse(c, "Debts fetched successfully", debts)
}

func DeleteDebt(c *gin.Context) {
	idParam := c.Param("id")
	storeID := c.MustGet("store_id").(pgtype.UUID)

	debtUUID, err := uuid.Parse(idParam)
	if err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Invalid debt ID", err)
		return
	}

	ctx, cancel := context.WithTimeout(c.Request.Context(), 5*time.Second)
	defer cancel()

	err = utils.Queries.DeleteDebt(ctx, db.DeleteDebtParams{
		ID:      pgtype.UUID{Bytes: debtUUID, Valid: true},
		StoreID: storeID,
	})
	if err != nil {
		log.Printf("error deleting debt: %v", err)
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to delete debt", err)
		return
	}

	utils.SuccessResponse(c, "Debt deleted successfully", nil)
}

type updateDebtReq struct {
	AmountPaid *float64 `json:"amount_paid"`
	Status     string   `json:"status"`
	Notes      string   `json:"notes"`
}

func UpdateDebt(c *gin.Context) {
	idParam := c.Param("id")
	storeID := c.MustGet("store_id").(pgtype.UUID)

	debtUUID, err := uuid.Parse(idParam)
	if err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Invalid debt ID", err)
		return
	}

	var req updateDebtReq
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Invalid request body", err)
		return
	}

	ctx, cancel := context.WithTimeout(c.Request.Context(), 5*time.Second)
	defer cancel()

	var amountPaid pgtype.Numeric
	if req.AmountPaid != nil {
		if err := amountPaid.Scan(fmt.Sprintf("%f", *req.AmountPaid)); err != nil {
			utils.ErrorResponse(c, http.StatusBadRequest, "Invalid amount paid format", err)
			return
		}
	} else {
		amountPaid = pgtype.Numeric{Valid: false}
	}

	var status db.NullDebtStatus
	if req.Status != "" {
		status = db.NullDebtStatus{DebtStatus: db.DebtStatus(req.Status), Valid: true}
	} else {
		status = db.NullDebtStatus{Valid: false}
	}

	var notes pgtype.Text
	if req.Notes != "" {
		notes = pgtype.Text{String: req.Notes, Valid: true}
	} else {
		notes = pgtype.Text{Valid: false}
	}

	debt, err := utils.Queries.UpdateDebt(ctx, db.UpdateDebtParams{
		ID:         pgtype.UUID{Bytes: debtUUID, Valid: true},
		StoreID:    storeID,
		AmountPaid: amountPaid,
		Status:     status,
		Notes:      notes,
	})

	if err != nil {
		log.Printf("error updating debt: %v", err)
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to update debt", err)
		return
	}

	utils.SuccessResponse(c, "Debt updated successfully", debt)
}
