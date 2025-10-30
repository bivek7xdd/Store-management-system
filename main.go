package main

import (
	"fmt"
	"storemanagement/handlers"
	"storemanagement/utils"

	"github.com/gin-gonic/gin"
)

func init() {
	utils.LoadEnv()
	utils.ConnectToDB()
}

func main() {
	fmt.Println("Hello World")
	// Now you can use functions from the utils package like:
	// utils.SomeFunction()

	router := gin.Default()

	// User routes
	userRoutes := router.Group("/api/users")
	{
		userRoutes.POST("/register", handlers.RegisterUserHandler)
		userRoutes.POST("/login", handlers.LoginUserHandler)
	}

	// Category routes
	categoryRoutes := router.Group("/api/categories")
	{
		categoryRoutes.POST("", handlers.CreateCategoryHandler)
		// categoryRoutes.GET("", handlers.ListCategoriesHandler)
		// categoryRoutes.GET("/:id", handlers.GetCategoryHandler)
		// categoryRoutes.PUT("/:id", handlers.UpdateCategoryHandler)
		// categoryRoutes.DELETE("/:id", handlers.DeleteCategoryHandler)
	}

	// Product routes
	productRoutes := router.Group("/api/products")
	{
		productRoutes.POST("", handlers.CreateProductHandler)
		productRoutes.GET("", handlers.ListProductsHandler)
		productRoutes.GET("/search", handlers.SearchProductsHandler)
		productRoutes.GET("/low-stock", handlers.GetLowStockProductsHandler)
		productRoutes.GET("/:id", handlers.GetProductHandler)
		productRoutes.PUT("/:id", handlers.UpdateProductHandler)
		productRoutes.DELETE("/:id", handlers.DeleteProductHandler)
	}

	// Supplier routes
	supplierRoutes := router.Group("/api/suppliers")
	{
		supplierRoutes.POST("", handlers.CreateSupplierHandler)
		supplierRoutes.GET("", handlers.ListSuppliersHandler)
		supplierRoutes.GET("/search", handlers.SearchSuppliersHandler)
		supplierRoutes.GET("/:id", handlers.GetSupplierHandler)
		supplierRoutes.GET("/:id/products", handlers.GetSupplierProductsHandler)
		supplierRoutes.PUT("/:id", handlers.UpdateSupplierHandler)
		supplierRoutes.DELETE("/:id", handlers.DeleteSupplierHandler)
	}

	// Store routes
	storeRoutes := router.Group("/api/stores")
	{
		storeRoutes.POST("", handlers.CreateStoreHandler)
		storeRoutes.GET("/my-stores", handlers.GetUserStoresHandler)
		storeRoutes.GET("/:id", handlers.GetStoreHandler)
		storeRoutes.PUT("/:id", handlers.UpdateStoreHandler)
		storeRoutes.DELETE("/:id", handlers.DeleteStoreHandler)
	}

	// Customer routes
	customerRoutes := router.Group("/api/customers")
	{
		customerRoutes.POST("", handlers.CreateCustomerHandler)
		customerRoutes.GET("", handlers.ListCustomersHandler)
		customerRoutes.GET("/search", handlers.SearchCustomersHandler)
		customerRoutes.GET("/with-debt", handlers.GetCustomersWithDebtHandler)
		customerRoutes.GET("/:id", handlers.GetCustomerHandler)
		customerRoutes.PUT("/:id", handlers.UpdateCustomerHandler)
		customerRoutes.DELETE("/:id", handlers.DeleteCustomerHandler)
	}

	// Sales routes
	salesRoutes := router.Group("/api/sales")
	{
		salesRoutes.POST("", handlers.CreateSaleHandler)
		salesRoutes.GET("", handlers.ListSalesHandler)
		salesRoutes.GET("/by-date", handlers.GetSalesByDateRangeHandler)
		salesRoutes.GET("/totals", handlers.GetSalesTotalHandler)
		salesRoutes.GET("/:id", handlers.GetSaleHandler)
	}

	// Debt routes
	debtRoutes := router.Group("/api/debts")
	{
		debtRoutes.POST("", handlers.CreateDebtHandler)
		debtRoutes.GET("", handlers.ListDebtsHandler)
		debtRoutes.GET("/overdue", handlers.ListOverdueDebtsHandler)
		debtRoutes.GET("/summary", handlers.GetDebtSummaryHandler)
		debtRoutes.GET("/:id", handlers.GetDebtHandler)
		debtRoutes.POST("/:id/payments", handlers.CreateDebtPaymentHandler)
	}

	// Stock Changes routes
	stockChangeRoutes := router.Group("/api/stock-changes")
	{
		stockChangeRoutes.POST("", handlers.CreateStockChangeHandler)
		stockChangeRoutes.GET("", handlers.ListStockChangesHandler)
		stockChangeRoutes.GET("/by-date", handlers.ListStockChangesByDateRangeHandler)
		stockChangeRoutes.GET("/by-type/:type", handlers.ListStockChangesByTypeHandler)
		stockChangeRoutes.GET("/product/:product_id", handlers.ListStockChangesByProductHandler)
		stockChangeRoutes.GET("/:id", handlers.GetStockChangeHandler)
	}

	// Product Expiration routes
	expirationRoutes := router.Group("/api/expirations")
	{
		expirationRoutes.POST("", handlers.CreateProductExpirationHandler)
		expirationRoutes.GET("", handlers.ListProductExpirationsHandler)
		expirationRoutes.GET("/expiring-soon", handlers.ListExpiringSoonHandler)
		expirationRoutes.GET("/expired", handlers.ListExpiredProductsHandler)
		expirationRoutes.GET("/product/:product_id", handlers.ListExpirationsByProductHandler)
		expirationRoutes.GET("/:id", handlers.GetProductExpirationHandler)
		expirationRoutes.PUT("/:id", handlers.UpdateProductExpirationHandler)
		expirationRoutes.DELETE("/:id", handlers.DeleteProductExpirationHandler)
	}

	router.Run(":8080")
}
