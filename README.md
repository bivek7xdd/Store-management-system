# Store Sync - Store Management System

A full-stack store management system with inventory tracking, sales POS, debt management, and analytics.

## Prerequisites

- Go 1.24+
- Node.js 18+
- Docker
- Atlas CLI (`go install ariga.io/atlas/cmd/atlas@latest`)
- sqlc (`go install github.com/sqlc-dev/sqlc/cmd/sqlc@latest`)
- CompileDaemon (`go install github.com/githubnemo/CompileDaemon@latest`)

## Quick Start

### 1. Start Database

```bash
cd backend
make postgres    # Start PostgreSQL container
make createdb    # Create main database
make migrateup   # Run migrations
```

### 2. Start Backend

```bash
cd backend
make sqlc        # Generate SQL code
make server      # Start server with hot-reload
```

Backend runs on `http://localhost:8000`

### 3. Start Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on `http://localhost:5173`

## Database Setup

| Command | Description |
|---------|-------------|
| `make postgres` | Start PostgreSQL in Docker |
| `make createdb` | Create main database |
| `make dropdb` | Drop main database |
| `make migrateup` | Run migrations |
| `make sqlc` | Regenerate SQL code |

## Testing

```bash
cd backend
make test        # Run all tests
```

## Project Structure

```
├── backend/          # Go API server
│   ├── handlers/     # HTTP handlers
│   ├── db/           # Database schemas, queries, migrations
│   ├── utils/        # Utilities (email, JWT, etc.)
│   └── main.go       # Entry point
├── frontend/         # React frontend
│   ├── src/
│   │   ├── components/  # UI components
│   │   ├── pages/       # Page components
│   │   ├── services/    # API services
│   │   └── contexts/    # React contexts
│   └── package.json
```

## Environment Variables

Backend configuration is in `backend/.env`. Key variables:

- `DB_URL_LOCAL` - PostgreSQL connection string
- `JWT_SECRET` - Secret for JWT tokens
- `PORT` - Server port (default: 8000)
- `SUPABASE_URL` / `SUPABASE_ANON_KEY` - Supabase config (if using)

## Features

- Inventory management with categories and variants
- Point of Sale (POS) with offline support
- Debt/tracking management
- Sales analytics and reporting
- Supplier management
- Market price comparison
- Multi-user with role-based access
