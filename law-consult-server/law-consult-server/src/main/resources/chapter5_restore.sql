USE law_consult;

ALTER TABLE lawyer_info
    MODIFY COLUMN total_consultations INT DEFAULT 0 AFTER experience_years;

SET @sql = IF(
    (SELECT COUNT(*) FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'announcements'
       AND COLUMN_NAME = 'status') > 0,
    'SELECT 1',
    "ALTER TABLE announcements ADD COLUMN status ENUM('draft', 'published', 'archived') NOT NULL DEFAULT 'published' AFTER is_pinned"
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

ALTER TABLE announcements
    MODIFY COLUMN is_pinned TINYINT(1) DEFAULT 0 AFTER content,
    MODIFY COLUMN status ENUM('draft', 'published', 'archived') NOT NULL DEFAULT 'published' AFTER is_pinned,
    MODIFY COLUMN published_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP AFTER status,
    MODIFY COLUMN created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP AFTER published_at,
    MODIFY COLUMN updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER created_at;

SET @sql = IF(
    (SELECT COUNT(*) FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'consultations'
       AND COLUMN_NAME = 'assignment_type') > 0,
    'SELECT 1',
    "ALTER TABLE consultations ADD COLUMN assignment_type ENUM('public', 'directed') NOT NULL DEFAULT 'public' AFTER lawyer_id"
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = IF(
    (SELECT COUNT(*) FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'consultations'
       AND COLUMN_NAME = 'fee_amount') > 0,
    'SELECT 1',
    'ALTER TABLE consultations ADD COLUMN fee_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00 AFTER status'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = IF(
    (SELECT COUNT(*) FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'consultations'
       AND COLUMN_NAME = 'pay_status') > 0,
    'SELECT 1',
    "ALTER TABLE consultations ADD COLUMN pay_status ENUM('unpaid', 'escrowed', 'settled', 'refunded') NOT NULL DEFAULT 'unpaid' AFTER fee_amount"
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = IF(
    (SELECT COUNT(*) FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'consultations'
       AND COLUMN_NAME = 'pay_at') > 0,
    'SELECT 1',
    'ALTER TABLE consultations ADD COLUMN pay_at DATETIME DEFAULT NULL AFTER pay_status'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = IF(
    (SELECT COUNT(*) FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'consultations'
       AND COLUMN_NAME = 'settled_at') > 0,
    'SELECT 1',
    'ALTER TABLE consultations ADD COLUMN settled_at DATETIME DEFAULT NULL AFTER pay_at'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = IF(
    (SELECT COUNT(*) FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'consultations'
       AND COLUMN_NAME = 'deleted_by_admin') > 0,
    'SELECT 1',
    'ALTER TABLE consultations ADD COLUMN deleted_by_admin TINYINT(1) DEFAULT 0 AFTER deleted_by_lawyer'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

UPDATE consultations
SET assignment_type = CASE WHEN lawyer_id IS NULL THEN 'public' ELSE 'directed' END
WHERE assignment_type IS NULL;

UPDATE consultations
SET pay_status = 'unpaid'
WHERE pay_status IS NULL;

UPDATE consultations
SET category = 'general'
WHERE category IS NULL OR TRIM(category) = '';

ALTER TABLE consultations
    MODIFY COLUMN lawyer_id INT DEFAULT NULL AFTER user_id,
    MODIFY COLUMN assignment_type ENUM('public', 'directed') NOT NULL DEFAULT 'public' AFTER lawyer_id,
    MODIFY COLUMN title VARCHAR(200) NOT NULL AFTER assignment_type,
    MODIFY COLUMN description TEXT NOT NULL AFTER title,
    MODIFY COLUMN category VARCHAR(100) NOT NULL AFTER description,
    MODIFY COLUMN priority ENUM('low', 'medium', 'high') NOT NULL DEFAULT 'medium' AFTER category,
    MODIFY COLUMN status ENUM('open', 'pending_accept', 'in_progress', 'resolved', 'closed') NOT NULL DEFAULT 'open' AFTER priority,
    MODIFY COLUMN attachments TEXT DEFAULT NULL AFTER status,
    MODIFY COLUMN created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP AFTER attachments,
    MODIFY COLUMN updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER created_at,
    MODIFY COLUMN resolved_at DATETIME DEFAULT NULL AFTER updated_at,
    MODIFY COLUMN user_confirmed_resolved TINYINT(1) DEFAULT 0 AFTER resolved_at,
    MODIFY COLUMN lawyer_confirmed_resolved TINYINT(1) DEFAULT 0 AFTER user_confirmed_resolved,
    MODIFY COLUMN deleted_by_user TINYINT(1) DEFAULT 0 AFTER lawyer_confirmed_resolved,
    MODIFY COLUMN deleted_by_lawyer TINYINT(1) DEFAULT 0 AFTER deleted_by_user,
    MODIFY COLUMN deleted_by_admin TINYINT(1) DEFAULT 0 AFTER deleted_by_lawyer,
    MODIFY COLUMN fee_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00 AFTER deleted_by_admin,
    MODIFY COLUMN pay_status ENUM('unpaid', 'escrowed', 'settled', 'refunded') NOT NULL DEFAULT 'unpaid' AFTER fee_amount,
    MODIFY COLUMN pay_at DATETIME DEFAULT NULL AFTER pay_status,
    MODIFY COLUMN settled_at DATETIME DEFAULT NULL AFTER pay_at;

ALTER TABLE consultation_replies
    MODIFY COLUMN lawyer_id INT DEFAULT NULL AFTER consultation_id,
    MODIFY COLUMN user_id INT DEFAULT NULL AFTER lawyer_id,
    MODIFY COLUMN content TEXT NOT NULL AFTER user_id,
    MODIFY COLUMN is_lawyer TINYINT(1) DEFAULT 1 AFTER content,
    MODIFY COLUMN is_solution TINYINT(1) DEFAULT 0 AFTER is_lawyer,
    MODIFY COLUMN created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP AFTER is_solution,
    MODIFY COLUMN updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER created_at;

SET @sql = IF(
    (SELECT COUNT(*) FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'complaints'
       AND COLUMN_NAME = 'type') > 0,
    'SELECT 1',
    'ALTER TABLE complaints ADD COLUMN type VARCHAR(50) DEFAULT NULL AFTER reason'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = IF(
    (SELECT COUNT(*) FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'complaints'
       AND COLUMN_NAME = 'contact') > 0,
    'SELECT 1',
    'ALTER TABLE complaints ADD COLUMN contact VARCHAR(100) DEFAULT NULL AFTER type'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = IF(
    (SELECT COUNT(*) FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'complaints'
       AND COLUMN_NAME = 'consultation_id') > 0,
    'SELECT 1',
    'ALTER TABLE complaints ADD COLUMN consultation_id INT DEFAULT NULL AFTER contact'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = IF(
    (SELECT COUNT(*) FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'complaints'
       AND COLUMN_NAME = 'handle_reason') > 0,
    'SELECT 1',
    'ALTER TABLE complaints ADD COLUMN handle_reason TEXT DEFAULT NULL AFTER status'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

UPDATE complaints
SET reason = 'unspecified'
WHERE reason IS NULL OR TRIM(reason) = '';

ALTER TABLE complaints
    MODIFY COLUMN reason VARCHAR(100) NOT NULL AFTER content,
    MODIFY COLUMN type VARCHAR(50) DEFAULT NULL AFTER reason,
    MODIFY COLUMN contact VARCHAR(100) DEFAULT NULL AFTER type,
    MODIFY COLUMN consultation_id INT DEFAULT NULL AFTER contact,
    MODIFY COLUMN status ENUM('pending', 'investigating', 'resolved', 'dismissed') NOT NULL DEFAULT 'pending' AFTER consultation_id,
    MODIFY COLUMN handle_reason TEXT DEFAULT NULL AFTER status,
    MODIFY COLUMN created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP AFTER handle_reason,
    MODIFY COLUMN updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER created_at,
    MODIFY COLUMN resolved_at DATETIME DEFAULT NULL AFTER updated_at;

UPDATE complaints
SET resolved_at = COALESCE(resolved_at, updated_at)
WHERE status IN ('resolved', 'dismissed');

CREATE TABLE IF NOT EXISTS carousel_items (
    id INT PRIMARY KEY AUTO_INCREMENT,
    admin_id INT NOT NULL,
    title VARCHAR(200) NOT NULL,
    summary VARCHAR(500) DEFAULT NULL,
    content TEXT NOT NULL,
    image_url VARCHAR(500) NOT NULL,
    category VARCHAR(100) DEFAULT '',
    sort_order INT NOT NULL DEFAULT 0,
    status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
    start_time DATETIME DEFAULT NULL,
    end_time DATETIME DEFAULT NULL,
    view_count INT NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    KEY idx_carousel_items_status (status),
    KEY idx_carousel_items_sort_order (sort_order),
    KEY idx_carousel_items_active_window (start_time, end_time),
    CONSTRAINT fk_carousel_items_admin FOREIGN KEY (admin_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE carousel_items
    MODIFY COLUMN category VARCHAR(100) DEFAULT '' AFTER image_url;

CREATE TABLE IF NOT EXISTS wallet_accounts (
    id INT PRIMARY KEY AUTO_INCREMENT,
    owner_type ENUM('user', 'lawyer') NOT NULL,
    owner_id INT NOT NULL,
    available_balance DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    frozen_balance DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    total_income DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    total_withdrawn DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    version INT NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_wallet_accounts_owner (owner_type, owner_id),
    KEY idx_wallet_accounts_owner_id (owner_id),
    CONSTRAINT fk_wallet_accounts_owner FOREIGN KEY (owner_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS wallet_flows (
    id INT PRIMARY KEY AUTO_INCREMENT,
    owner_type ENUM('user', 'lawyer') NOT NULL,
    owner_id INT NOT NULL,
    biz_type VARCHAR(50) NOT NULL,
    biz_id INT DEFAULT NULL,
    direction ENUM('in', 'out') NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    status ENUM('pending', 'success', 'rejected') NOT NULL DEFAULT 'success',
    balance_after DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    remark VARCHAR(255) DEFAULT NULL,
    operator_id INT DEFAULT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    KEY idx_wallet_flows_owner (owner_type, owner_id, created_at),
    KEY idx_wallet_flows_owner_id (owner_id),
    KEY idx_wallet_flows_biz (biz_type, biz_id),
    CONSTRAINT fk_wallet_flows_owner FOREIGN KEY (owner_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO wallet_accounts (owner_type, owner_id, available_balance, frozen_balance, total_income, total_withdrawn, version)
SELECT role, id, 0.00, 0.00, 0.00, 0.00, 0
FROM users
WHERE role IN ('user', 'lawyer');

CREATE OR REPLACE VIEW consultation_distribution AS
SELECT COALESCE(category, 'Uncategorized') AS category, COUNT(*) AS count
FROM consultations
WHERE deleted_by_admin = 0
GROUP BY COALESCE(category, 'Uncategorized');
