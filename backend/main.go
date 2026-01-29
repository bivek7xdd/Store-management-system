package main

import (
	"fmt"
	"storemanagement/handlers"
	"storemanagement/utils"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func init() {
	utils.LoadEnv()
	utils.ConnectToDB()
}

func main() {
	fmt.Println("Hello World")

	router := gin.Default()
	router.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:8080", "http://localhost:4173"},
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
		userRoutes.POST("/login", handlers.LoginHandler)
		userRoutes.POST("/verify-otp", handlers.VerifyOTP)

		// Protected routes (require JWT token)
		protected := userRoutes.Group("/")
		protected.Use(utils.JWTMiddleware())
		{
			protected.POST("/refresh-token", handlers.RefreshTokenHandler)
			protected.POST("/store-info", handlers.CreateStoreInfoHandler)

		}

	}
	// Category routes
	categoryRoutes := router.Group("/api/categories")
	categoryRoutes.Use(utils.JWTMiddleware())
	{
		categoryRoutes.POST("/create", handlers.CreateCategories)
		categoryRoutes.GET("", handlers.GetAllCategories)
	}

	// Supplier routes
	supplierRoutes := router.Group("/api/suppliers")
	supplierRoutes.Use(utils.JWTMiddleware())
	{
		supplierRoutes.POST("/create", handlers.CreateSuppliers)
		supplierRoutes.GET("", handlers.GetAllSuppliers)
	}

	// Product routes
	productRoutes := router.Group("/api/products")
	productRoutes.Use(utils.JWTMiddleware())
	{
		productRoutes.POST("/create", handlers.CreateProduct)
		productRoutes.GET("", handlers.GetProducts)
		productRoutes.GET("/search", handlers.SearchProducts)
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
	}

	// Debt routes
	debtRoutes := router.Group("/api/debts")
	debtRoutes.Use(utils.JWTMiddleware())
	{
		debtRoutes.GET("", handlers.GetDebts)
		debtRoutes.POST("/:id/remind", handlers.SendDebtReminder)
		debtRoutes.PUT("/:id", handlers.UpdateDebt)
		debtRoutes.DELETE("/:id", handlers.DeleteDebt)
	}

	// Report routes
	reportRoutes := router.Group("/api/reports")
	reportRoutes.Use(utils.JWTMiddleware())
	{
		reportRoutes.GET("/stats", handlers.GetReportStats)
	}

	router.Run(":8000")
}
