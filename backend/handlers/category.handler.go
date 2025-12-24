package handlers

import (
	"context"
	"log"
	"net/http"
	db "storemanagement/db/sqlc"
	"storemanagement/utils"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgtype"
)

type createCategoryReq struct {
	Name        string `json:"name" binding:"required"`
	Description string `json:"description" binding:"required"`
}

func CreateCategories(c *gin.Context) {
	//validate request body
	var req createCategoryReq
	storeID := c.MustGet("store_id").(pgtype.UUID)
	err := c.ShouldBindJSON(&req)
	if err != nil {
		log.Printf("error binding json: %v", err)
		utils.ErrorResponse(c, http.StatusInternalServerError, "error binding json", err)
	}

	//create context
	ctx, cancel := context.WithTimeout(c.Request.Context(), 2*time.Second)
	defer cancel()

	//add to database
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

	c.JSON(http.StatusCreated, gin.H{"category": category})
}

func GetAllCategories(c *gin.Context) {
	//get store id
	storeId := c.MustGet("store_id").(pgtype.UUID)

	//create context
	ctx, cancel := context.WithTimeout(c.Request.Context(), 2*time.Second)
	defer cancel()

	//get all categories
	categories, err := utils.Queries.GetCategories(ctx, storeId)
	if err != nil {
		log.Println("error geting categories", err)
		utils.ErrorResponse(c, http.StatusInternalServerError, "Error getting categories", err)
	}

	utils.SuccessResponse(c, "Categories fetched successfully", categories)
}
