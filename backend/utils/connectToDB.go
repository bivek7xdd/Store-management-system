package utils

import (
	"context"
	"log"
	"os"
	db "storemanagement/db/sqlc"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

var (
	DBPool  *pgxpool.Pool
	Queries *db.Queries
	Store   *db.Store
)

func ConnectToDB() {
	dbSource := os.Getenv("DB_URL_SUPABASE")
	config, err := pgxpool.ParseConfig(dbSource)
	if err != nil {
		log.Fatal("failed to parse db config: ", err)
	}

	config.ConnConfig.DefaultQueryExecMode = pgx.QueryExecModeSimpleProtocol
	config.MaxConns = 25
	config.MinConns = 2
	config.MaxConnLifetime = time.Hour
	config.MaxConnIdleTime = 30 * time.Minute

	conn, err := pgxpool.NewWithConfig(context.Background(), config)
	if err != nil {
		log.Fatal("failed to connect to database: ", err)
	}

	DBPool = conn
	Queries = db.New(conn)
	Store = db.NewStore(conn)
}
