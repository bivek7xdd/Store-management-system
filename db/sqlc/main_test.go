package db

import (
	"context"
	"log"
	"testing"

	"github.com/jackc/pgx/v5/pgxpool"
)

var testQueries *Queries

const (
	dbSource = "postgresql://postgres:Bivek@981841@db.dqzsdkgtcydvkbeymtjg.supabase.co:5432/postgres"
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
