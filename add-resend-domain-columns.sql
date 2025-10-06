-- Add columns for Resend domain integration
ALTER TABLE users ADD COLUMN IF NOT EXISTS resend_domain_id TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS domain_dns_records JSONB;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_resend_domain_id ON users(resend_domain_id);
CREATE INDEX IF NOT EXISTS idx_users_custom_domain ON users(custom_domain);

-- Update any existing domains to have null resend_domain_id (they'll need to re-register)
UPDATE users 
SET resend_domain_id = NULL, domain_dns_records = NULL, domain_verified = false 
WHERE custom_domain IS NOT NULL AND resend_domain_id IS NULL;