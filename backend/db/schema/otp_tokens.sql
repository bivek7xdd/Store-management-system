--TODO: change userid to user email with unique field and before creating a token need to check if the email already exists

CREATE TABLE IF NOT EXISTS otp_tokens(
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_email VARCHAR(50) NOT NULL,
    otp VARCHAR(6) NOT NULL,
    purpose VARCHAR(50) NOT NULL, -- 'email_verification', 'password_reset'
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMPTZ NOT NULL
);

-- Index for faster lookups
CREATE INDEX idx_otp_tokens_user_id ON otp_tokens(user_email);
CREATE INDEX idx_otp_tokens_expires_at ON otp_tokens(expires_at);