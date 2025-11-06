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
	// Now you can use functions from the utils package like:
	// utils.SomeFunction()

	router := gin.Default()

	// CORS middleware
	router.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:8080", "http://localhost:3000"},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization"},
		AllowCredentials: true,
	}))

	// User routes
	userRoutes := router.Group("/api/users")
	{
		userRoutes.POST("/register", handlers.RegisterUserHandler)
		userRoutes.POST("/login", handlers.LoginUserHandler)
		
		// Protected routes (require JWT token)
		protected := userRoutes.Group("/")
		protected.Use(utils.JWTMiddleware())
		{
			protected.GET("/profile", handlers.GetUserProfileHandler)
			protected.POST("/refresh-token", handlers.RefreshTokenHandler)
		}
	}

	// Category routes
	

	router.Run(":8000")
}
