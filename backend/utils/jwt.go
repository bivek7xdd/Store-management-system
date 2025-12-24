package utils

import (
	"errors"
	"os"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
)

type Claims struct {
	UserID        string `json:"user_id"`
	Name          string `json:"name"`
	StoreId       string `json:"store_id"`
	VerifiedEmail bool   `json:"verified_email"`
	jwt.RegisteredClaims
}

// GenerateJWT generates a new JWT token for the user
func GenerateJWT(userID pgtype.UUID, name string, storeId pgtype.UUID, emailVerified bool) (string, error) {
	jwtSecret := os.Getenv("JWT_SECRET")
	if jwtSecret == "" {
		return "", errors.New("JWT_SECRET not found in environment variables")
	}

	// Create claims with user data and expiration time
	userIDStr := ""
	if userID.Valid {
		// Convert pgtype.UUID to google/uuid and then to string
		googleUUID, err := uuid.FromBytes(userID.Bytes[:])
		if err != nil {
			return "", err
		}
		userIDStr = googleUUID.String()
	}

	claims := Claims{
		UserID:        userIDStr,
		Name:          name,
		StoreId:       storeId.String(),
		VerifiedEmail: emailVerified,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(24 * time.Hour)), // Token expires in 24 hours
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			NotBefore: jwt.NewNumericDate(time.Now()),
			Issuer:    "storemanagement",
			Subject:   userIDStr,
		},
	}

	// Create token with claims
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)

	// Sign token with secret
	tokenString, err := token.SignedString([]byte(jwtSecret))
	if err != nil {
		return "", err
	}

	return tokenString, nil
}

// ValidateJWT validates and parses a JWT token
func ValidateJWT(tokenString string) (*Claims, error) {
	jwtSecret := os.Getenv("JWT_SECRET")
	if jwtSecret == "" {
		return nil, errors.New("JWT_SECRET not found in environment variables")
	}

	// Parse token
	token, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(token *jwt.Token) (interface{}, error) {
		// Validate signing method
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, errors.New("invalid signing method")
		}
		return []byte(jwtSecret), nil
	})

	if err != nil {
		return nil, err
	}

	// Check if token is valid and extract claims
	if claims, ok := token.Claims.(*Claims); ok && token.Valid {
		return claims, nil
	}

	return nil, errors.New("invalid token")
}
