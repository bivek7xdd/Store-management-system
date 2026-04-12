// Atlas configuration for store management system

// Development environment
env "dev" {
  // Source of truth: your schema files
  src = "file://db/schema"
  
  // Database URL (where to apply migrations)
  url = "postgres://postgres.wwzjeyxmvaflfhgnnmfx:Bivek%40981841@aws-1-ap-south-1.pooler.supabase.com:5432/postgres?search_path=public&sslmode=require"
  
  // Dev database for Atlas to use for diffing
  dev = "postgres://root:password@localhost:5432/atlas-dev?sslmode=disable"
  
  // Schema to manage
  schemas = ["public"]

  // Where to store migrations
  migration {
    dir = "file://db/migration"
    revisions_schema = "public"
  }

  diff {
    skip {
      drop_schema = true
    }
  }
}

// Test environment
env "test" {
  // Source of truth: your schema files
  src = "file://db/schema"
  
  // Database URL (where to apply migrations)
  url = "postgres://root:password@localhost:5432/store-management-test?sslmode=disable"
  
  // Dev database for Atlas to use for diffing (use atlas-dev)
  dev = "postgres://root:password@localhost:5432/atlas-dev?sslmode=disable"
  
  // Schema to manage
  schemas = ["public"]

  // Where to store migrations
  migration {
    dir = "file://db/migration"
    revisions_schema = "public"
  }

  diff {
    skip {
      drop_schema = true
    }
  }
}
