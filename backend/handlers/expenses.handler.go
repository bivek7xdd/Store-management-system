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

func CreateExpense(c *gin.Context) {
	storeID, ok := utils.GetStoreID(c)
	if !ok {
		utils.ErrorResponse(c, http.StatusUnauthorized, "Store not found", nil)
		return
	}

	var req struct {
		Category      string  `json:"category" binding:"required"`
		Description   string  `json:"description"`
		Amount        float64 `json:"amount" binding:"required"`
		ExpenseDate   string  `json:"expense_date"`
		PaymentMethod string  `json:"payment_method"`
		ReceiptURL    string  `json:"receipt_url"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Invalid request body", err)
		return
	}

	expenseDate := time.Now()
	if req.ExpenseDate != "" {
		var err error
		expenseDate, err = time.Parse("2006-01-02", req.ExpenseDate)
		if err != nil {
			utils.ErrorResponse(c, http.StatusBadRequest, "Invalid date format, use YYYY-MM-DD", err)
			return
		}
	}

	ctx, cancel := context.WithTimeout(c.Request.Context(), 10*time.Second)
	defer cancel()

	expense, err := utils.Queries.CreateExpense(ctx, db.CreateExpenseParams{
		StoreID:       storeID,
		Category:      req.Category,
		Description:   utils.OptionalText(req.Description),
		Amount:        utils.Numeric(req.Amount),
		ExpenseDate:   pgtype.Timestamptz{Time: expenseDate, Valid: true},
		PaymentMethod: utils.OptionalText(req.PaymentMethod),
		ReceiptUrl:    utils.OptionalText(req.ReceiptURL),
	})

	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to create expense", err)
		return
	}

	utils.SuccessResponse(c, "Expense created successfully", expense)
}

func ListExpenses(c *gin.Context) {
	storeID, ok := utils.GetStoreID(c)
	if !ok {
		utils.ErrorResponse(c, http.StatusUnauthorized, "Store not found", nil)
		return
	}
	rangeType := c.DefaultQuery("range", "month")
	category := c.DefaultQuery("category", "")

	startDate, endDate := utils.GetDateRange(rangeType)

	ctx, cancel := context.WithTimeout(c.Request.Context(), 10*time.Second)
	defer cancel()

	expenses, err := utils.Queries.ListExpenses(ctx, db.ListExpensesParams{
		StoreID:       storeID,
		ExpenseDate:   pgtype.Timestamptz{Time: startDate, Valid: true},
		ExpenseDate_2: pgtype.Timestamptz{Time: endDate, Valid: true},
		Column4:       category,
	})

	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to fetch expenses", err)
		return
	}

	if expenses == nil {
		expenses = []db.Expense{}
	}

	utils.SuccessResponse(c, "Expenses fetched successfully", expenses)
}

func GetExpense(c *gin.Context) {
	storeID, ok := utils.GetStoreID(c)
	if !ok {
		utils.ErrorResponse(c, http.StatusUnauthorized, "Store not found", nil)
		return
	}
	id := c.Param("id")

	uuid, err := utils.ParseUUID(id)
	if err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Invalid expense ID", err)
		return
	}

	ctx, cancel := context.WithTimeout(c.Request.Context(), 10*time.Second)
	defer cancel()

	expense, err := utils.Queries.GetExpense(ctx, db.GetExpenseParams{
		ID:      uuid,
		StoreID: storeID,
	})

	if err != nil {
		utils.ErrorResponse(c, http.StatusNotFound, "Expense not found", err)
		return
	}

	utils.SuccessResponse(c, "Expense fetched successfully", expense)
}

func UpdateExpense(c *gin.Context) {
	storeID, ok := utils.GetStoreID(c)
	if !ok {
		utils.ErrorResponse(c, http.StatusUnauthorized, "Store not found", nil)
		return
	}
	id := c.Param("id")

	uuid, err := utils.ParseUUID(id)
	if err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Invalid expense ID", err)
		return
	}

	var req struct {
		Category      string  `json:"category" binding:"required"`
		Description   string  `json:"description"`
		Amount        float64 `json:"amount" binding:"required"`
		ExpenseDate   string  `json:"expense_date"`
		PaymentMethod string  `json:"payment_method"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Invalid request body", err)
		return
	}

	expenseDate := time.Now()
	if req.ExpenseDate != "" {
		expenseDate, err = time.Parse("2006-01-02", req.ExpenseDate)
		if err != nil {
			utils.ErrorResponse(c, http.StatusBadRequest, "Invalid date format", err)
			return
		}
	}

	ctx, cancel := context.WithTimeout(c.Request.Context(), 10*time.Second)
	defer cancel()

	expense, err := utils.Queries.UpdateExpense(ctx, db.UpdateExpenseParams{
		ID:            uuid,
		Category:      req.Category,
		Description:   utils.OptionalText(req.Description),
		Amount:        utils.Numeric(req.Amount),
		ExpenseDate:   pgtype.Timestamptz{Time: expenseDate, Valid: true},
		PaymentMethod: utils.OptionalText(req.PaymentMethod),
		StoreID:       storeID,
	})

	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to update expense", err)
		return
	}

	utils.SuccessResponse(c, "Expense updated successfully", expense)
}

func DeleteExpense(c *gin.Context) {
	storeID, ok := utils.GetStoreID(c)
	if !ok {
		utils.ErrorResponse(c, http.StatusUnauthorized, "Store not found", nil)
		return
	}
	id := c.Param("id")

	uuid, err := utils.ParseUUID(id)
	if err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Invalid expense ID", err)
		return
	}

	ctx, cancel := context.WithTimeout(c.Request.Context(), 10*time.Second)
	defer cancel()

	err = utils.Queries.DeleteExpense(ctx, db.DeleteExpenseParams{
		ID:      uuid,
		StoreID: storeID,
	})

	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to delete expense", err)
		return
	}

	utils.SuccessResponse(c, "Expense deleted successfully", nil)
}

func GetExpenseSummary(c *gin.Context) {
	storeID, ok := utils.GetStoreID(c)
	if !ok {
		utils.ErrorResponse(c, http.StatusUnauthorized, "Store not found", nil)
		return
	}
	rangeType := c.DefaultQuery("range", "month")

	startDate, endDate := utils.GetDateRange(rangeType)

	ctx, cancel := context.WithTimeout(c.Request.Context(), 10*time.Second)
	defer cancel()

	summary, err := utils.Queries.GetExpenseSummary(ctx, db.GetExpenseSummaryParams{
		StoreID:       storeID,
		ExpenseDate:   pgtype.Timestamptz{Time: startDate, Valid: true},
		ExpenseDate_2: pgtype.Timestamptz{Time: endDate, Valid: true},
	})

	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to fetch expense summary", err)
		return
	}

	byCategory, err := utils.Queries.GetExpenseTotalsByCategory(ctx, db.GetExpenseTotalsByCategoryParams{
		StoreID:       storeID,
		ExpenseDate:   pgtype.Timestamptz{Time: startDate, Valid: true},
		ExpenseDate_2: pgtype.Timestamptz{Time: endDate, Valid: true},
	})

	if err != nil {
		byCategory = []db.GetExpenseTotalsByCategoryRow{}
	}

	daily, err := utils.Queries.GetDailyExpenses(ctx, db.GetDailyExpensesParams{
		StoreID:       storeID,
		ExpenseDate:   pgtype.Timestamptz{Time: startDate, Valid: true},
		ExpenseDate_2: pgtype.Timestamptz{Time: endDate, Valid: true},
	})

	if err != nil {
		daily = []db.GetDailyExpensesRow{}
	}

	utils.SuccessResponse(c, "Expense summary fetched successfully", gin.H{
		"summary":     summary,
		"by_category": byCategory,
		"daily":       daily,
	})
}
