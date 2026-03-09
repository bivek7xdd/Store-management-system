package utils

import (
	"fmt"

	"github.com/jackc/pgx/v5/pgtype"
)

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
