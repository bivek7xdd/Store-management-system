-- name: CreateOTPToken :one
INSERT INTO otp_tokens (user_email, otp, purpose, expires_at)
VALUES ($1, $2, $3, NOW() + INTERVAL '10 minutes')
RETURNING *;

-- name: VerifyOTP :one
SELECT * FROM otp_tokens 
WHERE user_email = $1 AND otp = $2 AND purpose = $3 AND expires_at > NOW();

-- name: DeleteOTPToken :exec
DELETE FROM otp_tokens WHERE id = $1;

-- name: DeleteExpiredOTPs :exec
DELETE FROM otp_tokens WHERE expires_at < NOW();