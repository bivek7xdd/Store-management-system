package utils

import (
	"context"
	"log"
	"os"
	db "storemanagement/db/sqlc"

	"github.com/jackc/pgx/v5/pgxpool"
)

var (
	DBPool  *pgxpool.Pool
	Queries *db.Queries
)

func ConnectToDB() {
	dbSource := os.Getenv("DB_URL")
	config, err := pgxpool.ParseConfig(dbSource)
	if err != nil {
		log.Fatal("failed to parse db config: ", err)
	}

	conn, err := pgxpool.NewWithConfig(context.Background(), config)
	if err != nil {
		log.Fatal("failed to connect to database: ", err)
	}

	DBPool = conn
	Queries = db.New(conn)
}
