package utils

import (
	"fmt"
	"math/rand"
	"time"
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

// RandomBarcode generates a random 12-digit barcode string
func RandomBarcode() string {
	r := rand.New(rand.NewSource(time.Now().UnixNano()))
	digits := make([]byte, 12)
	for i := 0; i < 12; i++ {
		digits[i] = byte('0' + r.Intn(10))
	}
	return string(digits)
}
