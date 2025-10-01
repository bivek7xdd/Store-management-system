-- name: CreateUser :one
INSERT INTO users (
  name,
  email,
  password,
  phone
) VALUES (
  $1, $2, $3, $4
) RETURNING *;

-- name: GetUser :one
SELECT * FROM users
WHERE id = $1 LIMIT 1;

-- name: GetUserByEmail :one
SELECT * FROM users
WHERE email = $1 LIMIT 1;

-- name: ListUsers :many
SELECT * FROM users
ORDER BY created_at
LIMIT $1
OFFSET $2;

-- name: UpdateUser :one
UPDATE users
SET
  name = COALESCE($1, name),
  email = COALESCE($2, email),
  password = COALESCE($3, password),
  phone = COALESCE($4, phone),
  status = COALESCE($5, status),
  email_verified = COALESCE($6, email_verified),
  last_login = COALESCE($7, last_login),
  failed_login_attempts = COALESCE($8, failed_login_attempts),
  locked_until = COALESCE($9, locked_until),
  updated_at = now()
WHERE id = $10
RETURNING *;

-- name: DeleteUser :exec
DELETE FROM users
WHERE id = $1;

-- name: UpdateLoginAttempts :one
UPDATE users
SET
  failed_login_attempts = $1,
  locked_until = $2,
  last_login = $3,
  updated_at = now()
WHERE id = $4
RETURNING *;

-- name: VerifyEmail :one
UPDATE users
SET
  email_verified = true,
  updated_at = now()
WHERE id = $1
RETURNING *;

-- name: UpdatePassword :one
UPDATE users
SET
  password = $1,
  updated_at = now()
WHERE id = $2
RETURNING *;