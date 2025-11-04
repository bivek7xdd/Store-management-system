package handlers

import (
	"bytes"
	"context"
	"errors"
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
type RegisterUserRequest struct {
	Name      string `json:"name" binding:"required,min=3,max=50"`
	Email     string `json:"email" binding:"required,email"`
	Password  string `json:"password" binding:"required,min=8"`
	Phone     string `json:"phone" binding:"required,min=10,max=20"`
	StoreName string `json:"store_name" binding:"required"`
}

func RegisterUserHandler(c *gin.Context) {
	var req RegisterUserRequest

	// Log the raw request body for debugging
	body, _ := c.GetRawData()
	c.Request.Body = io.NopCloser(bytes.NewBuffer(body))
	fmt.Printf("Received registration request: %s\n", string(body))

	// Bind and validate the request
	if err := c.ShouldBindJSON(&req); err != nil {
		fmt.Printf("Validation error: %v\n", err)
		// Handle validation errors
		if errs, ok := err.(validator.ValidationErrors); ok {
			// Convert validation errors to a single error message
			for _, fieldErr := range errs {
				fmt.Printf("Field error - Field: %s, Tag: %s, Value: %v\n", fieldErr.Field(), fieldErr.Tag(), fieldErr.Value())
				var errMsg string
				switch fieldErr.Field() {
				case "Name":
					errMsg = "Name must be 3-50 characters"
				case "Email":
					errMsg = "Please provide a valid email"
				case "Password":
					errMsg = "Password must be at least 8 characters"
				case "Phone":
					errMsg = "Phone number must be 10-20 characters"
				case "StoreName":
					errMsg = "Store name is required"
				default:
					errMsg = fieldErr.Error()
				}
				utils.ErrorResponse(c, http.StatusBadRequest, "Validation failed", errors.New(errMsg))
				return // Return after first error
			}
		}

		// Handle other errors (e.g., invalid JSON)
		utils.ErrorResponse(c, http.StatusBadRequest, "Invalid request", err)
		return
	}
	//check if user already exists
	_, err := utils.Queries.GetUserByEmail(context.Background(), req.Email)
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

	user, err := utils.Queries.CreateUser(context.Background(), db.CreateUserParams{
		Name:      req.Name,
		Email:     req.Email,
		Password:  string(hashedPassword),
		StoreName: pgtype.Text{String: req.StoreName, Valid: true},
		Phone:     pgtype.Text{String: req.Phone, Valid: true},
	})
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to create user", err)
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "User registered successfully",
		"user":    user,
	})
}

/*
* * * ---------------------------------------------------- Handler for user login * * * ----------------------------------------
 */
type LoginUserRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

func LoginUserHandler(c *gin.Context) {
	var req LoginUserRequest

	// Bind and validate the request
	if err := c.ShouldBindJSON(&req); err != nil {
		// Handle validation errors
		if errs, ok := err.(validator.ValidationErrors); ok {
			// Convert validation errors to a single error message
			for _, fieldErr := range errs {
				var errMsg string
				switch fieldErr.Field() {
				case "Email":
					errMsg = "Please provide a valid email"
				case "Password":
					errMsg = "Password is required"
				default:
					errMsg = fieldErr.Error()
				}
				utils.ErrorResponse(c, http.StatusBadRequest, "Validation failed", errors.New(errMsg))
			}
		}

		// Handle other errors (e.g., invalid JSON)
		utils.ErrorResponse(c, http.StatusBadRequest, "Invalid request", err)
		return
	}

	// Check if user exists
	user, err := utils.Queries.GetUserByEmail(context.Background(), req.Email)
	if err != nil {
		utils.ErrorResponse(c, http.StatusUnauthorized, "Invalid credentials", err)
		return
	}

	// Verify password
	err = bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(req.Password))
	if err != nil {
		utils.ErrorResponse(c, http.StatusUnauthorized, "Invalid credentials", err)
		return
	}

	//TODO: Add JWT token generation

	c.JSON(200, gin.H{
		"message": "Login successful",
		"user":    user,
	})
}
