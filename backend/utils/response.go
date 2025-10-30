package utils

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// Response is the standard response structure for all API responses
type Response struct {
	Success bool        `json:"success"`
	Message string      `json:"message,omitempty"`
	Data    interface{} `json:"data,omitempty"`
	Error   string      `json:"error,omitempty"`
}

// Success sends a successful JSON response with status code 200
func SuccessResponse(c *gin.Context, message string, data interface{}) {
	c.JSON(http.StatusOK, Response{
		Success: true,
		Message: message,
		Data:    data,
	})
}

// Error sends an error JSON response with the specified status code
// Common status codes:
// - 400 Bad Request
// - 401 Unauthorized
// - 403 Forbidden
// - 404 Not Found
// - 500 Internal Server Error
func ErrorResponse(c *gin.Context, statusCode int, message string, err error) {
	errMsg := ""
	if err != nil {
		errMsg = err.Error()
	}

	c.JSON(statusCode, Response{
		Success: false,
		Message: message,
		Error:   errMsg,
	})
}
