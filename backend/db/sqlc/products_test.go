package db_test

import (
	"context"
	"testing"
	"time"

	db "storemanagement/db/sqlc"
	"storemanagement/utils"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/stretchr/testify/assert"
)

func TestFlagExpiringProducts(t *testing.T) {
	if utils.Queries == nil {
		t.Skip("Skipping: test database not connected")
	}

	ctx := context.Background()

	// 1. Create a dummy store and category if needed (using helpers if they exists, or assuming they do)
	storeID, _ := uuid.Parse("00000000-0000-0000-0000-000000000001")
	categoryID, _ := uuid.Parse("00000000-0000-0000-0000-000000000001")

	// Create a product that will expire in 5 days
	expiryDate := time.Now().Add(5 * 24 * time.Hour)
	p, err := utils.Queries.CreateProduct(ctx, db.CreateProductParams{
		Name:          "Expiring Soon Item",
		Price:         utils.Numeric(100),
		CostPrice:     utils.Numeric(80),
		StockQuantity: 10,
		ExpiresAt:     pgtype.Timestamptz{Time: expiryDate, Valid: true},
		Status:        db.NullProductStatus{ProductStatus: db.ProductStatusActive, Valid: true},
		CategoryID:    pgtype.UUID{Bytes: categoryID, Valid: true},
		StoreID:       pgtype.UUID{Bytes: storeID, Valid: true},
	})
	assert.NoError(t, err)

	// Create a product that will expire in 10 days (should NOT be flagged)
	futureExpiry := time.Now().Add(10 * 24 * time.Hour)
	p2, err := utils.Queries.CreateProduct(ctx, db.CreateProductParams{
		Name:          "Safe Item",
		Price:         utils.Numeric(100),
		CostPrice:     utils.Numeric(80),
		StockQuantity: 10,
		ExpiresAt:     pgtype.Timestamptz{Time: futureExpiry, Valid: true},
		Status:        db.NullProductStatus{ProductStatus: db.ProductStatusActive, Valid: true},
		CategoryID:    pgtype.UUID{Bytes: categoryID, Valid: true},
		StoreID:       pgtype.UUID{Bytes: storeID, Valid: true},
	})
	assert.NoError(t, err)

	// 2. Run the flagging query
	err = utils.Queries.FlagExpiringProducts(ctx)
	assert.NoError(t, err)

	// 3. Verify results
	updatedProduct, err := utils.Queries.GetProduct(ctx, p.ID)
	assert.NoError(t, err)
	assert.Equal(t, db.ProductStatus("expiring"), updatedProduct.Status.ProductStatus)

	safeProduct, err := utils.Queries.GetProduct(ctx, p2.ID)
	assert.NoError(t, err)
	assert.Equal(t, db.ProductStatusActive, safeProduct.Status.ProductStatus)
}
