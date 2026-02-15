package handlers

import (
	"context"
	"fmt"
	"log"
	"net/http"
	db "storemanagement/db/sqlc"
	"storemanagement/utils"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
)

type createProductReq struct {
	Name              string  `json:"name" binding:"required"`
	Barcode           string  `json:"barcode"`
	Price             float64 `json:"price" binding:"required"`
	CostPrice         float64 `json:"cost_price" binding:"required"`
	MarketPrice       float64 `json:"market_price"`
	StockQuantity     int32   `json:"stock_quantity" binding:"required"`
	LowStockThreshold int32   `json:"low_stock_threshold"`
	ExpiresAt         string  `json:"expires_at"`
	Status            string  `json:"status"`
	CategoryID        string  `json:"category_id" binding:"required"`
	SupplierID        string  `json:"supplier_id"`
	ImageUrl          string  `json:"image_url"`
	IsTracked         bool    `json:"is_tracked"`
}

func CreateProduct(c *gin.Context) {
	var req createProductReq
	storeID := c.MustGet("store_id").(pgtype.UUID)

	if err := c.ShouldBindJSON(&req); err != nil {
		log.Printf("error binding json: %v", err)
		utils.ErrorResponse(c, http.StatusBadRequest, "Invalid request body", err)
		return
	}

	ctx, cancel := context.WithTimeout(c.Request.Context(), 5*time.Second)
	defer cancel()

	// Parse category ID
	categoryUUID, err := uuid.Parse(req.CategoryID)
	if err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Invalid category ID", err)
		return
	}

	// Prepare optional fields
	var barcode pgtype.Text
	if req.Barcode != "" {
		barcode = pgtype.Text{String: req.Barcode, Valid: true}
	}

	var marketPrice pgtype.Numeric
	if req.MarketPrice > 0 {
		if err := marketPrice.Scan(fmt.Sprintf("%f", req.MarketPrice)); err != nil {
			utils.ErrorResponse(c, http.StatusBadRequest, "Invalid market price format", err)
			return
		}
	}

	var lowStockThreshold pgtype.Int4
	if req.LowStockThreshold > 0 {
		lowStockThreshold = pgtype.Int4{Int32: req.LowStockThreshold, Valid: true}
	} else {
		lowStockThreshold = pgtype.Int4{Int32: 10, Valid: true} // default
	}

	var expiresAt pgtype.Timestamptz
	if req.ExpiresAt != "" {
		parsedTime, err := time.Parse(time.RFC3339, req.ExpiresAt)
		if err == nil {
			expiresAt = pgtype.Timestamptz{Time: parsedTime, Valid: true}
		}
	}

	var status db.NullProductStatus
	if req.Status != "" {
		status = db.NullProductStatus{ProductStatus: db.ProductStatus(req.Status), Valid: true}
	} else {
		status = db.NullProductStatus{ProductStatus: db.ProductStatusActive, Valid: true}
	}

	var supplierID pgtype.UUID
	if req.SupplierID != "" {
		supplierUUID, err := uuid.Parse(req.SupplierID)
		if err == nil {
			supplierID = pgtype.UUID{Bytes: supplierUUID, Valid: true}
		}
	}

	var imageUrl pgtype.Text
	if req.ImageUrl != "" {
		imageUrl = pgtype.Text{String: req.ImageUrl, Valid: true}
	}

	// Convert price to pgtype.Numeric
	var price pgtype.Numeric
	if err := price.Scan(fmt.Sprintf("%f", req.Price)); err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Invalid price format", err)
		return
	}

	product, err := utils.Queries.CreateProduct(ctx, db.CreateProductParams{
		Name:              req.Name,
		Barcode:           barcode,
		Price:             price,
		CostPrice:         utils.Numeric(req.CostPrice),
		MarketPrice:       marketPrice,
		StockQuantity:     req.StockQuantity,
		LowStockThreshold: lowStockThreshold,
		ExpiresAt:         expiresAt,
		Status:            status,
		CategoryID:        pgtype.UUID{Bytes: categoryUUID, Valid: true},
		SupplierID:        supplierID,
		StoreID:           storeID,
		ImageUrl:          imageUrl,
		IsTracked:         pgtype.Bool{Bool: req.IsTracked, Valid: true},
	})

	if err != nil {
		log.Printf("error creating product: %v", err)
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to create product", err)
		return
	}

	utils.SuccessResponse(c, "Product created successfully", product)
}

func GetProducts(c *gin.Context) {
	storeID := c.MustGet("store_id").(pgtype.UUID)

	// Parse pagination params
	limitStr := c.DefaultQuery("limit", "50")
	offsetStr := c.DefaultQuery("offset", "0")

	limit, _ := strconv.Atoi(limitStr)
	offset, _ := strconv.Atoi(offsetStr)

	if limit <= 0 || limit > 100 {
		limit = 50
	}
	if offset < 0 {
		offset = 0
	}

	ctx, cancel := context.WithTimeout(c.Request.Context(), 5*time.Second)
	defer cancel()

	products, err := utils.Queries.ListProducts(ctx, db.ListProductsParams{
		StoreID: storeID,
		Limit:   int32(limit),
		Offset:  int32(offset),
	})
	if err != nil {
		log.Printf("error getting products: %v", err)
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to get products", err)
		return
	}

	utils.SuccessResponse(c, "Products fetched successfully", products)
}

func GetProduct(c *gin.Context) {
	idParam := c.Param("id")

	productUUID, err := uuid.Parse(idParam)
	if err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Invalid product ID", err)
		return
	}

	ctx, cancel := context.WithTimeout(c.Request.Context(), 2*time.Second)
	defer cancel()

	product, err := utils.Queries.GetProduct(ctx, pgtype.UUID{Bytes: productUUID, Valid: true})
	if err != nil {
		log.Printf("error getting product: %v", err)
		utils.ErrorResponse(c, http.StatusNotFound, "Product not found", err)
		return
	}

	utils.SuccessResponse(c, "Product fetched successfully", product)
}

type updateProductReq struct {
	Name              string  `json:"name"`
	Barcode           string  `json:"barcode"`
	Price             float64 `json:"price"`
	CostPrice         float64 `json:"cost_price"`
	MarketPrice       float64 `json:"market_price"`
	StockQuantity     int32   `json:"stock_quantity"`
	LowStockThreshold int32   `json:"low_stock_threshold"`
	ExpiresAt         string  `json:"expires_at"`
	Status            string  `json:"status"`
	CategoryID        string  `json:"category_id"`
	SupplierID        string  `json:"supplier_id"`
	ImageUrl          string  `json:"image_url"`
	IsTracked         *bool   `json:"is_tracked"`
}

func UpdateProduct(c *gin.Context) {
	idParam := c.Param("id")

	productUUID, err := uuid.Parse(idParam)
	if err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Invalid product ID", err)
		return
	}

	var req updateProductReq
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Invalid request body", err)
		return
	}

	ctx, cancel := context.WithTimeout(c.Request.Context(), 5*time.Second)
	defer cancel()

	// Get existing product first
	existingProduct, err := utils.Queries.GetProduct(ctx, pgtype.UUID{Bytes: productUUID, Valid: true})
	if err != nil {
		utils.ErrorResponse(c, http.StatusNotFound, "Product not found", err)
		return
	}

	// Prepare update params - use existing values if not provided
	name := existingProduct.Name
	if req.Name != "" {
		name = req.Name
	}

	barcode := existingProduct.Barcode
	if req.Barcode != "" {
		barcode = pgtype.Text{String: req.Barcode, Valid: true}
	}

	price := existingProduct.Price
	if req.Price > 0 {
		if err := price.Scan(fmt.Sprintf("%f", req.Price)); err != nil {
			utils.ErrorResponse(c, http.StatusBadRequest, "Invalid price format", err)
			return
		}
	}

	marketPrice := existingProduct.MarketPrice
	costPrice := existingProduct.CostPrice
	if req.CostPrice > 0 {
		if err := costPrice.Scan(fmt.Sprintf("%f", req.CostPrice)); err != nil {
			utils.ErrorResponse(c, http.StatusBadRequest, "Invalid cost price format", err)
			return
		}
	}

	if req.MarketPrice > 0 {
		if err := marketPrice.Scan(fmt.Sprintf("%f", req.MarketPrice)); err != nil {
			utils.ErrorResponse(c, http.StatusBadRequest, "Invalid market price format", err)
			return
		}
	}

	stockQuantity := existingProduct.StockQuantity
	if req.StockQuantity > 0 {
		stockQuantity = req.StockQuantity
	}

	lowStockThreshold := existingProduct.LowStockThreshold
	if req.LowStockThreshold > 0 {
		lowStockThreshold = pgtype.Int4{Int32: req.LowStockThreshold, Valid: true}
	}

	expiresAt := existingProduct.ExpiresAt
	if req.ExpiresAt != "" {
		parsedTime, err := time.Parse(time.RFC3339, req.ExpiresAt)
		if err == nil {
			expiresAt = pgtype.Timestamptz{Time: parsedTime, Valid: true}
		}
	}

	status := existingProduct.Status
	if req.Status != "" {
		status = db.NullProductStatus{ProductStatus: db.ProductStatus(req.Status), Valid: true}
	}

	categoryID := existingProduct.CategoryID
	if req.CategoryID != "" {
		catUUID, err := uuid.Parse(req.CategoryID)
		if err == nil {
			categoryID = pgtype.UUID{Bytes: catUUID, Valid: true}
		}
	}

	supplierID := existingProduct.SupplierID
	if req.SupplierID != "" {
		supUUID, err := uuid.Parse(req.SupplierID)
		if err == nil {
			supplierID = pgtype.UUID{Bytes: supUUID, Valid: true}
		}
	}

	imageUrl := existingProduct.ImageUrl
	if req.ImageUrl != "" {
		imageUrl = pgtype.Text{String: req.ImageUrl, Valid: true}
	}

	isTracked := existingProduct.IsTracked
	if req.IsTracked != nil {
		// If trying to enable tracking, check the limit
		if *req.IsTracked && !existingProduct.IsTracked.Bool {
			storeID := c.MustGet("store_id").(pgtype.UUID)
			trackedProducts, err := utils.Queries.ListTrackedProducts(ctx, storeID)
			if err == nil && len(trackedProducts) >= 6 {
				utils.ErrorResponse(c, http.StatusBadRequest, "Tracking limit reached. Max 6 products allowed.", fmt.Errorf("tracking limit reached"))
				return
			}
		}
		isTracked = pgtype.Bool{Bool: *req.IsTracked, Valid: true}
	}

	product, err := utils.Queries.UpdateProduct(ctx, db.UpdateProductParams{
		ID:                pgtype.UUID{Bytes: productUUID, Valid: true},
		Name:              name,
		Barcode:           barcode,
		Price:             price,
		CostPrice:         costPrice,
		MarketPrice:       marketPrice,
		StockQuantity:     stockQuantity,
		LowStockThreshold: lowStockThreshold,
		ExpiresAt:         expiresAt,
		Status:            status,
		CategoryID:        categoryID,
		SupplierID:        supplierID,
		ImageUrl:          imageUrl,
		IsTracked:         isTracked,
	})

	if err != nil {
		log.Printf("error updating product: %v", err)
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to update product", err)
		return
	}

	utils.SuccessResponse(c, "Product updated successfully", product)
}

func DeleteProduct(c *gin.Context) {
	idParam := c.Param("id")

	productUUID, err := uuid.Parse(idParam)
	if err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Invalid product ID", err)
		return
	}

	ctx, cancel := context.WithTimeout(c.Request.Context(), 2*time.Second)
	defer cancel()

	err = utils.Queries.DeleteProduct(ctx, pgtype.UUID{Bytes: productUUID, Valid: true})
	if err != nil {
		log.Printf("error deleting product: %v", err)
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to delete product", err)
		return
	}

	utils.SuccessResponse(c, "Product deleted successfully", nil)
}

func SearchProducts(c *gin.Context) {
	storeID := c.MustGet("store_id").(pgtype.UUID)
	query := c.Query("q")

	limitStr := c.DefaultQuery("limit", "50")
	offsetStr := c.DefaultQuery("offset", "0")

	limit, _ := strconv.Atoi(limitStr)
	offset, _ := strconv.Atoi(offsetStr)

	if limit <= 0 || limit > 100 {
		limit = 50
	}
	if offset < 0 {
		offset = 0
	}

	ctx, cancel := context.WithTimeout(c.Request.Context(), 5*time.Second)
	defer cancel()

	products, err := utils.Queries.SearchProducts(ctx, db.SearchProductsParams{
		StoreID: storeID,
		Column2: pgtype.Text{String: query, Valid: true},
		Limit:   int32(limit),
		Offset:  int32(offset),
	})
	if err != nil {
		log.Printf("error searching products: %v", err)
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to search products", err)
		return
	}

	utils.SuccessResponse(c, "Products found", products)
}

func GetTrackedProducts(c *gin.Context) {
	storeID := c.MustGet("store_id").(pgtype.UUID)

	ctx, cancel := context.WithTimeout(c.Request.Context(), 5*time.Second)
	defer cancel()

	products, err := utils.Queries.ListTrackedProducts(ctx, storeID)
	if err != nil {
		log.Printf("error getting tracked products: %v", err)
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to get tracked products", err)
		return
	}

	utils.SuccessResponse(c, "Tracked products fetched successfully", products)
}
