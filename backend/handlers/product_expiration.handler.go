package handlers

import (
	"context"
	"errors"
	"net/http"
	"strconv"
	"time"

	db "storemanagement/db/sqlc"
	"storemanagement/utils"

	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
)

type CreateProductExpirationRequest struct {
	ProductID      string `json:"product_id" binding:"required,uuid"`
	BatchNumber    string `json:"batch_number"`
	ExpirationDate string `json:"expiration_date" binding:"required"`
	Quantity       int32  `json:"quantity" binding:"required,gt=0"`
}

func CreateProductExpirationHandler(c *gin.Context) {
	var req CreateProductExpirationRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		if errs, ok := err.(validator.ValidationErrors); ok {
			for _, fieldErr := range errs {
				var errMsg string
				switch fieldErr.Field() {
				case "ProductID":
					errMsg = "Valid product ID is required"
				case "ExpirationDate":
					errMsg = "Expiration date is required"
				case "Quantity":
					errMsg = "Quantity must be greater than 0"
				default:
					errMsg = fieldErr.Error()
				}
				utils.ErrorResponse(c, http.StatusBadRequest, "Validation failed", errors.New(errMsg))
				return
			}
		}
		utils.ErrorResponse(c, http.StatusBadRequest, "Invalid request", err)
		return
	}

	expirationDate, err := time.Parse("2006-01-02", req.ExpirationDate)
	if err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Invalid expiration date format (use YYYY-MM-DD)", err)
		return
	}

	productExpiration, err := utils.Queries.CreateProductExpiration(context.Background(), db.CreateProductExpirationParams{
		ProductID:      uuid.MustParse(req.ProductID),
		BatchNumber:    pgtype.Text{String: req.BatchNumber, Valid: req.BatchNumber != ""},
		ExpirationDate: pgtype.Date{Time: expirationDate, Valid: true},
		Quantity:       req.Quantity,
	})

	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to create product expiration", err)
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message":            "Product expiration created successfully",
		"product_expiration": productExpiration,
	})
}

func GetProductExpirationHandler(c *gin.Context) {
	expirationID := c.Param("id")

	id, err := uuid.Parse(expirationID)
	if err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Invalid expiration ID", err)
		return
	}

	productExpiration, err := utils.Queries.GetProductExpirationById(context.Background(), id)
	if err != nil {
		utils.ErrorResponse(c, http.StatusNotFound, "Product expiration not found", err)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"product_expiration": productExpiration,
	})
}

func ListProductExpirationsHandler(c *gin.Context) {
	storeID := c.GetString("store_id")
	limitStr := c.DefaultQuery("limit", "50")
	offsetStr := c.DefaultQuery("offset", "0")

	limit, _ := strconv.Atoi(limitStr)
	offset, _ := strconv.Atoi(offsetStr)

	productExpirations, err := utils.Queries.ListProductExpirations(context.Background(), db.ListProductExpirationsParams{
		StoreID: uuid.MustParse(storeID),
		Limit:   int32(limit),
		Offset:  int32(offset),
	})

	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to fetch product expirations", err)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"product_expirations": productExpirations,
		"count":               len(productExpirations),
		"limit":               limit,
		"offset":              offset,
	})
}

func ListExpirationsByProductHandler(c *gin.Context) {
	productID := c.Param("product_id")

	id, err := uuid.Parse(productID)
	if err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Invalid product ID", err)
		return
	}

	productExpirations, err := utils.Queries.ListExpirationsByProduct(context.Background(), id)
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to fetch product expirations", err)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"product_expirations": productExpirations,
		"count":               len(productExpirations),
	})
}

func ListExpiringSoonHandler(c *gin.Context) {
	storeID := c.GetString("store_id")
	daysStr := c.DefaultQuery("days", "30")

	days, _ := strconv.Atoi(daysStr)
	futureDate := time.Now().AddDate(0, 0, days)

	productExpirations, err := utils.Queries.ListExpiringSoon(context.Background(), db.ListExpiringSoonParams{
		StoreID:        uuid.MustParse(storeID),
		ExpirationDate: pgtype.Date{Time: futureDate, Valid: true},
	})

	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to fetch expiring products", err)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"product_expirations": productExpirations,
		"count":               len(productExpirations),
		"expiring_within":     days,
	})
}

func ListExpiredProductsHandler(c *gin.Context) {
	storeID := c.GetString("store_id")

	productExpirations, err := utils.Queries.ListExpiredProducts(context.Background(), uuid.MustParse(storeID))
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to fetch expired products", err)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"product_expirations": productExpirations,
		"count":               len(productExpirations),
	})
}

type UpdateProductExpirationRequest struct {
	BatchNumber    *string `json:"batch_number,omitempty"`
	ExpirationDate *string `json:"expiration_date,omitempty"`
	Quantity       *int32  `json:"quantity,omitempty"`
}

func UpdateProductExpirationHandler(c *gin.Context) {
	expirationID := c.Param("id")
	var req UpdateProductExpirationRequest

	id, err := uuid.Parse(expirationID)
	if err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Invalid expiration ID", err)
		return
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Invalid request", err)
		return
	}

	params := db.UpdateProductExpirationParams{
		ID: id,
	}

	if req.BatchNumber != nil {
		params.BatchNumber = pgtype.Text{String: *req.BatchNumber, Valid: true}
	}
	if req.ExpirationDate != nil {
		expirationDate, err := time.Parse("2006-01-02", *req.ExpirationDate)
		if err != nil {
			utils.ErrorResponse(c, http.StatusBadRequest, "Invalid expiration date format", err)
			return
		}
		params.ExpirationDate = pgtype.Date{Time: expirationDate, Valid: true}
	}
	if req.Quantity != nil {
		params.Quantity = pgtype.Int4{Int32: *req.Quantity, Valid: true}
	}

	productExpiration, err := utils.Queries.UpdateProductExpiration(context.Background(), params)
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to update product expiration", err)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":            "Product expiration updated successfully",
		"product_expiration": productExpiration,
	})
}

func DeleteProductExpirationHandler(c *gin.Context) {
	expirationID := c.Param("id")

	id, err := uuid.Parse(expirationID)
	if err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Invalid expiration ID", err)
		return
	}

	err = utils.Queries.DeleteProductExpiration(context.Background(), id)
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to delete product expiration", err)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Product expiration deleted successfully",
	})
}
