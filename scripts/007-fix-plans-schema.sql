-- Fix plans table schema to match the application
DROP TABLE IF EXISTS plans CASCADE;

CREATE TABLE plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price_monthly DECIMAL(10,2) NOT NULL DEFAULT 0,
  price_yearly DECIMAL(10,2) NOT NULL DEFAULT 0,
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

-- Insert sample plans
INSERT INTO plans (name, description, price_monthly, price_yearly, max_screens, max_storage_gb, max_playlists, features, is_active) VALUES
('Basic', 'Perfect for small businesses getting started with digital signage', 29.99, 299.99, 3, 5, 10, '["HD Video Support", "Basic Analytics", "Email Support"]', true),
('Professional', 'Ideal for growing businesses with multiple locations', 79.99, 799.99, 10, 25, 50, '["4K Video Support", "Advanced Analytics", "Priority Support", "Custom Branding"]', true),
('Enterprise', 'Complete solution for large organizations', 199.99, 1999.99, 50, 100, 200, '["4K Video Support", "Advanced Analytics", "24/7 Phone Support", "Custom Branding", "API Access", "White Label"]', true);

-- Update users table to reference plans properly
ALTER TABLE users ADD COLUMN IF NOT EXISTS plan_id UUID REFERENCES plans(id);

-- Create index on users plan_id
CREATE INDEX IF NOT EXISTS idx_users_plan_id ON users(plan_id);
