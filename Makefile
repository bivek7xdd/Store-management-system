# database setup is sequential
postgres:
	docker run --name store-management-system -p 5432:5432 -e POSTGRES_USER=root -e POSTGRES_PASSWORD=password -d postgres:16.10-alpine

createdb:
	docker exec -it store-management-system createdb --username=root --owner=root store-management-system

dropdb:
	docker exec -it store-management-system dropdb  store-management-system

migrateup:
	migrate -path db/migration -database "postgres://root:password@localhost:5432/store-management-system?sslmode=disable" -verbose up

migratedown:
	migrate -path db/migration -database "postgres://root:password@localhost:5432/store-management-system?sslmode=disable" -verbose down

sqlc:
	sqlc generate

test:
	go test -v -cover ./...

.PHONY: createdb dropdb migrateup migratedown sqlc test