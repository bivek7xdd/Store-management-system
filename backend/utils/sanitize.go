package utils

import (
	"regexp"
	"strings"
)

// Dangerous patterns for SQL injection and XSS
var (
	// Matches common SQL injection patterns
	sqlInjectionPattern = regexp.MustCompile(`(?i)(--|;|\b(DROP|ALTER|DELETE|INSERT|UPDATE|UNION|SELECT|EXEC|EXECUTE)\b\s)`)

	// Matches HTML/script tags for XSS prevention
	htmlTagPattern = regexp.MustCompile(`<[^>]*>`)
)

// ContainsSQLInjection checks if a string contains common SQL injection patterns.
func ContainsSQLInjection(s string) bool {
	return sqlInjectionPattern.MatchString(s)
}

// ContainsXSS checks if a string contains HTML/script tags.
func ContainsXSS(s string) bool {
	return htmlTagPattern.MatchString(s)
}

// ContainsDangerousInput checks for both SQL injection and XSS patterns.
func ContainsDangerousInput(s string) bool {
	return ContainsSQLInjection(s) || ContainsXSS(s)
}

// SanitizeString strips HTML tags and trims whitespace from a string.
// Use this for fields where you want to clean the input rather than reject it.
func SanitizeString(s string) string {
	// Strip HTML tags
	s = htmlTagPattern.ReplaceAllString(s, "")
	// Trim whitespace
	s = strings.TrimSpace(s)
	return s
}

// ValidateUserInputFields checks a map of field names to values for dangerous content.
// Returns the name of the first offending field, or empty string if all are clean.
func ValidateUserInputFields(fields map[string]string) string {
	for name, value := range fields {
		if ContainsDangerousInput(value) {
			return name
		}
	}
	return ""
}
