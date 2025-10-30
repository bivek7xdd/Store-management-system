package handlers

import (
	"context"
	"errors"
	"net/http"
	db "storemanagement/db/sqlc"
	"storemanagement/utils"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
)

// CreateStoreRequest represents the request body for creating a store
type CreateStoreRequest struct {
	Name         string `json:"name" binding:"required,min=2,max=100"`
	BusinessType string `json:"business_type" binding:"required"`
	Description  string `json:"description"`
	Address      string `json:"address"`
	Phone        string `json:"phone"`
	Email        string `json:"email" binding:"omitempty,email"`
	Currency     string `json:"currency" binding:"omitempty,len=3"`
	Timezone     string `json:"timezone"`
}

// CreateStoreHandler creates a new store
func CreateStoreHandler(c *gin.Context) {
	var req CreateStoreRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		if errs, ok := err.(validator.ValidationErrors); ok {
			for _, fieldErr := range errs {
				var errMsg string
				switch fieldErr.Field() {
				case "Name":
					errMsg = "Store name must be 2-100 characters"
				case "BusinessType":
					errMsg = "Business type is required"
				case "Email":
					errMsg = "Please provide a valid email"
				case "Currency":
					errMsg = "Currency must be 3 characters (e.g., USD)"
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

	// Get user ID from context (should be set by auth middleware)
	userIDStr := c.GetString("user_id")
	if userIDStr == "" {
		utils.ErrorResponse(c, http.StatusUnauthorized, "User not authenticated", nil)
		return
	}

	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Invalid user ID", err)
		return
	}

	// Generate slug from store name
	slug := strings.ToLower(strings.ReplaceAll(req.Name, " ", "-"))

	// Set defaults
	currency := req.Currency
	if currency == "" {
		currency = "USD"
	}
	timezone := req.Timezone
	if timezone == "" {
		timezone = "UTC"
	}

	store, err := utils.Queries.CreateStore(context.Background(), db.CreateStoreParams{
		OwnerID:      userID,
		Name:         req.Name,
		Slug:         slug,
		BusinessType: pgtype.Text{String: req.BusinessType, Valid: true},
		Description:  pgtype.Text{String: req.Description, Valid: req.Description != ""},
		Address:      pgtype.Text{String: req.Address, Valid: req.Address != ""},
		Phone:        pgtype.Text{String: req.Phone, Valid: req.Phone != ""},
		Email:        pgtype.Text{String: req.Email, Valid: req.Email != ""},
		Currency:     pgtype.Text{String: currency, Valid: true},
		Timezone:     pgtype.Text{String: timezone, Valid: true},
	})

	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to create store", err)
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Store created successfully",
		"store":   store,
	})
}

// GetStoreHandler retrieves a store by ID
func GetStoreHandler(c *gin.Context) {
	storeID := c.Param("id")

	id, err := uuid.Parse(storeID)
	if err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Invalid store ID", err)
		return
	}

	store, err := utils.Queries.GetStoreById(context.Background(), id)
	if err != nil {
		utils.ErrorResponse(c, http.StatusNotFound, "Store not found", err)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"store": store,
	})
}

// GetUserStoresHandler retrieves all stores for the authenticated user
func GetUserStoresHandler(c *gin.Context) {
	userIDStr := c.GetString("user_id")
	if userIDStr == "" {
		utils.ErrorResponse(c, http.StatusUnauthorized, "User not authenticated", nil)
		return
	}

	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Invalid user ID", err)
		return
	}

	stores, err := utils.Queries.GetUserStores(context.Background(), userID)
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to fetch stores", err)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"stores": stores,
		"count":  len(stores),
	})
}

// UpdateStoreRequest represents the request body for updating a store
type UpdateStoreRequest struct {
	Name         *string `json:"name,omitempty"`
	BusinessType *string `json:"business_type,omitempty"`
	Description  *string `json:"description,omitempty"`
	Address      *string `json:"address,omitempty"`
	Phone        *string `json:"phone,omitempty"`
	Email        *string `json:"email,omitempty"`
	LogoURL      *string `json:"logo_url,omitempty"`
	IsActive     *bool   `json:"is_active,omitempty"`
}

// UpdateStoreHandler updates a store
func UpdateStoreHandler(c *gin.Context) {
	storeID := c.Param("id")
	var req UpdateStoreRequest

	id, err := uuid.Parse(storeID)
	if err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Invalid store ID", err)
		return
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Invalid request", err)
		return
	}

	params := db.UpdateStoreParams{
		ID: id,
	}

	if req.Name != nil {
		params.Name = pgtype.Text{String: *req.Name, Valid: true}
	}
	if req.BusinessType != nil {
		params.BusinessType = pgtype.Text{String: *req.BusinessType, Valid: true}
	}
	if req.Description != nil {
		params.Description = pgtype.Text{String: *req.Description, Valid: true}
	}
	if req.Address != nil {
		params.Address = pgtype.Text{String: *req.Address, Valid: true}
	}
	if req.Phone != nil {
		params.Phone = pgtype.Text{String: *req.Phone, Valid: true}
	}
	if req.Email != nil {
		params.Email = pgtype.Text{String: *req.Email, Valid: true}
	}
	if req.LogoURL != nil {
		params.LogoUrl = pgtype.Text{String: *req.LogoURL, Valid: true}
	}
	if req.IsActive != nil {
		params.IsActive = pgtype.Bool{Bool: *req.IsActive, Valid: true}
	}

	store, err := utils.Queries.UpdateStore(context.Background(), params)
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to update store", err)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Store updated successfully",
		"store":   store,
	})
}

// DeleteStoreHandler soft deletes a store
func DeleteStoreHandler(c *gin.Context) {
	storeID := c.Param("id")

	id, err := uuid.Parse(storeID)
	if err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Invalid store ID", err)
		return
	}

	store, err := utils.Queries.DeleteStore(context.Background(), id)
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to delete store", err)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Store deleted successfully",
		"store":   store,
	})
}
