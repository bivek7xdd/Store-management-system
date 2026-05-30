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
	storeId, ok := utils.GetStoreID(c)
	if !ok {
		utils.ErrorResponse(c, http.StatusUnauthorized, "Store not found", nil)
		return
	}

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
	storeId, ok := utils.GetStoreID(c)
	if !ok {
		utils.ErrorResponse(c, http.StatusUnauthorized, "Store not found", nil)
		return
	}

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

func GetSupplier(c *gin.Context) {
	storeId, ok := utils.GetStoreID(c)
	if !ok {
		utils.ErrorResponse(c, http.StatusUnauthorized, "Store not found", nil)
		return
	}
	idStr := c.Param("id")

	supplierUUID, err := uuid.Parse(idStr)
	if err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Invalid supplier ID", err)
		return
	}

	ctx, cancel := context.WithTimeout(c.Request.Context(), 2*time.Second)
	defer cancel()

	supplier, err := utils.Queries.GetSupplier(ctx, db.GetSupplierParams{
		ID:      pgtype.UUID{Bytes: supplierUUID, Valid: true},
		StoreID: storeId,
	})
	if err != nil {
		log.Println("error getting supplier:", err)
		utils.ErrorResponse(c, http.StatusInternalServerError, "failed to get supplier", err)
		return
	}

	utils.SuccessResponse(c, "Supplier fetched successfully", supplier)
}

type updateSupplierReq struct {
	Name        string `json:"name"`
	Address     string `json:"address"`
	PhoneNumber string `json:"phone_number"`
	Email       string `json:"email"`
}

func UpdateSupplier(c *gin.Context) {
	storeId, ok := utils.GetStoreID(c)
	if !ok {
		utils.ErrorResponse(c, http.StatusUnauthorized, "Store not found", nil)
		return
	}
	idStr := c.Param("id")

	supplierUUID, err := uuid.Parse(idStr)
	if err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Invalid supplier ID", err)
		return
	}

	var req updateSupplierReq
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Invalid request body", err)
		return
	}

	ctx, cancel := context.WithTimeout(c.Request.Context(), 2*time.Second)
	defer cancel()

	// Prepare optional params
	var name, address, phone, email pgtype.Text
	if req.Name != "" {
		name = utils.Text(req.Name)
	}
	if req.Address != "" {
		address = utils.Text(req.Address)
	}
	if req.PhoneNumber != "" {
		phone = utils.Text(req.PhoneNumber)
	}
	if req.Email != "" {
		email = utils.Text(req.Email)
	}

	supplier, err := utils.Queries.UpdateSupplier(ctx, db.UpdateSupplierParams{
		ID:          pgtype.UUID{Bytes: supplierUUID, Valid: true},
		Name:        name,
		Address:     address,
		PhoneNumber: phone,
		Email:       email,
		StoreID:     storeId,
	})

	if err != nil {
		log.Println("error updating supplier:", err)
		utils.ErrorResponse(c, http.StatusInternalServerError, "failed to update supplier", err)
		return
	}

	utils.SuccessResponse(c, "Supplier updated successfully", supplier)
}

func DeleteSupplier(c *gin.Context) {
	storeId, ok := utils.GetStoreID(c)
	if !ok {
		utils.ErrorResponse(c, http.StatusUnauthorized, "Store not found", nil)
		return
	}
	idStr := c.Param("id")

	supplierUUID, err := uuid.Parse(idStr)
	if err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Invalid supplier ID", err)
		return
	}

	ctx, cancel := context.WithTimeout(c.Request.Context(), 2*time.Second)
	defer cancel()

	err = utils.Queries.DeleteSupplier(ctx, db.DeleteSupplierParams{
		ID:      pgtype.UUID{Bytes: supplierUUID, Valid: true},
		StoreID: storeId,
	})

	if err != nil {
		log.Println("error deleting supplier:", err)
		utils.ErrorResponse(c, http.StatusInternalServerError, "failed to delete supplier", err)
		return
	}

	utils.SuccessResponse(c, "Supplier deleted successfully", nil)
}

func GetSupplierStats(c *gin.Context) {
	storeId, ok := utils.GetStoreID(c)
	if !ok {
		utils.ErrorResponse(c, http.StatusUnauthorized, "Store not found", nil)
		return
	}
	idStr := c.Param("id")

	supplierUUID, err := uuid.Parse(idStr)
	if err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Invalid supplier ID", err)
		return
	}

	ctx, cancel := context.WithTimeout(c.Request.Context(), 2*time.Second)
	defer cancel()

	stats, err := utils.Queries.GetSupplierStats(ctx, db.GetSupplierStatsParams{
		SupplierID: pgtype.UUID{Bytes: supplierUUID, Valid: true},
		StoreID:    storeId,
	})
	if err != nil {
		log.Println("error getting supplier stats:", err)
		utils.ErrorResponse(c, http.StatusInternalServerError, "failed to get supplier stats", err)
		return
	}

	utils.SuccessResponse(c, "Supplier stats fetched successfully", stats)
}

func GetSupplierProducts(c *gin.Context) {
	storeId, ok := utils.GetStoreID(c)
	if !ok {
		utils.ErrorResponse(c, http.StatusUnauthorized, "Store not found", nil)
		return
	}
	idStr := c.Param("id")

	supplierUUID, err := uuid.Parse(idStr)
	if err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Invalid supplier ID", err)
		return
	}

	ctx, cancel := context.WithTimeout(c.Request.Context(), 2*time.Second)
	defer cancel()

	products, err := utils.Queries.ListProductsBySupplier(ctx, db.ListProductsBySupplierParams{
		SupplierID: pgtype.UUID{Bytes: supplierUUID, Valid: true},
		StoreID:    storeId,
	})
	if err != nil {
		log.Println("error getting supplier products:", err)
		utils.ErrorResponse(c, http.StatusInternalServerError, "failed to get supplier products", err)
		return
	}

	utils.SuccessResponse(c, "Supplier products fetched successfully", products)
}
