package handlers

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	db "storemanagement/db/sqlc"
	"storemanagement/utils"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func setupNotificationRouter(storeID pgtype.UUID) *gin.Engine {
	gin.SetMode(gin.TestMode)
	r := gin.Default()
	r.Use(func(c *gin.Context) {
		c.Set("store_id", storeID)
		c.Next()
	})
	r.GET("/notifications", GetNotifications)
	return r
}

func createTestStore(t *testing.T, ctx context.Context) db.StoreInfo {
	// 1. Create a store owner
	ownerEmail := fmt.Sprintf("test_owner_%d@example.com", time.Now().UnixNano())
	owner, err := utils.Queries.CreateStoreOwner(ctx, db.CreateStoreOwnerParams{
		Name:     "Test Owner",
		Email:    ownerEmail,
		Password: "password",
		Phone:    "1234567890",
		Role:     "owner",
	})
	require.NoError(t, err)

	// 2. Create a store
	store, err := utils.Queries.CreateStoreInfo(ctx, db.CreateStoreInfoParams{
		Name:         "Test Store " + uuid.NewString(),
		Address:      "Test Address",
		CurrencyCode: "NPR",
		OwnerID:      owner.ID,
	})
	require.NoError(t, err)

	return store
}

func TestCheckAndNotifyLowStock(t *testing.T) {
	if utils.Queries == nil {
		t.Skip("Skipping: test database not connected")
	}

	ctx := context.Background()
	store := createTestStore(t, ctx)
	storeID := store.ID

	// 1. Create a category
	category, err := utils.Queries.CreateCategories(ctx, db.CreateCategoriesParams{
		Name:    "Test Category " + uuid.NewString(),
		StoreID: storeID,
	})
	require.NoError(t, err)

	// 2. Create a product with stock below threshold
	productName := "Low Stock Product " + uuid.NewString()
	p, err := utils.Queries.CreateProduct(ctx, db.CreateProductParams{
		Name:              productName,
		Price:             utils.Numeric(100),
		CostPrice:         utils.Numeric(50),
		StockQuantity:     5, // Below threshold
		LowStockThreshold: pgtype.Int4{Int32: 10, Valid: true},
		IsTracked:         pgtype.Bool{Bool: true, Valid: true},
		CategoryID:        category.ID,
		StoreID:           storeID,
		Status:            db.NullProductStatus{ProductStatus: db.ProductStatusActive, Valid: true},
	})
	require.NoError(t, err)

	// 3. Manually call CheckAndNotifyLowStock
	utils.Queries.CheckAndNotifyLowStock(ctx, storeID, p)

	// 4. Verify notification exists in DB
	notifications, err := utils.Queries.GetNotifications(ctx, db.GetNotificationsParams{
		StoreID: storeID,
		Limit:   10,
		Offset:  0,
	})
	require.NoError(t, err)

	found := false
	for _, n := range notifications {
		if n.Type == db.NotificationTypeLowStock && n.ReferenceID == p.ID {
			found = true
			assert.Contains(t, n.Message, productName)
			break
		}
	}
	assert.True(t, found, "Low stock notification should have been created")

	// 5. Test API endpoint
	router := setupNotificationRouter(storeID)
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/notifications", nil)
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)

	var resp utils.Response
	err = json.Unmarshal(w.Body.Bytes(), &resp)
	require.NoError(t, err)

	// Data is a list of notifications
	dataJson, _ := json.Marshal(resp.Data)
	var fetchedNotifications []db.Notification
	err = json.Unmarshal(dataJson, &fetchedNotifications)
	require.NoError(t, err)

	foundApi := false
	for _, n := range fetchedNotifications {
		if n.Type == db.NotificationTypeLowStock && n.ReferenceID == p.ID {
			foundApi = true
			break
		}
	}
	assert.True(t, foundApi, "Notification should be returned by API")
}
