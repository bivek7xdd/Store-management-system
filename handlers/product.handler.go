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

// CreateProductRequest represents the request body for creating a product
type CreateProductRequest struct {
	Name               string  `json:"name" binding:"required,min=2,max=100"`
	Code               string  `json:"code" binding:"required,min=2,max=50"`
	CategoryID         string  `json:"category_id" binding:"required,uuid"`
	SupplierID         string  `json:"supplier_id" binding:"required,uuid"`
	Price              float64 `json:"price" binding:"required,gt=0"`
	MarketPrice        float64 `json:"market_price" binding:"omitempty,gt=0"`
	StockQuantity      int32   `json:"stock_quantity" binding:"required,gte=0"`
	LowStockThreshold  int32   `json:"low_stock_threshold" binding:"required,gte=0"`
	IsPerishable       bool    `json:"is_perishable"`
	UnitOfMeasure      string  `json:"unit_of_measure" binding:"required"`
	Status             string  `json:"status" binding:"required,oneof=active discontinued out_of_stock"`
}

// CreateProductHandler creates a new product
func CreateProductHandler(c *gin.Context) {
	var req CreateProductRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		if errs, ok := err.(validator.ValidationErrors); ok {
			for _, fieldErr := range errs {
				var errMsg string
				switch fieldErr.Field() {
				case "Name":
					errMsg = "Product name must be 2-100 characters"
				case "Code":
					errMsg = "Product code must be 2-50 characters"
				case "CategoryID":
					errMsg = "Valid category ID is required"
				case "SupplierID":
					errMsg = "Valid supplier ID is required"
				case "Price":
					errMsg = "Price must be greater than 0"
				case "Status":
					errMsg = "Status must be: active, discontinued, or out_of_stock"
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

	// Generate slug from product name
	slug := strings.ToLower(strings.ReplaceAll(req.Name, " ", "-"))

	// Parse UUIDs
	categoryID, _ := uuid.Parse(req.CategoryID)
	supplierID, _ := uuid.Parse(req.SupplierID)

	// Create product
	product, err := utils.Queries.CreateProduct(context.Background(), db.CreateProductParams{
		Name:              req.Name,
		Code:              req.Code,
		Slug:              slug,
		CategoryID:        categoryID,
		SupplierID:        supplierID,
		Price:             req.Price,
		MarketPrice:       pgtype.Numeric{Valid: req.MarketPrice > 0},
		StockQuantity:     req.StockQuantity,
		LowStockThreshold: req.LowStockThreshold,
		IsPerishable:      req.IsPerishable,
		UnitOfMeasure:     req.UnitOfMeasure,
		Status:            db.ProductStatus(req.Status),
	})

	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to create product", err)
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Product created successfully",
		"product": product,
	})
}

// GetProductHandler retrieves a product by ID
func GetProductHandler(c *gin.Context) {
	productID := c.Param("id")

	id, err := uuid.Parse(productID)
	if err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Invalid product ID", err)
		return
	}

	product, err := utils.Queries.GetProductById(context.Background(), id)
	if err != nil {
		utils.ErrorResponse(c, http.StatusNotFound, "Product not found", err)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"product": product,
	})
}

// ListProductsHandler retrieves all products with pagination
func ListProductsHandler(c *gin.Context) {
	// Get pagination parameters
	limitStr := c.DefaultQuery("limit", "20")
	offsetStr := c.DefaultQuery("offset", "0")

	limit, _ := strconv.Atoi(limitStr)
	offset, _ := strconv.Atoi(offsetStr)

	products, err := utils.Queries.ListProducts(context.Background(), db.ListProductsParams{
		Limit:  int32(limit),
		Offset: int32(offset),
	})

	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to fetch products", err)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"products": products,
		"count":    len(products),
		"limit":    limit,
		"offset":   offset,
	})
}

// SearchProductsHandler searches products by name or code
func SearchProductsHandler(c *gin.Context) {
	query := c.Query("q")
	if query == "" {
		utils.ErrorResponse(c, http.StatusBadRequest, "Search query is required", nil)
		return
	}

	limitStr := c.DefaultQuery("limit", "20")
	offsetStr := c.DefaultQuery("offset", "0")

	limit, _ := strconv.Atoi(limitStr)
	offset, _ := strconv.Atoi(offsetStr)

	products, err := utils.Queries.SearchProducts(context.Background(), db.SearchProductsParams{
		Lower:   "%" + strings.ToLower(query) + "%",
		Limit:   int32(limit),
		Offset:  int32(offset),
	})

	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to search products", err)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"products": products,
		"count":    len(products),
		"query":    query,
	})
}

// GetLowStockProductsHandler retrieves products with low stock
func GetLowStockProductsHandler(c *gin.Context) {
	products, err := utils.Queries.ListLowStockProducts(context.Background())

	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to fetch low stock products", err)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"products": products,
		"count":    len(products),
	})
}

// UpdateProductRequest represents the request body for updating a product
type UpdateProductRequest struct {
	Name               *string  `json:"name,omitempty"`
	Price              *float64 `json:"price,omitempty"`
	MarketPrice        *float64 `json:"market_price,omitempty"`
	StockQuantity      *int32   `json:"stock_quantity,omitempty"`
	LowStockThreshold  *int32   `json:"low_stock_threshold,omitempty"`
	Status             *string  `json:"status,omitempty"`
	IsActive           *bool    `json:"is_active,omitempty"`
}

// UpdateProductHandler updates a product
func UpdateProductHandler(c *gin.Context) {
	productID := c.Param("id")
	var req UpdateProductRequest

	id, err := uuid.Parse(productID)
	if err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Invalid product ID", err)
		return
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Invalid request", err)
		return
	}

	// Build update params
	params := db.UpdateProductParams{
		ID: id,
	}

	if req.Name != nil {
		params.Name = pgtype.Text{String: *req.Name, Valid: true}
		slug := strings.ToLower(strings.ReplaceAll(*req.Name, " ", "-"))
		params.Slug = pgtype.Text{String: slug, Valid: true}
	}

	if req.Price != nil {
		params.Price = pgtype.Numeric{Valid: true}
	}

	if req.StockQuantity != nil {
		params.StockQuantity = pgtype.Int4{Int32: *req.StockQuantity, Valid: true}
	}

	if req.IsActive != nil {
		params.IsActive = pgtype.Bool{Bool: *req.IsActive, Valid: true}
	}

	product, err := utils.Queries.UpdateProduct(context.Background(), params)
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to update product", err)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Product updated successfully",
		"product": product,
	})
}

// DeleteProductHandler soft deletes a product
func DeleteProductHandler(c *gin.Context) {
	productID := c.Param("id")

	id, err := uuid.Parse(productID)
	if err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Invalid product ID", err)
		return
	}

	product, err := utils.Queries.DeleteProduct(context.Background(), id)
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to delete product", err)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Product deleted successfully",
		"product": product,
	})
}
