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

type createSuppliersReq struct {
	Name        string `json:"name" binding:"required"`
	Address     string `json:"address" binding:"required"`
	PhoneNumber string `json:"phone_number" binding:"required"`
	Email       string `json:"email" binding:"required"`
}

func CreateSuppliers(c *gin.Context) {
	//bind the request body
	var req createSuppliersReq
	err := c.ShouldBindJSON(&req)
	if err != nil {
		log.Println("error binding json:", err)
		utils.ErrorResponse(c, http.StatusInternalServerError, "error binding json", err)
		return
	}

	//get store id
	storeId := c.MustGet("store_id").(pgtype.UUID)

	//create context
	ctx, cancel := context.WithTimeout(c.Request.Context(), 2*time.Second)
	defer cancel()

	//store the data
	supplier, err := utils.Queries.CreateSuppliers(ctx, db.CreateSuppliersParams{
		Name:        utils.Text(req.Name),
		Address:     utils.Text(req.Address),
		PhoneNumber: utils.Text(req.PhoneNumber),
		Email:       utils.Text(req.Email),
		StoreID:     storeId,
	})

	if err != nil {
		log.Println("error creating supplier:", err)
		utils.ErrorResponse(c, http.StatusInternalServerError, "failed to create supplier", err)
		return
	}

	utils.SuccessResponse(c, "Supplier created successfully", supplier)
}

func GetAllSuppliers(c *gin.Context) {
	//get store id
	storeId := c.MustGet("store_id").(pgtype.UUID)

	//create context
	ctx, cancel := context.WithTimeout(c.Request.Context(), 2*time.Second)
	defer cancel()

	//get all suppliers
	suppliers, err := utils.Queries.GetAllSuppliers(ctx, storeId)
	if err != nil {
		log.Println("error getting suppliers:", err)
		utils.ErrorResponse(c, http.StatusInternalServerError, "failed to get suppliers", err)
		return
	}

	utils.SuccessResponse(c, "Suppliers fetched successfully", suppliers)
}
