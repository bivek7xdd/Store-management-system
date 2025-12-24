package handlers

import (
	"context"
	"net/http"
	"storemanagement/utils"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgtype"
)

func ListCustomers(c *gin.Context) {
	storeID := c.MustGet("store_id").(pgtype.UUID)

	ctx, cancel := context.WithTimeout(c.Request.Context(), 5*time.Second)
	defer cancel()

	customers, err := utils.Queries.ListCustomers(ctx, storeID)
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to fetch customers", err)
		return
	}

	utils.SuccessResponse(c, "Customers fetched successfully", customers)
}
