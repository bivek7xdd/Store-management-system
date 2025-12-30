package main

import (
	"context"
	"fmt"
	"log"
	"math/rand"
	"storemanagement/utils"
	"time"

	db "storemanagement/db/sqlc"

	"github.com/jackc/pgx/v5/pgtype"
)

func main() {
	// 1. Initialize logic
	utils.LoadEnv()
	utils.ConnectToDB()

	ctx := context.Background()
	queries := utils.Queries
	conn := utils.DBPool

	var storeID pgtype.UUID
	var storeName string

	// Using raw SQL to get simple first store
	err := conn.QueryRow(ctx, "SELECT id, name FROM store_info LIMIT 1").Scan(&storeID, &storeName)
	if err != nil {
		log.Fatalf("Failed to find any store in 'store_info'. Please create a store first via the app or SQL. Error: %v", err)
	}

	fmt.Printf("Seeding data for Store: %s (ID: %x)\n", storeName, storeID.Bytes)

	// 3. Seed Suppliers
	suppliers := []string{"Alpha Supplies", "Beta Distributors", "Gamma Wholesalers", "Delta Imports", "Epsilon Traders"}
	var supplierIDs []pgtype.UUID

	for _, sName := range suppliers {
		// Check if exists or just create. To avoid duplicates if ran multiple times, we might want to check.
		// But for a simple seeder, let's just create.

		params := db.CreateSuppliersParams{
			Name:        pgtype.Text{String: sName, Valid: true},
			Address:     pgtype.Text{String: fmt.Sprintf("%d Market St", rand.Intn(100)+1), Valid: true},
			PhoneNumber: pgtype.Text{String: fmt.Sprintf("555-01%02d", rand.Intn(99)), Valid: true},
			Email:       pgtype.Text{String: fmt.Sprintf("contact@%s.com", sName), Valid: true}, // simplified email
			StoreID:     storeID,
		}

		supplier, err := queries.CreateSuppliers(ctx, params)
		if err != nil {
			log.Printf("Failed to create supplier %s: %v", sName, err)
			continue
		}
		supplierIDs = append(supplierIDs, supplier.ID)
		fmt.Printf("Created Supplier: %s\n", sName)
	}

	// 4. Seed Categories
	categories := []string{"Electronics", "Groceries", "Clothing", "Home & Garden", "Toys"}
	var categoryIDs []pgtype.UUID

	for _, cName := range categories {
		params := db.CreateCategoriesParams{
			Name:        cName,
			Description: pgtype.Text{String: fmt.Sprintf("All kinds of %s", cName), Valid: true},
			StoreID:     storeID,
		}

		category, err := queries.CreateCategories(ctx, params)
		if err != nil {
			log.Printf("Failed to create category %s: %v", cName, err)
			continue
		}
		categoryIDs = append(categoryIDs, category.ID)
		fmt.Printf("Created Category: %s\n", cName)
	}

	if len(categoryIDs) == 0 || len(supplierIDs) == 0 {
		log.Fatal("Need at least one category and one supplier to create products.")
	}

	// 5. Seed Products
	productNames := []string{
		"Super Widget 2000", "Mega Gadget", "Ultra Thingamajig", "Wonder Tool", "Power Device",
		"Eco Friendly Cleaner", "Organic Snack Bar", "Smart Watch Pro", "Wireless Earbuds", "Gaming Laptop",
		"Running Shoes", "Cotton T-Shirt", "Designer Jeans", "Leather Wallet", "Sunglasses",
		"Coffee Maker", "Blender 3000", "Toaster Oven", "Microwave X", "Vacuum Cleaner",
	}

	for _, pName := range productNames {
		catID := categoryIDs[rand.Intn(len(categoryIDs))]
		supID := supplierIDs[rand.Intn(len(supplierIDs))]

		price := float64(rand.Intn(10000)+500) / 100.0 // 5.00 to 105.00

		// Setup numeric for price
		var priceNumeric pgtype.Numeric
		priceNumeric.Scan(fmt.Sprintf("%.2f", price))

		var marketPriceNumeric pgtype.Numeric
		marketPriceNumeric.Scan(fmt.Sprintf("%.2f", price*1.2))

		params := db.CreateProductParams{
			Name:              pName,
			Barcode:           pgtype.Text{String: fmt.Sprintf("%d", rand.Int63n(1000000000000)), Valid: true},
			Price:             priceNumeric,
			MarketPrice:       marketPriceNumeric,
			StockQuantity:     int32(rand.Intn(100) + 1),
			LowStockThreshold: pgtype.Int4{Int32: 10, Valid: true},
			// random expiry in future
			ExpiresAt:  pgtype.Timestamptz{Time: time.Now().AddDate(0, rand.Intn(12)+1, 0), Valid: true, InfinityModifier: pgtype.Finite},
			Status:     db.NullProductStatus{ProductStatus: "active", Valid: true},
			CategoryID: catID,
			SupplierID: supID,
			StoreID:    storeID,
			ImageUrl:   pgtype.Text{String: "https://placehold.co/600x400", Valid: true},
		}

		_, err := queries.CreateProduct(ctx, params)
		if err != nil {
			log.Printf("Failed to create product %s: %v", pName, err)
		} else {
			fmt.Printf("Created Product: %s\n", pName)
		}
	}

	fmt.Println("Seeding completed successfully!")
}
