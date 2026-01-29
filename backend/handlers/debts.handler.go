package handlers

import (
	"context"
	"fmt"
	"log"
	"net/http"
	db "storemanagement/db/sqlc"
	"storemanagement/utils"
	"strings"
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

type sendReminderReq struct {
	Message string `json:"message"`
}

func SendDebtReminder(c *gin.Context) {
	idParam := c.Param("id")
	storeID := c.MustGet("store_id").(pgtype.UUID)

	debtUUID, err := uuid.Parse(idParam)
	if err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Invalid debt ID", err)
		return
	}

	ctx, cancel := context.WithTimeout(c.Request.Context(), 10*time.Second)
	defer cancel()

	debt, err := utils.Queries.GetDebt(ctx, db.GetDebtParams{
		ID:      pgtype.UUID{Bytes: debtUUID, Valid: true},
		StoreID: storeID,
	})
	if err != nil {
		utils.ErrorResponse(c, http.StatusNotFound, "Debt not found", err)
		return
	}

	if !debt.CustomerPhone.Valid || debt.CustomerPhone.String == "" {
		utils.ErrorResponse(c, http.StatusBadRequest, "Customer has no phone number", nil)
		return
	}

	// Calculate outstanding amount
	owed, _ := debt.AmountOwed.Float64Value()
	paid, _ := debt.AmountPaid.Float64Value()
	outstanding := owed.Float64 - paid.Float64

	if outstanding <= 0 {
		utils.ErrorResponse(c, http.StatusBadRequest, "Debt is already paid or zero", nil)
		return
	}

	// Default message if not provided
	// message := fmt.Sprintf("नमस्ते %s, तपाईंको बाँकी रकम रू %.2f छ। कृपया यथाशीघ्र भुक्तान गर्नुहोस्। धन्यवाद!", debt.CustomerName.String, outstanding)
	// Using English for better deliverability on trial accounts
	message := fmt.Sprintf("Hello %s, you have an outstanding payment of Rs %.2f. Please pay as soon as possible. Thank you!", debt.CustomerName.String, outstanding)

	// In case we want to customize the message from frontend later
	var req sendReminderReq
	if err := c.ShouldBindJSON(&req); err == nil && req.Message != "" {
		message = req.Message
	}

	// Format phone number to E.164 format with +977 prefix
	phone := debt.CustomerPhone.String

	// Remove any spaces, dashes, or parentheses
	phone = strings.ReplaceAll(phone, " ", "")
	phone = strings.ReplaceAll(phone, "-", "")
	phone = strings.ReplaceAll(phone, "(", "")
	phone = strings.ReplaceAll(phone, ")", "")

	// Add +977 if not present
	if !strings.HasPrefix(phone, "+977") {
		if strings.HasPrefix(phone, "977") {
			phone = "+" + phone
		} else if strings.HasPrefix(phone, "0") {
			// Remove leading 0 and add +977
			phone = "+977" + phone[1:]
		} else if len(phone) == 10 {
			// Assume it's a 10-digit Nepal number
			phone = "+977" + phone
		} else {
			utils.ErrorResponse(c, http.StatusBadRequest, "Invalid phone number format. Use +977XXXXXXXXXX or 10-digit Nepal number", nil)
			return
		}
	}

	err = utils.SendSMS(phone, message)
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to send SMS", err)
		return
	}

	utils.SuccessResponse(c, "SMS sent successfully", nil)
}
