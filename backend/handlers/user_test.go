package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"os"
	"strings"
	"testing"
	"time"

	"storemanagement/utils"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
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
