package main

import (
	"context"
	"fmt"
	"log"
	"storemanagement/utils"
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

	fmt.Printf("Cleaning up sales and debts for Store: %s\n", store.Name)

	_, err = utils.DBPool.Exec(ctx, "DELETE FROM sale_items WHERE sale_id IN (SELECT id FROM sales WHERE store_id = $1)", store.ID)
	_, err = utils.DBPool.Exec(ctx, "DELETE FROM debts WHERE store_id = $1", store.ID)
	_, err = utils.DBPool.Exec(ctx, "DELETE FROM sales WHERE store_id = $1", store.ID)
	_, err = utils.DBPool.Exec(ctx, "DELETE FROM products WHERE store_id = $1", store.ID)
	_, err = utils.DBPool.Exec(ctx, "DELETE FROM categories WHERE store_id = $1", store.ID)
	_, err = utils.DBPool.Exec(ctx, "DELETE FROM suppliers WHERE store_id = $1", store.ID)

	fmt.Println("✅ Cleanup complete!")
}
