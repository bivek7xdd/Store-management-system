package handlers

import (
	"context"
	"net/http"
	db "storemanagement/db/sqlc"
	"storemanagement/utils"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgtype"
)

func CreateSupplierPayable(c *gin.Context) {
	storeID := c.MustGet("store_id").(pgtype.UUID)

	var req struct {
		SupplierID  string  `json:"supplier_id" binding:"required"`
		Description string  `json:"description"`
		AmountOwed  float64 `json:"amount_owed" binding:"required"`
		DueDate     string  `json:"due_date"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Invalid request body", err)
		return
	}

	supplierUUID, err := utils.ParseUUID(req.SupplierID)
	if err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Invalid supplier ID", err)
		return
	}

	ctx, cancel := context.WithTimeout(c.Request.Context(), 10*time.Second)
	defer cancel()

	_, err = utils.Queries.GetSupplier(ctx, db.GetSupplierParams{
		ID:      supplierUUID,
		StoreID: storeID,
	})
	if err != nil {
		utils.ErrorResponse(c, http.StatusNotFound, "Supplier not found or does not belong to your store", err)
		return
	}

	var dueDate pgtype.Timestamptz
	if req.DueDate != "" {
		t, err := time.Parse("2006-01-02", req.DueDate)
		if err != nil {
			utils.ErrorResponse(c, http.StatusBadRequest, "Invalid date format", err)
			return
		}
		dueDate = pgtype.Timestamptz{Time: t, Valid: true}
	}

	payable, err := utils.Queries.CreateSupplierPayable(ctx, db.CreateSupplierPayableParams{
		StoreID:     storeID,
		SupplierID:  supplierUUID,
		Description: utils.OptionalText(req.Description),
		AmountOwed:  utils.Numeric(req.AmountOwed),
		AmountPaid:  utils.Numeric(0),
		DueDate:     dueDate,
		Status:      "pending",
	})

	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to create payable", err)
		return
	}

	utils.SuccessResponse(c, "Payable created successfully", payable)
}

func ListSupplierPayables(c *gin.Context) {
	storeID := c.MustGet("store_id").(pgtype.UUID)
	status := c.DefaultQuery("status", "")

	ctx, cancel := context.WithTimeout(c.Request.Context(), 10*time.Second)
	defer cancel()

	payables, err := utils.Queries.ListSupplierPayables(ctx, db.ListSupplierPayablesParams{
		StoreID: storeID,
		Column2: status,
	})

	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to fetch payables", err)
		return
	}

	if payables == nil {
		payables = []db.ListSupplierPayablesRow{}
	}

	utils.SuccessResponse(c, "Payables fetched successfully", payables)
}

func GetSupplierPayable(c *gin.Context) {
	storeID := c.MustGet("store_id").(pgtype.UUID)
	id := c.Param("id")

	uuid, err := utils.ParseUUID(id)
	if err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Invalid payable ID", err)
		return
	}

	ctx, cancel := context.WithTimeout(c.Request.Context(), 10*time.Second)
	defer cancel()

	payable, err := utils.Queries.GetSupplierPayable(ctx, db.GetSupplierPayableParams{
		ID:      uuid,
		StoreID: storeID,
	})

	if err != nil {
		utils.ErrorResponse(c, http.StatusNotFound, "Payable not found", err)
		return
	}

	payments, _ := utils.Queries.ListPaymentsByPayable(ctx, db.ListPaymentsByPayableParams{
		PayableID: payable.ID,
		StoreID:   storeID,
	})

	if payments == nil {
		payments = []db.SupplierPayment{}
	}

	utils.SuccessResponse(c, "Payable fetched successfully", gin.H{
		"payable":  payable,
		"payments": payments,
	})
}

func UpdateSupplierPayable(c *gin.Context) {
	storeID := c.MustGet("store_id").(pgtype.UUID)
	id := c.Param("id")

	uuid, err := utils.ParseUUID(id)
	if err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Invalid payable ID", err)
		return
	}

	var req struct {
		Description string  `json:"description"`
		AmountOwed  float64 `json:"amount_owed"`
		DueDate     string  `json:"due_date"`
		Status      string  `json:"status"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Invalid request body", err)
		return
	}

	var dueDate pgtype.Timestamptz
	if req.DueDate != "" {
		t, err := time.Parse("2006-01-02", req.DueDate)
		if err != nil {
			utils.ErrorResponse(c, http.StatusBadRequest, "Invalid date format", err)
			return
		}
		dueDate = pgtype.Timestamptz{Time: t, Valid: true}
	}

	ctx, cancel := context.WithTimeout(c.Request.Context(), 10*time.Second)
	defer cancel()

	payable, err := utils.Queries.UpdateSupplierPayable(ctx, db.UpdateSupplierPayableParams{
		ID:          uuid,
		Description: utils.OptionalText(req.Description),
		AmountOwed:  utils.Numeric(req.AmountOwed),
		DueDate:     dueDate,
		Status:      req.Status,
		StoreID:     storeID,
	})

	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to update payable", err)
		return
	}

	utils.SuccessResponse(c, "Payable updated successfully", payable)
}

func DeleteSupplierPayable(c *gin.Context) {
	storeID := c.MustGet("store_id").(pgtype.UUID)
	id := c.Param("id")

	uuid, err := utils.ParseUUID(id)
	if err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Invalid payable ID", err)
		return
	}

	ctx, cancel := context.WithTimeout(c.Request.Context(), 10*time.Second)
	defer cancel()

	err = utils.Queries.DeleteSupplierPayable(ctx, db.DeleteSupplierPayableParams{
		ID:      uuid,
		StoreID: storeID,
	})

	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to delete payable", err)
		return
	}

	utils.SuccessResponse(c, "Payable deleted successfully", nil)
}

func RecordSupplierPayment(c *gin.Context) {
	storeID := c.MustGet("store_id").(pgtype.UUID)
	payableID := c.Param("id")

	uuid, err := utils.ParseUUID(payableID)
	if err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Invalid payable ID", err)
		return
	}

	var req struct {
		Amount        float64 `json:"amount" binding:"required"`
		PaymentMethod string  `json:"payment_method"`
		Notes         string  `json:"notes"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Invalid request body", err)
		return
	}

	ctx, cancel := context.WithTimeout(c.Request.Context(), 10*time.Second)
	defer cancel()

	payable, err := utils.Queries.GetSupplierPayable(ctx, db.GetSupplierPayableParams{
		ID:      uuid,
		StoreID: storeID,
	})

	if err != nil {
		utils.ErrorResponse(c, http.StatusNotFound, "Payable not found", err)
		return
	}

	payment, err := utils.Queries.RecordSupplierPayment(ctx, db.RecordSupplierPaymentParams{
		StoreID:       storeID,
		PayableID:     payable.ID,
		Amount:        utils.Numeric(req.Amount),
		PaymentMethod: utils.OptionalText(req.PaymentMethod),
		Notes:         utils.OptionalText(req.Notes),
	})

	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to record payment", err)
		return
	}

	newAmountPaid := utils.Float64(payable.AmountPaid) + req.Amount
	amountOwed := utils.Float64(payable.AmountOwed)
	newStatus := "partial"
	if newAmountPaid >= amountOwed {
		newStatus = "paid"
	}

	updatedPayable, err := utils.Queries.UpdatePayableAfterPayment(ctx, db.UpdatePayableAfterPaymentParams{
		ID:         payable.ID,
		AmountPaid: utils.Numeric(newAmountPaid),
		Status:     newStatus,
		StoreID:    storeID,
	})

	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to update payable status", err)
		return
	}

	utils.SuccessResponse(c, "Payment recorded successfully", gin.H{
		"payment": payment,
		"payable": updatedPayable,
	})
}

func GetSupplierPayableSummary(c *gin.Context) {
	storeID := c.MustGet("store_id").(pgtype.UUID)

	ctx, cancel := context.WithTimeout(c.Request.Context(), 10*time.Second)
	defer cancel()

	summary, err := utils.Queries.GetSupplierPayableSummary(ctx, storeID)

	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to fetch summary", err)
		return
	}

	overdue, _ := utils.Queries.GetOverduePayables(ctx, storeID)
	if overdue == nil {
		overdue = []db.GetOverduePayablesRow{}
	}

	utils.SuccessResponse(c, "Summary fetched successfully", gin.H{
		"summary": summary,
		"overdue": overdue,
	})
}
