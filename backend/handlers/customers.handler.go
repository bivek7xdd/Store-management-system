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

func ListCustomers(c *gin.Context) {
	storeID := c.MustGet("store_id").(pgtype.UUID)

	ctx, cancel := context.WithTimeout(c.Request.Context(), 5*time.Second)
	defer cancel()

	customers, err := utils.Queries.ListCustomers(ctx, storeID)
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to fetch customers", err)
		return
	}

	if customers == nil {
		customers = []db.Customer{}
	}

	utils.SuccessResponse(c, "Customers fetched successfully", customers)
}

func SearchCustomers(c *gin.Context) {
	storeID := c.MustGet("store_id").(pgtype.UUID)
	query := c.Query("q")

	ctx, cancel := context.WithTimeout(c.Request.Context(), 5*time.Second)
	defer cancel()

	searchQuery := "%" + query + "%"
	customers, err := utils.Queries.SearchCustomers(ctx, db.SearchCustomersParams{
		StoreID: storeID,
		Name:    searchQuery,
	})
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to search customers", err)
		return
	}

	if customers == nil {
		customers = []db.Customer{}
	}

	utils.SuccessResponse(c, "Customers found successfully", customers)
}

type CreateCustomerRequest struct {
	Name  string `json:"name" binding:"required"`
	Phone string `json:"phone" binding:"required"`
}

func CreateCustomer(c *gin.Context) {
	storeID := c.MustGet("store_id").(pgtype.UUID)

	var req CreateCustomerRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Invalid request payload", err)
		return
	}

	ctx, cancel := context.WithTimeout(c.Request.Context(), 5*time.Second)
	defer cancel()

	customer, err := utils.Queries.CreateCustomer(ctx, db.CreateCustomerParams{
		Name:    req.Name,
		Phone:   req.Phone,
		StoreID: storeID,
	})
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to create customer", err)
		return
	}

	utils.SuccessResponse(c, "Customer created successfully", customer)
}

type UpdateCustomerRequest struct {
	Name  string `json:"name" binding:"required"`
	Phone string `json:"phone" binding:"required"`
}

func UpdateCustomer(c *gin.Context) {
	idParam := c.Param("id")
	customerID, err := utils.ParseUUID(idParam)
	if err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Invalid customer ID", err)
		return
	}

	storeID := c.MustGet("store_id").(pgtype.UUID)

	var req UpdateCustomerRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Invalid request payload", err)
		return
	}

	ctx, cancel := context.WithTimeout(c.Request.Context(), 5*time.Second)
	defer cancel()

	customer, err := utils.Queries.UpdateCustomer(ctx, db.UpdateCustomerParams{
		Name:    req.Name,
		Phone:   req.Phone,
		ID:      customerID,
		StoreID: storeID,
	})
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to update customer", err)
		return
	}

	utils.SuccessResponse(c, "Customer updated successfully", customer)
}
