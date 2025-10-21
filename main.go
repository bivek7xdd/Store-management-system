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

	userRoutes := router.Group("/api/users")
	{
		userRoutes.POST("/register", handlers.RegisterUserHandler)
		userRoutes.POST("/login", handlers.LoginUserHandler)
	}
	categoryRoutes := router.Group("/api/categories")
	{
		categoryRoutes.POST("/create", handlers.CreateCategoryHandler)
		// categoryRoutes.GET("/all", handlers.GetCategoriesHandler)
		// categoryRoutes.GET("/:id", handlers.GetCategoryByIdHandler)
		// categoryRoutes.GET("/:slug", handlers.GetCategoryBySlugHandler)
	}

	router.Run(":8080")
}
