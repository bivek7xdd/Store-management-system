package main

import (
	"context"
	"fmt"
	"log"
	"storemanagement/redis"
	"storemanagement/utils"
)

func main() {
	utils.LoadEnv()
	redis.ConnectToRedis()

	if redis.IsRedisAvailable() {
		err := redis.RedisClient.FlushAll(context.Background()).Err()
		if err != nil {
			log.Fatalf("Failed to flush redis: %v", err)
		}
		fmt.Println("✅ Redis cache cleared successfully!")
	} else {
		fmt.Println("ℹ️ Redis not available, skipping cache clear.")
	}
}
