-- ES TURBO Database Schema
-- WhatsApp Marketing Automation Platform

-- Users Table
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  full_name VARCHAR(100),
  account_type ENUM('free', 'active', 'admin') DEFAULT 'free',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP NULL,
  is_active BOOLEAN DEFAULT TRUE,
  is_banned BOOLEAN DEFAULT FALSE,
  can_send BOOLEAN DEFAULT TRUE,
  max_instances INT DEFAULT 0,
  INDEX idx_email (email),
  INDEX idx_username (username),
  INDEX idx_account_type (account_type),
  INDEX idx_is_banned (is_banned),
  INDEX idx_can_send (can_send)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Z-API Instances Table
CREATE TABLE IF NOT EXISTS zapi_instances (
  id INT AUTO_INCREMENT PRIMARY KEY,
  instance_id VARCHAR(100) UNIQUE NOT NULL,
  instance_token VARCHAR(255) NOT NULL,
  instance_name VARCHAR(100),
  client_token VARCHAR(255),
  secret_key VARCHAR(255),
  status ENUM('connected', 'disconnected', 'pending') DEFAULT 'disconnected',
  phone_number VARCHAR(20),
  qr_code TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_check TIMESTAMP NULL,
  is_shared BOOLEAN DEFAULT FALSE,
  INDEX idx_status (status),
  INDEX idx_instance_id (instance_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- User Instances (User WhatsApp Instances)
CREATE TABLE IF NOT EXISTS instances (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  zapi_instance_id INT,
  instance_name VARCHAR(100) NOT NULL,
  status ENUM('connected', 'disconnected', 'pending') DEFAULT 'pending',
  phone_number VARCHAR(20),
  warmup_phase INT DEFAULT 0,
  warmup_messages_sent INT DEFAULT 0,
  messages_sent_today INT DEFAULT 0,
  messages_sent_hour INT DEFAULT 0,
  last_message_time TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  connected_at TIMESTAMP NULL,
  is_active BOOLEAN DEFAULT TRUE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (zapi_instance_id) REFERENCES zapi_instances(id) ON DELETE SET NULL,
  INDEX idx_user_id (user_id),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Templates Table
CREATE TABLE IF NOT EXISTS templates (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  name VARCHAR(100) NOT NULL,
  title VARCHAR(255),
  message TEXT NOT NULL,
  footer VARCHAR(255),
  button_label VARCHAR(50),
  button_url VARCHAR(500),
  image_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Campaigns Table
CREATE TABLE IF NOT EXISTS campaigns (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  template_id INT,
  template_id_2 INT,
  template_id_3 INT,
  status ENUM('pending', 'processing', 'paused', 'completed', 'cancelled') DEFAULT 'pending',
  total_numbers INT DEFAULT 0,
  sent_count INT DEFAULT 0,
  failed_count INT DEFAULT 0,
  success_count INT DEFAULT 0,
  processing_type ENUM('realtime', 'batch') DEFAULT 'realtime',
  min_interval INT DEFAULT 15,
  max_interval INT DEFAULT 25,
  batch_size INT DEFAULT 20,
  use_proxy BOOLEAN DEFAULT FALSE,
  use_anti_ban BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  started_at TIMESTAMP NULL,
  completed_at TIMESTAMP NULL,
  paused_at TIMESTAMP NULL,
  progress_percentage DECIMAL(5,2) DEFAULT 0.00,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (template_id) REFERENCES templates(id) ON DELETE SET NULL,
  FOREIGN KEY (template_id_2) REFERENCES templates(id) ON DELETE SET NULL,
  FOREIGN KEY (template_id_3) REFERENCES templates(id) ON DELETE SET NULL,
  INDEX idx_user_id (user_id),
  INDEX idx_status (status),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Campaign Numbers Table
CREATE TABLE IF NOT EXISTS campaign_numbers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  campaign_id INT NOT NULL,
  phone_number VARCHAR(20) NOT NULL,
  var1 VARCHAR(255),
  var2 VARCHAR(255),
  var3 VARCHAR(255),
  var4 VARCHAR(255),
  var5 VARCHAR(255),
  status ENUM('pending', 'sent', 'failed', 'processing') DEFAULT 'pending',
  instance_id INT,
  sent_at TIMESTAMP NULL,
  error_message TEXT,
  template_used INT,
  tracking_url VARCHAR(500),
  FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE,
  FOREIGN KEY (instance_id) REFERENCES instances(id) ON DELETE SET NULL,
  INDEX idx_campaign_id (campaign_id),
  INDEX idx_status (status),
  INDEX idx_phone_number (phone_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Proxies Table
CREATE TABLE IF NOT EXISTS proxies (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  name VARCHAR(100) NOT NULL,
  proxy_type ENUM('http', 'https', 'socks4', 'socks5') DEFAULT 'http',
  host VARCHAR(255) NOT NULL,
  port INT NOT NULL,
  username VARCHAR(100),
  password VARCHAR(255),
  provider ENUM('decodo', 'smartproxy', 'oxylabs', 'custom') DEFAULT 'custom',
  session_type ENUM('rotating', 'sticky') DEFAULT 'rotating',
  is_active BOOLEAN DEFAULT TRUE,
  success_count INT DEFAULT 0,
  fail_count INT DEFAULT 0,
  last_used TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Link Tracking Table
CREATE TABLE IF NOT EXISTS link_clicks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  campaign_id INT NOT NULL,
  phone_number VARCHAR(20) NOT NULL,
  template_id INT,
  original_url VARCHAR(500) NOT NULL,
  tracking_code VARCHAR(50) UNIQUE NOT NULL,
  clicked_at TIMESTAMP NULL,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE,
  FOREIGN KEY (template_id) REFERENCES templates(id) ON DELETE SET NULL,
  INDEX idx_campaign_id (campaign_id),
  INDEX idx_tracking_code (tracking_code),
  INDEX idx_phone_number (phone_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- System Logs Table
CREATE TABLE IF NOT EXISTS system_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  log_type ENUM('info', 'warning', 'error', 'success') DEFAULT 'info',
  action VARCHAR(100),
  description TEXT,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_user_id (user_id),
  INDEX idx_log_type (log_type),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Activation Requests Table
CREATE TABLE IF NOT EXISTS activation_requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  request_message TEXT,
  status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  processed_at TIMESTAMP NULL,
  processed_by INT,
  admin_notes TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (processed_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_user_id (user_id),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default admin user (password: admin123)
INSERT INTO users (username, email, password, full_name, account_type)
VALUES (
  'admin',
  'admin@esturbo.com',
  '$2a$10$vI8aWBnW3fID.ZQ4/zo1G.q1lRps.9cGLcZEiGDMVr5yUP1KUOYTa',
  'Administrator',
  'admin'
) ON DUPLICATE KEY UPDATE username=username;

-- Create indexes for performance
CREATE INDEX idx_campaigns_user_status ON campaigns(user_id, status);
CREATE INDEX idx_campaign_numbers_campaign_status ON campaign_numbers(campaign_id, status);
CREATE INDEX idx_instances_user_status ON instances(user_id, status);
