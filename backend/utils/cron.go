package utils

import (
	"context"
	"log"
	"time"
)

// StartCronJobs initializes and starts periodic background tasks
func StartCronJobs() {
	// Daily ticker for expiry detection
	ticker := time.NewTicker(24 * time.Hour)

	// Run immediately on start
	go func() {
		runExpiryCheck()
		for range ticker.C {
			runExpiryCheck()
		}
	}()

	log.Println("[Cron] Expiry detection job started (Interval: 24h)")
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

	// Also delete expired OTPs while we're at it (cleaning up the system)
	err = Queries.DeleteExpiredOTPs(ctx)
	if err != nil {
		log.Printf("[Cron] Error deleting expired OTPs: %v", err)
	}

	log.Println("[Cron] Daily cron-job completed successfully")
}
