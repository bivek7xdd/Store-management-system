package utils

import (
	"fmt"
	"log"
	"net/http"
	"storemanagement/redis"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
)

// JWTMiddleware validates JWT tokens from Authorization header
func JWTMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Get Authorization header
		tokenString := ""
		authHeader := c.GetHeader("Authorization")

		if authHeader != "" {
			// Check if header starts with "Bearer "
			if !strings.HasPrefix(authHeader, "Bearer ") {
				ErrorResponse(c, http.StatusUnauthorized, "Invalid authorization header format", nil)
				c.Abort()
				return
			}
			tokenString = strings.TrimPrefix(authHeader, "Bearer ")
		} else {
			// Try to get token from query parameter (for direct downloads)
			tokenString = c.Query("token")
		}

		if tokenString == "" {
			ErrorResponse(c, http.StatusUnauthorized, "Authorization required", nil)
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

// RateLimitMiddleware throttles requests based on client IP and route path.
// If Redis is not available, it gracefully allows the request to proceed.
func RateLimitMiddleware(limit int, window time.Duration) gin.HandlerFunc {
	return func(c *gin.Context) {
		if !redis.IsRedisAvailable() {
			c.Next()
			return
		}

		// Create a unique key per IP and route path
		key := fmt.Sprintf("rate_limit:%s:%s", c.ClientIP(), c.FullPath())

		ctx := c.Request.Context()
		count, err := redis.RedisClient.Incr(ctx, key).Result()
		if err != nil {
			log.Printf("[Redis] Rate limiting error: %v", err)
			c.Next()
			return
		}

		// On the first request in the window, set the expiry
		if count == 1 {
			redis.RedisClient.Expire(ctx, key, window)
		}

		if count > int64(limit) {
			ErrorResponse(c, http.StatusTooManyRequests, "Too many requests. Please try again later.", nil)
			c.Abort()
			return
		}

		c.Next()
	}
}

