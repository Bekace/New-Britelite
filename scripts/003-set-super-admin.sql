-- Set bekace.multimedia@gmail.com as super admin
UPDATE users 
SET 
    role = 'admin',
    is_email_verified = true,
    updated_at = CURRENT_TIMESTAMP
WHERE email = 'bekace.multimedia@gmail.com';

-- Verify the update
SELECT 
    id, email, first_name, last_name, role, is_email_verified, is_active
FROM users 
WHERE email = 'bekace.multimedia@gmail.com';
