package db

import (
	"context"
	"log"
	"testing"

	"github.com/jackc/pgx/v5/pgxpool"
)

var testQueries *Queries

const (
	dbSource = "postgres://root:password@localhost:5432/store-management-system?sslmode=disable"
)

func TestMain(m *testing.M) {
	config, err := pgxpool.ParseConfig(dbSource)
	if err != nil {
		log.Fatal("failed to parse db config: ", err)
	}

	conn, err := pgxpool.NewWithConfig(context.Background(), config)
	if err != nil {
		log.Fatal("failed to connect to database: ", err)
	}
	defer conn.Close()

	testQueries = New(conn)

	m.Run()
}
