package utils

import (
	"context"
	"fmt"
	"math/rand"
	"regexp"
	"strings"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

func init() {
	rand.Seed(time.Now().UnixNano())
}

// GenerateSlug creates a URL-friendly slug from a string
func GenerateSlug(input string) string {
	// Convert to lowercase
	slug := strings.ToLower(input)

	// Replace spaces and special characters with hyphens
	reg := regexp.MustCompile(`[^a-z0-9]+`)
	slug = reg.ReplaceAllString(slug, "-")

	// Remove leading/trailing hyphens
	slug = strings.Trim(slug, "-")

	return slug
}

// GenerateUniqueSlug generates a unique slug by checking against the database
func GenerateUniqueSlug(pool *pgxpool.Pool, table, baseSlug string) (string, error) {
	// First try the base slug
	slug := GenerateSlug(baseSlug)
	originalSlug := slug

	// Keep trying until we find a unique slug
	for i := 1; ; i++ {
		var count int
		err := pool.QueryRow(
			context.Background(),
			"SELECT COUNT(*) FROM "+table+" WHERE slug = $1",
			slug,
		).Scan(&count)

		if err != nil {
			return "", err
		}

		if count == 0 {
			return slug, nil
		}

		// Append a random 4-digit number if the slug exists
		slug = fmt.Sprintf("%s-%04d", originalSlug, rand.Intn(10000))
	}
}
