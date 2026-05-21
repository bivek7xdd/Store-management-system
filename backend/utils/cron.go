package utils

import (
	"context"
	"fmt"
	"log"
	"time"

	db "storemanagement/db/sqlc"
	"storemanagement/redis"

	"github.com/jackc/pgx/v5/pgtype"
)

var cronTicker *time.Ticker

func StopCronJobs() {
	cronTicker.Stop()
	log.Println("[Cron] Cron jobs stopped")
}

// StartCronJobs initializes and starts periodic background tasks
func StartCronJobs() {
	// Daily ticker for expiry detection and notifications
	cronTicker = time.NewTicker(24 * time.Hour)

	// Run immediately on start
	go func() {
		runExpiryCheck()
		checkAndCreateNotifications()
		for range cronTicker.C {
			runExpiryCheck()
			checkAndCreateNotifications()
		}
	}()

	log.Println("[Cron] Expiry detection and notification jobs started (Interval: 24h)")
}

func runExpiryCheck() {
	log.Println("[Cron] Running daily expiry detection job...")

	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	err := Queries.FlagExpiringProducts(ctx)
	if err != nil {
		log.Printf("[Cron] Error flagging expiring products: %v", err)
		return
	}

	if !redis.IsRedisAvailable() {
		err = Queries.DeleteExpiredOTPs(ctx)
		if err != nil {
			log.Printf("[Cron] Error deleting expired Postgres OTPs: %v", err)
		}
	}

	log.Println("[Cron] Daily cron-job completed successfully")
}

// checkAndCreateNotifications checks for due debts and low stock, creates notifications
func checkAndCreateNotifications() {
	log.Println("[Cron] Checking for notifications...")

	ctx, cancel := context.WithTimeout(context.Background(), 60*time.Second)
	defer cancel()

	// Get all stores
	stores, err := Queries.GetAllStores(ctx)
	if err != nil {
		log.Printf("[Cron] Error fetching stores: %v", err)
		return
	}

	for _, store := range stores {
		// Check for due/overdue debts
		checkDueDebts(ctx, store.ID)

		// Clean up old dismissed notifications
		err := Queries.DeleteOldNotifications(ctx, store.ID)
		if err != nil {
			log.Printf("[Cron] Error deleting old notifications for store %s: %v", store.ID, err)
		}
	}

	log.Println("[Cron] Notification check completed")
}

// checkDueDebts checks for debts due today or overdue and creates notifications
func checkDueDebts(ctx context.Context, storeID pgtype.UUID) {
	// Get debts that are due today or overdue
	debts, err := Queries.GetDueDebts(ctx, storeID)
	if err != nil {
		log.Printf("[Cron] Error fetching due debts for store %s: %v", storeID, err)
		return
	}

	for _, debt := range debts {
		// Check if notification already exists (within last 24 hours)
		exists, err := Queries.CheckNotificationExists(ctx, db.CheckNotificationExistsParams{
			StoreID:     storeID,
			Type:        db.NotificationTypeDebtDue,
			ReferenceID: debt.ID,
		})
		if err != nil {
			log.Printf("[Cron] Error checking notification existence: %v", err)
			continue
		}

		if exists {
			continue // Skip if already notified recently
		}

		// Create notification
		outstanding := Float64(debt.AmountOwed) - Float64(debt.AmountPaid)
		title := "Debt Payment Due"
		customerName := debt.CustomerName.String
		if customerName == "" {
			customerName = "Customer"
		}
		message := fmt.Sprintf("%s has an outstanding payment of रू %.2f due today.", customerName, outstanding)

		_, err = Queries.CreateNotification(ctx, db.CreateNotificationParams{
			StoreID:       storeID,
			Type:          db.NotificationTypeDebtDue,
			Title:         title,
			Message:       message,
			ReferenceID:   debt.ID,
			ReferenceType: pgtype.Text{String: "debt", Valid: true},
			Status:        db.NotificationStatusUnread,
		})
		if err != nil {
			log.Printf("[Cron] Error creating debt notification: %v", err)
		} else {
			log.Printf("[Cron] Created debt notification for %s", customerName)
			// Invalidate cache so the badge count updates
			redis.InvalidateNotificationCount(ctx, storeID)
		}
	}
}
