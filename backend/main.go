package main

import (
	"fmt"
	"os"
	"storemanagement/handlers"
	"storemanagement/redis"
	"storemanagement/utils"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func init() {
	utils.LoadEnv()
	utils.ConnectToDB()
	redis.ConnectToRedis()
}

func main() {
	utils.StartCronJobs()
	fmt.Println("Hello World")

	router := gin.Default()
	router.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:8080", "http://localhost:4173", "https://store-management-system-liart.vercel.app", "https://store-management-system-bca8g5aaz.vercel.app"},
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
		protected.Use(utils.JWTMiddleware())
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
	categoryRoutes.Use(utils.JWTMiddleware())
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
	supplierRoutes.Use(utils.JWTMiddleware())
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
	productRoutes.Use(utils.JWTMiddleware())
	{
		productRoutes.POST("/create", handlers.CreateProduct)
		productRoutes.GET("", handlers.GetProducts)
		productRoutes.GET("/search", handlers.SearchProducts)
		productRoutes.GET("/tracked", handlers.GetTrackedProducts)
		productRoutes.GET("/:id", handlers.GetProduct)
		productRoutes.PUT("/:id", handlers.UpdateProduct)
		productRoutes.DELETE("/:id", handlers.DeleteProduct)
	}

	// Sales routes
	salesRoutes := router.Group("/api/sales")
	salesRoutes.Use(utils.JWTMiddleware())
	{
		salesRoutes.POST("/create", handlers.CreateSale)
		salesRoutes.GET("", handlers.ListSales)
		salesRoutes.GET("/:id", handlers.GetSaleDetails)
	}

	// Customer routes
	customerRoutes := router.Group("/api/customers")
	customerRoutes.Use(utils.JWTMiddleware())
	{
		customerRoutes.GET("", handlers.ListCustomers)
		customerRoutes.GET("/search", handlers.SearchCustomers)
		customerRoutes.POST("", handlers.CreateCustomer)
	}

	// Debt routes
	debtRoutes := router.Group("/api/debts")
	debtRoutes.Use(utils.JWTMiddleware())
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
	reportRoutes.Use(utils.JWTMiddleware())
	{
		reportRoutes.GET("/stats", handlers.GetReportStats)
		reportRoutes.GET("/export/csv", handlers.ExportSalesReportCSV)
		reportRoutes.GET("/export/pdf", handlers.ExportSalesReportPDF)
	}

	// Notification routes
	notificationRoutes := router.Group("/api/notifications")
	notificationRoutes.Use(utils.JWTMiddleware())
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
	marketRoutes.Use(utils.JWTMiddleware())
	{
		marketRoutes.GET("/prices", handlers.GetMarketPrices)
		marketRoutes.GET("/suppliers", handlers.FindSuppliers)
	}

	// POS routes
	posRoutes := router.Group("/api/pos")
	posRoutes.Use(utils.JWTMiddleware())
	{
		posRoutes.GET("/catalog", handlers.GetPOSCatalog)
	}
	PORT := os.Getenv("PORT")
	if PORT == "" {
		PORT = "8000"
	}
	router.Run(":" + PORT)
}
