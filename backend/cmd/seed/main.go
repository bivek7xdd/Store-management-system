package main

import (
	"context"
	"fmt"
	"log"
	"os"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/google/uuid"
)

func main() {
	connStr := os.Getenv("DB_URL_SUPABASE")
	if connStr == "" {
		log.Fatal("DB_URL_SUPABASE environment variable not set")
	}

	ctx, cancel := context.WithTimeout(context.Background(), 60*time.Second)
	defer cancel()

	conn, err := pgx.Connect(ctx, connStr)
	if err != nil {
		log.Fatalf("Failed to connect: %v", err)
	}
	defer conn.Close(ctx)

	fmt.Println("🌱 Seeding demo data...")

	// Check if demo user already exists
	var existingOwnerID string
	err = conn.QueryRow(ctx, "SELECT id FROM store_owner WHERE email = 'demo@demo.com'").Scan(&existingOwnerID)
	if err == nil {
		fmt.Println("✓ Demo user already exists, skipping...")
		return
	}

	// Demo Store Owner ID
	ownerID := uuid.New()
	storeID := uuid.New()

	// 1. Create Demo User (store_owner table)
	_, err = conn.Exec(ctx, `
		INSERT INTO store_owner (id, name, email, password, phone, role, emailverified)
		VALUES ($1, 'Demo User', 'demo@demo.com', 'demo123', '+9779841234567', 'owner', true)
	`, ownerID)
	if err != nil {
		log.Fatalf("Failed to create user: %v", err)
	}
	fmt.Println("✓ Demo user created (demo@demo.com)")

	// 2. Create Store (store_info table)
	_, err = conn.Exec(ctx, `
		INSERT INTO store_info (id, name, address, owner_id)
		VALUES ($1, 'Demo Store', 'Kathmandu, Nepal', $2)
	`, storeID, ownerID)
	if err != nil {
		log.Fatalf("Failed to create store: %v", err)
	}
	fmt.Println("✓ Demo store created")

	// 3. Create Categories
	categories := []struct {
		name        string
		description string
	}{
		{"Electronics", "Mobile phones, laptops, accessories"},
		{"Groceries", "Food items, beverages, snacks"},
		{"Clothing", "Men's and women's clothing"},
		{"Home & Kitchen", "Kitchen appliances, home decor"},
		{"Health & Beauty", "Personal care, cosmetics"},
	}

	categoryIDs := make(map[string]string)
	for _, cat := range categories {
		catID := uuid.New()
		categoryIDs[cat.name] = catID.String()
		_, err = conn.Exec(ctx, `
			INSERT INTO categories (id, store_id, name, description)
			VALUES ($1, $2, $3, $4)
		`, catID, storeID, cat.name, cat.description)
		if err != nil {
			log.Printf("Warning: category %s: %v", cat.name, err)
		}
	}
	fmt.Println("✓ Categories created")

	// 4. Create Suppliers
	suppliers := []struct {
		name  string
		phone string
		email string
		addr  string
	}{
		{"Tech Wholesale Nepal", "+9779801111111", "tech@wholesale.com", "New Road, Kathmandu"},
		{"Fresh Food Suppliers", "+9779802222222", "fresh@food.com", "Balkhu, Kathmandu"},
		{"Fashion Hub", "+9779803333333", "fashion@hub.com", "New Baneshwor, Kathmandu"},
	}

	supplierIDs := make([]string, len(suppliers))
	for i, sup := range suppliers {
		supID := uuid.New()
		supplierIDs[i] = supID.String()
		_, err = conn.Exec(ctx, `
			INSERT INTO suppliers (id, store_id, name, phone_number, email, address)
			VALUES ($1, $2, $3, $4, $5, $6)
		`, supID, storeID, sup.name, sup.phone, sup.email, sup.addr)
		if err != nil {
			log.Printf("Warning: supplier %s: %v", sup.name, err)
		}
	}
	fmt.Println("✓ Suppliers created")

	// 5. Create Products
	products := []struct {
		name       string
		barcode    string
		price      float64
		costPrice  float64
		stock      int
		category   string
		supplier   int
		warranty   int
	}{
		{"iPhone 15 Pro", "1234567890123", 149999, 120000, 25, "Electronics", 0, 365},
		{"Samsung Galaxy S24", "1234567890124", 99999, 80000, 30, "Electronics", 0, 365},
		{"MacBook Air M3", "1234567890125", 189999, 160000, 15, "Electronics", 0, 730},
		{"Basmati Rice 5kg", "2345678901234", 850, 700, 100, "Groceries", 1, 0},
		{"Cooking Oil 1L", "2345678901235", 250, 200, 150, "Groceries", 1, 0},
		{"Instant Noodles", "2345678901236", 120, 90, 200, "Groceries", 1, 0},
		{"Men's Cotton T-Shirt", "3456789012345", 999, 600, 50, "Clothing", 2, 0},
		{"Women's Jeans", "3456789012346", 1999, 1200, 40, "Clothing", 2, 0},
		{"Mixer Grinder", "4567890123456", 3999, 3000, 20, "Home & Kitchen", 0, 365},
		{"Shampoo 400ml", "5678901234567", 450, 350, 80, "Health & Beauty", 1, 0},
	}

	productIDs := make([]string, len(products))
	for i, prod := range products {
		prodID := uuid.New()
		productIDs[i] = prodID.String()
		catID := categoryIDs[prod.category]
		var supID interface{} = nil
		if prod.supplier >= 0 && prod.supplier < len(supplierIDs) {
			supID = supplierIDs[prod.supplier]
		}

		_, err = conn.Exec(ctx, `
			INSERT INTO products (id, store_id, category_id, supplier_id, name, barcode, price, cost_price, stock_quantity, warranty_days, status)
			VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'active')
		`, prodID, storeID, catID, supID, prod.name, prod.barcode, prod.price, prod.costPrice, prod.stock, prod.warranty)
		if err != nil {
			log.Printf("Warning: product %s: %v", prod.name, err)
		}
	}
	fmt.Println("✓ Products created")

	// 6. Create Customers (customers table - no email column)
	customers := []struct {
		name  string
		phone string
	}{
		{"Ram Sharma", "+9779841111111"},
		{"Sita Patel", "+9779842222222"},
		{"Hari Thapa", "+9779843333333"},
		{"Gita Kami", "+977984444444"},
		{"Krishna Bahadur", "+9779845555555"},
	}

	customerIDs := make([]string, len(customers))
	for i, cust := range customers {
		custID := uuid.New()
		customerIDs[i] = custID.String()
		_, err = conn.Exec(ctx, `
			INSERT INTO customers (id, store_id, name, phone)
			VALUES ($1, $2, $3, $4)
		`, custID, storeID, cust.name, cust.phone)
		if err != nil {
			log.Printf("Warning: customer %s: %v", cust.name, err)
		}
	}
	fmt.Println("✓ Customers created")

	// 7. Create Product Batches
	for i := 0; i < 5; i++ {
		batchID := uuid.New()
		prodIdx := i % len(productIDs)
		mfgDate := time.Now().AddDate(0, -6, 0)
		expiryDate := time.Now().AddDate(0, 6, 0)

		_, err = conn.Exec(ctx, `
			INSERT INTO product_batches (id, product_id, batch_number, manufacturing_date, expiry_date, quantity)
			VALUES ($1, $2, $3, $4, $5, $6)
		`, batchID, productIDs[prodIdx], fmt.Sprintf("BATCH-%03d", i+1), mfgDate, expiryDate, 50)
		if err != nil {
			log.Printf("Warning: batch: %v", err)
		}
	}
	fmt.Println("✓ Product batches created")

	// 8. Create Stock Adjustments
	for i := 0; i < 3; i++ {
		adjID := uuid.New()
		prodIdx := i % len(productIDs)
		_, err = conn.Exec(ctx, `
			INSERT INTO stock_adjustments (id, store_id, product_id, adjustment_quantity, previous_quantity, new_quantity, reason, notes)
			VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
		`, adjID, storeID, productIDs[prodIdx], 10, 50, 60, "physical_count", "Monthly stock count adjustment")
		if err != nil {
			log.Printf("Warning: adjustment: %v", err)
		}
	}
	fmt.Println("✓ Stock adjustments created")

	// 9. Create Stock Movements
	for i := 0; i < 5; i++ {
		movID := uuid.New()
		prodIdx := i % len(productIDs)
		movType := "sale"
		qtyChange := -2
		if i%2 == 0 {
			movType = "purchase"
			qtyChange = 50
		}
		_, err = conn.Exec(ctx, `
			INSERT INTO stock_movements (id, store_id, product_id, movement_type, quantity_change, notes)
			VALUES ($1, $2, $3, $4, $5, $6)
		`, movID, storeID, productIDs[prodIdx], movType, qtyChange, fmt.Sprintf("Sample %s movement", movType))
		if err != nil {
			log.Printf("Warning: movement: %v", err)
		}
	}
	fmt.Println("✓ Stock movements created")

	// 10. Create Debts
	for i := 0; i < 3; i++ {
		debtID := uuid.New()
		custIdx := i % len(customerIDs)
		_, err = conn.Exec(ctx, `
			INSERT INTO debts (id, store_id, customer_id, amount_owed, amount_paid, due_date, status, notes)
			VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
		`, debtID, storeID, customerIDs[custIdx], 5000, 2000, time.Now().AddDate(0, 0, 30), "partial", "Credit sale pending payment")
		if err != nil {
			log.Printf("Warning: debt: %v", err)
		}
	}
	fmt.Println("✓ Debts created")

	// 11. Create Expenses
	expenses := []struct {
		category string
		desc     string
		amount   float64
	}{
		{"Rent", "Monthly shop rent", 25000},
		{"Electricity", "Monthly electricity bill", 3500},
		{"Transport", "Delivery charges", 1500},
	}

	for _, exp := range expenses {
		expID := uuid.New()
		_, err = conn.Exec(ctx, `
			INSERT INTO expenses (id, store_id, category, description, amount, expense_date)
			VALUES ($1, $2, $3, $4, $5, $6)
		`, expID, storeID, exp.category, exp.desc, exp.amount, time.Now().AddDate(0, 0, -7))
		if err != nil {
			log.Printf("Warning: expense: %v", err)
		}
	}
	fmt.Println("✓ Expenses created")

	fmt.Println("\n🎉 Demo data seeded successfully!")
	fmt.Println("\n📧 Demo Account:")
	fmt.Println("   Email: demo@demo.com")
	fmt.Println("   Password: demo123")
	fmt.Println("\n📊 Data created:")
	fmt.Println("   - 5 categories")
	fmt.Println("   - 3 suppliers")
	fmt.Println("   - 10 products")
	fmt.Println("   - 5 customers")
	fmt.Println("   - 5 product batches")
	fmt.Println("   - 3 stock adjustments")
	fmt.Println("   - 5 stock movements")
	fmt.Println("   - 3 debts")
	fmt.Println("   - 3 expenses")
}
