package handlers

import (
	"context"
	"errors"
	"net/http"
	"strconv"
	db "storemanagement/db/sqlc"
	"storemanagement/utils"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
)

type CreateCustomerRequest struct {
	Name              string `json:"name" binding:"required,min=2,max=100"`
	Phone             string `json:"phone" binding:"required"`
	Email             string `json:"email" binding:"omitempty,email"`
	Address           string `json:"address"`
	NotificationToken string `json:"notification_token"`
}

func CreateCustomerHandler(c *gin.Context) {
	var req CreateCustomerRequest
	storeID := c.GetString("store_id")

	if err := c.ShouldBindJSON(&req); err != nil {
		if errs, ok := err.(validator.ValidationErrors); ok {
			for _, fieldErr := range errs {
				var errMsg string
				switch fieldErr.Field() {
				case "Name":
					errMsg = "Customer name must be 2-100 characters"
				case "Phone":
					errMsg = "Phone number is required"
				case "Email":
					errMsg = "Please provide a valid email"
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

	customer, err := utils.Queries.CreateCustomer(context.Background(), db.CreateCustomerParams{
		StoreID:           uuid.MustParse(storeID),
		Name:              req.Name,
		Phone:             pgtype.Text{String: req.Phone, Valid: true},
		Email:             pgtype.Text{String: req.Email, Valid: req.Email != ""},
		Address:           pgtype.Text{String: req.Address, Valid: req.Address != ""},
		NotificationToken: pgtype.Text{String: req.NotificationToken, Valid: req.NotificationToken != ""},
	})

	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to create customer", err)
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message":  "Customer created successfully",
		"customer": customer,
	})
}

func GetCustomerHandler(c *gin.Context) {
	customerID := c.Param("id")
	storeID := c.GetString("store_id")

	id, err := uuid.Parse(customerID)
	if err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Invalid customer ID", err)
		return
	}

	customer, err := utils.Queries.GetCustomerById(context.Background(), db.GetCustomerByIdParams{
		ID:      id,
		StoreID: uuid.MustParse(storeID),
	})

	if err != nil {
		utils.ErrorResponse(c, http.StatusNotFound, "Customer not found", err)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"customer": customer,
	})
}

func ListCustomersHandler(c *gin.Context) {
	storeID := c.GetString("store_id")
	limitStr := c.DefaultQuery("limit", "20")
	offsetStr := c.DefaultQuery("offset", "0")

	limit, _ := strconv.Atoi(limitStr)
	offset, _ := strconv.Atoi(offsetStr)

	customers, err := utils.Queries.ListCustomers(context.Background(), db.ListCustomersParams{
		StoreID: uuid.MustParse(storeID),
		Limit:   int32(limit),
		Offset:  int32(offset),
	})

	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to fetch customers", err)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"customers": customers,
		"count":     len(customers),
		"limit":     limit,
		"offset":    offset,
	})
}

func SearchCustomersHandler(c *gin.Context) {
	storeID := c.GetString("store_id")
	query := c.Query("q")
	if query == "" {
		utils.ErrorResponse(c, http.StatusBadRequest, "Search query is required", nil)
		return
	}

	limitStr := c.DefaultQuery("limit", "20")
	offsetStr := c.DefaultQuery("offset", "0")
	limit, _ := strconv.Atoi(limitStr)
	offset, _ := strconv.Atoi(offsetStr)

	customers, err := utils.Queries.SearchCustomers(context.Background(), db.SearchCustomersParams{
		StoreID: uuid.MustParse(storeID),
		Lower:   "%" + strings.ToLower(query) + "%",
		Limit:   int32(limit),
		Offset:  int32(offset),
	})

	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to search customers", err)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"customers": customers,
		"count":     len(customers),
		"query":     query,
	})
}

func GetCustomersWithDebtHandler(c *gin.Context) {
	storeID := c.GetString("store_id")
	limitStr := c.DefaultQuery("limit", "20")
	offsetStr := c.DefaultQuery("offset", "0")

	limit, _ := strconv.Atoi(limitStr)
	offset, _ := strconv.Atoi(offsetStr)

	customers, err := utils.Queries.GetCustomersWithDebt(context.Background(), db.GetCustomersWithDebtParams{
		StoreID: uuid.MustParse(storeID),
		Limit:   int32(limit),
		Offset:  int32(offset),
	})

	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to fetch customers with debt", err)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"customers": customers,
		"count":     len(customers),
	})
}

type UpdateCustomerRequest struct {
	Name    *string `json:"name,omitempty"`
	Phone   *string `json:"phone,omitempty"`
	Email   *string `json:"email,omitempty"`
	Address *string `json:"address,omitempty"`
}

func UpdateCustomerHandler(c *gin.Context) {
	customerID := c.Param("id")
	storeID := c.GetString("store_id")
	var req UpdateCustomerRequest

	id, err := uuid.Parse(customerID)
	if err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Invalid customer ID", err)
		return
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Invalid request", err)
		return
	}

	params := db.UpdateCustomerParams{
		ID:      id,
		StoreID: uuid.MustParse(storeID),
	}

	if req.Name != nil {
		params.Name = pgtype.Text{String: *req.Name, Valid: true}
	}
	if req.Phone != nil {
		params.Phone = pgtype.Text{String: *req.Phone, Valid: true}
	}
	if req.Email != nil {
		params.Email = pgtype.Text{String: *req.Email, Valid: true}
	}
	if req.Address != nil {
		params.Address = pgtype.Text{String: *req.Address, Valid: true}
	}

	customer, err := utils.Queries.UpdateCustomer(context.Background(), params)
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to update customer", err)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":  "Customer updated successfully",
		"customer": customer,
	})
}

func DeleteCustomerHandler(c *gin.Context) {
	customerID := c.Param("id")
	storeID := c.GetString("store_id")

	id, err := uuid.Parse(customerID)
	if err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Invalid customer ID", err)
		return
	}

	customer, err := utils.Queries.DeleteCustomer(context.Background(), db.DeleteCustomerParams{
		ID:      id,
		StoreID: uuid.MustParse(storeID),
	})

	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to delete customer", err)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":  "Customer deleted successfully",
		"customer": customer,
	})
}
