package handlers

import (
	"bytes"
	"context"
	"fmt"
	"io"
	"net/http"
	db "storemanagement/db/sqlc"
	"storemanagement/redis"
	"storemanagement/utils"

	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"
	"github.com/jackc/pgx/v5/pgtype"
	"golang.org/x/crypto/bcrypt"
)

/*
* * * ---------------------------------------------------- Handler for user registration * * * ----------------------------------------
 */

type RegisterStoreOwnerParams struct {
	Name           string `json:"name" binding:"required"`
	Email          string `json:"email" binding:"required,email"`
	Password       string `json:"password" binding:"required"`
	Phone          string `json:"phone"`
	ProfilePicture string `db:"profile_picture" json:"profile_picture"`
	StoreName      string `json:"store_name" binding:"required"`
	StoreAddress   string `json:"store_address" binding:"required"`
	CurrencyCode   string `json:"currency_code" binding:"required"`
}

func RegisterUserHandler(c *gin.Context) {
	var req RegisterStoreOwnerParams

	// Log the raw request body for debugging
	body, _ := c.GetRawData()
	c.Request.Body = io.NopCloser(bytes.NewBuffer(body))

	// Bind and validate the request
	if err := c.ShouldBindJSON(&req); err != nil {
		fmt.Printf("Validation error: %v\n", err)
		// Handle validation errors
		if errs, ok := err.(validator.ValidationErrors); ok {
			utils.ErrorResponse(c, http.StatusBadRequest, "Invalid email/fields required", errs)
			return
		}

		// Handle other errors (e.g., invalid JSON)
		utils.ErrorResponse(c, http.StatusBadRequest, "Invalid request", err)
		return
	}

	// Validate inputs for SQL injection / XSS patterns
	if offending := utils.ValidateUserInputFields(map[string]string{
		"name":          req.Name,
		"email":         req.Email,
		"store_name":    req.StoreName,
		"store_address": req.StoreAddress,
		"phone":         req.Phone,
	}); offending != "" {
		utils.ErrorResponse(c, http.StatusBadRequest, fmt.Sprintf("Invalid characters in %s", offending), nil)
		return
	}
	// check if user already exists
	_, err := utils.Queries.GetStoreOwnerByEmail(context.Background(), req.Email)
	if err == nil {
		utils.ErrorResponse(c, http.StatusConflict, "User already exists", err)
		return
	}
	// Hash the password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), 10)
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to hash password", err)
		return
	}
	otp, err := utils.GenerateOTP()
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to generate OTP", err)
		return
	}

	var createdUser db.StoreOwner

	// Execute user creation and store info inside a transaction.
	err = utils.Store.ExecTx(context.Background(), func(q *db.Queries) error {
		var txErr error

		// 1. Create User
		createdUser, txErr = q.CreateStoreOwner(context.Background(), db.CreateStoreOwnerParams{
			Name:           req.Name,
			Email:          req.Email,
			Password:       string(hashedPassword),
			Phone:          req.Phone,
			ProfilePicture: req.ProfilePicture,
		})
		if txErr != nil {
			return fmt.Errorf("failed to create user: %w", txErr)
		}

		// 2. Create Store Info
		_, txErr = q.CreateStoreInfo(context.Background(), db.CreateStoreInfoParams{
			OwnerID:      createdUser.ID,
			Name:         req.StoreName,
			Address:      req.StoreAddress,
			CurrencyCode: req.CurrencyCode,
		})
		if txErr != nil {
			return fmt.Errorf("failed to create store info: %w", txErr)
		}

		return nil
	})
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, err.Error(), err)
		return
	}

	// 3. Store OTP — prefer Redis (auto-expiring), fall back to Postgres.
	if redis.IsRedisAvailable() {
		if redisErr := redis.StoreOTP(context.Background(), createdUser.Email, "email_verification", otp); redisErr != nil {
			fmt.Printf("[Redis] StoreOTP failed, falling back to Postgres: %v\n", redisErr)
			utils.Queries.CreateOTPToken(context.Background(), db.CreateOTPTokenParams{
				UserEmail: createdUser.Email,
				Otp:       otp,
				Purpose:   "email_verification",
			})
		}
	} else {
		utils.Queries.CreateOTPToken(context.Background(), db.CreateOTPTokenParams{
			UserEmail: createdUser.Email,
			Otp:       otp,
			Purpose:   "email_verification",
		})
	}

	// 4. Send OTP email asynchronously.
	go func(email, code string) {
		if emailErr := utils.SendOTPEmail(email, code); emailErr != nil {
			fmt.Printf("Failed to send OTP email: %v\n", emailErr)
		}
	}(createdUser.Email, otp)

	utils.SuccessResponse(c, "User and Store created successfully", createdUser)
}

type LoginStoreOwnerParams struct {
	Email    string `json:"email" binding:"required"`
	Password string `json:"password" binding:"required"`
}

func LoginHandler(c *gin.Context) {
	var req LoginStoreOwnerParams
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Invalid request", err)
		return
	}

	user, err := utils.Queries.GetStoreOwnerByEmail(context.Background(), req.Email)
	if err != nil {
		utils.ErrorResponse(c, http.StatusUnauthorized, "Invalid credentials", err)
		return
	}

	storeinfo, err := utils.Queries.GetStoreInfoByOwner(context.Background(), user.ID)
	if err != nil {
		utils.ErrorResponse(c, http.StatusUnauthorized, "Invalid credentials", err)
		return
	}

	err = bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(req.Password))
	if err != nil {
		utils.ErrorResponse(c, http.StatusUnauthorized, "Invalid credentials", err)
		return
	}

	token, err := utils.GenerateJWT(user.ID, user.Name, storeinfo.ID, user.Emailverified)
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to generate token", err)
		return
	}

	utils.SuccessResponse(c, "Login successful", gin.H{"userData": user, "newToken": token})
}

type StoreInfoParams struct {
	Name         string `json:"name" binding:"required"`
	Address      string `json:"address" binding:"required"`
	CurrencyCode string `json:"currency_code" binding:"required"`
}

func CreateStoreInfoHandler(c *gin.Context) {
	// gent user id from token
	userId, _ := c.Get("user_id")
	// Type assert userId to pgtype.UUID
	userUUID, ok := userId.(pgtype.UUID)
	if !ok {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Invalid user ID format", nil)
		return
	}
	var req StoreInfoParams

	// check if user exists
	_, err := utils.Queries.GetStoreOwnerById(context.Background(), userUUID)
	if err != nil {
		utils.ErrorResponse(c, http.StatusUnauthorized, "User not found", err)
		return
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Invalid request", err)
		return
	}

	// Validate inputs for SQL injection / XSS patterns
	if offending := utils.ValidateUserInputFields(map[string]string{
		"name":    req.Name,
		"address": req.Address,
	}); offending != "" {
		utils.ErrorResponse(c, http.StatusBadRequest, fmt.Sprintf("Invalid characters in %s", offending), nil)
		return
	}

	info, err := utils.Queries.CreateStoreInfo(context.Background(), db.CreateStoreInfoParams{
		OwnerID:      userUUID,
		Name:         req.Name,
		Address:      req.Address,
		CurrencyCode: req.CurrencyCode,
	})
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to create store info", err)
		return
	}

	// create store info
	utils.SuccessResponse(c, "Store info created successfully", info)
}

/*
* * * ---------------------------------------------------- Handler for refreshing JWT token * * * ----------------------------------------
 */
func RefreshTokenHandler(c *gin.Context) {
	// Get user information from JWT token (set by middleware)
	userID, exists := c.Get("user_id")
	if !exists {
		utils.ErrorResponse(c, http.StatusUnauthorized, "User not authenticated", nil)
		return
	}

	userName, _ := c.Get("user_name")
	storeId, _ := c.Get("store_id")
	verifiedEmail, _ := c.Get("verified_email")

	// Generate new JWT token
	token, err := utils.GenerateJWT(userID.(pgtype.UUID), userName.(string), storeId.(pgtype.UUID), verifiedEmail.(bool))
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to generate token", err)
		return
	}

	c.JSON(200, gin.H{
		"message": "Token refreshed successfully",
		"token":   token,
	})
}

type VerifyOTPParams struct {
	UserEmail string `json:"userEmail" binding:"required"`
	Otp       string `json:"otp" binding:"required"`
	Purpose   string `json:"purpose" binding:"required"` // "email_verification" or "password_reset"
}

func VerifyOTP(c *gin.Context) {
	var req VerifyOTPParams

	// Bind and validate request
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Invalid request: otp and purpose are required", err)
		return
	}

	// Validate OTP format (should be 6 digits)
	if len(req.Otp) != 6 {
		utils.ErrorResponse(c, http.StatusBadRequest, "Invalid OTP format: must be 6 digits", nil)
		return
	}

	// Verify OTP — prefer Redis (auto-consuming), fall back to Postgres.
	if redis.IsRedisAvailable() {
		if err := redis.VerifyAndConsumeOTP(c.Request.Context(), req.UserEmail, req.Purpose, req.Otp); err != nil {
			utils.ErrorResponse(c, http.StatusBadRequest, "Invalid or expired OTP", err)
			return
		}
	} else {
		// Postgres fallback
		otpRecord, err := utils.Queries.VerifyOTP(context.Background(), db.VerifyOTPParams{
			UserEmail: req.UserEmail,
			Otp:       req.Otp,
			Purpose:   req.Purpose,
		})
		if err != nil {
			utils.ErrorResponse(c, http.StatusBadRequest, "Invalid or expired OTP", err)
			return
		}
		if delErr := utils.Queries.DeleteOTPToken(context.Background(), otpRecord.ID); delErr != nil {
			fmt.Printf("Warning: failed to delete used OTP: %v\n", delErr)
		}
	}

	if err := utils.Queries.UpdateEmailVerification(context.Background(), req.UserEmail); err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Failed to verify email", err)
		return
	}

	utils.SuccessResponse(c, "OTP verified successfully", gin.H{
		"verified": true,
		"purpose":  req.Purpose,
	})
}

/*
* * * ---------------------------------------------------- Handler for forgot password (send OTP) * * * ----------------------------------------
 */

type ForgotPasswordParams struct {
	Email string `json:"email" binding:"required,email"`
}

func ForgotPasswordHandler(c *gin.Context) {
	var req ForgotPasswordParams

	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Invalid email address", err)
		return
	}

	// Check if user exists
	user, err := utils.Queries.GetStoreOwnerByEmail(context.Background(), req.Email)
	if err != nil {
		// Don't reveal whether user exists or not for security
		utils.SuccessResponse(c, "If an account with that email exists, we have sent a password reset code", nil)
		return
	}

	// Generate OTP
	otp, err := utils.GenerateOTP()
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to generate reset code", err)
		return
	}

	// Store OTP — prefer Redis (auto-expiring), fall back to Postgres.
	if redis.IsRedisAvailable() {
		if redisErr := redis.StoreOTP(context.Background(), user.Email, "password_reset", otp); redisErr != nil {
			fmt.Printf("[Redis] StoreOTP failed, falling back to Postgres: %v\n", redisErr)
			_, dbErr := utils.Queries.CreateOTPToken(context.Background(), db.CreateOTPTokenParams{
				UserEmail: user.Email,
				Otp:       otp,
				Purpose:   "password_reset",
			})
			if dbErr != nil {
				utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to create reset code", dbErr)
				return
			}
		}
	} else {
		_, dbErr := utils.Queries.CreateOTPToken(context.Background(), db.CreateOTPTokenParams{
			UserEmail: user.Email,
			Otp:       otp,
			Purpose:   "password_reset",
		})
		if dbErr != nil {
			utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to create reset code", dbErr)
			return
		}
	}

	// Send OTP email asynchronously.
	go func(email, code string) {
		if emailErr := utils.SendOTPEmail(email, code); emailErr != nil {
			fmt.Printf("Failed to send OTP email: %v\n", emailErr)
		}
	}(user.Email, otp)

	utils.SuccessResponse(c, "If an account with that email exists, we have sent a password reset code", nil)
}

/*
* * * ---------------------------------------------------- Handler for reset password (verify OTP and update password) * * * ----------------------------------------
 */

type ResetPasswordParams struct {
	Email    string `json:"email" binding:"required,email"`
	Otp      string `json:"otp" binding:"required"`
	Password string `json:"password" binding:"required,min=8"`
}

func ResetPasswordHandler(c *gin.Context) {
	var req ResetPasswordParams

	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Invalid request", err)
		return
	}

	// Validate OTP format (should be 6 digits)
	if len(req.Otp) != 6 {
		utils.ErrorResponse(c, http.StatusBadRequest, "Invalid OTP format: must be 6 digits", nil)
		return
	}

	// Validate password strength
	if len(req.Password) < 8 {
		utils.ErrorResponse(c, http.StatusBadRequest, "Password must be at least 8 characters", nil)
		return
	}

	// Verify OTP — prefer Redis (auto-consuming), fall back to Postgres.
	if redis.IsRedisAvailable() {
		if err := redis.VerifyAndConsumeOTP(c.Request.Context(), req.Email, "password_reset", req.Otp); err != nil {
			utils.ErrorResponse(c, http.StatusBadRequest, "Invalid or expired reset code", err)
			return
		}
	} else {
		otpRecord, err := utils.Queries.VerifyOTP(context.Background(), db.VerifyOTPParams{
			UserEmail: req.Email,
			Otp:       req.Otp,
			Purpose:   "password_reset",
		})
		if err != nil {
			utils.ErrorResponse(c, http.StatusBadRequest, "Invalid or expired reset code", err)
			return
		}
		if delErr := utils.Queries.DeleteOTPToken(context.Background(), otpRecord.ID); delErr != nil {
			fmt.Printf("Warning: failed to delete used OTP: %v\n", delErr)
		}
	}

	// Hash the new password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), 10)
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to hash password", err)
		return
	}

	// Update password in database
	if err := utils.Queries.UpdatePasswordByEmail(context.Background(), db.UpdatePasswordByEmailParams{
		Email:    req.Email,
		Password: string(hashedPassword),
	}); err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to update password", err)
		return
	}

	utils.SuccessResponse(c, "Password reset successfully", nil)
}
