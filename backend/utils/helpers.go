package utils

import "github.com/jackc/pgx/v5/pgtype"

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

// Numeric converts a float64 to a valid pgtype.Numeric
func Numeric(f float64) pgtype.Numeric {
	var n pgtype.Numeric
	n.Scan(f)
	return n
}
