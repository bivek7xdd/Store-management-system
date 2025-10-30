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

// CreateSupplierRequest represents the request body for creating a supplier
type CreateSupplierRequest struct {
	Name         string `json:"name" binding:"required,min=2,max=100"`
	ContactPhone string `json:"contact_phone" binding:"omitempty,max=20"`
	ContactEmail string `json:"contact_email" binding:"omitempty,email"`
	Address      string `json:"address" binding:"omitempty,max=255"`
}

// CreateSupplierHandler creates a new supplier
func CreateSupplierHandler(c *gin.Context) {
	var req CreateSupplierRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		if errs, ok := err.(validator.ValidationErrors); ok {
			for _, fieldErr := range errs {
				var errMsg string
				switch fieldErr.Field() {
				case "Name":
					errMsg = "Supplier name must be 2-100 characters"
				case "ContactEmail":
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

	// Generate slug from supplier name
	slug := strings.ToLower(strings.ReplaceAll(req.Name, " ", "-"))

	supplier, err := utils.Queries.CreateSupplier(context.Background(), db.CreateSupplierParams{
		Name:         req.Name,
		Slug:         slug,
		ContactPhone: pgtype.Text{String: req.ContactPhone, Valid: req.ContactPhone != ""},
		ContactEmail: pgtype.Text{String: req.ContactEmail, Valid: req.ContactEmail != ""},
		Address:      pgtype.Text{String: req.Address, Valid: req.Address != ""},
	})

	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to create supplier", err)
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message":  "Supplier created successfully",
		"supplier": supplier,
	})
}

// GetSupplierHandler retrieves a supplier by ID
func GetSupplierHandler(c *gin.Context) {
	supplierID := c.Param("id")

	id, err := uuid.Parse(supplierID)
	if err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Invalid supplier ID", err)
		return
	}

	supplier, err := utils.Queries.GetSupplierById(context.Background(), id)
	if err != nil {
		utils.ErrorResponse(c, http.StatusNotFound, "Supplier not found", err)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"supplier": supplier,
	})
}

// ListSuppliersHandler retrieves all suppliers with pagination
func ListSuppliersHandler(c *gin.Context) {
	limitStr := c.DefaultQuery("limit", "20")
	offsetStr := c.DefaultQuery("offset", "0")

	limit, _ := strconv.Atoi(limitStr)
	offset, _ := strconv.Atoi(offsetStr)

	suppliers, err := utils.Queries.ListSuppliers(context.Background(), db.ListSuppliersParams{
		Limit:  int32(limit),
		Offset: int32(offset),
	})

	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to fetch suppliers", err)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"suppliers": suppliers,
		"count":     len(suppliers),
		"limit":     limit,
		"offset":    offset,
	})
}

// SearchSuppliersHandler searches suppliers by name
func SearchSuppliersHandler(c *gin.Context) {
	query := c.Query("q")
	if query == "" {
		utils.ErrorResponse(c, http.StatusBadRequest, "Search query is required", nil)
		return
	}

	limitStr := c.DefaultQuery("limit", "20")
	offsetStr := c.DefaultQuery("offset", "0")

	limit, _ := strconv.Atoi(limitStr)
	offset, _ := strconv.Atoi(offsetStr)

	suppliers, err := utils.Queries.SearchSuppliers(context.Background(), db.SearchSuppliersParams{
		Lower:  "%" + strings.ToLower(query) + "%",
		Limit:  int32(limit),
		Offset: int32(offset),
	})

	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to search suppliers", err)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"suppliers": suppliers,
		"count":     len(suppliers),
		"query":     query,
	})
}

// UpdateSupplierRequest represents the request body for updating a supplier
type UpdateSupplierRequest struct {
	Name         *string `json:"name,omitempty"`
	ContactPhone *string `json:"contact_phone,omitempty"`
	ContactEmail *string `json:"contact_email,omitempty"`
	Address      *string `json:"address,omitempty"`
	IsActive     *bool   `json:"is_active,omitempty"`
}

// UpdateSupplierHandler updates a supplier
func UpdateSupplierHandler(c *gin.Context) {
	supplierID := c.Param("id")
	var req UpdateSupplierRequest

	id, err := uuid.Parse(supplierID)
	if err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Invalid supplier ID", err)
		return
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Invalid request", err)
		return
	}

	params := db.UpdateSupplierParams{
		ID: id,
	}

	if req.Name != nil {
		params.Name = pgtype.Text{String: *req.Name, Valid: true}
		slug := strings.ToLower(strings.ReplaceAll(*req.Name, " ", "-"))
		params.Slug = pgtype.Text{String: slug, Valid: true}
	}

	if req.ContactPhone != nil {
		params.ContactPhone = pgtype.Text{String: *req.ContactPhone, Valid: true}
	}

	if req.ContactEmail != nil {
		params.ContactEmail = pgtype.Text{String: *req.ContactEmail, Valid: true}
	}

	if req.Address != nil {
		params.Address = pgtype.Text{String: *req.Address, Valid: true}
	}

	if req.IsActive != nil {
		params.IsActive = pgtype.Bool{Bool: *req.IsActive, Valid: true}
	}

	supplier, err := utils.Queries.UpdateSupplier(context.Background(), params)
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to update supplier", err)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":  "Supplier updated successfully",
		"supplier": supplier,
	})
}

// DeleteSupplierHandler soft deletes a supplier
func DeleteSupplierHandler(c *gin.Context) {
	supplierID := c.Param("id")

	id, err := uuid.Parse(supplierID)
	if err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Invalid supplier ID", err)
		return
	}

	supplier, err := utils.Queries.DeleteSupplier(context.Background(), id)
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to delete supplier", err)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":  "Supplier deleted successfully",
		"supplier": supplier,
	})
}

// GetSupplierProductsHandler retrieves all products from a supplier
func GetSupplierProductsHandler(c *gin.Context) {
	supplierID := c.Param("id")

	id, err := uuid.Parse(supplierID)
	if err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Invalid supplier ID", err)
		return
	}

	products, err := utils.Queries.GetSupplierProducts(context.Background(), id)
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to fetch supplier products", err)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"products": products,
		"count":    len(products),
	})
}
