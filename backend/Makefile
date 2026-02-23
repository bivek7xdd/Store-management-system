# database setup is sequential
postgres:
	docker run --name sms -p 5432:5432 -e POSTGRES_USER=root -e POSTGRES_PASSWORD=password -d postgres:16.10-alpine

createdb:
	docker exec -it sms createdb --username=root --owner=root sms

dropdb:
	docker exec -it sms dropdb  sms

createdevdb:
	docker exec -it sms createdb --username=root --owner=root atlas-dev

dropdevdb:
	docker exec -it sms dropdb atlas-dev

migrateup:
	migrate -path db/migration -database "postgres://root:password@localhost:5432/sms?sslmode=disable" -verbose up

migratedown:
	migrate -path db/migration -database "postgres://root:password@localhost:5432/sms?sslmode=disable" -verbose down

createdbtest:
	docker exec -it sms createdb --username=root --owner=root store-management-test

dropdbtest:
	docker exec -it sms dropdb store-management-test

migratetestup:
	migrate -path db/migration -database "postgres://root:password@localhost:5432/store-management-test?sslmode=disable" -verbose up

migratetestdown:
	migrate -path db/migration -database "postgres://root:password@localhost:5432/store-management-test?sslmode=disable" -verbose down

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

# Atlas: Apply migrations to test database
atlas-test-apply:
	atlas migrate apply --env test

# Atlas: Check test schema status
atlas-test-status:
	atlas migrate status --env test

# Atlas: Inspect test database schema
atlas-test-inspect:
	atlas schema inspect --env test

# Atlas: Validate test migrations
atlas-test-validate:
	atlas migrate validate --env test

# Complete workflow: generate migration and regenerate sqlc
atlas-gen:
	atlas migrate diff --env dev
	sqlc generate

server:
	CompileDaemon -command="./storemanagement"

.PHONY: createdb dropdb createdevdb dropdevdb migrateup migratedown createdbtest dropdbtest migratetestup migratetestdown sqlc test server atlas-diff atlas-apply atlas-status atlas-inspect atlas-validate atlas-test-apply atlas-test-status atlas-test-inspect atlas-test-validate atlas-gen