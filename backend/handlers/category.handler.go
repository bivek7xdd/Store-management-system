package handlers

import (
	"context"
	"errors"
	"net/http"
	db "storemanagement/db/sqlc"
	"storemanagement/utils"

	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"
	"github.com/jackc/pgx/v5/pgtype"
)

type CreateCategoryRequest struct {
	Name        string `json:"name" binding:"required,min=3,max=50"`
	Description string `json:"description" binding:"required,min=1"`
}

func CreateCategoryHandler(c *gin.Context) {
	var req CreateCategoryRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		//handle validation error
		if errs, ok := err.(validator.ValidationErrors); ok {
			for _, fieldErr := range errs {
				var errMsg string
				switch fieldErr.Field() {
				case "Name":
					errMsg = "Name must be 3-50 characters"
				case "Description":
					errMsg = "Description is required and cannot be empty"
				default:
					errMsg = fieldErr.Error()
				}
				utils.ErrorResponse(c, http.StatusBadRequest, "Validation failed", errors.New(errMsg))
			}
		}
		return
	}

	//generate slug
	slug, err := utils.GenerateUniqueSlug(utils.DBPool, "categories", req.Name)
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to generate slug", err)
		return
	}

	//check if category already exists
	_, err = utils.Queries.GetCategoryBySlug(context.Background(), slug)
	if err == nil {
		utils.ErrorResponse(c, http.StatusConflict, "Category already exists", err)
		return
	}

	// Convert description to pgtype.Text
	var description pgtype.Text
	if err := description.Scan(req.Description); err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to process description", err)
		return
	}

	// Create category
	category, err := utils.Queries.CreateCategory(context.Background(), db.CreateCategoryParams{
		Name:        req.Name,
		Description: description,
		Slug:        slug,
	})
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to create category", err)
		return
	}

	utils.SuccessResponse(c, "Category created successfully", category)

}

//TODO: for update category if name is changed then generate new slug and check if it exists
