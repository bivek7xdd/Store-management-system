# database setup is sequential
postgres:
	docker run --name store-management-system -p 5432:5432 -e POSTGRES_USER=root -e POSTGRES_PASSWORD=password -d postgres:16.10-alpine

createdb:
	docker exec -it store-management-system createdb --username=root --owner=root store-management-system

dropdb:
	docker exec -it store-management-system dropdb  store-management-system

createdevdb:
	docker exec -it store-management-system createdb --username=root --owner=root atlas-dev

dropdevdb:
	docker exec -it store-management-system dropdb atlas-dev

migrateup:
	migrate -path db/migration -database "postgres://root:password@localhost:5432/store-management-system?sslmode=disable" -verbose up

migratedown:
	migrate -path db/migration -database "postgres://root:password@localhost:5432/store-management-system?sslmode=disable" -verbose down

sqlc:
	sqlc generate

test:
	go test -v -cover ./...

# Atlas: Generate migration from schema changes (with name)
atlas-diff:
	atlas migrate diff $(name) --env dev

# Atlas: Initialize migration directory (first time only)
atlas-init:
	atlas migrate hash --env dev

# Atlas: Apply schema directly (bypass migrations for first time)
atlas-schema-apply:
	atlas schema apply --env dev --auto-approve

# Atlas: Apply migrations to database
atlas-apply:
	atlas migrate apply --env dev

# Atlas: Check schema status
atlas-status:
	atlas migrate status --env dev

# Atlas: Inspect current database schema
atlas-inspect:
	atlas schema inspect --env dev

# Atlas: Validate migrations
atlas-validate:
	atlas migrate validate --env dev

# Complete workflow: generate migration and regenerate sqlc
atlas-gen:
	atlas migrate diff --env dev
	sqlc generate

server:
	CompileDaemon -command="./storemanagement"

.PHONY: createdb dropdb createdevdb dropdevdb migrateup migratedown sqlc test server atlas-diff atlas-apply atlas-status atlas-inspect atlas-validate atlas-gen