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
	log.Println("Initializing Database Connection...")
	dbSource := os.Getenv("DB_URL_SUPABASE")
	if dbSource == "" {
		log.Println("WARNING: DB_URL_SUPABASE environment variable is empty!")
	} else {
		log.Printf("DB_URL_SUPABASE found (length: %d)", len(dbSource))
	}

	config, err := pgxpool.ParseConfig(dbSource)
	if err != nil {
		log.Fatal("failed to parse db config: ", err)
	}

	config.ConnConfig.DefaultQueryExecMode = pgx.QueryExecModeSimpleProtocol
	config.MaxConns = 25
	config.MinConns = 2
	config.MaxConnLifetime = time.Hour
	config.MaxConnIdleTime = 30 * time.Minute

	log.Println("Creating PGX Pool...")
	conn, err := pgxpool.NewWithConfig(context.Background(), config)
	if err != nil {
		log.Fatal("failed to connect to database: ", err)
	}

	log.Println("Determining database connectivity...")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	err = conn.Ping(ctx)
	if err != nil {
		log.Fatal("Database Ping failed (check firewall/IP whitelist): ", err)
	}

	log.Println("Database Connection Established Successfully.")

	DBPool = conn
	Queries = db.New(conn)
	Store = db.NewStore(conn)
}

func CloseDB() {
	if DBPool != nil {
		DBPool.Close()
		log.Println("Database connection pool closed.")
	}
}
