package main

import (
	"context"
	"fmt"
	"log"
	"storemanagement/utils"
	"github.com/jackc/pgx/v5/pgtype"
)

func main() {
	utils.LoadEnv()
	utils.ConnectToDB()

	ctx := context.Background()
	demoEmail := "demo@showcase.com"

	owner, err := utils.Queries.GetStoreOwnerByEmail(ctx, demoEmail)
	if err != nil {
		log.Fatalf("No demo owner found: %v", err)
	}

	store, err := utils.Queries.GetStoreInfoByOwner(ctx, owner.ID)
	if err != nil {
		log.Fatalf("No demo store found: %v", err)
	}

	fmt.Printf("Verifying database for Store: %s (ID: %s)\n", store.Name, store.ID)

	// Count Products
	var prodCount int64
	utils.DBPool.QueryRow(ctx, "SELECT COUNT(*) FROM products WHERE store_id = $1", store.ID).Scan(&prodCount)
	fmt.Printf("Products: %d\n", prodCount)

	// Count Sales
	var saleCount int64
	utils.DBPool.QueryRow(ctx, "SELECT COUNT(*) FROM sales WHERE store_id = $1", store.ID).Scan(&saleCount)
	fmt.Printf("Sales: %d\n", saleCount)

	// Count Customers
	var custCount int64
	utils.DBPool.QueryRow(ctx, "SELECT COUNT(*) FROM customers WHERE store_id = $1", store.ID).Scan(&custCount)
	fmt.Printf("Customers: %d\n", custCount)

	// Sample Sale Date
	var lastSaleDate pgtype.Timestamptz
	utils.DBPool.QueryRow(ctx, "SELECT MAX(sale_date) FROM sales WHERE store_id = $1", store.ID).Scan(&lastSaleDate)
	fmt.Printf("Last Sale Date: %v\n", lastSaleDate.Time)
}
