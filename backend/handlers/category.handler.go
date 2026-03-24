package handlers

import (
	"context"
	"log"
	"net/http"
	db "storemanagement/db/sqlc"
	"storemanagement/utils"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
)

type createCategoryReq struct {
	Name        string `json:"name" binding:"required"`
	Description string `json:"description" binding:"required"`
}

func CreateCategories(c *gin.Context) {
	// validate request body
	var req createCategoryReq
	storeID := c.MustGet("store_id").(pgtype.UUID)
	err := c.ShouldBindJSON(&req)
	if err != nil {
		log.Printf("error binding json: %v", err)
		utils.ErrorResponse(c, http.StatusInternalServerError, "error binding json", err)
		return
	}

	// create context
	ctx, cancel := context.WithTimeout(c.Request.Context(), 2*time.Second)
	defer cancel()

	// add to database
	category, err := utils.Queries.CreateCategories(ctx, db.CreateCategoriesParams{
		Name: req.Name,
		Description: pgtype.Text{
			String: req.Description,
			Valid:  true,
		},
		StoreID: storeID,
	})
	if err != nil {
		log.Printf("error creating category: %v", err)
		utils.ErrorResponse(c, http.StatusInternalServerError, "failed to create category", err)
		return
	}

	c.JSON(http.StatusCreated, utils.Response{
		Success: true,
		Message: "Category created successfully",
		Data:    category,
	})
}

func GetAllCategories(c *gin.Context) {
	// get store id
	storeId := c.MustGet("store_id").(pgtype.UUID)

	// create context
	ctx, cancel := context.WithTimeout(c.Request.Context(), 2*time.Second)
	defer cancel()

	// get all categories
	categories, err := utils.Queries.GetCategories(ctx, storeId)
	if err != nil {
		log.Println("error geting categories", err)
		utils.ErrorResponse(c, http.StatusInternalServerError, "Error getting categories", err)
		return
	}

	utils.SuccessResponse(c, "Categories fetched successfully", categories)
}

func DeleteCategory(c *gin.Context) {
	storeId := c.MustGet("store_id").(pgtype.UUID)
	categoryIdStr := c.Query("category_id")
	if categoryIdStr == "" {
		utils.ErrorResponse(c, http.StatusBadRequest, "category_id is required", nil)
		return
	}
	categoryUUID, err := uuid.Parse(categoryIdStr)
	if err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Invalid category ID", err)
		return
	}

	ctx, cancel := context.WithTimeout(c.Request.Context(), 2*time.Second)
	defer cancel()

	err = utils.Queries.DeleteCategory(ctx, db.DeleteCategoryParams{
		StoreID: storeId,
		ID:      pgtype.UUID{Bytes: categoryUUID, Valid: true},
	})
	if err != nil {
		log.Println("error deleting category", err)
		utils.ErrorResponse(c, http.StatusInternalServerError, "Error deleting category", err)
		return
	}

	utils.SuccessResponse(c, "Category deleted successfully", nil)
}

func GetCategory(c *gin.Context) {
	storeId := c.MustGet("store_id").(pgtype.UUID)
	categoryIdStr := c.Param("id")
	if categoryIdStr == "" {
		utils.ErrorResponse(c, http.StatusBadRequest, "category_id is required", nil)
		return
	}
	categoryUUID, err := uuid.Parse(categoryIdStr)
	if err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Invalid category ID", err)
		return
	}

	ctx, cancel := context.WithTimeout(c.Request.Context(), 2*time.Second)
	defer cancel()

	category, err := utils.Queries.GetCategory(ctx, db.GetCategoryParams{
		ID:      pgtype.UUID{Bytes: categoryUUID, Valid: true},
		StoreID: storeId,
	})
	if err != nil {
		log.Printf("error getting category: %v", err)
		utils.ErrorResponse(c, http.StatusInternalServerError, "Error getting category", err)
		return
	}

	utils.SuccessResponse(c, "Category fetched successfully", category)
}

type updateCategoryReq struct {
	Name        string `json:"name" binding:"required"`
	Description string `json:"description" binding:"required"`
}

func UpdateCategory(c *gin.Context) {
	storeId := c.MustGet("store_id").(pgtype.UUID)
	categoryIdStr := c.Param("id")

	if categoryIdStr == "" {
		utils.ErrorResponse(c, http.StatusBadRequest, "category_id is required", nil)
		return
	}
	categoryUUID, err := uuid.Parse(categoryIdStr)
	if err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Invalid category ID", err)
		return
	}

	var req updateCategoryReq
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Invalid request body", err)
		return
	}

	ctx, cancel := context.WithTimeout(c.Request.Context(), 2*time.Second)
	defer cancel()

	category, err := utils.Queries.UpdateCategory(ctx, db.UpdateCategoryParams{
		ID:          pgtype.UUID{Bytes: categoryUUID, Valid: true},
		Name:        req.Name,
		Description: pgtype.Text{String: req.Description, Valid: true},
		StoreID:     storeId,
	})
	if err != nil {
		log.Printf("error updating category: %v", err)
		utils.ErrorResponse(c, http.StatusInternalServerError, "Error updating category", err)
		return
	}

	utils.SuccessResponse(c, "Category updated successfully", category)
}

func GetCategoryStats(c *gin.Context) {
	storeId := c.MustGet("store_id").(pgtype.UUID)
	categoryIdStr := c.Param("id")

	if categoryIdStr == "" {
		utils.ErrorResponse(c, http.StatusBadRequest, "category_id is required", nil)
		return
	}
	categoryUUID, err := uuid.Parse(categoryIdStr)
	if err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Invalid category ID", err)
		return
	}

	ctx, cancel := context.WithTimeout(c.Request.Context(), 2*time.Second)
	defer cancel()

	stats, err := utils.Queries.GetCategoryStats(ctx, db.GetCategoryStatsParams{
		StoreID:    storeId,
		CategoryID: pgtype.UUID{Bytes: categoryUUID, Valid: true},
	})
	if err != nil {
		log.Printf("error getting category stats: %v", err)
		utils.ErrorResponse(c, http.StatusInternalServerError, "Error getting category stats", err)
		return
	}

	utils.SuccessResponse(c, "Category stats fetched successfully", stats)
}

func GetCategoryProducts(c *gin.Context) {
	storeId := c.MustGet("store_id").(pgtype.UUID)
	categoryIdStr := c.Param("id")

	if categoryIdStr == "" {
		utils.ErrorResponse(c, http.StatusBadRequest, "category_id is required", nil)
		return
	}
	categoryUUID, err := uuid.Parse(categoryIdStr)
	if err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Invalid category ID", err)
		return
	}

	ctx, cancel := context.WithTimeout(c.Request.Context(), 5*time.Second)
	defer cancel()

	products, err := utils.Queries.ListProductsByCategory(ctx, db.ListProductsByCategoryParams{
		StoreID:    storeId,
		CategoryID: pgtype.UUID{Bytes: categoryUUID, Valid: true},
	})
	if err != nil {
		log.Printf("error listing products by category: %v", err)
		utils.ErrorResponse(c, http.StatusInternalServerError, "Error listing products by category", err)
		return
	}

	utils.SuccessResponse(c, "Category products fetched successfully", products)
}
