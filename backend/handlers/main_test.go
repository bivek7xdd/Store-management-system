package handlers

import (
	"context"
	"log"
	"os"
	"testing"
	"time"

	db "storemanagement/db/sqlc"
	"storemanagement/utils"

	"github.com/jackc/pgx/v5/pgxpool"
)

func TestMain(m *testing.M) {
	// Set up test database
	testDBURL := os.Getenv("TEST_DB_URL")
	if testDBURL == "" {
		testDBURL = "postgres://root:password@localhost:5432/store-management-test?sslmode=disable"
	}

	config, err := pgxpool.ParseConfig(testDBURL)
	if err != nil {
		log.Fatal("failed to parse test db config: ", err)
	}

	config.MaxConns = 10
	config.MinConns = 1
	config.MaxConnLifetime = time.Hour

	conn, err := pgxpool.NewWithConfig(context.Background(), config)
	if err != nil {
		log.Fatal("failed to connect to test database: ", err)
	}

	// Ping to ensure connection
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	if err := conn.Ping(ctx); err != nil {
		log.Fatal("failed to ping test database: ", err)
	}

	// Set global variables for tests
	utils.DBPool = conn
	utils.Queries = db.New(conn)
	utils.Store = db.NewStore(conn)

	// Run tests
	code := m.Run()

	// Clean up
	conn.Close()

	os.Exit(code)
}
