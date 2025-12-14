-- Smart Form Validator Database Initialization Script
-- This script creates the database and all required tables

-- Create database (if it doesn't exist)
CREATE DATABASE IF NOT EXISTS `db_smartform` 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE `db_smartform`;

-- Drop tables if they exist (in reverse order of dependencies)
DROP TABLE IF EXISTS `audit_logs`;
DROP TABLE IF EXISTS `submission_data`;
DROP TABLE IF EXISTS `submissions`;
DROP TABLE IF EXISTS `form_fields`;
DROP TABLE IF EXISTS `forms`;
DROP TABLE IF EXISTS `users`;

-- Table: users
CREATE TABLE `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `username` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL,
  `role` ENUM('admin', 'user') NOT NULL,
  `account_id` INT NULL,
  `is_account_owner` BOOLEAN DEFAULT FALSE,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`account_id`) REFERENCES `users`(`id`) ON DELETE SET NULL,
  INDEX `idx_email` (`email`),
  INDEX `idx_role` (`role`),
  INDEX `idx_account_id` (`account_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: forms
CREATE TABLE `forms` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `title` VARCHAR(255) NOT NULL,
  `created_by` INT NOT NULL,
  `account_id` INT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`account_id`) REFERENCES `users`(`id`) ON DELETE SET NULL,
  INDEX `idx_created_by` (`created_by`),
  INDEX `idx_account_id` (`account_id`),
  INDEX `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: form_fields
CREATE TABLE `form_fields` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `form_id` INT NOT NULL,
  `label` VARCHAR(255) NOT NULL,
  `type` ENUM('text', 'email', 'number', 'textarea', 'phone', 'date', 'select', 'checkbox', 'file') NOT NULL,
  `is_required` BOOLEAN DEFAULT FALSE,
  `ai_validation_enabled` BOOLEAN DEFAULT FALSE,
  `expected_entity` VARCHAR(50) NOT NULL DEFAULT 'none',
  `expected_sentiment` VARCHAR(50) NOT NULL DEFAULT 'any',
  `options` TEXT NULL,
  FOREIGN KEY (`form_id`) REFERENCES `forms`(`id`) ON DELETE CASCADE,
  INDEX `idx_form_id` (`form_id`),
  INDEX `idx_type` (`type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: submissions
CREATE TABLE `submissions` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `form_id` INT NOT NULL,
  `submitted_by` INT NULL,
  `submitted_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`form_id`) REFERENCES `forms`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`submitted_by`) REFERENCES `users`(`id`) ON DELETE SET NULL,
  INDEX `idx_form_id` (`form_id`),
  INDEX `idx_submitted_by` (`submitted_by`),
  INDEX `idx_submitted_at` (`submitted_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: submission_data
CREATE TABLE `submission_data` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `submission_id` INT NOT NULL,
  `field_id` INT NOT NULL,
  `value` TEXT NOT NULL,
  `ai_sentiment_flag` BOOLEAN DEFAULT FALSE,
  `ai_entity_flag` BOOLEAN DEFAULT FALSE,
  `ai_not_evaluated` BOOLEAN DEFAULT FALSE,
  `ai_errors` TEXT NULL,
  FOREIGN KEY (`submission_id`) REFERENCES `submissions`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`field_id`) REFERENCES `form_fields`(`id`) ON DELETE CASCADE,
  INDEX `idx_submission_id` (`submission_id`),
  INDEX `idx_field_id` (`field_id`),
  INDEX `idx_ai_flags` (`ai_sentiment_flag`, `ai_entity_flag`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: audit_logs
CREATE TABLE `audit_logs` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NULL,
  `action` VARCHAR(255) NOT NULL,
  `entity_type` VARCHAR(100) NULL,
  `entity_id` INT NULL,
  `metadata` JSON NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL,
  INDEX `idx_user_id` (`user_id`),
  INDEX `idx_action` (`action`),
  INDEX `idx_entity` (`entity_type`, `entity_id`),
  INDEX `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: form_permissions
CREATE TABLE `form_permissions` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `form_id` INT NOT NULL,
  `user_id` INT NULL,
  `account_id` INT NULL,
  `permission_type` ENUM('view', 'edit', 'admin') NOT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`form_id`) REFERENCES `forms`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`account_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  UNIQUE KEY `unique_form_user_permission` (`form_id`, `user_id`),
  UNIQUE KEY `unique_form_account_permission` (`form_id`, `account_id`),
  INDEX `idx_form_id` (`form_id`),
  INDEX `idx_user_id` (`user_id`),
  INDEX `idx_account_id` (`account_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Success message
SELECT 'Database initialized successfully!' AS message;

