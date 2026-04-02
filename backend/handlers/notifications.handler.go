package handlers

import (
	"fmt"
	"net/http"
	db "storemanagement/db/sqlc"
	"storemanagement/redis"
	"storemanagement/utils"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgtype"
)

// GetNotifications returns paginated notifications for the store
func GetNotifications(c *gin.Context) {
	storeID, exists := c.Get("store_id")
	if !exists {
		utils.ErrorResponse(c, http.StatusUnauthorized, "Store not found", nil)
		return
	}

	storeUUID := storeID.(pgtype.UUID)

	// Get limit and offset from query params (optional)
	limit := 50
	offset := 0

	notifications, err := utils.Queries.GetNotifications(c.Request.Context(), db.GetNotificationsParams{
		StoreID: storeUUID,
		Limit:   int32(limit),
		Offset:  int32(offset),
	})
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to fetch notifications", err)
		return
	}

	utils.SuccessResponse(c, "Notifications fetched successfully", notifications)
}

// GetUnreadCount returns the count of unread notifications
func GetUnreadCount(c *gin.Context) {
	storeID, exists := c.Get("store_id")
	if !exists {
		utils.ErrorResponse(c, http.StatusUnauthorized, "Store not found", nil)
		return
	}

	storeUUID := storeID.(pgtype.UUID)
	cacheKey := fmt.Sprintf("notif_unread:%s", storeUUID.String())

	// Try to get count from Redis
	if redis.IsRedisAvailable() {
		val, err := redis.RedisClient.Get(c.Request.Context(), cacheKey).Result()
		if err == nil {
			count, _ := strconv.ParseInt(val, 10, 64)
			utils.SuccessResponse(c, "Unread count fetched successfully (from cache)", gin.H{"count": count})
			return
		}
	}

	// Cache miss: fetch from Postgres
	count, err := utils.Queries.GetUnreadCount(c.Request.Context(), storeUUID)
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to fetch unread count", err)
		return
	}

	// Store in Redis (TTL: 24 hours as a safety fallback)
	if redis.IsRedisAvailable() {
		redis.RedisClient.Set(c.Request.Context(), cacheKey, count, 24*time.Hour)
	}

	utils.SuccessResponse(c, "Unread count fetched successfully", gin.H{"count": count})
}

// MarkNotificationAsRead marks a single notification as read
func MarkNotificationAsRead(c *gin.Context) {
	storeID, exists := c.Get("store_id")
	if !exists {
		utils.ErrorResponse(c, http.StatusUnauthorized, "Store not found", nil)
		return
	}

	storeUUID := storeID.(pgtype.UUID)
	notificationID := c.Param("id")

	var notificationUUID pgtype.UUID
	err := notificationUUID.Scan(notificationID)
	if err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Invalid notification ID", err)
		return
	}

	notification, err := utils.Queries.MarkNotificationAsRead(c.Request.Context(), db.MarkNotificationAsReadParams{
		ID:      notificationUUID,
		StoreID: storeUUID,
	})
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to mark notification as read", err)
		return
	}

	// Invalidate cache
	redis.InvalidateNotificationCount(c.Request.Context(), storeUUID)

	utils.SuccessResponse(c, "Notification marked as read", notification)
}

// MarkAllNotificationsAsRead marks all unread notifications as read
func MarkAllNotificationsAsRead(c *gin.Context) {
	storeID, exists := c.Get("store_id")
	if !exists {
		utils.ErrorResponse(c, http.StatusUnauthorized, "Store not found", nil)
		return
	}

	storeUUID := storeID.(pgtype.UUID)

	err := utils.Queries.MarkAllNotificationsAsRead(c.Request.Context(), storeUUID)
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to mark all notifications as read", err)
		return
	}

	// Invalidate cache
	redis.InvalidateNotificationCount(c.Request.Context(), storeUUID)

	utils.SuccessResponse(c, "All notifications marked as read", nil)
}

// DismissNotification dismisses a notification
func DismissNotification(c *gin.Context) {
	storeID, exists := c.Get("store_id")
	if !exists {
		utils.ErrorResponse(c, http.StatusUnauthorized, "Store not found", nil)
		return
	}

	storeUUID := storeID.(pgtype.UUID)
	notificationID := c.Param("id")

	var notificationUUID pgtype.UUID
	err := notificationUUID.Scan(notificationID)
	if err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Invalid notification ID", err)
		return
	}

	notification, err := utils.Queries.DismissNotification(c.Request.Context(), db.DismissNotificationParams{
		ID:      notificationUUID,
		StoreID: storeUUID,
	})
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to dismiss notification", err)
		return
	}

	// Invalidate cache
	redis.InvalidateNotificationCount(c.Request.Context(), storeUUID)

	utils.SuccessResponse(c, "Notification dismissed", notification)
}

// DeleteNotification permanently deletes a notification
func DeleteNotification(c *gin.Context) {
	storeID, exists := c.Get("store_id")
	if !exists {
		utils.ErrorResponse(c, http.StatusUnauthorized, "Store not found", nil)
		return
	}

	storeUUID := storeID.(pgtype.UUID)
	notificationID := c.Param("id")

	var notificationUUID pgtype.UUID
	err := notificationUUID.Scan(notificationID)
	if err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Invalid notification ID", err)
		return
	}

	err = utils.Queries.DeleteNotification(c.Request.Context(), db.DeleteNotificationParams{
		ID:      notificationUUID,
		StoreID: storeUUID,
	})
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to delete notification", err)
		return
	}

	// Invalidate cache
	redis.InvalidateNotificationCount(c.Request.Context(), storeUUID)

	utils.SuccessResponse(c, "Notification deleted", nil)
}
