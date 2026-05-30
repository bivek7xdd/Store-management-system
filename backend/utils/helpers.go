package utils

import (
	"fmt"
	"math/rand"
	"strconv"
	"time"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
)

// ParseUUID parses a string into a pgtype.UUID
func ParseUUID(s string) (pgtype.UUID, error) {
	id, err := uuid.Parse(s)
	if err != nil {
		return pgtype.UUID{}, err
	}
	return pgtype.UUID{Bytes: id, Valid: true}, nil
}

// Text converts a string to a valid pgtype.Text
func Text(s string) pgtype.Text {
	return pgtype.Text{
		String: s,
		Valid:  true,
	}
}

// OptionalText converts a string to pgtype.Text, allowing NULL if the string is empty
func OptionalText(s string) pgtype.Text {
	if s == "" {
		return pgtype.Text{Valid: false}
	}
	return pgtype.Text{
		String: s,
		Valid:  true,
	}
}

// Numeric converts a float64 to a valid pgtype.Numeric.
// pgtype.Numeric.Scan(float64) does NOT set Valid=true; only string scanning
// works reliably. We format via Sprintf to match how price is handled in handlers.
func Numeric(f float64) pgtype.Numeric {
	var n pgtype.Numeric
	// Intentionally ignore error — invalid floats (NaN/Inf) will leave Valid=false
	_ = n.Scan(fmt.Sprintf("%f", f))
	return n
}

// Float64 converts pgtype.Numeric back to float64
func Float64(n pgtype.Numeric) float64 {
	if !n.Valid {
		return 0
	}
	f, _ := n.Float64Value()
	return f.Float64
}

// StringToNumeric converts a string to a valid pgtype.Numeric.
func StringToNumeric(s string) (pgtype.Numeric, error) {
	var n pgtype.Numeric
	err := n.Scan(s)
	return n, err
}

// RandomBarcode generates a random 12-digit barcode string
func RandomBarcode() string {
	r := rand.New(rand.NewSource(time.Now().UnixNano()))
	digits := make([]byte, 12)
	for i := 0; i < 12; i++ {
		digits[i] = byte('0' + r.Intn(10))
	}
	return string(digits)
}

// GetStoreID safely extracts store_id from gin context.
// Returns the UUID and true if present and valid, or zero UUID and false otherwise.
func GetStoreID(c *gin.Context) (pgtype.UUID, bool) {
	val, exists := c.Get("store_id")
	if !exists {
		return pgtype.UUID{}, false
	}
	uuid, ok := val.(pgtype.UUID)
	return uuid, ok
}

// Pagination holds parsed limit and offset values
type Pagination struct {
	Limit  int
	Offset int
}

// ParsePagination extracts and validates limit/offset query parameters
func ParsePagination(c *gin.Context) Pagination {
	limitStr := c.DefaultQuery("limit", "50")
	offsetStr := c.DefaultQuery("offset", "0")
	limit, _ := strconv.Atoi(limitStr)
	offset, _ := strconv.Atoi(offsetStr)
	if limit <= 0 || limit > 100 {
		limit = 50
	}
	if offset < 0 {
		offset = 0
	}
	return Pagination{Limit: limit, Offset: offset}
}

// GetDateRange returns start and end dates for a given range type
func GetDateRange(rangeType string) (time.Time, time.Time) {
	now := time.Now()
	endDate := now
	var startDate time.Time

	switch rangeType {
	case "today":
		startDate = time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())
	case "week":
		weekday := int(now.Weekday())
		startDate = time.Date(now.Year(), now.Month(), now.Day()-weekday, 0, 0, 0, 0, now.Location())
	case "month":
		startDate = time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, now.Location())
	case "year":
		startDate = time.Date(now.Year(), 1, 1, 0, 0, 0, 0, now.Location())
	default:
		startDate = time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())
	}

	return startDate, endDate
}
