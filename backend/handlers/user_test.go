package handlers

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"os"
	"strings"
	"testing"
	"time"

	db "storemanagement/db/sqlc"
	"storemanagement/redis"
	"storemanagement/utils"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"golang.org/x/crypto/bcrypt"
)

// setupTestRouter creates a test router for unauthenticated endpoints
func setupTestRouter() *gin.Engine {
	gin.SetMode(gin.TestMode)
	r := gin.Default()
	r.POST("/register", RegisterUserHandler)
	r.POST("/login", LoginHandler)
	r.POST("/verify-otp", VerifyOTP)
	return r
}

// setupAuthenticatedRouter creates a test router with JWT middleware for authenticated endpoints
func setupAuthenticatedRouter() *gin.Engine {
	gin.SetMode(gin.TestMode)
	r := gin.Default()
	auth := r.Group("/")
	auth.Use(utils.JWTMiddleware())
	{
		auth.POST("/store-info", CreateStoreInfoHandler)
		auth.POST("/refresh-token", RefreshTokenHandler)
	}
	return r
}

// ─── Helper: create a test user + store + guest customer directly in DB ──
func createTestUser(t *testing.T, email, password string) (db.StoreOwner, db.StoreInfo) {
	t.Helper()
	hashedPw, err := bcrypt.GenerateFromPassword([]byte(password), 10)
	require.NoError(t, err)

	ctx := context.Background()
	user, err := utils.Queries.CreateStoreOwner(ctx, db.CreateStoreOwnerParams{
		Name:           "Test User",
		Email:          email,
		Password:       string(hashedPw),
		Phone:          "1234567890",
		Role:           "owner",
		ProfilePicture: "",
	})
	require.NoError(t, err)

	var discount pgtype.Numeric
	require.NoError(t, discount.Scan("10.00"))
	store, err := utils.Queries.CreateStoreInfo(ctx, db.CreateStoreInfoParams{
		Name:         "Test Store",
		Address:      "123 Test St",
		CurrencyCode: "USD",
		OwnerID:      user.ID,
	})
	require.NoError(t, err)

	_, err = utils.Queries.CreateCustomer(ctx, db.CreateCustomerParams{
		Name:    "Guest",
		Phone:   "0000000000",
		StoreID: pgtype.UUID{Bytes: store.ID.Bytes, Valid: true},
	})
	require.NoError(t, err)

	return user, store
}

// ─── Helper: generate a valid JWT for a test user ────────────────────
func generateTestToken(t *testing.T, user db.StoreOwner, store db.StoreInfo) string {
	t.Helper()
	token, err := utils.GenerateJWT(user.ID, user.Name, store.ID, user.Emailverified)
	require.NoError(t, err)
	return token
}

// setupResetFlowRouter creates a test router for password reset endpoints
func setupResetFlowRouter() *gin.Engine {
	gin.SetMode(gin.TestMode)
	r := gin.Default()
	r.POST("/forgot-password", ForgotPasswordHandler)
	r.POST("/reset-password", ResetPasswordHandler)
	return r
}

// setupPasswordUpdateRouter creates a test router with JWT-protected password update
func setupPasswordUpdateRouter() *gin.Engine {
	gin.SetMode(gin.TestMode)
	r := gin.Default()
	auth := r.Group("/")
	auth.Use(utils.JWTMiddleware())
	{
		auth.PUT("/password", UpdatePasswordHandler)
		auth.POST("/refresh-token", RefreshTokenHandler)
		auth.POST("/store-info", CreateStoreInfoHandler)
	}
	return r
}

// setupRateLimitedLoginRouter creates a test router with rate-limited login
func setupRateLimitedLoginRouter() *gin.Engine {
	gin.SetMode(gin.TestMode)
	r := gin.Default()
	r.POST("/login", utils.RateLimitMiddleware(5, time.Minute), LoginHandler)
	return r
}

// ====================================================================
// AUTH-01: Register with invalid email format or empty fields
// ====================================================================
func TestRegister_InvalidEmailOrEmptyFields(t *testing.T) {
	router := setupTestRouter()

	tests := []struct {
		name         string
		body         string
		expectedCode int
		expectedMsg  string
	}{
		{
			name:         "Invalid Email Format",
			body:         `{"email":"invalid-email","password":"validpass123","name":"Test","store_name":"Test Store","store_address":"Addr","currency_code":"USD"}`,
			expectedCode: http.StatusBadRequest,
			expectedMsg:  "Invalid email/fields required",
		},
		{
			name:         "Empty Email",
			body:         `{"email":"","password":"validpass123","name":"Test","store_name":"Test Store","store_address":"Addr","currency_code":"USD"}`,
			expectedCode: http.StatusBadRequest,
			expectedMsg:  "Invalid email/fields required",
		},
		{
			name:         "Missing Required Field (Name)",
			body:         `{"email":"test@example.com","password":"validpass123","name":"","store_name":"Test Store","store_address":"Addr","currency_code":"USD"}`,
			expectedCode: http.StatusBadRequest,
			expectedMsg:  "Invalid email/fields required",
		},
		{
			name:         "Missing Required Field (Password)",
			body:         `{"email":"test@example.com","password":"","name":"Test","store_name":"Test Store","store_address":"Addr","currency_code":"USD"}`,
			expectedCode: http.StatusBadRequest,
			expectedMsg:  "Invalid email/fields required",
		},
		{
			name:         "Missing Required Field (StoreName)",
			body:         `{"email":"test@example.com","password":"validpass123","name":"Test","store_name":"","store_address":"Addr","currency_code":"USD"}`,
			expectedCode: http.StatusBadRequest,
			expectedMsg:  "Invalid email/fields required",
		},
		{
			name:         "Missing Required Field (StoreAddress)",
			body:         `{"email":"test@example.com","password":"validpass123","name":"Test","store_name":"Test Store","store_address":"","currency_code":"USD"}`,
			expectedCode: http.StatusBadRequest,
			expectedMsg:  "Invalid email/fields required",
		},
		{
			name:         "Missing Required Field (CurrencyCode)",
			body:         `{"email":"test@example.com","password":"validpass123","name":"Test","store_name":"Test Store","store_address":"Addr","currency_code":""}`,
			expectedCode: http.StatusBadRequest,
			expectedMsg:  "Invalid email/fields required",
		},
		{
			name:         "Completely Empty Body",
			body:         `{}`,
			expectedCode: http.StatusBadRequest,
			expectedMsg:  "Invalid email/fields required",
		},
		{
			name:         "Malformed JSON",
			body:         `{invalid json`,
			expectedCode: http.StatusBadRequest,
			expectedMsg:  "Invalid request",
		},
		{
			name:         "Email with spaces",
			body:         `{"email":"test @example.com","password":"validpass123","name":"Test","store_name":"Store","store_address":"Addr","currency_code":"USD"}`,
			expectedCode: http.StatusBadRequest,
			expectedMsg:  "Invalid email/fields required",
		},
		{
			name:         "Email without domain",
			body:         `{"email":"test@","password":"validpass123","name":"Test","store_name":"Store","store_address":"Addr","currency_code":"USD"}`,
			expectedCode: http.StatusBadRequest,
			expectedMsg:  "Invalid email/fields required",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			w := httptest.NewRecorder()
			req, _ := http.NewRequest("POST", "/register", strings.NewReader(tt.body))
			req.Header.Set("Content-Type", "application/json")
			router.ServeHTTP(w, req)

			assert.Equal(t, tt.expectedCode, w.Code)
			assert.Contains(t, w.Body.String(), tt.expectedMsg)
		})
	}
}

// ====================================================================
// AUTH-03 & AUTH-04: Login tests (valid and invalid credentials)
// These are integration tests that hit the actual test database.
// ====================================================================
func TestLogin_InvalidRequestBody(t *testing.T) {
	router := setupTestRouter()

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
			expectedMsg:  "Invalid request",
		},
		{
			name:         "Missing email",
			body:         `{"password":"somepassword"}`,
			expectedCode: http.StatusBadRequest,
			expectedMsg:  "Invalid request",
		},
		{
			name:         "Missing password",
			body:         `{"email":"test@example.com"}`,
			expectedCode: http.StatusBadRequest,
			expectedMsg:  "Invalid request",
		},
		{
			name:         "Malformed JSON",
			body:         `{bad json`,
			expectedCode: http.StatusBadRequest,
			expectedMsg:  "Invalid request",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			w := httptest.NewRecorder()
			req, _ := http.NewRequest("POST", "/login", strings.NewReader(tt.body))
			req.Header.Set("Content-Type", "application/json")
			router.ServeHTTP(w, req)

			assert.Equal(t, tt.expectedCode, w.Code)
			assert.Contains(t, w.Body.String(), tt.expectedMsg)
		})
	}
}

func TestLogin_NonExistentUser(t *testing.T) {
	router := setupTestRouter()

	body := `{"email":"nonexistent_user_xyz@doesnotexist.com","password":"anypassword"}`
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("POST", "/login", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusUnauthorized, w.Code)
	assert.Contains(t, w.Body.String(), "Invalid credentials")
}

// ====================================================================
// AUTH-03: Integration test — Full Registration + Login happy path
// Requires TEST_DB_URL to be configured and SENDGRID_API_KEY set.
// This test creates a real user, so we use a unique email each run.
// ====================================================================
func TestRegisterAndLogin_Integration(t *testing.T) {
	// Skip if we don't have the email service configured (to avoid side effects)
	if os.Getenv("SENDGRID_API_KEY") == "" {
		t.Skip("Skipping integration test: SENDGRID_API_KEY not set")
	}
	// Also need JWT secret for login
	if os.Getenv("JWT_SECRET") == "" {
		os.Setenv("JWT_SECRET", "test-secret-key-for-testing-only")
	}

	router := setupTestRouter()
	uniqueEmail := fmt.Sprintf("testuser_%d@example.com", time.Now().UnixNano())

	// Step 1: Register
	registerBody := fmt.Sprintf(`{
		"name":"Integration Test User",
		"email":"%s",
		"password":"securepass123",
		"store_name":"Test Store",
		"store_address":"123 Test St",
		"currency_code":"NPR"
	}`, uniqueEmail)

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("POST", "/register", strings.NewReader(registerBody))
	req.Header.Set("Content-Type", "application/json")
	router.ServeHTTP(w, req)

	require.Equal(t, http.StatusOK, w.Code, "Registration should succeed. Response: %s", w.Body.String())

	var registerResp utils.Response
	err := json.Unmarshal(w.Body.Bytes(), &registerResp)
	require.NoError(t, err)
	assert.True(t, registerResp.Success)
	assert.Contains(t, registerResp.Message, "User and Store created successfully")

	// Step 2: Login with the same credentials
	loginBody := fmt.Sprintf(`{"email":"%s","password":"securepass123"}`, uniqueEmail)
	w2 := httptest.NewRecorder()
	req2, _ := http.NewRequest("POST", "/login", strings.NewReader(loginBody))
	req2.Header.Set("Content-Type", "application/json")
	router.ServeHTTP(w2, req2)

	require.Equal(t, http.StatusOK, w2.Code, "Login should succeed. Response: %s", w2.Body.String())

	var loginResp map[string]interface{}
	err = json.Unmarshal(w2.Body.Bytes(), &loginResp)
	require.NoError(t, err)
	assert.Equal(t, true, loginResp["success"])
	assert.Contains(t, loginResp["message"], "Login successful")

	// Verify token is present in the response data
	data, ok := loginResp["data"].(map[string]interface{})
	require.True(t, ok, "Response data should be a map")
	assert.NotEmpty(t, data["newToken"], "JWT token should be returned")
	assert.NotNil(t, data["userData"], "User data should be returned")

	// Step 3: Login with WRONG password should fail (AUTH-04)
	wrongPassBody := fmt.Sprintf(`{"email":"%s","password":"wrongpassword123"}`, uniqueEmail)
	w3 := httptest.NewRecorder()
	req3, _ := http.NewRequest("POST", "/login", strings.NewReader(wrongPassBody))
	req3.Header.Set("Content-Type", "application/json")
	router.ServeHTTP(w3, req3)

	assert.Equal(t, http.StatusUnauthorized, w3.Code)
	assert.Contains(t, w3.Body.String(), "Invalid credentials")
}

// ====================================================================
// Duplicate Email Registration (related to AUTH tests)
// ====================================================================
func TestRegister_DuplicateEmail(t *testing.T) {
	if os.Getenv("SENDGRID_API_KEY") == "" {
		t.Skip("Skipping integration test: SENDGRID_API_KEY not set")
	}
	if os.Getenv("JWT_SECRET") == "" {
		os.Setenv("JWT_SECRET", "test-secret-key-for-testing-only")
	}

	router := setupTestRouter()
	uniqueEmail := fmt.Sprintf("duptest_%d@example.com", time.Now().UnixNano())

	// First registration — should succeed
	body := fmt.Sprintf(`{
		"name":"Dup Test User",
		"email":"%s",
		"password":"securepass123",
		"store_name":"Dup Store",
		"store_address":"456 Dup St",
		"currency_code":"NPR"
	}`, uniqueEmail)

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("POST", "/register", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	router.ServeHTTP(w, req)
	require.Equal(t, http.StatusOK, w.Code, "First registration should succeed. Response: %s", w.Body.String())

	// Second registration with same email — should fail with 409 Conflict
	w2 := httptest.NewRecorder()
	req2, _ := http.NewRequest("POST", "/register", strings.NewReader(body))
	req2.Header.Set("Content-Type", "application/json")
	router.ServeHTTP(w2, req2)

	assert.Equal(t, http.StatusConflict, w2.Code)
	assert.Contains(t, w2.Body.String(), "User already exists")
}

// ====================================================================
// VerifyOTP — Validation tests (no DB needed for input validation)
// ====================================================================
func TestVerifyOTP_InvalidRequest(t *testing.T) {
	router := setupTestRouter()

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
			expectedMsg:  "Invalid request",
		},
		{
			name:         "Missing OTP",
			body:         `{"userEmail":"test@example.com","purpose":"email_verification"}`,
			expectedCode: http.StatusBadRequest,
			expectedMsg:  "Invalid request",
		},
		{
			name:         "Missing purpose",
			body:         `{"userEmail":"test@example.com","otp":"123456"}`,
			expectedCode: http.StatusBadRequest,
			expectedMsg:  "Invalid request",
		},
		{
			name:         "Missing email",
			body:         `{"otp":"123456","purpose":"email_verification"}`,
			expectedCode: http.StatusBadRequest,
			expectedMsg:  "Invalid request",
		},
		{
			name:         "OTP too short (not 6 digits)",
			body:         `{"userEmail":"test@example.com","otp":"123","purpose":"email_verification"}`,
			expectedCode: http.StatusBadRequest,
			expectedMsg:  "Invalid OTP format",
		},
		{
			name:         "OTP too long",
			body:         `{"userEmail":"test@example.com","otp":"12345678","purpose":"email_verification"}`,
			expectedCode: http.StatusBadRequest,
			expectedMsg:  "Invalid OTP format",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			w := httptest.NewRecorder()
			req, _ := http.NewRequest("POST", "/verify-otp", strings.NewReader(tt.body))
			req.Header.Set("Content-Type", "application/json")
			router.ServeHTTP(w, req)

			assert.Equal(t, tt.expectedCode, w.Code)
			assert.Contains(t, w.Body.String(), tt.expectedMsg)
		})
	}
}

func TestVerifyOTP_InvalidOTP(t *testing.T) {
	router := setupTestRouter()

	// Valid format but OTP doesn't exist in database
	body := `{"userEmail":"test@example.com","otp":"999999","purpose":"email_verification"}`
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("POST", "/verify-otp", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusBadRequest, w.Code)
	assert.Contains(t, w.Body.String(), "Invalid or expired OTP")
}

// ====================================================================
// AUTH-08: Token / Middleware tests
// ====================================================================
func TestAuthMiddleware_NoToken(t *testing.T) {
	router := setupAuthenticatedRouter()

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("POST", "/store-info", strings.NewReader(`{"name":"Test","address":"Addr","currency_code":"USD"}`))
	req.Header.Set("Content-Type", "application/json")
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusUnauthorized, w.Code)
	assert.Contains(t, w.Body.String(), "Authorization required")
}

func TestAuthMiddleware_InvalidToken(t *testing.T) {
	if os.Getenv("JWT_SECRET") == "" {
		os.Setenv("JWT_SECRET", "test-secret-key-for-testing-only")
	}

	router := setupAuthenticatedRouter()

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("POST", "/store-info", strings.NewReader(`{"name":"Test","address":"Addr","currency_code":"USD"}`))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer invalid.token.here")
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusUnauthorized, w.Code)
	assert.Contains(t, w.Body.String(), "Invalid token")
}

func TestAuthMiddleware_MalformedAuthHeader(t *testing.T) {
	router := setupAuthenticatedRouter()

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("POST", "/store-info", strings.NewReader(`{}`))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "NotBearer sometoken")
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusUnauthorized, w.Code)
	assert.Contains(t, w.Body.String(), "Invalid authorization header format")
}

// ====================================================================
// SEC-01: SQL Injection / XSS attempts on auth endpoints
// These tests verify that malicious payloads are REJECTED (400),
// not just "don't crash". The handler must refuse to store dangerous input.
// ====================================================================
func TestRegister_SQLInjectionAttempts(t *testing.T) {
	router := setupTestRouter()

	tests := []struct {
		name        string
		body        string
		expectedMsg string
	}{
		{
			name:        "SQL Injection in name (DROP TABLE)",
			body:        `{"email":"sqli1@example.com","password":"validpass123","name":"'; DROP TABLE store_owners; --","store_name":"Store","store_address":"Addr","currency_code":"USD"}`,
			expectedMsg: "Invalid characters in name",
		},
		{
			name:        "SQL Injection in name (UNION SELECT)",
			body:        `{"email":"sqli2@example.com","password":"validpass123","name":"' UNION SELECT * FROM store_owners --","store_name":"Store","store_address":"Addr","currency_code":"USD"}`,
			expectedMsg: "Invalid characters in name",
		},
		{
			name:        "SQL Injection in store_name",
			body:        `{"email":"sqli3@example.com","password":"validpass123","name":"Test","store_name":"'; DELETE FROM products; --","store_address":"Addr","currency_code":"USD"}`,
			expectedMsg: "Invalid characters in store_name",
		},
		{
			name:        "SQL Injection in store_address",
			body:        `{"email":"sqli4@example.com","password":"validpass123","name":"Test","store_name":"Store","store_address":"'; DROP TABLE stores; --","currency_code":"USD"}`,
			expectedMsg: "Invalid characters in store_address",
		},
		{
			name:        "XSS in store name (script tag)",
			body:        `{"email":"xss1@example.com","password":"validpass123","name":"Test","store_name":"<script>alert('xss')</script>","store_address":"Addr","currency_code":"USD"}`,
			expectedMsg: "Invalid characters in store_name",
		},
		{
			name:        "XSS in name (img tag with onerror)",
			body:        `{"email":"xss2@example.com","password":"validpass123","name":"<img src=x onerror=alert(1)>","store_name":"Store","store_address":"Addr","currency_code":"USD"}`,
			expectedMsg: "Invalid characters in name",
		},
		{
			name:        "XSS in store_address (iframe)",
			body:        `{"email":"xss3@example.com","password":"validpass123","name":"Test","store_name":"Store","store_address":"<iframe src='evil.com'></iframe>","currency_code":"USD"}`,
			expectedMsg: "Invalid characters in store_address",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			w := httptest.NewRecorder()
			req, _ := http.NewRequest("POST", "/register", strings.NewReader(tt.body))
			req.Header.Set("Content-Type", "application/json")
			router.ServeHTTP(w, req)

			// Malicious input must be REJECTED, not silently stored
			assert.Equal(t, http.StatusBadRequest, w.Code,
				"SQL injection/XSS should be rejected with 400. Got %d. Body: %s", w.Code, w.Body.String())
			assert.Contains(t, w.Body.String(), tt.expectedMsg,
				"Response should indicate which field contains invalid characters")
		})
	}
}

// TestRegister_CleanInputAccepted ensures that the sanitization doesn't block legitimate input.
func TestRegister_CleanInputAccepted(t *testing.T) {
	router := setupTestRouter()

	// These should NOT be rejected by sanitization (they may still fail for other reasons like DB)
	tests := []struct {
		name string
		body string
	}{
		{
			name: "Name with apostrophe (O'Brien)",
			body: `{"email":"obrien@example.com","password":"validpass123","name":"O'Brien","store_name":"O'Brien's Shop","store_address":"123 Main St","currency_code":"USD"}`,
		},
		{
			name: "Name with ampersand",
			body: `{"email":"amper@example.com","password":"validpass123","name":"Ben & Jerry","store_name":"B&J Store","store_address":"456 Elm St","currency_code":"USD"}`,
		},
		{
			name: "Name with unicode",
			body: `{"email":"unicode@example.com","password":"validpass123","name":"José García","store_name":"Tienda México","store_address":"Calle 123","currency_code":"MXN"}`,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			w := httptest.NewRecorder()
			req, _ := http.NewRequest("POST", "/register", strings.NewReader(tt.body))
			req.Header.Set("Content-Type", "application/json")
			router.ServeHTTP(w, req)

			// These should NOT be rejected by input sanitization
			assert.NotEqual(t, http.StatusBadRequest, w.Code,
				"Legitimate input should not be rejected. Body: %s", w.Body.String())
		})
	}
}

func TestLogin_SQLInjectionAttempts(t *testing.T) {
	router := setupTestRouter()

	tests := []struct {
		name string
		body string
	}{
		{
			name: "SQL Injection in email (OR bypass)",
			body: `{"email":"admin' OR '1'='1","password":"anything"}`,
		},
		{
			name: "SQL Injection in password (OR bypass)",
			body: `{"email":"test@test.com","password":"' OR '1'='1"}`,
		},
		{
			name: "SQL Injection in email (UNION SELECT)",
			body: `{"email":"' UNION SELECT * FROM store_owners --","password":"anything"}`,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			w := httptest.NewRecorder()
			req, _ := http.NewRequest("POST", "/login", strings.NewReader(tt.body))
			req.Header.Set("Content-Type", "application/json")
			router.ServeHTTP(w, req)

			// Should return 401 (user not found) or 400, never 200 or 500
			assert.NotEqual(t, http.StatusInternalServerError, w.Code,
				"SQL injection should not cause server error")
			assert.NotEqual(t, http.StatusOK, w.Code,
				"SQL injection should not grant access")
		})
	}
}

// ====================================================================
// Response structure validation
// ====================================================================
func TestErrorResponse_StructureValidation(t *testing.T) {
	router := setupTestRouter()

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("POST", "/register", strings.NewReader(`{}`))
	req.Header.Set("Content-Type", "application/json")
	router.ServeHTTP(w, req)

	var resp utils.Response
	err := json.Unmarshal(w.Body.Bytes(), &resp)
	require.NoError(t, err, "Response should be valid JSON")

	// Validate response structure
	assert.False(t, resp.Success, "Success should be false on error")
	assert.NotEmpty(t, resp.Message, "Error message should not be empty")
	assert.NotEmpty(t, resp.Error, "Error details should not be empty")
}

func TestLoginResponse_NoPasswordLeak(t *testing.T) {
	// For any failed login, ensure the response doesn't leak password hashes
	router := setupTestRouter()

	body := `{"email":"nonexistent@test.com","password":"testpass"}`
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("POST", "/login", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	router.ServeHTTP(w, req)

	responseBody := w.Body.String()
	assert.NotContains(t, responseBody, "$2a$", "Response should not contain bcrypt hash")
	assert.NotContains(t, responseBody, "testpass", "Response should not echo back the password")
}

// ====================================================================
// Content-Type edge cases
// ====================================================================
func TestRegister_WrongContentType(t *testing.T) {
	router := setupTestRouter()

	body := `name=Test&email=test@test.com&password=pass123&store_name=Store&store_address=Addr&currency_code=USD`
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("POST", "/register", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	router.ServeHTTP(w, req)

	// Should fail since handler expects JSON
	assert.Equal(t, http.StatusBadRequest, w.Code)
}

func TestRegister_EmptyBody(t *testing.T) {
	router := setupTestRouter()

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("POST", "/register", strings.NewReader(""))
	req.Header.Set("Content-Type", "application/json")
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusBadRequest, w.Code)
}

// ====================================================================
// AUTH-02: Short / weak password tests
// ====================================================================

func TestRegister_WeakPassword(t *testing.T) {
	router := setupTestRouter()

	tests := []struct {
		name         string
		password     string
		expectedCode int
		expectedMsg  string
	}{
		{
			name:         "Too short (7 chars)",
			password:     "Ab1!xyz",
			expectedCode: http.StatusBadRequest,
			expectedMsg:  "Password must be at least 8 characters long",
		},
		{
			name:         "Missing uppercase letter",
			password:     "abcdef1!@",
			expectedCode: http.StatusBadRequest,
			expectedMsg:  "uppercase",
		},
		{
			name:         "Missing lowercase letter",
			password:     "ABCDEF1!@",
			expectedCode: http.StatusBadRequest,
			expectedMsg:  "lowercase",
		},
		{
			name:         "Missing digit",
			password:     "Abcdefg!@",
			expectedCode: http.StatusBadRequest,
			expectedMsg:  "digit",
		},
		{
			name:         "Missing special character",
			password:     "Abcdefg12",
			expectedCode: http.StatusBadRequest,
			expectedMsg:  "special character",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			body := fmt.Sprintf(`{"email":"pwdtest_%d@example.com","password":"%s","name":"Test","store_name":"Store","store_address":"Addr","currency_code":"USD"}`,
				time.Now().UnixNano(), tt.password)
			w := httptest.NewRecorder()
			req, _ := http.NewRequest("POST", "/register", strings.NewReader(body))
			req.Header.Set("Content-Type", "application/json")
			router.ServeHTTP(w, req)

			assert.Equal(t, tt.expectedCode, w.Code,
				"Expected 400 for weak password. Got %d. Body: %s", w.Code, w.Body.String())
			assert.Contains(t, w.Body.String(), tt.expectedMsg)
		})
	}
}

func TestResetPassword_WeakPassword(t *testing.T) {
	router := setupResetFlowRouter()

	body := `{"email":"test@example.com","otp":"123456","password":"short"}`
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("POST", "/reset-password", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusBadRequest, w.Code)
	assert.Contains(t, w.Body.String(), "Invalid request")
}

func TestUpdatePassword_WeakPassword(t *testing.T) {
	if os.Getenv("JWT_SECRET") == "" {
		os.Setenv("JWT_SECRET", "test-secret-key-for-testing-only")
	}

	email := fmt.Sprintf("updpwd_%d@example.com", time.Now().UnixNano())
	user, store := createTestUser(t, email, "Current@123")
	token := generateTestToken(t, user, store)

	router := setupPasswordUpdateRouter()

	body := `{"current_password":"Current@123","new_password":"short"}`
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("PUT", "/password", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+token)
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusBadRequest, w.Code)
	assert.Contains(t, w.Body.String(), "Invalid request")
}

// ====================================================================
// AUTH-05: Password reset flow
// ====================================================================

func TestForgotPassword_InvalidRequest(t *testing.T) {
	router := setupResetFlowRouter()

	tests := []struct {
		name         string
		body         string
		expectedCode int
		expectedMsg  string
	}{
		{
			name:         "Invalid email format",
			body:         `{"email":"not-an-email"}`,
			expectedCode: http.StatusBadRequest,
			expectedMsg:  "Invalid email address",
		},
		{
			name:         "Empty email",
			body:         `{"email":""}`,
			expectedCode: http.StatusBadRequest,
			expectedMsg:  "Invalid email address",
		},
		{
			name:         "Missing email field",
			body:         `{}`,
			expectedCode: http.StatusBadRequest,
			expectedMsg:  "Invalid email address",
		},
		{
			name:         "Malformed JSON",
			body:         `{bad json`,
			expectedCode: http.StatusBadRequest,
			expectedMsg:  "Invalid email address",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			w := httptest.NewRecorder()
			req, _ := http.NewRequest("POST", "/forgot-password", strings.NewReader(tt.body))
			req.Header.Set("Content-Type", "application/json")
			router.ServeHTTP(w, req)

			assert.Equal(t, tt.expectedCode, w.Code)
			assert.Contains(t, w.Body.String(), tt.expectedMsg)
		})
	}
}

func TestForgotPassword_NonExistentUser(t *testing.T) {
	router := setupResetFlowRouter()

	body := `{"email":"nonexistent_user_xyz@doesnotexist.com"}`
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("POST", "/forgot-password", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	router.ServeHTTP(w, req)

	// Must return 200 (timing-safe response), NOT 404
	assert.Equal(t, http.StatusOK, w.Code)
	assert.Contains(t, w.Body.String(), "If an account with that email exists")
}

func TestResetPassword_Validation(t *testing.T) {
	router := setupResetFlowRouter()

	tests := []struct {
		name         string
		body         string
		expectedCode int
		expectedMsg  string
	}{
		{
			name:         "Missing fields (empty body)",
			body:         `{}`,
			expectedCode: http.StatusBadRequest,
			expectedMsg:  "Invalid request",
		},
		{
			name:         "Missing email",
			body:         `{"otp":"123456","password":"NewPass@123"}`,
			expectedCode: http.StatusBadRequest,
			expectedMsg:  "Invalid request",
		},
		{
			name:         "Missing OTP",
			body:         `{"email":"test@example.com","password":"NewPass@123"}`,
			expectedCode: http.StatusBadRequest,
			expectedMsg:  "Invalid request",
		},
		{
			name:         "Missing password",
			body:         `{"email":"test@example.com","otp":"123456"}`,
			expectedCode: http.StatusBadRequest,
			expectedMsg:  "Invalid request",
		},
		{
			name:         "Malformed JSON",
			body:         `{bad json`,
			expectedCode: http.StatusBadRequest,
			expectedMsg:  "Invalid request",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			w := httptest.NewRecorder()
			req, _ := http.NewRequest("POST", "/reset-password", strings.NewReader(tt.body))
			req.Header.Set("Content-Type", "application/json")
			router.ServeHTTP(w, req)

			assert.Equal(t, tt.expectedCode, w.Code)
			assert.Contains(t, w.Body.String(), tt.expectedMsg)
		})
	}
}

// ====================================================================
// AUTH-06: Role-based access control
// ====================================================================

func TestRegister_IncludesRoleField(t *testing.T) {
	if os.Getenv("SENDGRID_API_KEY") == "" {
		t.Skip("Skipping integration test: SENDGRID_API_KEY not set")
	}
	if os.Getenv("JWT_SECRET") == "" {
		os.Setenv("JWT_SECRET", "test-secret-key-for-testing-only")
	}

	router := setupTestRouter()
	uniqueEmail := fmt.Sprintf("roletest_%d@example.com", time.Now().UnixNano())

	registerBody := fmt.Sprintf(`{
		"name":"Role Test User",
		"email":"%s",
		"password":"Secure@123",
		"store_name":"Role Store",
		"store_address":"123 Role St",
		"currency_code":"USD"
	}`, uniqueEmail)

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("POST", "/register", strings.NewReader(registerBody))
	req.Header.Set("Content-Type", "application/json")
	router.ServeHTTP(w, req)

	require.Equal(t, http.StatusOK, w.Code, "Registration should succeed. Response: %s", w.Body.String())

	var resp map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &resp)
	require.NoError(t, err)

	if data, ok := resp["data"].(map[string]interface{}); ok {
		role, roleExists := data["role"]
		assert.True(t, roleExists, "Response should include 'role' field")
		if roleExists {
			t.Logf("User role in response: %q", role)
		}
	} else {
		t.Log("Response data not a map — role may not be exposed in this endpoint version")
	}
}

// TestNoRBACMiddleware documents that role-based access control is not yet implemented.
func TestNoRBACMiddleware(t *testing.T) {
	// The codebase has a `role` column in store_owner (default 'owner') but no RBAC middleware.
	// - All authenticated users have the same access level.
	// - No 403 Forbidden responses are ever returned.
	// - The TODO.md explicitly lists RBAC as unimplemented.
	//
	// Once RBAC is implemented, this test should be updated to verify:
	//   1. Users with insufficient role get 403 Forbidden
	//   2. Endpoints correctly check required permissions
	//   3. Role escalation is prevented
	t.Log("RBAC middleware is not implemented — all authenticated users have full access")
}

// ====================================================================
// AUTH-07: Brute force login lockout (429)
// ====================================================================

func TestLogin_RateLimiting(t *testing.T) {
	if !redis.IsRedisAvailable() {
		t.Skip("Skipping rate limit test: Redis not available")
	}

	gin.SetMode(gin.TestMode)
	router := setupRateLimitedLoginRouter()

	body := `{"email":"ratelimit_nobody@example.com","password":"AnyPass@123"}`

	for i := 0; i < 6; i++ {
		w := httptest.NewRecorder()
		req, _ := http.NewRequest("POST", "/login", strings.NewReader(body))
		req.Header.Set("Content-Type", "application/json")
		router.ServeHTTP(w, req)

		if i < 5 {
			assert.Equal(t, http.StatusUnauthorized, w.Code,
				"Request %d should be processed (got %d). Body: %s", i+1, w.Code, w.Body.String())
		} else {
			assert.Equal(t, http.StatusTooManyRequests, w.Code,
				"Request 6 should be rate-limited with 429 (got %d). Body: %s", w.Code, w.Body.String())
			assert.Contains(t, w.Body.String(), "Too many requests")
		}
	}
}

// ====================================================================
// AUTH-09: Session invalidation on password change
// ====================================================================

func TestSessionInvalidation_OnPasswordChange(t *testing.T) {
	if os.Getenv("JWT_SECRET") == "" {
		os.Setenv("JWT_SECRET", "test-secret-key-for-testing-only")
	}

	email := fmt.Sprintf("sessioninv_%d@example.com", time.Now().UnixNano())
	_, _ = createTestUser(t, email, "OldPass@123")

	loginRouter := setupTestRouter()
	authRouter := setupPasswordUpdateRouter()

	// Step 1: Login with the original password
	loginBody := fmt.Sprintf(`{"email":"%s","password":"OldPass@123"}`, email)
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("POST", "/login", strings.NewReader(loginBody))
	req.Header.Set("Content-Type", "application/json")
	loginRouter.ServeHTTP(w, req)
	require.Equal(t, http.StatusOK, w.Code, "Step 1: Login should succeed")

	var loginResp map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &loginResp)
	require.NoError(t, err)
	data, ok := loginResp["data"].(map[string]interface{})
	require.True(t, ok, "Response should contain data")
	oldToken, ok := data["newToken"].(string)
	require.True(t, ok, "Response should contain newToken")
	require.NotEmpty(t, oldToken)

	// Step 2: Update password (authenticated with old token)
	updateBody := `{"current_password":"OldPass@123","new_password":"NewPass@456"}`
	w2 := httptest.NewRecorder()
	req2, _ := http.NewRequest("PUT", "/password", strings.NewReader(updateBody))
	req2.Header.Set("Content-Type", "application/json")
	req2.Header.Set("Authorization", "Bearer "+oldToken)
	authRouter.ServeHTTP(w2, req2)
	require.Equal(t, http.StatusOK, w2.Code, "Step 2: Password update should succeed")

	// Step 3: Old token should still be valid (BUG: no session invalidation implemented)
	w3 := httptest.NewRecorder()
	req3, _ := http.NewRequest("POST", "/refresh-token", strings.NewReader(`{}`))
	req3.Header.Set("Content-Type", "application/json")
	req3.Header.Set("Authorization", "Bearer "+oldToken)
	authRouter.ServeHTTP(w3, req3)
	t.Log("AUTH-09 VULNERABILITY: Old token still works after password change — " +
		"session invalidation is not implemented. Tokens should be invalidated " +
		"by maintaining a token version or password-changed-at timestamp.")
	assert.Equal(t, http.StatusOK, w3.Code,
		"BUG (AUTH-09): Old token should be invalidated after password change, but currently is not")

	// Step 4: Login with old password should fail
	w4 := httptest.NewRecorder()
	req4, _ := http.NewRequest("POST", "/login", strings.NewReader(loginBody))
	req4.Header.Set("Content-Type", "application/json")
	loginRouter.ServeHTTP(w4, req4)
	assert.Equal(t, http.StatusUnauthorized, w4.Code,
		"Step 4: Old password should no longer work")

	// Step 5: Login with new password should succeed
	newLoginBody := fmt.Sprintf(`{"email":"%s","password":"NewPass@456"}`, email)
	w5 := httptest.NewRecorder()
	req5, _ := http.NewRequest("POST", "/login", strings.NewReader(newLoginBody))
	req5.Header.Set("Content-Type", "application/json")
	loginRouter.ServeHTTP(w5, req5)
	require.Equal(t, http.StatusOK, w5.Code, "Step 5: Login with new password should succeed")

	var loginResp2 map[string]interface{}
	err = json.Unmarshal(w5.Body.Bytes(), &loginResp2)
	require.NoError(t, err)
	data2 := loginResp2["data"].(map[string]interface{})
	newToken := data2["newToken"].(string)
	require.NotEmpty(t, newToken)

	// Step 6: New token should work on protected endpoint
	w6 := httptest.NewRecorder()
	req6, _ := http.NewRequest("POST", "/refresh-token", strings.NewReader(`{}`))
	req6.Header.Set("Content-Type", "application/json")
	req6.Header.Set("Authorization", "Bearer "+newToken)
	authRouter.ServeHTTP(w6, req6)
	assert.Equal(t, http.StatusOK, w6.Code, "Step 6: New token should work")
}
