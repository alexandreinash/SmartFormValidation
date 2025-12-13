-- Simple migration script to add account_id and is_account_owner columns
-- Run this SQL in your MySQL database

USE db_smartform;

-- Add account_id column
ALTER TABLE `users` 
ADD COLUMN `account_id` INT NULL AFTER `role`;

-- Add is_account_owner column
ALTER TABLE `users`
ADD COLUMN `is_account_owner` BOOLEAN DEFAULT FALSE AFTER `account_id`;

-- Add index on account_id
ALTER TABLE `users`
ADD INDEX `idx_account_id` (`account_id`);

-- Add foreign key constraint (remove the constraint name if it already exists)
ALTER TABLE `users`
ADD CONSTRAINT `users_ibfk_1` FOREIGN KEY (`account_id`) REFERENCES `users`(`id`) ON DELETE SET NULL;

