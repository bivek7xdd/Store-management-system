// Atlas configuration for store management system

// Development environment
env "dev" {
  // Source of truth: your schema files
  src = "file://db/schema"
  
  // Database URL (where to apply migrations)
  url = "postgres://postgres.wwzjeyxmvaflfhgnnmfx:Bivek%40981841@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?sslmode=require"
  
  // Dev database for Atlas to use for diffing
  dev = "postgres://root:password@localhost:5432/atlas-dev?sslmode=disable"
  
  // Schema to manage
  schemas = ["public"]

  // Where to store migrations
  migration {
    dir = "file://db/migration"
    revisions_schema = "public"
  }
}
