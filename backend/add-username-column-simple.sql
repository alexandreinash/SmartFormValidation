-- Simple SQL to add username column (use this if the complex version doesn't work)
-- Run this if your MySQL version doesn't support IF EXISTS in ALTER TABLE

USE `db_smartform`;

-- Add username column (will fail if already exists - that's okay)
ALTER TABLE `users` ADD COLUMN `username` VARCHAR(255) NOT NULL AFTER `id`;

-- Update existing users to have a username based on email
UPDATE `users` 
SET `username` = CONCAT(SUBSTRING_INDEX(email, '@', 1), '_', FLOOR(RAND() * 1000000))
WHERE `username` IS NULL OR `username` = '' OR `username` = '0';

SELECT 'Username column added successfully!' AS message;

