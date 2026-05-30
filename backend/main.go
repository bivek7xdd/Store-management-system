package main

import (
	"context"
	"fmt"
	"net/http"
	"os"
	"os/signal"
	"storemanagement/handlers"
	"storemanagement/redis"
	"storemanagement/utils"
	"strings"
	"syscall"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func init() {
	utils.LoadEnv()
	utils.ConnectToDB()
	redis.ConnectToRedis()
}

func securityHeadersMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Header("X-Content-Type-Options", "nosniff")
		c.Header("X-Frame-Options", "DENY")
		c.Header("X-XSS-Protection", "1; mode=block")
		c.Header("Referrer-Policy", "strict-origin-when-cross-origin")
		c.Header("Permissions-Policy", "geolocation=(), microphone=(), camera=()")
		c.Header("Cross-Origin-Opener-Policy", "same-origin")
		c.Header("Cross-Origin-Resource-Policy", "same-origin")
		if os.Getenv("ENV") == "production" {
			c.Header("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload")
			c.Header("Content-Security-Policy", "default-src 'self'")
		}
		c.Next()
	}
}

func main() {
	utils.StartCronJobs()

	router := gin.Default()

	// Security headers
	router.Use(securityHeadersMiddleware())

	// Request body size limit (10MB)
	router.Use(func(c *gin.Context) {
		c.Request.Body = http.MaxBytesReader(c.Writer, c.Request.Body, 10<<20)
		c.Next()
	})

	// CORS with dynamic origins
	allowedOrigins := os.Getenv("CORS_ORIGINS")
	originsList := []string{"http://localhost:8080", "http://localhost:4173"}
	if allowedOrigins != "" {
		parts := strings.Split(allowedOrigins, ",")
		for i, p := range parts {
			parts[i] = strings.TrimSpace(p)
		}
		originsList = append(originsList, parts...)
	}
	router.Use(cors.New(cors.Config{
		AllowOrigins:     originsList,
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization", "X-Requested-With"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * 60 * 60,
	}))
	// User routes
	userRoutes := router.Group("/api/users")
	{
		userRoutes.POST("/register", handlers.RegisterUserHandler)
		userRoutes.POST("/login", utils.RateLimitMiddleware(5, time.Minute), handlers.LoginHandler)
		userRoutes.POST("/verify-otp", utils.RateLimitMiddleware(10, 15*time.Minute), handlers.VerifyOTP)
		userRoutes.POST("/forgot-password", utils.RateLimitMiddleware(3, 15*time.Minute), handlers.ForgotPasswordHandler)
		userRoutes.POST("/reset-password", handlers.ResetPasswordHandler)

		// Protected routes (require JWT token)
		protected := userRoutes.Group("/")
		protected.Use(utils.JWTMiddleware(), utils.RateLimitMiddleware(120, time.Minute))
		{
			protected.POST("/refresh-token", handlers.RefreshTokenHandler)
			protected.POST("/store-info", handlers.CreateStoreInfoHandler)
			protected.GET("/store", handlers.GetStoreInfoHandler)
			protected.PUT("/profile", handlers.UpdateUserHandler)
			protected.PUT("/password", handlers.UpdatePasswordHandler)
			protected.PUT("/store", handlers.UpdateStoreHandler)
		}

	}
	// Category routes
	categoryRoutes := router.Group("/api/categories")
	categoryRoutes.Use(utils.JWTMiddleware(), utils.RateLimitMiddleware(120, time.Minute))
	{
		categoryRoutes.POST("/create", handlers.CreateCategories)
		categoryRoutes.GET("", handlers.GetAllCategories)
		categoryRoutes.GET("/:id", handlers.GetCategory)                  // Get single category
		categoryRoutes.GET("/:id/stats", handlers.GetCategoryStats)       // Get category stats
		categoryRoutes.GET("/:id/products", handlers.GetCategoryProducts) // Get products in category
		categoryRoutes.PUT("/:id", handlers.UpdateCategory)               // Update category
		categoryRoutes.DELETE("", handlers.DeleteCategory)
	}

	// Supplier routes
	supplierRoutes := router.Group("/api/suppliers")
	supplierRoutes.Use(utils.JWTMiddleware(), utils.RateLimitMiddleware(120, time.Minute))
	{
		supplierRoutes.POST("/create", handlers.CreateSuppliers)
		supplierRoutes.GET("", handlers.GetAllSuppliers)
		supplierRoutes.GET("/:id", handlers.GetSupplier)
		supplierRoutes.GET("/:id/stats", handlers.GetSupplierStats)
		supplierRoutes.GET("/:id/products", handlers.GetSupplierProducts)
		supplierRoutes.PUT("/:id", handlers.UpdateSupplier)
		supplierRoutes.DELETE("/:id", handlers.DeleteSupplier)
	}

	// Product routes
	productRoutes := router.Group("/api/products")
	productRoutes.Use(utils.JWTMiddleware(), utils.RateLimitMiddleware(120, time.Minute))
	{
		productRoutes.POST("/create", handlers.CreateProduct)
		productRoutes.GET("", handlers.GetProducts)
		productRoutes.GET("/search", handlers.SearchProducts)
		productRoutes.GET("/tracked", handlers.GetTrackedProducts)
		productRoutes.GET("/:id", handlers.GetProduct)
		productRoutes.PUT("/:id", handlers.UpdateProduct)
		productRoutes.DELETE("/:id", handlers.DeleteProduct)
	}

	// Stock adjustment routes
	stockAdjustmentRoutes := router.Group("/api/stock-adjustments")
	stockAdjustmentRoutes.Use(utils.JWTMiddleware(), utils.RateLimitMiddleware(120, time.Minute))
	{
		stockAdjustmentRoutes.POST("", handlers.CreateStockAdjustment)
		stockAdjustmentRoutes.GET("", handlers.ListStockAdjustments)
		stockAdjustmentRoutes.GET("/product/:id", handlers.GetStockAdjustmentsByProduct)
	}

	// Stock movement routes
	stockMovementRoutes := router.Group("/api/stock-movements")
	stockMovementRoutes.Use(utils.JWTMiddleware(), utils.RateLimitMiddleware(120, time.Minute))
	{
		stockMovementRoutes.GET("", handlers.ListStockMovements)
		stockMovementRoutes.GET("/product/:id/summary", handlers.GetStockMovementSummary)
		stockMovementRoutes.GET("/product/:id", handlers.GetStockMovementsByProduct)
	}

	// Sales routes
	salesRoutes := router.Group("/api/sales")
	salesRoutes.Use(utils.JWTMiddleware(), utils.RateLimitMiddleware(120, time.Minute))
	{
		salesRoutes.POST("/create", handlers.CreateSale)
		salesRoutes.GET("", handlers.ListSales)
		salesRoutes.GET("/:id", handlers.GetSaleDetails)
	}

	// Customer routes
	customerRoutes := router.Group("/api/customers")
	customerRoutes.Use(utils.JWTMiddleware(), utils.RateLimitMiddleware(120, time.Minute))
	{
		customerRoutes.GET("", handlers.ListCustomers)
		customerRoutes.GET("/search", handlers.SearchCustomers)
		customerRoutes.POST("", handlers.CreateCustomer)
		customerRoutes.PUT("/:id", handlers.UpdateCustomer)
	}

	// Debt routes
	debtRoutes := router.Group("/api/debts")
	debtRoutes.Use(utils.JWTMiddleware(), utils.RateLimitMiddleware(120, time.Minute))
	{
		debtRoutes.POST("/create", handlers.CreateDebt)
		debtRoutes.GET("", handlers.GetDebts)
		debtRoutes.POST("/:id/remind", handlers.SendDebtReminder)
		debtRoutes.PUT("/:id", handlers.UpdateDebt)
		debtRoutes.POST("/:id/pay", handlers.RecordDebtPayment)
		debtRoutes.DELETE("/:id", handlers.DeleteDebt)
	}

	// Report routes
	reportRoutes := router.Group("/api/reports")
	reportRoutes.Use(utils.JWTMiddleware(), utils.RateLimitMiddleware(120, time.Minute))
	{
		reportRoutes.GET("/stats", handlers.GetReportStats)
		reportRoutes.POST("/export/csv", handlers.ExportSalesReportCSV)
		reportRoutes.POST("/export/pdf", handlers.ExportSalesReportPDF)
		reportRoutes.GET("/cashflow", handlers.GetCashFlow)
		reportRoutes.GET("/balance-sheet/assets", handlers.GetBalanceSheetAssets)
		reportRoutes.GET("/balance-sheet/liabilities", handlers.GetBalanceSheetLiabilities)
		reportRoutes.GET("/net-profit", handlers.GetNetProfit)
	}

	// Notification routes
	notificationRoutes := router.Group("/api/notifications")
	notificationRoutes.Use(utils.JWTMiddleware(), utils.RateLimitMiddleware(120, time.Minute))
	{
		notificationRoutes.GET("", handlers.GetNotifications)
		notificationRoutes.GET("/unread-count", handlers.GetUnreadCount)
		notificationRoutes.PUT("/:id/read", handlers.MarkNotificationAsRead)
		notificationRoutes.PUT("/mark-all-read", handlers.MarkAllNotificationsAsRead)
		notificationRoutes.PUT("/:id/dismiss", handlers.DismissNotification)
		notificationRoutes.DELETE("/:id", handlers.DeleteNotification)
	}

	// Market routes
	marketRoutes := router.Group("/api/market")
	marketRoutes.Use(utils.JWTMiddleware(), utils.RateLimitMiddleware(120, time.Minute))
	{
		marketRoutes.GET("/prices", handlers.GetMarketPrices)
		marketRoutes.GET("/suppliers", handlers.FindSuppliers)
	}

	// POS routes
	posRoutes := router.Group("/api/pos")
	posRoutes.Use(utils.JWTMiddleware(), utils.RateLimitMiddleware(120, time.Minute))
	{
		posRoutes.GET("/catalog", handlers.GetPOSCatalog)
	}

	// Returns routes
	returnsRoutes := router.Group("/api/returns")
	returnsRoutes.Use(utils.JWTMiddleware(), utils.RateLimitMiddleware(120, time.Minute))
	{
		returnsRoutes.POST("", handlers.CreateReturn)
		returnsRoutes.POST("/sync", handlers.SyncReturns)
		returnsRoutes.GET("", handlers.ListReturns)
		returnsRoutes.GET("/:id", handlers.GetReturnDetails)
	}

	// Expense routes
	expenseRoutes := router.Group("/api/expenses")
	expenseRoutes.Use(utils.JWTMiddleware(), utils.RateLimitMiddleware(120, time.Minute))
	{
		expenseRoutes.POST("", handlers.CreateExpense)
		expenseRoutes.GET("", handlers.ListExpenses)
		expenseRoutes.GET("/summary", handlers.GetExpenseSummary)
		expenseRoutes.GET("/:id", handlers.GetExpense)
		expenseRoutes.PUT("/:id", handlers.UpdateExpense)
		expenseRoutes.DELETE("/:id", handlers.DeleteExpense)
	}

	// Supplier payables routes
	payableRoutes := router.Group("/api/supplier-payables")
	payableRoutes.Use(utils.JWTMiddleware(), utils.RateLimitMiddleware(120, time.Minute))
	{
		payableRoutes.POST("", handlers.CreateSupplierPayable)
		payableRoutes.GET("", handlers.ListSupplierPayables)
		payableRoutes.GET("/summary", handlers.GetSupplierPayableSummary)
		payableRoutes.GET("/:id", handlers.GetSupplierPayable)
		payableRoutes.PUT("/:id", handlers.UpdateSupplierPayable)
		payableRoutes.DELETE("/:id", handlers.DeleteSupplierPayable)
		payableRoutes.POST("/:id/payment", handlers.RecordSupplierPayment)
	}
	
	// Purchase order routes
	poRoutes := router.Group("/api/purchase-orders")
	poRoutes.Use(utils.JWTMiddleware(), utils.RateLimitMiddleware(120, time.Minute))
	{
		poRoutes.POST("", handlers.CreatePurchaseOrder)
		poRoutes.GET("", handlers.ListPurchaseOrders)
		poRoutes.GET("/:id", handlers.GetPurchaseOrder)
		poRoutes.PUT("/:id", handlers.UpdatePurchaseOrder)
		poRoutes.PUT("/:id/status", handlers.UpdatePurchaseOrderStatus)
		poRoutes.POST("/:id/receive", handlers.ReceivePurchaseOrder)
		poRoutes.DELETE("/:id", handlers.DeletePurchaseOrder)
	}

	// Supplier purchase orders route
	router.GET("/api/suppliers/:id/purchase-orders", utils.JWTMiddleware(), utils.RateLimitMiddleware(120, time.Minute), handlers.GetSupplierPurchaseOrders)

	PORT := os.Getenv("PORT")
	if PORT == "" {
		PORT = "8000"
	}

	srv := &http.Server{
		Addr:         ":" + PORT,
		Handler:      router,
		ReadTimeout:  10 * time.Second,
		WriteTimeout: 30 * time.Second,
		IdleTimeout:  120 * time.Second,
	}

	go func() {
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			fmt.Printf("Server error: %v\n", err)
			os.Exit(1)
		}
	}()

	fmt.Printf("Server started on port %s\n", PORT)

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	fmt.Println("\nShutting down server...")

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := srv.Shutdown(ctx); err != nil {
		fmt.Printf("Server forced to shutdown: %v\n", err)
	}

	utils.StopCronJobs()
	redis.Disconnect()
	utils.CloseDB()

	fmt.Println("Server exited gracefully")
}
