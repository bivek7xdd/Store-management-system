package handlers

import (
	"bytes"
	"context"
	"fmt"
	"io"
	"net/http"
	db "storemanagement/db/sqlc"
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
	Email          string `json:"email" binding:"required"`
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
			utils.ErrorResponse(c, 500, "validation error", errs)
		}

		// Handle other errors (e.g., invalid JSON)
		utils.ErrorResponse(c, http.StatusBadRequest, "Invalid request", err)
		return
	}
	//check if user already exists
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
		println("error:", err)
	}

	// Create User
	user, err := utils.Queries.CreateStoreOwner(context.Background(), db.CreateStoreOwnerParams{
		Name:           req.Name,
		Email:          req.Email,
		Password:       string(hashedPassword),
		Phone:          req.Phone,
		ProfilePicture: req.ProfilePicture,
	})
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to create user", err)
		return
	}

	// Create Store Info
	_, err = utils.Queries.CreateStoreInfo(context.Background(), db.CreateStoreInfoParams{
		OwnerID:      user.ID,
		Name:         req.StoreName,
		Address:      req.StoreAddress,
		CurrencyCode: req.CurrencyCode,
	})
	if err != nil {
		// Note: Ideally we should rollback user creation here, but keeping it simple for now
		fmt.Printf("Failed to create store info: %v\n", err)
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to create store info", err)
		return
	}

	//set the otp
	utils.Queries.CreateOTPToken(context.Background(), db.CreateOTPTokenParams{
		UserEmail: user.Email,
		Otp:       otp,
		Purpose:   "email_verification",
	})
	//TODO: Fix the bug of creating user even though the email is not sent
	err = utils.SendOTPEmail(user.Email, otp)
	if err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Error sending mail", err)
	}
	utils.SuccessResponse(c, "User and Store created successfully", user)

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

	err = bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(req.Password))
	if err != nil {
		utils.ErrorResponse(c, http.StatusUnauthorized, "Invalid credentials", err)
		return
	}

	token, err := utils.GenerateJWT(user.ID, user.Email, user.Name)
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
	//gent user id from token
	userId, _ := c.Get("user_id")
	// Type assert userId to pgtype.UUID
	userUUID, ok := userId.(pgtype.UUID)
	if !ok {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Invalid user ID format", nil)
		return
	}
	var req StoreInfoParams

	//check if user exists
	_, err := utils.Queries.GetStoreOwnerById(context.Background(), userUUID)
	if err != nil {
		utils.ErrorResponse(c, http.StatusUnauthorized, "User not found", err)
		return
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Invalid request", err)
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

	//create store info
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

	userEmail, _ := c.Get("user_email")
	storeName, _ := c.Get("store_name")

	// Generate new JWT token
	token, err := utils.GenerateJWT(userID.(pgtype.UUID), userEmail.(string), storeName.(string))
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

	// Verify the OTP exists and is not expired
	otpRecord, err := utils.Queries.VerifyOTP(context.Background(), db.VerifyOTPParams{
		UserEmail: req.UserEmail,
		Otp:       req.Otp,
		Purpose:   req.Purpose,
	})
	if err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Invalid or expired OTP", err)
		return
	}

	// Delete the OTP after successful verification (one-time use)
	err = utils.Queries.DeleteOTPToken(context.Background(), otpRecord.ID)
	if err != nil {
		// Log the error but don't fail the request - OTP was valid
		fmt.Printf("Warning: failed to delete used OTP: %v\n", err)
	}

	err = utils.Queries.UpdateEmailVerification(context.Background(), req.UserEmail)
	if err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Invalid or expired OTP", err)
		return
	}

	utils.SuccessResponse(c, "OTP verified successfully", gin.H{
		"verified": true,
		"purpose":  req.Purpose,
	})
}
