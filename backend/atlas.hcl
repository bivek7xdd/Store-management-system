// Atlas configuration for store management system

// Development environment
env "dev" {
  // Source of truth: your schema files
  src = "file://db/schema"
  
  // Database URL (where to apply migrations)
  url = "postgres://root:password@localhost:5432/store-management-system?sslmode=disable"
  
  // Dev database for Atlas to use for diffing
  dev = "postgres://root:password@localhost:5432/atlas-dev?sslmode=disable"
  
  // Where to store migrations
  migration {
    dir = "file://db/migration"
  }
}
