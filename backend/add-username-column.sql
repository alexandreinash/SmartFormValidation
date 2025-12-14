-- Add username column to users table
-- This fixes the registration issue where username is required but column doesn't exist

USE `db_smartform`;

-- Add username column if it doesn't exist
-- Note: This will fail if column already exists, which is fine - just run the UPDATE part below
SET @dbname = DATABASE();
SET @tablename = "users";
SET @columnname = "username";
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (column_name = @columnname)
  ) > 0,
  "SELECT 'Column already exists.' AS message;",
  "ALTER TABLE `users` ADD COLUMN `username` VARCHAR(255) NOT NULL AFTER `id`;"
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- If column already exists but allows NULL, make it NOT NULL (safe to run)
SET @preparedStatement2 = (SELECT IF(
  (
    SELECT IS_NULLABLE FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (column_name = @columnname)
  ) = 'YES',
  "ALTER TABLE `users` MODIFY COLUMN `username` VARCHAR(255) NOT NULL;",
  "SELECT 'Column is already NOT NULL.' AS message;"
));
PREPARE alterIfNull FROM @preparedStatement2;
EXECUTE alterIfNull;
DEALLOCATE PREPARE alterIfNull;

-- For existing users without username, generate one from email (safe to run multiple times)
UPDATE `users` 
SET `username` = CONCAT(SUBSTRING_INDEX(email, '@', 1), '_', FLOOR(RAND() * 1000000))
WHERE `username` IS NULL OR `username` = '' OR `username` = '0';

SELECT 'Username column migration completed successfully!' AS message;

