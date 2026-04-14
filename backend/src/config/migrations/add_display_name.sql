-- Add display_name field to zapi_instances table to store WhatsApp profile name (pushname)
ALTER TABLE zapi_instances
ADD COLUMN IF NOT EXISTS display_name VARCHAR(100) AFTER phone_number;

-- Add index for display_name
CREATE INDEX IF NOT EXISTS idx_display_name ON zapi_instances(display_name);
