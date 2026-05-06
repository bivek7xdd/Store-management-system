package handlers

import (
	"context"
	"encoding/json"
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

type CreateProductVariantReq struct {
	Sku          string            `json:"sku" binding:"required"`
	Barcode      string            `json:"barcode"`
	Attributes   json.RawMessage   `json:"attributes" binding:"required"`
	CostPrice    float64           `json:"cost_price" binding:"required"`
	SellingPrice float64           `json:"selling_price" binding:"required"`
	StockLevel   int32             `json:"stock_level" binding:"required"`
	ImageUrl     string            `json:"image_url"`
}

type createProductReq struct {
	Name              string                    `json:"name" binding:"required"`
	Barcode           string                    `json:"barcode"`
	Price             float64                   `json:"price"` // Changed binding required to optional
	CostPrice         float64                   `json:"cost_price"` // Changed binding required to optional
	MarketPrice       float64                   `json:"market_price"`
	StockQuantity     int32                     `json:"stock_quantity"` // Changed binding required to optional
	LowStockThreshold int32                     `json:"low_stock_threshold"`
	ExpiresAt         string                    `json:"expires_at"`
	Status            string                    `json:"status"`
	CategoryID        string                    `json:"category_id" binding:"required"`
	SupplierID        string                    `json:"supplier_id"`
	ImageUrl          string                    `json:"image_url"`
	IsTracked         bool                      `json:"is_tracked"`
	Variants          []CreateProductVariantReq `json:"variants"`
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
	} else {
		barcode = pgtype.Text{String: utils.RandomBarcode(), Valid: true}
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

	// Convert price to pgtype.Numeric safely if provided
	var price pgtype.Numeric
	if req.Price > 0 {
		if err := price.Scan(fmt.Sprintf("%f", req.Price)); err != nil {
			utils.ErrorResponse(c, http.StatusBadRequest, "Invalid price format", err)
			return
		}
	} else if len(req.Variants) == 0 {
		utils.ErrorResponse(c, http.StatusBadRequest, "Price is required for standard items", err)
		return
	}

	createParams := db.CreateProductParams{
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
	}

	if len(req.Variants) > 0 {
		var variantParams []db.CreateProductVariantParams
		for _, variant := range req.Variants {
			var vImageUrl pgtype.Text
			if variant.ImageUrl != "" {
				vImageUrl = pgtype.Text{String: variant.ImageUrl, Valid: true}
			}

			attrBytes := json.RawMessage("{}")
			if len(variant.Attributes) > 0 && string(variant.Attributes) != "null" {
				if !json.Valid(variant.Attributes) {
					utils.ErrorResponse(c, http.StatusBadRequest, fmt.Sprintf("Invalid JSON attributes for variant %s", variant.Sku), nil)
					return
				}
				attrBytes = variant.Attributes
			}

			var vBarcode pgtype.Text
			if variant.Barcode != "" {
				vBarcode = pgtype.Text{String: variant.Barcode, Valid: true}
			} else {
				vBarcode = pgtype.Text{String: utils.RandomBarcode(), Valid: true}
			}

			variantParams = append(variantParams, db.CreateProductVariantParams{
				Sku:          variant.Sku,
				Barcode:      vBarcode,
				Attributes:   attrBytes,
				CostPrice:    utils.Numeric(variant.CostPrice),
				SellingPrice: utils.Numeric(variant.SellingPrice),
				StockLevel:   variant.StockLevel,
				ImageUrl:     vImageUrl,
			})
		}
		
		txParams := db.CreateProductWithVariantsTxParams{
			Product:  createParams,
			Variants: variantParams,
		}
		
		product, variants, err := utils.Store.CreateProductWithVariantsTx(ctx, txParams)
		if err != nil {
			log.Printf("error creating nested product: %v", err)
			utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to create product with variants", err)
			return
		}
		utils.Queries.CheckAndNotifyLowStock(ctx, storeID, product)
		c.JSON(http.StatusOK, gin.H{
			"message": "Product and variants created successfully",
			"product": product,
			"variants": variants,
		})
		return
	}

	product, err := utils.Queries.CreateProduct(ctx, createParams)

	if err != nil {
		log.Printf("error creating product: %v", err)
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to create product", err)
		return
	}

	// Check for low stock notification
	utils.Queries.CheckAndNotifyLowStock(ctx, storeID, product)

	utils.SuccessResponse(c, "Product created successfully", product)
}

// VariantResponse is a JSON-serialisable variant with attributes decoded to a map.
type VariantResponse struct {
	ID           pgtype.UUID            `json:"id"`
	ProductID    pgtype.UUID            `json:"product_id"`
	Sku          string                 `json:"sku"`
	Barcode      pgtype.Text            `json:"barcode"`
	Attributes   json.RawMessage        `json:"attributes"`
	CostPrice    pgtype.Numeric         `json:"cost_price"`
	SellingPrice pgtype.Numeric         `json:"selling_price"`
	StockLevel   int32                  `json:"stock_level"`
	ImageUrl     pgtype.Text            `json:"image_url"`
}

// productWithVariants is the enriched response type for the list endpoint.
type productWithVariants struct {
	db.Product
	Variants []VariantResponse `json:"variants"`
}

// decodeVariants converts []db.ProductVariant (with []byte attributes) to
// []VariantResponse (with map[string]interface{} attributes) so they serialise
// correctly instead of being base64-encoded.
func decodeVariants(variants []db.ProductVariant) []VariantResponse {
	out := make([]VariantResponse, 0, len(variants))
	for _, v := range variants {
		out = append(out, VariantResponse{
			ID:           v.ID,
			ProductID:    v.ProductID,
			Sku:          v.Sku,
			Barcode:      v.Barcode,
			Attributes:   v.Attributes,
			CostPrice:    v.CostPrice,
			SellingPrice: v.SellingPrice,
			StockLevel:   v.StockLevel,
			ImageUrl:     v.ImageUrl,
		})
	}
	return out
}

func GetProducts(c *gin.Context) {
	storeID := c.MustGet("store_id").(pgtype.UUID)

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

	// Batch-fetch all variants in one query.
	productIDs := make([]pgtype.UUID, 0, len(products))
	for _, p := range products {
		productIDs = append(productIDs, p.ID)
	}

	variantMap := make(map[pgtype.UUID][]db.ProductVariant)
	if len(productIDs) > 0 {
		allVariants, verr := utils.Queries.ListVariantsByProducts(ctx, productIDs)
		if verr != nil {
			log.Printf("warning: could not batch-fetch variants: %v", verr)
		}
		for _, v := range allVariants {
			variantMap[v.ProductID] = append(variantMap[v.ProductID], v)
		}
	}

	enriched := make([]productWithVariants, 0, len(products))
	for _, p := range products {
		enriched = append(enriched, productWithVariants{
			Product:  p,
			Variants: decodeVariants(variantMap[p.ID]),
		})
	}

	utils.SuccessResponse(c, "Products fetched successfully", enriched)
}

func GetProduct(c *gin.Context) {
	idParam := c.Param("id")

	productUUID, err := uuid.Parse(idParam)
	if err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Invalid product ID", err)
		return
	}

	ctx, cancel := context.WithTimeout(c.Request.Context(), 3*time.Second)
	defer cancel()

	product, err := utils.Queries.GetProduct(ctx, pgtype.UUID{Bytes: productUUID, Valid: true})
	if err != nil {
		log.Printf("error getting product: %v", err)
		utils.ErrorResponse(c, http.StatusNotFound, "Product not found", err)
		return
	}

	// Also return any active variants so the frontend can hydrate the edit form
	variants, err := utils.Queries.ListVariantsByProduct(ctx, product.ID)
	if err != nil {
		log.Printf("warning: could not fetch variants for product %s: %v", idParam, err)
		variants = []db.ProductVariant{} // non-fatal, return empty
	}

	utils.SuccessResponse(c, "Product fetched successfully", gin.H{
		"product":  product,
		"variants": decodeVariants(variants),
	})
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
	ImageUrl          string                    `json:"image_url"`
	IsTracked         *bool                     `json:"is_tracked"`
	Variants          []CreateProductVariantReq `json:"variants"`
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

	// Cascade validation: if the product has active variants, stock_quantity
	// must NOT be set manually — it is derived from the sum of variant stock levels.
	stockQuantity := existingProduct.StockQuantity
	if req.StockQuantity > 0 {
		activeVariants, verr := utils.Queries.ListVariantsByProduct(ctx, existingProduct.ID)
		if verr == nil && len(activeVariants) > 0 {
			// Silently ignore the manually supplied stock_quantity;
			// the correct total is the sum of variant stock levels.
			total := int32(0)
			for _, v := range activeVariants {
				total += v.StockLevel
			}
			stockQuantity = total
		} else {
			stockQuantity = req.StockQuantity
		}
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

	updateParams := db.UpdateProductParams{
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
	}

	if len(req.Variants) > 0 {
		var variantParams []db.CreateProductVariantParams
		for _, variant := range req.Variants {
			var vImageUrl pgtype.Text
			if variant.ImageUrl != "" {
				vImageUrl = pgtype.Text{String: variant.ImageUrl, Valid: true}
			}

			attrBytes := json.RawMessage("{}")
			if len(variant.Attributes) > 0 && string(variant.Attributes) != "null" {
				if !json.Valid(variant.Attributes) {
					utils.ErrorResponse(c, http.StatusBadRequest, fmt.Sprintf("Invalid JSON attributes for variant %s", variant.Sku), nil)
					return
				}
				attrBytes = variant.Attributes
			}

			var vBarcode pgtype.Text
			if variant.Barcode != "" {
				vBarcode = pgtype.Text{String: variant.Barcode, Valid: true}
			} else {
				vBarcode = pgtype.Text{String: utils.RandomBarcode(), Valid: true}
			}

			variantParams = append(variantParams, db.CreateProductVariantParams{
				Sku:          variant.Sku,
				Barcode:      vBarcode,
				Attributes:   attrBytes,
				CostPrice:    utils.Numeric(variant.CostPrice),
				SellingPrice: utils.Numeric(variant.SellingPrice),
				StockLevel:   variant.StockLevel,
				ImageUrl:     vImageUrl,
			})
		}

		txParams := db.UpdateProductWithVariantsTxParams{
			UpdateProductParams: updateParams,
			Variants:            variantParams,
		}

		product, variants, err := utils.Store.UpdateProductWithVariantsTx(ctx, txParams)
		if err != nil {
			log.Printf("error updating product with variants: %v", err)
			utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to update product with variants", err)
			return
		}
		
		utils.Queries.CheckAndNotifyLowStock(ctx, product.StoreID, product)
		
		c.JSON(http.StatusOK, gin.H{
			"message":  "Product and variants updated successfully",
			"product":  product,
			"variants": decodeVariants(variants),
		})
		return
	}

	product, err := utils.Queries.UpdateProduct(ctx, updateParams)

	if err != nil {
		log.Printf("error updating product: %v", err)
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to update product", err)
		return
	}

	// Check for low stock notification
	utils.Queries.CheckAndNotifyLowStock(ctx, product.StoreID, product)

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

type POSCatalogItem struct {
	ID            pgtype.UUID     `json:"id"`
	Name          string          `json:"name"`
	Barcode       pgtype.Text     `json:"barcode"`
	Price         float64         `json:"price"`
	CostPrice     float64         `json:"cost_price"`
	StockQuantity int32           `json:"stock_quantity"`
	CategoryID    pgtype.UUID     `json:"category_id"`
	ImageUrl      pgtype.Text     `json:"image_url"`
	Variants      json.RawMessage `json:"variants"`
}

func GetPOSCatalog(c *gin.Context) {
	storeID := c.MustGet("store_id").(pgtype.UUID)
	ctx, cancel := context.WithTimeout(c.Request.Context(), 5*time.Second)
	defer cancel()

	rows, err := utils.Queries.GetPOSCatalog(ctx, storeID)
	if err != nil {
		log.Printf("error getting POS catalog: %v", err)
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to get POS catalog", err)
		return
	}

	var items []POSCatalogItem
	for _, row := range rows {
		price, _ := row.Price.Float64Value()
		costPrice, _ := row.CostPrice.Float64Value()

		item := POSCatalogItem{
			ID:            row.ID,
			Name:          row.Name,
			Barcode:       row.Barcode,
			Price:         price.Float64,
			CostPrice:     costPrice.Float64,
			StockQuantity: row.StockQuantity,
			CategoryID:    row.CategoryID,
			ImageUrl:      row.ImageUrl,
		}

		if len(row.Variants) > 0 {
			item.Variants = json.RawMessage(row.Variants)
		} else {
			item.Variants = json.RawMessage("[]")
		}

		items = append(items, item)
	}
	
	if items == nil {
		items = []POSCatalogItem{}
	}

	utils.SuccessResponse(c, "POS catalog fetched successfully", items)
}
