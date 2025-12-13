-- Migration script to add account_id and is_account_owner columns to users table
-- Run this if your users table doesn't have these columns

USE db_smartform;

-- Add account_id column if it doesn't exist
ALTER TABLE `users` 
ADD COLUMN IF NOT EXISTS `account_id` INT NULL AFTER `role`,
ADD INDEX IF NOT EXISTS `idx_account_id` (`account_id`);

-- Add is_account_owner column if it doesn't exist  
ALTER TABLE `users`
ADD COLUMN IF NOT EXISTS `is_account_owner` BOOLEAN DEFAULT FALSE AFTER `account_id`;

-- Add foreign key constraint if it doesn't exist
-- Note: MySQL doesn't support "IF NOT EXISTS" for foreign keys, so this might fail if it already exists
-- In that case, just ignore the error
SET @fk_exists = (
    SELECT COUNT(*) 
    FROM information_schema.table_constraints 
    WHERE constraint_schema = 'db_smartform' 
    AND table_name = 'users' 
    AND constraint_name = 'users_ibfk_1'
);

SET @sql = IF(@fk_exists = 0,
    'ALTER TABLE `users` ADD CONSTRAINT `users_ibfk_1` FOREIGN KEY (`account_id`) REFERENCES `users`(`id`) ON DELETE SET NULL',
    'SELECT "Foreign key already exists" AS message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

