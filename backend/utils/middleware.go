package utils

import (
	"log"
	"net/http"

	"strings"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
)

// JWTMiddleware validates JWT tokens from Authorization header
func JWTMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Get Authorization header
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			ErrorResponse(c, http.StatusUnauthorized, "Authorization header required", nil)
			c.Abort()
			return
		}

		// Check if header starts with "Bearer "
		if !strings.HasPrefix(authHeader, "Bearer ") {
			ErrorResponse(c, http.StatusUnauthorized, "Invalid authorization header format", nil)
			c.Abort()
			return
		}

		// Extract token from header
		tokenString := strings.TrimPrefix(authHeader, "Bearer ")
		if tokenString == "" {
			ErrorResponse(c, http.StatusUnauthorized, "Token not found", nil)
			c.Abort()
			return
		}

		// Validate token
		claims, err := ValidateJWT(tokenString)
		if err != nil {
			ErrorResponse(c, http.StatusUnauthorized, "Invalid token", err)
			c.Abort()
			return
		}

		// Parse UUID from string
		googleUUID, err := uuid.Parse(claims.UserID)
		if err != nil {
			ErrorResponse(c, http.StatusUnauthorized, "Invalid user ID in token", err)
			c.Abort()
			return
		}
		userUUID := pgtype.UUID{
			Bytes: googleUUID,
			Valid: true,
		}

		storeUUIDBytes, err := uuid.Parse(claims.StoreId)
		if err != nil {
			log.Println("error parsing storeid:", err)
			ErrorResponse(c, http.StatusUnauthorized, "invalid store id token", err)
			c.Abort()
			return
		}
		storeUUID := pgtype.UUID{
			Bytes: storeUUIDBytes,
			Valid: true,
		}
		// Set user information in context for use in handlers
		c.Set("user_id", userUUID)
		c.Set("user_name", claims.Name)
		c.Set("store_id", storeUUID)
		c.Set("verified_email", claims.VerifiedEmail)

		// Continue to next handler
		c.Next()
	}
}
