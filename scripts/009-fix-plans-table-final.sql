-- Ensure plans table has the correct structure
DROP TABLE IF EXISTS plans CASCADE;

CREATE TABLE plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price_monthly DECIMAL(10,2) NOT NULL DEFAULT 0,
  price_yearly DECIMAL(10,2) NOT NULL DEFAULT 0,
  billing_cycle VARCHAR(20) DEFAULT 'monthly',
  max_screens INTEGER NOT NULL DEFAULT 1,
  max_storage_gb INTEGER NOT NULL DEFAULT 1,
  max_playlists INTEGER NOT NULL DEFAULT 1,
  features JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_plans_active ON plans(is_active);
CREATE INDEX idx_plans_price_monthly ON plans(price_monthly);

-- Insert sample plans with proper pricing
INSERT INTO plans (name, description, price_monthly, price_yearly, billing_cycle, max_screens, max_storage_gb, max_playlists, features, is_active) VALUES
('Free', 'Perfect for getting started', 0.00, 0.00, 'monthly', 1, 1, 3, '["Basic Support"]', true),
('Starter', 'Great for small businesses', 29.99, 299.99, 'monthly', 5, 10, 20, '["Real-time Updates", "Custom Branding", "Email Support"]', true),
('Professional', 'Perfect for growing teams', 79.99, 799.99, 'monthly', 25, 100, 100, '["Real-time Updates", "Custom Branding", "Advanced Analytics", "API Access", "Priority Support"]', true),
('Enterprise', 'For large organizations', 199.99, 1999.99, 'monthly', 100, 1000, 500, '["Real-time Updates", "Custom Branding", "Advanced Analytics", "API Access", "Priority Support", "Team Collaboration", "White Label"]', true);

-- Update users table to reference plans properly if not already done
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='plan_id') THEN
        ALTER TABLE users ADD COLUMN plan_id UUID REFERENCES plans(id);
        CREATE INDEX idx_users_plan_id ON users(plan_id);
    END IF;
END $$;
