package redis

import (
	"context"
	"errors"
	"fmt"
	"log"
	"os"
	"strings"
	"time"

	"github.com/jackc/pgx/v5/pgtype"
	"github.com/redis/go-redis/v9"
)

// RedisClient is the global Redis connection.
// It may be nil if Redis is not configured — callers must check IsRedisAvailable().
var RedisClient *redis.Client

// IsRedisAvailable returns true if Redis was successfully connected.
func IsRedisAvailable() bool {
	return RedisClient != nil
}

func Disconnect() {
	if RedisClient != nil {
		if err := RedisClient.Close(); err != nil {
			log.Printf("[Redis] Error closing Redis client: %v", err)
		} else {
			log.Println("[Redis] Redis client disconnected successfully.")
		}
	}
}

// ConnectToRedis initialises the Redis client using environment variables.
// Supports both plain ("host:port") and full URL ("redis[s]://..." / "rediss://...") formats
// so it works with local Redis and Upstash out of the box.
func ConnectToRedis() {
	addr := os.Getenv("REDIS_URL")
	password := os.Getenv("REDIS_PASSWORD")

	if addr == "" {
		log.Println("[Redis] REDIS_URL not set — Redis disabled. OTPs will fall back to Postgres.")
		return
	}

	var opts *redis.Options

	// Full URL format (Upstash / hosted providers)
	if strings.HasPrefix(addr, "redis://") || strings.HasPrefix(addr, "rediss://") {
		parsed, err := redis.ParseURL(addr)
		if err != nil {
			log.Printf("[Redis] Failed to parse REDIS_URL: %v — Redis disabled.", err)
			return
		}
		opts = parsed
	} else {
		// Plain "host:port" format
		opts = &redis.Options{
			Addr:     addr,
			Password: password,
			DB:       0,
		}
	}

	client := redis.NewClient(opts)

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := client.Ping(ctx).Err(); err != nil {
		log.Printf("[Redis] Ping failed: %v — Redis disabled. OTPs will fall back to Postgres.", err)
		return
	}

	RedisClient = client
	log.Println("[Redis] Connected successfully.")
}

// ─── OTP helpers ────────────────────────────────────────────────────────────

const otpTTL = 10 * time.Minute

func otpKey(email, purpose string) string {
	return fmt.Sprintf("otp:%s:%s", strings.ToLower(email), purpose)
}

// StoreOTP saves an OTP for the given (email, purpose) pair and makes it
// auto-expire after 10 minutes. Any previously stored OTP for the same pair
// is overwritten (prevents spamming multiple valid codes).
func StoreOTP(ctx context.Context, email, purpose, otp string) error {
	if RedisClient == nil {
		return errors.New("redis not available")
	}
	return RedisClient.Set(ctx, otpKey(email, purpose), otp, otpTTL).Err()
}

// VerifyAndConsumeOTP validates the provided OTP against the stored value and
// deletes it on success (one-time use). Returns an error when:
//   - Redis is unavailable
//   - the key has expired or was never set
//   - the OTP value does not match
func VerifyAndConsumeOTP(ctx context.Context, email, purpose, otp string) error {
	if RedisClient == nil {
		return errors.New("redis not available")
	}

	key := otpKey(email, purpose)

	stored, err := RedisClient.Get(ctx, key).Result()
	if err == redis.Nil {
		return errors.New("otp expired or not found")
	}
	if err != nil {
		return fmt.Errorf("redis error: %w", err)
	}
	if stored != otp {
		return errors.New("invalid otp")
	}

	// Consume: delete so it cannot be replayed
	RedisClient.Del(ctx, key)
	return nil
}

// DeleteOTP removes a stored OTP (e.g. when the user deliberately cancels a flow).
func DeleteOTP(ctx context.Context, email, purpose string) {
	if RedisClient == nil {
		return
	}
	RedisClient.Del(ctx, otpKey(email, purpose))
}

// InvalidateNotificationCount deletes the cached unread count for a store.
// Call this whenever a notification for that store is created, read, or deleted.
func InvalidateNotificationCount(ctx context.Context, storeID pgtype.UUID) {
	if !IsRedisAvailable() {
		return
	}
	key := fmt.Sprintf("notif_unread:%s", storeID.String())
	RedisClient.Del(ctx, key)
}
