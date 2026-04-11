package main

import (
	"context"
	"fmt"
	"log"
	"math/rand"
	db "storemanagement/db/sqlc"
	"storemanagement/utils"
	"time"

	"github.com/jackc/pgx/v5/pgtype"
	"golang.org/x/crypto/bcrypt"
)

func main() {
	// 1. Initialize
	utils.LoadEnv()
	utils.ConnectToDB()

	ctx := context.Background()
	queries := utils.Queries
	conn := utils.DBPool

	fmt.Println("🚀 Starting Premium Showcase Seeder...")

	// 2. Create Showcase User & Store
	demoEmail := "demo@showcase.com"
	demoPassword := "Password123!"

	var ownerID pgtype.UUID
	var storeID pgtype.UUID

	// Check if user exists
	owner, err := queries.GetStoreOwnerByEmail(ctx, demoEmail)
	if err != nil {
		fmt.Println("Creating demo user...")
		hashedPassword, _ := bcrypt.GenerateFromPassword([]byte(demoPassword), 10)
		owner, err = queries.CreateStoreOwner(ctx, db.CreateStoreOwnerParams{
			Name:           "Showcase Demo",
			Email:          demoEmail,
			Password:       string(hashedPassword),
			Phone:          "9876543210",
			ProfilePicture: "https://api.dicebear.com/7.x/avataaars/svg?seed=demo",
		})
		if err != nil {
			log.Fatalf("Failed to create demo owner: %v", err)
		}
		// Force email verification
		_, err = conn.Exec(ctx, "UPDATE store_owner SET emailVerified = true WHERE id = $1", owner.ID)
		if err != nil {
			log.Fatalf("Failed to verify email: %v", err)
		}
	}
	ownerID = owner.ID

	// Check if store exists
	storeInfo, err := queries.GetStoreInfoByOwner(ctx, ownerID)
	if err != nil {
		fmt.Println("Creating demo store...")
		storeInfo, err = queries.CreateStoreInfo(ctx, db.CreateStoreInfoParams{
			OwnerID:      ownerID,
			Name:         "Showcase Department Store",
			Address:      "Kathmandu, Nepal",
			CurrencyCode: "NPR",
		})
		if err != nil {
			log.Fatalf("Failed to create demo store: %v", err)
		}
	}
	storeID = storeInfo.ID

	fmt.Printf("✅ Seeding for: %s (%s)\n", storeInfo.Name, demoEmail)

	// 3. Seed Suppliers
	fmt.Println("📦 Seeding Suppliers...")
	supplierNames := []string{"Alpha Tech", "Global Groceries", "Lifestyle Imports", "Everest Distro", "Organic Farms"}
	var supplierIDs []pgtype.UUID
	for _, name := range supplierNames {
		s, err := queries.CreateSuppliers(ctx, db.CreateSuppliersParams{
			Name:        pgtype.Text{String: name, Valid: true},
			Address:     pgtype.Text{String: "Supplier Road, 123", Valid: true},
			PhoneNumber: pgtype.Text{String: "9800000000", Valid: true},
			Email:       pgtype.Text{String: fmt.Sprintf("contact@%s.com", name), Valid: true},
			StoreID:     storeID,
		})
		if err == nil {
			supplierIDs = append(supplierIDs, s.ID)
		}
	}

	// 4. Seed Categories
	fmt.Println("🏷️ Seeding Categories...")
	categories := []struct {
		name string
		desc string
	}{
		{"Electronics", "Gadgets, Devices, and Core Tech"},
		{"Groceries", "Fresh produce and daily essentials"},
		{"Clothing", "Premium fashion and footwear"},
		{"Home & Kitchen", "Appliances and home decor"},
		{"Health & Beauty", "Cosmetics and personal care"},
	}
	var categoryIDs []pgtype.UUID
	for _, c := range categories {
		cat, err := queries.CreateCategories(ctx, db.CreateCategoriesParams{
			Name:        c.name,
			Description: pgtype.Text{String: c.desc, Valid: true},
			StoreID:     storeID,
		})
		if err == nil {
			categoryIDs = append(categoryIDs, cat.ID)
		}
	}

	// 5. Seed Products
	fmt.Println("🍎 Seeding Products...")
	products := []struct {
		name     string
		catName  string
		price    float64
		cost     float64
		stock    int32
		lowStock int32
		tracked  bool
	}{
		// Electronics
		{"MacBook Pro M3", "Electronics", 250000, 220000, 5, 2, true},
		{"iPhone 15 Pro", "Electronics", 185000, 160000, 10, 3, true},
		{"Sony WH-1000XM5", "Electronics", 45000, 38000, 15, 5, true},
		{"Mechanical Keyboard", "Electronics", 12000, 8000, 25, 5, true},
		{"UltraWide Monitor", "Electronics", 65000, 55000, 8, 2, true},
		// Groceries
		{"Himalayan Coffee", "Groceries", 1200, 800, 50, 10, false},
		{"Organic Honey 500g", "Groceries", 850, 600, 40, 10, false},
		{"Green Tea selection", "Groceries", 450, 300, 100, 20, false},
		{"Olive Oil 1L", "Groceries", 2200, 1800, 30, 5, false},
		{"Basmati Rice 5kg", "Groceries", 1500, 1200, 60, 10, false},
		// Clothing
		{"Denim Jacket", "Clothing", 4500, 3000, 20, 5, false},
		{"Running Shoes Pro", "Clothing", 8500, 6000, 12, 3, true},
		{"Premium T-Shirt", "Clothing", 1500, 800, 100, 15, false},
		{"Leather Wallet", "Clothing", 2500, 1500, 35, 5, false},
		// Home
		{"Air Purifier", "Home & Kitchen", 18000, 14000, 10, 3, true},
		{"Smart Bulb Set", "Home & Kitchen", 3500, 2200, 45, 10, false},
		{"Non-stick Pan", "Home & Kitchen", 2800, 1900, 25, 5, false},
		// Dead Stock (No sales will be generated for these)
		{"Antique Clock", "Home & Kitchen", 15000, 10000, 2, 1, false},
		{"Legacy DVD Player", "Electronics", 5000, 3500, 10, 2, false},
	}

	var productIDs []pgtype.UUID
	var allProducts []db.Product
	for _, p := range products {
		var catID pgtype.UUID
		for i, c := range categories {
			if c.name == p.catName {
				catID = categoryIDs[i]
				break
			}
		}

		priceNum := pgtype.Numeric{}
		priceNum.Scan(fmt.Sprintf("%.2f", p.price))
		marketPriceNum := pgtype.Numeric{}
		marketPriceNum.Scan(fmt.Sprintf("%.2f", p.price*1.15))
		costNum := pgtype.Numeric{}
		costNum.Scan(fmt.Sprintf("%.2f", p.cost))

		prod, err := queries.CreateProduct(ctx, db.CreateProductParams{
			Name:              p.name,
			Barcode:           pgtype.Text{String: fmt.Sprintf("880%d", rand.Intn(1000000)), Valid: true},
			Price:             priceNum,
			CostPrice:         costNum,
			MarketPrice:       marketPriceNum,
			StockQuantity:     p.stock,
			LowStockThreshold: pgtype.Int4{Int32: p.lowStock, Valid: true},
			Status:            db.NullProductStatus{ProductStatus: db.ProductStatusActive, Valid: true},
			CategoryID:        catID,
			SupplierID:        supplierIDs[rand.Intn(len(supplierIDs))],
			StoreID:           storeID,
			ImageUrl:          pgtype.Text{String: fmt.Sprintf("https://api.dicebear.com/7.x/identicon/svg?seed=%s", p.name), Valid: true},
			IsTracked:         pgtype.Bool{Bool: p.tracked, Valid: true},
		})
		if err == nil {
			productIDs = append(productIDs, prod.ID)
			allProducts = append(allProducts, prod)
		}
	}

	// 6. Seed Customers
	fmt.Println("👥 Seeding Customers...")
	customerNames := []string{"Bivek Shrestha", "Anish Magar", "Sita Rai", "Ram Prasad", "Gita Thapa", "Niraj Kumar", "Pooja Sharma"}
	var customerIDs []pgtype.UUID
	for _, name := range customerNames {
		c, err := queries.CreateCustomer(ctx, db.CreateCustomerParams{
			Name:    name,
			Phone:   fmt.Sprintf("9841%d", rand.Intn(1000000)),
			StoreID: storeID,
		})
		if err == nil {
			customerIDs = append(customerIDs, c.ID)
		}
	}

	// 7. Seed Sales (Historical Data)
	fmt.Println("💰 Generating History (300+ Sales over 60 days)...")
	saleTypes := []db.SalesTypes{db.SalesTypesCash, db.SalesTypesCash, db.SalesTypesOnline, db.SalesTypesCredit}
	
	// Pre-filter products that ARE NOT dead stock (exclude last 2)
	activeProducts := allProducts[:len(allProducts)-2]

	for d := 60; d >= 0; d-- {
		// More sales on weekends
		date := time.Now().AddDate(0, 0, -d)
		numSales := 3 + rand.Intn(5)
		if date.Weekday() == time.Saturday || date.Weekday() == time.Sunday {
			numSales += 4
		}

		for i := 0; i < numSales; i++ {
			// Random peak hour logic
			hour := rand.Intn(24)
			// Weighted hours: busy at 12-2 PM and 6-9 PM
			if rand.Float64() < 0.7 {
				peakChoices := []int{11, 12, 13, 17, 18, 19, 20}
				hour = peakChoices[rand.Intn(len(peakChoices))]
			}
			saleTime := time.Date(date.Year(), date.Month(), date.Day(), hour, rand.Intn(60), rand.Intn(60), 0, time.Local)
			
			// Start Transaction for Sale
			err := utils.Store.ExecTx(ctx, func(q *db.Queries) error {
				customerID := pgtype.UUID{Valid: false}
				stype := saleTypes[rand.Intn(len(saleTypes))]
				if stype == db.SalesTypesCredit || rand.Float64() < 0.4 {
					customerID = customerIDs[rand.Intn(len(customerIDs))]
				}

				zeroNum := pgtype.Numeric{}
				zeroNum.Scan("0.00")

				// Create Sale record
				sale, err := q.CreateSale(ctx, db.CreateSaleParams{
					SalesType:       stype,
					TotalAmount:     zeroNum,
					DiscountApplied: zeroNum,
					StoreID:         storeID,
					CustomerID:      customerID,
					SaleDate:        pgtype.Timestamptz{Time: saleTime, Valid: true},
				})
				if err != nil {
					return err
				}

				// Add 1-4 items per sale
				itemsCount := 1 + rand.Intn(3)
				var totalSaleAmount float64
				
				// Keep track of products in this sale to avoid duplicates
				usedProducts := make(map[pgtype.UUID]bool)

				for j := 0; j < itemsCount; j++ {
					p := activeProducts[rand.Intn(len(activeProducts))]
					if usedProducts[p.ID] { continue }
					usedProducts[p.ID] = true

					qty := int32(1 + rand.Intn(2))
					unitPrice, _ := p.Price.Float64Value()
					itemTotal := unitPrice.Float64 * float64(qty)
					totalSaleAmount += itemTotal

					itemTotalNum := pgtype.Numeric{}
					itemTotalNum.Scan(fmt.Sprintf("%.2f", itemTotal))

					_, err = q.CreateSaleItem(ctx, db.CreateSaleItemParams{
						SaleID:     sale.ID,
						ProductID:  p.ID,
						Quantity:   qty,
						UnitPrice:  p.Price,
						TotalPrice: itemTotalNum,
					})
					if err != nil {
						return err
					}
				}

				// Update total sale amount
				totalNum := pgtype.Numeric{}
				totalNum.Scan(fmt.Sprintf("%.2f", totalSaleAmount))
				err = q.UpdateSaleAmount(ctx, db.UpdateSaleAmountParams{
					TotalAmount: totalNum,
					ID:          sale.ID,
				})
				if err != nil {
					return fmt.Errorf("failed to update sale total: %w", err)
				}
				
				// Handle Debt if credit
				if stype == db.SalesTypesCredit && customerID.Valid {
					owed := totalNum
					paid := pgtype.Numeric{}
					paid.Scan("0.00")
					status := db.DebtStatusPending
					
					// Randomly mark some debts as partially paid
					if rand.Float64() < 0.3 {
						pamt := totalSaleAmount * 0.4
						paid.Scan(fmt.Sprintf("%.2f", pamt))
						status = db.DebtStatusPartial
					}

					_, err = q.CreateDebt(ctx, db.CreateDebtParams{
						StoreID:    storeID,
						CustomerID: customerID,
						SaleID:     sale.ID,
						AmountOwed: owed,
						AmountPaid: paid,
						DueDate:    pgtype.Timestamptz{Time: saleTime.AddDate(0, 0, 15), Valid: true},
						Status:     status,
					})
					if err != nil {
						return fmt.Errorf("failed to create debt: %w", err)
					}
				}

				return nil
			})
			if err != nil {
				log.Printf("Failed to create sale on day %d: %v", d, err)
			}
		}
	}

	// 8. Seed Notifications
	fmt.Println("🔔 Seeding Notifications...")
	notifs := []struct {
		mType db.NotificationType
		title string
		msg   string
	}{
		{db.NotificationTypeLowStock, "Low Stock Alert: MacBook Pro", "Only 2 units remaining in stock. Consider reordering soon."},
		{db.NotificationTypeDebtDue, "Debt Overdue: Anish Magar", "A credit sale of रू 12,000 has passed its due date."},
		{db.NotificationTypeSystem, "Inventory Sync Complete", "Market prices for Electronics have been updated to match latest Daraz trends."},
	}
	for _, n := range notifs {
		queries.CreateNotification(ctx, db.CreateNotificationParams{
			StoreID: storeID,
			Type:    n.mType,
			Title:   n.title,
			Message: n.msg,
			Status:  db.NotificationStatusUnread,
		})
	}

	fmt.Println("\n✨ SEEDING COMPLETE! ✨")
	fmt.Println("-------------------------------------------")
	fmt.Printf("Login Email:   %s\n", demoEmail)
	fmt.Printf("Password:      %s\n", demoPassword)
	fmt.Println("-------------------------------------------")
	fmt.Println("Go ahead and WOW them at the showcase! 🚀")
}
