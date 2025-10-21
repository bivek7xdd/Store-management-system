# database setup is sequential
postgres:
	docker run --name store-management-system -p 5432:5432 -e POSTGRES_USER=root -e POSTGRES_PASSWORD=password -d postgres:16.10-alpine

createdb:
	docker exec -it store-management-system createdb --username=root --owner=root store-management-system

dropdb:
	docker exec -it store-management-system dropdb  store-management-system

migrateup:
	migrate -path db/migration -database "postgresql://postgres:Bivek@981841@db.dqzsdkgtcydvkbeymtjg.supabase.co:5432/postgres" -verbose up

migratedown:
	migrate -path db/migration -database "postgresql://postgres:Bivek@981841@db.dqzsdkgtcydvkbeymtjg.supabase.co:5432/postgres" -verbose down

sqlc:
	sqlc generate

test:
	go test -v -cover ./...

server:
	CompileDaemon -command="./storemanagement"

.PHONY: createdb dropdb migrateup migratedown sqlc test server