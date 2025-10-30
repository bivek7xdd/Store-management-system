package handlers

import (
	"context"
	"errors"
	"net/http"
	"strconv"
	"time"

	db "storemanagement/db/sqlc"
	"storemanagement/utils"

	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
)

type CreateDebtRequest struct {
	CustomerID string  `json:"customer_id" binding:"required,uuid"`
	SaleID     string  `json:"sale_id" binding:"omitempty,uuid"`
	AmountOwed float64 `json:"amount_owed" binding:"required,gt=0"`
	DueDate    string  `json:"due_date" binding:"required"`
}

func CreateDebtHandler(c *gin.Context) {
	var req CreateDebtRequest
	storeID := c.GetString("store_id")

	if err := c.ShouldBindJSON(&req); err != nil {
		if errs, ok := err.(validator.ValidationErrors); ok {
			for _, fieldErr := range errs {
				var errMsg string
				switch fieldErr.Field() {
				case "CustomerID":
					errMsg = "Valid customer ID is required"
				case "AmountOwed":
					errMsg = "Amount owed must be greater than 0"
				case "DueDate":
					errMsg = "Due date is required"
				default:
					errMsg = fieldErr.Error()
				}
				utils.ErrorResponse(c, http.StatusBadRequest, "Validation failed", errors.New(errMsg))
				return
			}
		}
		utils.ErrorResponse(c, http.StatusBadRequest, "Invalid request", err)
		return
	}

	dueDate, err := time.Parse("2006-01-02", req.DueDate)
	if err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Invalid due date format (use YYYY-MM-DD)", err)
		return
	}

	var saleID pgtype.UUID
	if req.SaleID != "" {
		saleID = pgtype.UUID{Bytes: uuid.MustParse(req.SaleID), Valid: true}
	}

	debt, err := utils.Queries.CreateDebt(context.Background(), db.CreateDebtParams{
		StoreID:         uuid.MustParse(storeID),
		CustomerID:      uuid.MustParse(req.CustomerID),
		SaleID:          saleID,
		AmountOwed:      req.AmountOwed,
		AmountRemaining: req.AmountOwed,
		DueDate:         pgtype.Date{Time: dueDate, Valid: true},
		Status:          "pending",
	})

	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to create debt", err)
		return
	}

	// Update customer total debt
	customer, _ := utils.Queries.GetCustomerById(context.Background(), db.GetCustomerByIdParams{
		ID:      uuid.MustParse(req.CustomerID),
		StoreID: uuid.MustParse(storeID),
	})

	newTotalDebt := customer.TotalDebt.Float64 + req.AmountOwed
	utils.Queries.UpdateCustomerTotals(context.Background(), db.UpdateCustomerTotalsParams{
		ID:              uuid.MustParse(req.CustomerID),
		TotalPurchases:  customer.TotalPurchases.Float64,
		TotalDebt:       newTotalDebt,
	})

	c.JSON(http.StatusCreated, gin.H{
		"message": "Debt created successfully",
		"debt":    debt,
	})
}

func GetDebtHandler(c *gin.Context) {
	debtID := c.Param("id")
	storeID := c.GetString("store_id")

	id, err := uuid.Parse(debtID)
	if err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Invalid debt ID", err)
		return
	}

	debt, err := utils.Queries.GetDebtById(context.Background(), db.GetDebtByIdParams{
		ID:      id,
		StoreID: uuid.MustParse(storeID),
	})

	if err != nil {
		utils.ErrorResponse(c, http.StatusNotFound, "Debt not found", err)
		return
	}

	// Get payment history
	payments, _ := utils.Queries.GetDebtPayments(context.Background(), id)

	c.JSON(http.StatusOK, gin.H{
		"debt":     debt,
		"payments": payments,
	})
}

func ListDebtsHandler(c *gin.Context) {
	storeID := c.GetString("store_id")
	limitStr := c.DefaultQuery("limit", "20")
	offsetStr := c.DefaultQuery("offset", "0")

	limit, _ := strconv.Atoi(limitStr)
	offset, _ := strconv.Atoi(offsetStr)

	debts, err := utils.Queries.ListDebts(context.Background(), db.ListDebtsParams{
		StoreID: uuid.MustParse(storeID),
		Limit:   int32(limit),
		Offset:  int32(offset),
	})

	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to fetch debts", err)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"debts":  debts,
		"count":  len(debts),
		"limit":  limit,
		"offset": offset,
	})
}

func ListOverdueDebtsHandler(c *gin.Context) {
	storeID := c.GetString("store_id")

	debts, err := utils.Queries.ListOverdueDebts(context.Background(), uuid.MustParse(storeID))

	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to fetch overdue debts", err)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"debts": debts,
		"count": len(debts),
	})
}

func GetDebtSummaryHandler(c *gin.Context) {
	storeID := c.GetString("store_id")

	summary, err := utils.Queries.GetDebtSummary(context.Background(), uuid.MustParse(storeID))

	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to get debt summary", err)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"summary": summary,
	})
}

type CreateDebtPaymentRequest struct {
	AmountPaid    float64 `json:"amount_paid" binding:"required,gt=0"`
	PaymentMethod string  `json:"payment_method" binding:"required,oneof=cash card mobile_money bank_transfer"`
	Notes         string  `json:"notes"`
}

func CreateDebtPaymentHandler(c *gin.Context) {
	debtID := c.Param("id")
	storeID := c.GetString("store_id")
	userID := c.GetString("user_id")
	var req CreateDebtPaymentRequest

	id, err := uuid.Parse(debtID)
	if err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Invalid debt ID", err)
		return
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Invalid request", err)
		return
	}

	// Get current debt
	debt, err := utils.Queries.GetDebtById(context.Background(), db.GetDebtByIdParams{
		ID:      id,
		StoreID: uuid.MustParse(storeID),
	})

	if err != nil {
		utils.ErrorResponse(c, http.StatusNotFound, "Debt not found", err)
		return
	}

	// Validate payment amount
	if req.AmountPaid > debt.AmountRemaining.Float64 {
		utils.ErrorResponse(c, http.StatusBadRequest, "Payment amount exceeds remaining debt", nil)
		return
	}

	// Create payment record
	payment, err := utils.Queries.CreateDebtPayment(context.Background(), db.CreateDebtPaymentParams{
		DebtID:        id,
		AmountPaid:    req.AmountPaid,
		PaymentMethod: req.PaymentMethod,
		ReceivedBy:    pgtype.UUID{Bytes: uuid.MustParse(userID), Valid: true},
		Notes:         pgtype.Text{String: req.Notes, Valid: req.Notes != ""},
	})

	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to create payment", err)
		return
	}

	// Update debt
	newAmountPaid := debt.AmountPaid.Float64 + req.AmountPaid
	newAmountRemaining := debt.AmountRemaining.Float64 - req.AmountPaid
	newStatus := "partial"
	if newAmountRemaining == 0 {
		newStatus = "paid"
	}

	updatedDebt, _ := utils.Queries.UpdateDebt(context.Background(), db.UpdateDebtParams{
		ID:              id,
		AmountPaid:      newAmountPaid,
		AmountRemaining: newAmountRemaining,
		Status:          newStatus,
	})

	// Update customer total debt
	customer, _ := utils.Queries.GetCustomerById(context.Background(), db.GetCustomerByIdParams{
		ID:      debt.CustomerID,
		StoreID: uuid.MustParse(storeID),
	})

	newCustomerDebt := customer.TotalDebt.Float64 - req.AmountPaid
	utils.Queries.UpdateCustomerTotals(context.Background(), db.UpdateCustomerTotalsParams{
		ID:              debt.CustomerID,
		TotalPurchases:  customer.TotalPurchases.Float64,
		TotalDebt:       newCustomerDebt,
	})

	c.JSON(http.StatusCreated, gin.H{
		"message": "Payment recorded successfully",
		"payment": payment,
		"debt":    updatedDebt,
	})
}
