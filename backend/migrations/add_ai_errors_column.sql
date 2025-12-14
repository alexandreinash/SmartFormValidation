-- Migration: Add ai_errors column to submission_data table
-- This column stores all AI-detected errors with corrections as JSON

ALTER TABLE `submission_data` 
ADD COLUMN `ai_errors` TEXT NULL 
AFTER `ai_not_evaluated`;

-- Add index for queries filtering by AI errors (optional, for performance)
-- Note: Since ai_errors is TEXT/JSON, we can't create a standard index on it
-- If needed, consider using generated columns or JSON indexes (MySQL 5.7+)


