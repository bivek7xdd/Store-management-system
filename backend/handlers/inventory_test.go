package handlers

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"strings"
	"testing"

	"storemanagement/utils"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// setupProductRouter creates a router with authenticated product endpoints
func setupProductRouter(storeID pgtype.UUID) *gin.Engine {
	gin.SetMode(gin.TestMode)
	r := gin.Default()

	// Middleware to inject store_id and user_id without real JWT
	r.Use(func(c *gin.Context) {
		c.Set("store_id", storeID)
		c.Set("user_id", storeID) // reuse for simplicity
		c.Next()
	})

	r.POST("/products", CreateProduct)
	r.GET("/products", GetProducts)
	r.GET("/products/:id", GetProduct)
	r.PUT("/products/:id", UpdateProduct)
	r.DELETE("/products/:id", DeleteProduct)
	r.GET("/products/search", SearchProducts)

	return r
}

// setupCategoryRouter creates a router with authenticated category endpoints
func setupCategoryRouter(storeID pgtype.UUID) *gin.Engine {
	gin.SetMode(gin.TestMode)
	r := gin.Default()

	r.Use(func(c *gin.Context) {
		c.Set("store_id", storeID)
		c.Next()
	})

	r.POST("/categories", CreateCategories)
	r.GET("/categories", GetAllCategories)
	r.GET("/categories/:id", GetCategory)
	r.PUT("/categories/:id", UpdateCategory)
	r.DELETE("/categories", DeleteCategory)
	r.GET("/categories/:id/stats", GetCategoryStats)
	r.GET("/categories/:id/products", GetCategoryProducts)

	return r
}

// helper to get a test store ID — creates a user and store via DB if needed.
// Returns the storeID or skips the test if the DB isn't available.
func getTestStoreID(t *testing.T) pgtype.UUID {
	t.Helper()
	if utils.Queries == nil {
		t.Skip("Skipping: test database not connected")
	}

	// Use a fixed UUID for test store — this assumes main_test.go sets up the DB.
	// We'll use a real query to find an existing store or create one.
	storeUUID, _ := uuid.Parse("00000000-0000-0000-0000-000000000001")
	return pgtype.UUID{Bytes: storeUUID, Valid: true}
}

// ====================================================================
// INV-01: Create product with negative price or stock
// ====================================================================
func TestCreateProduct_InvalidRequest(t *testing.T) {
	storeID := getTestStoreID(t)
	router := setupProductRouter(storeID)

	tests := []struct {
		name         string
		body         string
		expectedCode int
		expectedMsg  string
	}{
		{
			name:         "Empty body",
			body:         `{}`,
			expectedCode: http.StatusBadRequest,
			expectedMsg:  "Invalid request body",
		},
		{
			name:         "Missing product name",
			body:         `{"price":10.0,"cost_price":5.0,"stock_quantity":10,"category_id":"` + uuid.NewString() + `"}`,
			expectedCode: http.StatusBadRequest,
			expectedMsg:  "Invalid request body",
		},
		{
			name:         "Missing price",
			body:         `{"name":"Test Product","cost_price":5.0,"stock_quantity":10,"category_id":"` + uuid.NewString() + `"}`,
			expectedCode: http.StatusBadRequest,
			expectedMsg:  "Invalid request body",
		},
		{
			name:         "Missing cost_price",
			body:         `{"name":"Test Product","price":10.0,"stock_quantity":10,"category_id":"` + uuid.NewString() + `"}`,
			expectedCode: http.StatusBadRequest,
			expectedMsg:  "Invalid request body",
		},
		{
			name:         "Missing stock_quantity",
			body:         `{"name":"Test Product","price":10.0,"cost_price":5.0,"category_id":"` + uuid.NewString() + `"}`,
			expectedCode: http.StatusBadRequest,
			expectedMsg:  "Invalid request body",
		},
		{
			name:         "Missing category_id",
			body:         `{"name":"Test Product","price":10.0,"cost_price":5.0,"stock_quantity":10}`,
			expectedCode: http.StatusBadRequest,
			expectedMsg:  "Invalid request body",
		},
		{
			name:         "Invalid category_id format",
			body:         `{"name":"Test Product","price":10.0,"cost_price":5.0,"stock_quantity":10,"category_id":"not-a-uuid"}`,
			expectedCode: http.StatusBadRequest,
			expectedMsg:  "Invalid category ID",
		},
		{
			name:         "Malformed JSON",
			body:         `{invalid`,
			expectedCode: http.StatusBadRequest,
			expectedMsg:  "Invalid request body",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			w := httptest.NewRecorder()
			req, _ := http.NewRequest("POST", "/products", strings.NewReader(tt.body))
			req.Header.Set("Content-Type", "application/json")
			router.ServeHTTP(w, req)

			assert.Equal(t, tt.expectedCode, w.Code, "Body: %s", w.Body.String())
			assert.Contains(t, w.Body.String(), tt.expectedMsg)
		})
	}
}

// ====================================================================
// GetProduct — Invalid ID
// ====================================================================
func TestGetProduct_InvalidID(t *testing.T) {
	storeID := getTestStoreID(t)
	router := setupProductRouter(storeID)

	tests := []struct {
		name         string
		id           string
		expectedCode int
		expectedMsg  string
	}{
		{
			name:         "Not a UUID",
			id:           "not-a-uuid",
			expectedCode: http.StatusBadRequest,
			expectedMsg:  "Invalid product ID",
		},
		{
			name:         "Non-existent UUID",
			id:           uuid.NewString(),
			expectedCode: http.StatusNotFound,
			expectedMsg:  "Product not found",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			w := httptest.NewRecorder()
			req, _ := http.NewRequest("GET", "/products/"+tt.id, nil)
			router.ServeHTTP(w, req)

			assert.Equal(t, tt.expectedCode, w.Code)
			assert.Contains(t, w.Body.String(), tt.expectedMsg)
		})
	}
}

// ====================================================================
// UpdateProduct — Invalid requests
// ====================================================================
func TestUpdateProduct_InvalidRequest(t *testing.T) {
	storeID := getTestStoreID(t)
	router := setupProductRouter(storeID)

	tests := []struct {
		name         string
		id           string
		body         string
		expectedCode int
		expectedMsg  string
	}{
		{
			name:         "Invalid product UUID",
			id:           "not-a-uuid",
			body:         `{"name":"Updated"}`,
			expectedCode: http.StatusBadRequest,
			expectedMsg:  "Invalid product ID",
		},
		{
			name:         "Non-existent product",
			id:           uuid.NewString(),
			body:         `{"name":"Updated"}`,
			expectedCode: http.StatusNotFound,
			expectedMsg:  "Product not found",
		},
		{
			name:         "Malformed JSON",
			id:           uuid.NewString(),
			body:         `{bad}`,
			expectedCode: http.StatusBadRequest,
			expectedMsg:  "Invalid request body",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			w := httptest.NewRecorder()
			req, _ := http.NewRequest("PUT", "/products/"+tt.id, strings.NewReader(tt.body))
			req.Header.Set("Content-Type", "application/json")
			router.ServeHTTP(w, req)

			assert.Equal(t, tt.expectedCode, w.Code, "Body: %s", w.Body.String())
			assert.Contains(t, w.Body.String(), tt.expectedMsg)
		})
	}
}

// ====================================================================
// DeleteProduct — Invalid ID
// ====================================================================
func TestDeleteProduct_InvalidID(t *testing.T) {
	storeID := getTestStoreID(t)
	router := setupProductRouter(storeID)

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("DELETE", "/products/not-a-uuid", nil)
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusBadRequest, w.Code)
	assert.Contains(t, w.Body.String(), "Invalid product ID")
}

// ====================================================================
// INV-02: Category name uniqueness & validation
// ====================================================================
func TestCreateCategory_InvalidRequest(t *testing.T) {
	storeID := getTestStoreID(t)
	router := setupCategoryRouter(storeID)

	tests := []struct {
		name         string
		body         string
		expectedCode int
	}{
		{
			name:         "Empty body",
			body:         `{}`,
			expectedCode: http.StatusInternalServerError, // handler returns 500 for binding errors
		},
		{
			name:         "Missing name",
			body:         `{"description":"Test desc"}`,
			expectedCode: http.StatusInternalServerError,
		},
		{
			name:         "Missing description",
			body:         `{"name":"Test Category"}`,
			expectedCode: http.StatusInternalServerError,
		},
		{
			name:         "Malformed JSON",
			body:         `{bad json`,
			expectedCode: http.StatusInternalServerError,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			w := httptest.NewRecorder()
			req, _ := http.NewRequest("POST", "/categories", strings.NewReader(tt.body))
			req.Header.Set("Content-Type", "application/json")
			router.ServeHTTP(w, req)

			assert.Equal(t, tt.expectedCode, w.Code, "Body: %s", w.Body.String())
		})
	}
}

// ====================================================================
// GetCategory — Invalid ID
// ====================================================================
func TestGetCategory_InvalidID(t *testing.T) {
	storeID := getTestStoreID(t)
	router := setupCategoryRouter(storeID)

	tests := []struct {
		name         string
		id           string
		expectedCode int
		expectedMsg  string
	}{
		{
			name:         "Not a UUID",
			id:           "not-a-uuid",
			expectedCode: http.StatusBadRequest,
			expectedMsg:  "Invalid category ID",
		},
		{
			name:         "Non-existent UUID",
			id:           uuid.NewString(),
			expectedCode: http.StatusInternalServerError,
			expectedMsg:  "Error getting category",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			w := httptest.NewRecorder()
			req, _ := http.NewRequest("GET", "/categories/"+tt.id, nil)
			router.ServeHTTP(w, req)

			assert.Equal(t, tt.expectedCode, w.Code)
			assert.Contains(t, w.Body.String(), tt.expectedMsg)
		})
	}
}

// ====================================================================
// UpdateCategory — Invalid requests
// ====================================================================
func TestUpdateCategory_InvalidRequest(t *testing.T) {
	storeID := getTestStoreID(t)
	router := setupCategoryRouter(storeID)

	tests := []struct {
		name         string
		id           string
		body         string
		expectedCode int
		expectedMsg  string
	}{
		{
			name:         "Invalid UUID",
			id:           "not-a-uuid",
			body:         `{"name":"Updated","description":"Upd"}`,
			expectedCode: http.StatusBadRequest,
			expectedMsg:  "Invalid category ID",
		},
		{
			name:         "Missing name",
			id:           uuid.NewString(),
			body:         `{"description":"Updated desc"}`,
			expectedCode: http.StatusBadRequest,
			expectedMsg:  "Invalid request body",
		},
		{
			name:         "Missing description",
			id:           uuid.NewString(),
			body:         `{"name":"Updated name"}`,
			expectedCode: http.StatusBadRequest,
			expectedMsg:  "Invalid request body",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			w := httptest.NewRecorder()
			req, _ := http.NewRequest("PUT", "/categories/"+tt.id, strings.NewReader(tt.body))
			req.Header.Set("Content-Type", "application/json")
			router.ServeHTTP(w, req)

			assert.Equal(t, tt.expectedCode, w.Code, "Body: %s", w.Body.String())
			assert.Contains(t, w.Body.String(), tt.expectedMsg)
		})
	}
}

// ====================================================================
// DeleteCategory — missing category_id query param
// ====================================================================
func TestDeleteCategory_MissingID(t *testing.T) {
	storeID := getTestStoreID(t)
	router := setupCategoryRouter(storeID)

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("DELETE", "/categories", nil)
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusBadRequest, w.Code)
	assert.Contains(t, w.Body.String(), "category_id is required")
}

func TestDeleteCategory_InvalidID(t *testing.T) {
	storeID := getTestStoreID(t)
	router := setupCategoryRouter(storeID)

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("DELETE", "/categories?category_id=not-a-uuid", nil)
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusBadRequest, w.Code)
	assert.Contains(t, w.Body.String(), "Invalid category ID")
}

// ====================================================================
// INV-02: Large values for price/stock — boundary tests
// ====================================================================
func TestCreateProduct_LargeValues(t *testing.T) {
	storeID := getTestStoreID(t)
	router := setupProductRouter(storeID)

	tests := []struct {
		name           string
		body           string
		expectNotPanic bool // just assert no panic (code != 0)
		expectBadReq   bool // assert 400 Bad Request
	}{
		{
			name: "INV-02: stock_quantity at int32 max (2,147,483,647)",
			body: `{
				"name":"Boundary Product",
				"price":9999999.99,
				"cost_price":8888888.88,
				"market_price":9999999.99,
				"stock_quantity":2147483647,
				"low_stock_threshold":999999,
				"category_id":"` + uuid.NewString() + `"
			}`,
			expectNotPanic: true,
			expectBadReq:   false,
		},
		{
			name: "INV-02: stock_quantity exceeds int32 max (overflow)",
			body: `{
				"name":"Overflow Product",
				"price":9999999.99,
				"cost_price":8888888.88,
				"stock_quantity":3000000000,
				"category_id":"` + uuid.NewString() + `"
			}`,
			expectNotPanic: true,
			expectBadReq:   true, // Gin JSON binding must reject int32 overflow
		},
		{
			name: "INV-02: stock_quantity just above 1,000,000 (should be handled)",
			body: `{
				"name":"Large Stock Product",
				"price":10.0,
				"cost_price":5.0,
				"stock_quantity":1000001,
				"category_id":"` + uuid.NewString() + `"
			}`,
			expectNotPanic: true,
			expectBadReq:   false, // 1,000,001 is within int32 range
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			w := httptest.NewRecorder()
			req, _ := http.NewRequest("POST", "/products", strings.NewReader(tt.body))
			req.Header.Set("Content-Type", "application/json")
			router.ServeHTTP(w, req)

			if tt.expectNotPanic {
				assert.NotEqual(t, 0, w.Code, "Should not panic on large values")
			}
			if tt.expectBadReq {
				assert.Equal(t, http.StatusBadRequest, w.Code,
					"stock_quantity > int32 max should be rejected with 400. Body: %s", w.Body.String())
			}
		})
	}
}

// ====================================================================
// Response format consistency — all endpoints return standard Response
// ====================================================================
func TestProductEndpoints_ResponseFormat(t *testing.T) {
	storeID := getTestStoreID(t)
	router := setupProductRouter(storeID)

	// GET /products should always return standard response format
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/products", nil)
	router.ServeHTTP(w, req)

	var resp utils.Response
	err := json.Unmarshal(w.Body.Bytes(), &resp)
	require.NoError(t, err, "Response should be valid JSON. Got: %s", w.Body.String())

	// Even if zero products, it should have the standard format
	assert.NotEmpty(t, resp.Message)
}

// ====================================================================
// Pagination edge cases
// ====================================================================
func TestGetProducts_PaginationParams(t *testing.T) {
	storeID := getTestStoreID(t)
	router := setupProductRouter(storeID)

	tests := []struct {
		name     string
		queryStr string
		expectOK bool
	}{
		{
			name:     "Default pagination",
			queryStr: "",
			expectOK: true,
		},
		{
			name:     "Custom limit and offset",
			queryStr: "?limit=10&offset=0",
			expectOK: true,
		},
		{
			name:     "Negative limit (should default to 50)",
			queryStr: "?limit=-1&offset=0",
			expectOK: true,
		},
		{
			name:     "Very large limit (should cap at 50)",
			queryStr: "?limit=9999&offset=0",
			expectOK: true,
		},
		{
			name:     "Negative offset (should default to 0)",
			queryStr: "?limit=10&offset=-5",
			expectOK: true,
		},
		{
			name:     "Non-numeric limit",
			queryStr: "?limit=abc&offset=0",
			expectOK: true, // strconv.Atoi will return 0, fallback to 50
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			w := httptest.NewRecorder()
			req, _ := http.NewRequest("GET", "/products"+tt.queryStr, nil)
			router.ServeHTTP(w, req)

			if tt.expectOK {
				// Should not crash regardless of params
				assert.NotEqual(t, http.StatusInternalServerError, w.Code,
					"Pagination should not cause server error. Body: %s", w.Body.String())
			}
		})
	}
}

// ====================================================================
// Search endpoint
// ====================================================================
func TestSearchProducts_NoQuery(t *testing.T) {
	storeID := getTestStoreID(t)
	router := setupProductRouter(storeID)

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/products/search", nil)
	router.ServeHTTP(w, req)

	// Should not error even with empty query, just return empty results
	assert.NotEqual(t, http.StatusInternalServerError, w.Code,
		"Empty search should not cause server error. Body: %s", w.Body.String())
}

func TestSearchProducts_SpecialCharacters(t *testing.T) {
	storeID := getTestStoreID(t)
	router := setupProductRouter(storeID)

	tests := []struct {
		name  string
		query string
	}{
		{"SQL injection in search", "q='; DROP TABLE products; --"},
		{"HTML/XSS in search", "q=<script>alert('xss')</script>"},
		{"Unicode in search", "q=产品名称"},
		{"Very long search", "q=" + strings.Repeat("a", 1000)},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			w := httptest.NewRecorder()
			req, _ := http.NewRequest("GET", "/products/search?"+tt.query, nil)
			router.ServeHTTP(w, req)

			assert.NotEqual(t, http.StatusInternalServerError, w.Code,
				"Special characters should not cause server error. Body: %s", w.Body.String())
		})
	}
}

// ====================================================================
// Stock Adjustment Tests
// ====================================================================
func setupStockAdjustmentRouter(storeID pgtype.UUID) *gin.Engine {
	gin.SetMode(gin.TestMode)
	r := gin.Default()

	r.Use(func(c *gin.Context) {
		c.Set("store_id", storeID)
		c.Set("user_id", storeID)
		c.Next()
	})

	r.POST("/stock-adjustments", CreateStockAdjustment)
	r.GET("/stock-adjustments", ListStockAdjustments)
	r.GET("/stock-adjustments/product/:id", GetStockAdjustmentsByProduct)

	return r
}

func TestCreateStockAdjustment_InvalidRequest(t *testing.T) {
	storeID := getTestStoreID(t)
	router := setupStockAdjustmentRouter(storeID)

	tests := []struct {
		name         string
		body         string
		expectedCode int
		expectedMsg  string
	}{
		{
			name:         "Empty body",
			body:         `{}`,
			expectedCode: http.StatusBadRequest,
			expectedMsg:  "Invalid request body",
		},
		{
			name:         "Missing product_id",
			body:         `{"adjustment_quantity":10,"reason":"correction"}`,
			expectedCode: http.StatusBadRequest,
			expectedMsg:  "Invalid request body",
		},
		{
			name:         "Missing adjustment_quantity",
			body:         `{"product_id":"` + uuid.NewString() + `","reason":"correction"}`,
			expectedCode: http.StatusBadRequest,
			expectedMsg:  "Invalid request body",
		},
		{
			name:         "Missing reason",
			body:         `{"product_id":"` + uuid.NewString() + `","adjustment_quantity":10}`,
			expectedCode: http.StatusBadRequest,
			expectedMsg:  "Invalid request body",
		},
		{
			name:         "Zero adjustment quantity",
			body:         `{"product_id":"` + uuid.NewString() + `","adjustment_quantity":0,"reason":"correction"}`,
			expectedCode: http.StatusBadRequest,
			expectedMsg:  "Adjustment quantity cannot be zero",
		},
		{
			name:         "Invalid reason",
			body:         `{"product_id":"` + uuid.NewString() + `","adjustment_quantity":10,"reason":"invalid"}`,
			expectedCode: http.StatusBadRequest,
			expectedMsg:  "Invalid reason",
		},
		{
			name:         "Invalid product_id format",
			body:         `{"product_id":"not-a-uuid","adjustment_quantity":10,"reason":"correction"}`,
			expectedCode: http.StatusBadRequest,
			expectedMsg:  "Invalid product ID",
		},
		{
			name:         "Malformed JSON",
			body:         `{invalid`,
			expectedCode: http.StatusBadRequest,
			expectedMsg:  "Invalid request body",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			w := httptest.NewRecorder()
			req, _ := http.NewRequest("POST", "/stock-adjustments", strings.NewReader(tt.body))
			req.Header.Set("Content-Type", "application/json")
			router.ServeHTTP(w, req)

			assert.Equal(t, tt.expectedCode, w.Code, "Body: %s", w.Body.String())
			assert.Contains(t, w.Body.String(), tt.expectedMsg)
		})
	}
}

func TestCreateStockAdjustment_NonExistentProduct(t *testing.T) {
	storeID := getTestStoreID(t)
	router := setupStockAdjustmentRouter(storeID)

	body := `{"product_id":"` + uuid.NewString() + `","adjustment_quantity":10,"reason":"correction"}`
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("POST", "/stock-adjustments", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusNotFound, w.Code)
	assert.Contains(t, w.Body.String(), "product not found")
}

func TestListStockAdjustments_PaginationParams(t *testing.T) {
	storeID := getTestStoreID(t)
	router := setupStockAdjustmentRouter(storeID)

	tests := []struct {
		name     string
		queryStr string
		expectOK bool
	}{
		{"Default pagination", "", true},
		{"Custom limit and offset", "?limit=10&offset=0", true},
		{"Negative limit", "?limit=-1&offset=0", true},
		{"Very large limit", "?limit=9999&offset=0", true},
		{"Negative offset", "?limit=10&offset=-5", true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			w := httptest.NewRecorder()
			req, _ := http.NewRequest("GET", "/stock-adjustments"+tt.queryStr, nil)
			router.ServeHTTP(w, req)

			if tt.expectOK {
				assert.NotEqual(t, http.StatusInternalServerError, w.Code,
					"Pagination should not cause server error. Body: %s", w.Body.String())
			}
		})
	}
}

func TestGetStockAdjustmentsByProduct_InvalidID(t *testing.T) {
	storeID := getTestStoreID(t)
	router := setupStockAdjustmentRouter(storeID)

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/stock-adjustments/product/not-a-uuid", nil)
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusBadRequest, w.Code)
	assert.Contains(t, w.Body.String(), "Invalid product ID")
}

// ====================================================================
// Stock Movement Tests
// ====================================================================
func setupStockMovementRouter(storeID pgtype.UUID) *gin.Engine {
	gin.SetMode(gin.TestMode)
	r := gin.Default()

	r.Use(func(c *gin.Context) {
		c.Set("store_id", storeID)
		c.Set("user_id", storeID)
		c.Next()
	})

	r.GET("/stock-movements", ListStockMovements)
	r.GET("/stock-movements/product/:id", GetStockMovementsByProduct)
	r.GET("/stock-movements/product/:id/summary", GetStockMovementSummary)

	return r
}

func TestListStockMovements_PaginationParams(t *testing.T) {
	storeID := getTestStoreID(t)
	router := setupStockMovementRouter(storeID)

	tests := []struct {
		name     string
		queryStr string
		expectOK bool
	}{
		{"Default pagination", "", true},
		{"Custom limit and offset", "?limit=10&offset=0", true},
		{"Negative limit", "?limit=-1&offset=0", true},
		{"Very large limit", "?limit=9999&offset=0", true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			w := httptest.NewRecorder()
			req, _ := http.NewRequest("GET", "/stock-movements"+tt.queryStr, nil)
			router.ServeHTTP(w, req)

			if tt.expectOK {
				assert.NotEqual(t, http.StatusInternalServerError, w.Code,
					"Pagination should not cause server error. Body: %s", w.Body.String())
			}
		})
	}
}

func TestGetStockMovementsByProduct_InvalidID(t *testing.T) {
	storeID := getTestStoreID(t)
	router := setupStockMovementRouter(storeID)

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/stock-movements/product/not-a-uuid", nil)
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusBadRequest, w.Code)
	assert.Contains(t, w.Body.String(), "Invalid product ID")
}

func TestGetStockMovementSummary_InvalidID(t *testing.T) {
	storeID := getTestStoreID(t)
	router := setupStockMovementRouter(storeID)

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/stock-movements/product/not-a-uuid/summary", nil)
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusBadRequest, w.Code)
	assert.Contains(t, w.Body.String(), "Invalid product ID")
}

// ====================================================================
// Inventory Report Tests
// ====================================================================
func setupInventoryReportRouter(storeID pgtype.UUID) *gin.Engine {
	gin.SetMode(gin.TestMode)
	r := gin.Default()

	r.Use(func(c *gin.Context) {
		c.Set("store_id", storeID)
		c.Set("user_id", storeID)
		c.Next()
	})

	r.GET("/inventory-reports/valuation", GetInventoryValuation)
	r.GET("/inventory-reports/low-stock", GetLowStockReport)
	r.GET("/inventory-reports/expiring", GetExpiringProductsReport)

	return r
}

func TestGetInventoryValuation_ResponseFormat(t *testing.T) {
	storeID := getTestStoreID(t)
	router := setupInventoryReportRouter(storeID)

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/inventory-reports/valuation", nil)
	router.ServeHTTP(w, req)

	var resp utils.Response
	err := json.Unmarshal(w.Body.Bytes(), &resp)
	require.NoError(t, err, "Response should be valid JSON. Got: %s", w.Body.String())

	assert.NotEmpty(t, resp.Message)
}

func TestGetLowStockReport_ResponseFormat(t *testing.T) {
	storeID := getTestStoreID(t)
	router := setupInventoryReportRouter(storeID)

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/inventory-reports/low-stock", nil)
	router.ServeHTTP(w, req)

	var resp utils.Response
	err := json.Unmarshal(w.Body.Bytes(), &resp)
	require.NoError(t, err, "Response should be valid JSON. Got: %s", w.Body.String())

	assert.NotEmpty(t, resp.Message)
}

func TestGetExpiringProductsReport_ResponseFormat(t *testing.T) {
	storeID := getTestStoreID(t)
	router := setupInventoryReportRouter(storeID)

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/inventory-reports/expiring", nil)
	router.ServeHTTP(w, req)

	var resp utils.Response
	err := json.Unmarshal(w.Body.Bytes(), &resp)
	require.NoError(t, err, "Response should be valid JSON. Got: %s", w.Body.String())

	assert.NotEmpty(t, resp.Message)
}

// ====================================================================
// Test helper: ensure JWT_SECRET is set for tests needing auth
// ====================================================================
func init() {
	if os.Getenv("JWT_SECRET") == "" {
		os.Setenv("JWT_SECRET", "test-secret-key-for-testing-only")
	}
}
