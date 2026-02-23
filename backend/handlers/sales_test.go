package handlers

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/stretchr/testify/assert"
)

// setupSalesRouter creates a router with authenticated sales endpoints
func setupSalesRouter(storeID pgtype.UUID) *gin.Engine {
	gin.SetMode(gin.TestMode)
	r := gin.Default()

	r.Use(func(c *gin.Context) {
		c.Set("store_id", storeID)
		c.Set("user_id", storeID)
		c.Next()
	})

	r.POST("/sales", CreateSale)
	r.GET("/sales", ListSales)
	r.GET("/sales/:id", GetSaleDetails)

	return r
}

// setupDebtRouter creates a router with authenticated debt endpoints
func setupDebtRouter(storeID pgtype.UUID) *gin.Engine {
	gin.SetMode(gin.TestMode)
	r := gin.Default()

	r.Use(func(c *gin.Context) {
		c.Set("store_id", storeID)
		c.Set("user_id", storeID)
		c.Next()
	})

	r.POST("/debts", CreateDebt)
	r.GET("/debts", GetDebts)
	r.PUT("/debts/:id", UpdateDebt)
	r.DELETE("/debts/:id", DeleteDebt)

	return r
}

// ====================================================================
// POS-09: Attempt checkout with empty cart
// ====================================================================
func TestCreateSale_EmptyOrInvalidRequest(t *testing.T) {
	storeID := getTestStoreID(t)
	router := setupSalesRouter(storeID)

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
			name:         "Missing sales_type",
			body:         `{"items":[{"product_id":"` + uuid.NewString() + `","quantity":1,"unit_price":10}]}`,
			expectedCode: http.StatusBadRequest,
			expectedMsg:  "Invalid request body",
		},
		{
			name:         "Missing items",
			body:         `{"sales_type":"cash"}`,
			expectedCode: http.StatusBadRequest,
			expectedMsg:  "Invalid request body",
		},
		{
			name:         "Malformed JSON",
			body:         `{bad json`,
			expectedCode: http.StatusBadRequest,
			expectedMsg:  "Invalid request body",
		},
		{
			name:         "Item missing product_id triggers credit check (no customer)",
			body:         `{"sales_type":"cash","items":[{"quantity":1,"unit_price":10}]}`,
			expectedCode: http.StatusBadRequest,
			expectedMsg:  "Customer details required",
		},
		{
			name:         "Item with empty product_id triggers credit check (no customer)",
			body:         `{"sales_type":"cash","items":[{"product_id":"","quantity":1,"unit_price":10}]}`,
			expectedCode: http.StatusBadRequest,
			expectedMsg:  "Customer details required",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			w := httptest.NewRecorder()
			req, _ := http.NewRequest("POST", "/sales", strings.NewReader(tt.body))
			req.Header.Set("Content-Type", "application/json")
			router.ServeHTTP(w, req)

			assert.Equal(t, tt.expectedCode, w.Code, "Body: %s", w.Body.String())
			assert.Contains(t, w.Body.String(), tt.expectedMsg)
		})
	}
}

// ====================================================================
// POS-02: Negative amount_paid
// ====================================================================
func TestCreateSale_NegativeAmountPaid(t *testing.T) {
	storeID := getTestStoreID(t)
	router := setupSalesRouter(storeID)

	body := `{
		"sales_type":"cash",
		"amount_paid":-50,
		"items":[{"product_id":"` + uuid.NewString() + `","quantity":1,"unit_price":100}]
	}`

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("POST", "/sales", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusBadRequest, w.Code)
	assert.Contains(t, w.Body.String(), "Amount paid cannot be negative")
}

// ====================================================================
// POS-04: Credit sale requires customer details
// ====================================================================
func TestCreateSale_CreditWithoutCustomer(t *testing.T) {
	storeID := getTestStoreID(t)
	router := setupSalesRouter(storeID)

	// Partial payment (amount_paid < total) = credit, but no customer info
	body := `{
		"sales_type":"cash",
		"amount_paid":50,
		"items":[{"product_id":"` + uuid.NewString() + `","quantity":1,"unit_price":100}]
	}`

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("POST", "/sales", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusBadRequest, w.Code)
	assert.Contains(t, w.Body.String(), "Customer details required for partial payment/credit")
}

// ====================================================================
// GetSaleDetails — Invalid sale ID
// ====================================================================
func TestGetSaleDetails_InvalidID(t *testing.T) {
	storeID := getTestStoreID(t)
	router := setupSalesRouter(storeID)

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
			expectedMsg:  "Invalid sale ID",
		},
		{
			name:         "Non-existent sale",
			id:           uuid.NewString(),
			expectedCode: http.StatusNotFound,
			expectedMsg:  "Sale not found",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			w := httptest.NewRecorder()
			req, _ := http.NewRequest("GET", "/sales/"+tt.id, nil)
			router.ServeHTTP(w, req)

			assert.Equal(t, tt.expectedCode, w.Code)
			assert.Contains(t, w.Body.String(), tt.expectedMsg)
		})
	}
}

// ====================================================================
// DEBT-01 / DEBT-02: Debt creation validation
// ====================================================================
func TestCreateDebt_InvalidRequest(t *testing.T) {
	storeID := getTestStoreID(t)
	router := setupDebtRouter(storeID)

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
			name:         "Missing customer_id",
			body:         `{"amount_owed":100.50}`,
			expectedCode: http.StatusBadRequest,
			expectedMsg:  "Invalid request body",
		},
		{
			name:         "Missing amount_owed",
			body:         `{"customer_id":"` + uuid.NewString() + `"}`,
			expectedCode: http.StatusBadRequest,
			expectedMsg:  "Invalid request body",
		},
		{
			name:         "Invalid customer_id format",
			body:         `{"customer_id":"not-a-uuid","amount_owed":100}`,
			expectedCode: http.StatusBadRequest,
			expectedMsg:  "Invalid customer ID",
		},
		{
			name:         "Invalid due_date format",
			body:         `{"customer_id":"` + uuid.NewString() + `","amount_owed":100,"due_date":"not-a-date"}`,
			expectedCode: http.StatusBadRequest,
			expectedMsg:  "Invalid due date format",
		},
		{
			name:         "Malformed JSON",
			body:         `{bad}`,
			expectedCode: http.StatusBadRequest,
			expectedMsg:  "Invalid request body",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			w := httptest.NewRecorder()
			req, _ := http.NewRequest("POST", "/debts", strings.NewReader(tt.body))
			req.Header.Set("Content-Type", "application/json")
			router.ServeHTTP(w, req)

			assert.Equal(t, tt.expectedCode, w.Code, "Body: %s", w.Body.String())
			assert.Contains(t, w.Body.String(), tt.expectedMsg)
		})
	}
}

// ====================================================================
// UpdateDebt — Invalid requests
// ====================================================================
func TestUpdateDebt_InvalidRequest(t *testing.T) {
	storeID := getTestStoreID(t)
	router := setupDebtRouter(storeID)

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
			body:         `{"status":"paid"}`,
			expectedCode: http.StatusBadRequest,
			expectedMsg:  "Invalid debt ID",
		},
		{
			name:         "Malformed JSON",
			id:           uuid.NewString(),
			body:         `{bad}`,
			expectedCode: http.StatusBadRequest,
			expectedMsg:  "Invalid request body",
		},
		{
			name:         "Invalid due_date format",
			id:           uuid.NewString(),
			body:         `{"due_date":"not-a-date"}`,
			expectedCode: http.StatusBadRequest,
			expectedMsg:  "Invalid due date format",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			w := httptest.NewRecorder()
			req, _ := http.NewRequest("PUT", "/debts/"+tt.id, strings.NewReader(tt.body))
			req.Header.Set("Content-Type", "application/json")
			router.ServeHTTP(w, req)

			assert.Equal(t, tt.expectedCode, w.Code, "Body: %s", w.Body.String())
			assert.Contains(t, w.Body.String(), tt.expectedMsg)
		})
	}
}

// ====================================================================
// DeleteDebt — Invalid ID
// ====================================================================
func TestDeleteDebt_InvalidID(t *testing.T) {
	storeID := getTestStoreID(t)
	router := setupDebtRouter(storeID)

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("DELETE", "/debts/not-a-uuid", nil)
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusBadRequest, w.Code)
	assert.Contains(t, w.Body.String(), "Invalid debt ID")
}
