-- Migration: Add instance tracking to campaigns
-- Date: 2024-12-31
-- Description: Add fields to track which instances are being used in campaigns

USE es_turbo;

-- Add instance_phone to campaign_numbers table to store the phone number of the instance used
ALTER TABLE campaign_numbers
ADD COLUMN IF NOT EXISTS instance_phone VARCHAR(20) AFTER instance_id,
ADD INDEX idx_instance_id (instance_id);

-- Add instances_used to campaigns table to track all instances used in this campaign (JSON array)
ALTER TABLE campaigns
ADD COLUMN IF NOT EXISTS instances_used JSON AFTER use_anti_ban,
ADD COLUMN IF NOT EXISTS active_instances_count INT DEFAULT 0 AFTER instances_used;

-- Update existing records to have empty JSON array
UPDATE campaigns SET instances_used = JSON_ARRAY() WHERE instances_used IS NULL;
