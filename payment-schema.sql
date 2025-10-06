-- Add subscription fields to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_plan VARCHAR(50) DEFAULT 'free';
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_status VARCHAR(50) DEFAULT 'inactive';
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_updated_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS payment_id VARCHAR(255);

-- Create payment_logs table for tracking all payments
CREATE TABLE IF NOT EXISTS payment_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  whop_user_id VARCHAR(255) NOT NULL,
  payment_id VARCHAR(255) NOT NULL UNIQUE,
  plan_type VARCHAR(50) NOT NULL,
  amount INTEGER NOT NULL, -- Amount in cents
  currency VARCHAR(10) DEFAULT 'usd',
  status VARCHAR(50) DEFAULT 'pending',
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_payment_logs_user_id ON payment_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_logs_whop_user_id ON payment_logs(whop_user_id);
CREATE INDEX IF NOT EXISTS idx_payment_logs_payment_id ON payment_logs(payment_id);
CREATE INDEX IF NOT EXISTS idx_payment_logs_status ON payment_logs(status);
CREATE INDEX IF NOT EXISTS idx_users_subscription_plan ON users(subscription_plan);

-- Enable RLS (Row Level Security)
ALTER TABLE payment_logs ENABLE ROW LEVEL SECURITY;

-- Create policy for payment_logs (adjust as needed for your security requirements)
CREATE POLICY "Users can view their own payment logs" ON payment_logs
  FOR SELECT USING (auth.uid()::text = whop_user_id);

-- Create policy for admins to view all payment logs (optional)
CREATE POLICY "Admins can view all payment logs" ON payment_logs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE whop_user_id = auth.uid()::text 
      AND role = 'admin'
    )
  );

-- Update trigger for payment_logs
CREATE OR REPLACE FUNCTION update_payment_logs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER payment_logs_updated_at
  BEFORE UPDATE ON payment_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_payment_logs_updated_at();