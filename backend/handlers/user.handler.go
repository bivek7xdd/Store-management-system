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

	utils.SuccessResponse(c, "User created successfully", user)
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

	utils.SuccessResponse(c, "Login successful", gin.H{"token": token})
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
