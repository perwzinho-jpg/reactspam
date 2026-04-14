-- Migration: Add admin control columns to users table
-- Date: 2024-01-15

-- Add is_banned column (ignore if already exists)
SET @exist := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'is_banned');
SET @query := IF(@exist = 0, 'ALTER TABLE users ADD COLUMN is_banned BOOLEAN DEFAULT FALSE', 'SELECT 1');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add can_send column (ignore if already exists)
SET @exist := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'can_send');
SET @query := IF(@exist = 0, 'ALTER TABLE users ADD COLUMN can_send BOOLEAN DEFAULT TRUE', 'SELECT 1');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add max_instances column (ignore if already exists)
SET @exist := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'max_instances');
SET @query := IF(@exist = 0, 'ALTER TABLE users ADD COLUMN max_instances INT DEFAULT 0', 'SELECT 1');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
