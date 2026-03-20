CREATE DATABASE IF NOT EXISTS law_consult DEFAULT CHARSET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE law_consult;

CREATE TABLE IF NOT EXISTS users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    account VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    username VARCHAR(255) NOT NULL,
    role ENUM('user', 'lawyer', 'admin') NOT NULL,
    status ENUM('active', 'blocked', 'pending_approval') NOT NULL DEFAULT 'active',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    avatar VARCHAR(255) DEFAULT NULL,
    KEY idx_users_role (role),
    KEY idx_users_status (status),
    KEY idx_users_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS lawyer_info (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL UNIQUE,
    license_number VARCHAR(100) NOT NULL UNIQUE,
    firm_name VARCHAR(200) NOT NULL,
    specialization VARCHAR(255) NOT NULL,
    experience_years INT DEFAULT NULL,
    total_consultations INT DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    KEY idx_lawyer_info_user_id (user_id),
    CONSTRAINT fk_lawyer_info_user FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS lawyer_documents (
    id INT PRIMARY KEY AUTO_INCREMENT,
    lawyer_id INT NOT NULL,
    document_url VARCHAR(255) NOT NULL,
    document_type VARCHAR(50) NOT NULL,
    upload_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    verified_at DATETIME DEFAULT NULL,
    verified_by INT DEFAULT NULL,
    status ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
    KEY idx_lawyer_documents_lawyer_id (lawyer_id),
    KEY idx_lawyer_documents_status (status),
    KEY idx_lawyer_documents_upload_at (upload_at),
    CONSTRAINT fk_lawyer_documents_lawyer FOREIGN KEY (lawyer_id) REFERENCES users(id),
    CONSTRAINT fk_lawyer_documents_verified_by FOREIGN KEY (verified_by) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS announcements (
    id INT PRIMARY KEY AUTO_INCREMENT,
    admin_id INT NOT NULL,
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    is_pinned TINYINT(1) DEFAULT 0,
    status ENUM('draft', 'published', 'archived') NOT NULL DEFAULT 'published',
    published_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    KEY idx_announcements_status (status),
    CONSTRAINT fk_announcements_admin FOREIGN KEY (admin_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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

CREATE TABLE IF NOT EXISTS consultations (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    lawyer_id INT DEFAULT NULL,
    assignment_type ENUM('public', 'directed') NOT NULL DEFAULT 'public',
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(100) NOT NULL,
    priority ENUM('low', 'medium', 'high') NOT NULL DEFAULT 'medium',
    status ENUM('open', 'pending_accept', 'in_progress', 'resolved', 'closed') NOT NULL DEFAULT 'open',
    attachments TEXT DEFAULT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    resolved_at DATETIME DEFAULT NULL,
    user_confirmed_resolved TINYINT(1) DEFAULT 0,
    lawyer_confirmed_resolved TINYINT(1) DEFAULT 0,
    deleted_by_user TINYINT(1) DEFAULT 0,
    deleted_by_lawyer TINYINT(1) DEFAULT 0,
    deleted_by_admin TINYINT(1) DEFAULT 0,
    fee_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    pay_status ENUM('unpaid', 'escrowed', 'settled', 'refunded') NOT NULL DEFAULT 'unpaid',
    pay_at DATETIME DEFAULT NULL,
    settled_at DATETIME DEFAULT NULL,
    KEY idx_consultations_user_created (user_id, created_at),
    KEY idx_consultations_lawyer_created (lawyer_id, created_at),
    KEY idx_consultations_status (status),
    KEY idx_consultations_assignment_type (assignment_type),
    KEY idx_consultations_priority (priority),
    KEY idx_consultations_category (category),
    KEY idx_consultations_pay_status (pay_status),
    CONSTRAINT fk_consultations_user FOREIGN KEY (user_id) REFERENCES users(id),
    CONSTRAINT fk_consultations_lawyer FOREIGN KEY (lawyer_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS consultation_replies (
    id INT PRIMARY KEY AUTO_INCREMENT,
    consultation_id INT NOT NULL,
    lawyer_id INT DEFAULT NULL,
    user_id INT DEFAULT NULL,
    content TEXT NOT NULL,
    is_lawyer TINYINT(1) DEFAULT 1,
    is_solution TINYINT(1) DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    KEY idx_consultation_replies_consultation_created (consultation_id, created_at),
    KEY idx_consultation_replies_user (user_id),
    KEY idx_consultation_replies_lawyer (lawyer_id),
    CONSTRAINT fk_consultation_replies_consultation FOREIGN KEY (consultation_id) REFERENCES consultations(id),
    CONSTRAINT fk_consultation_replies_user FOREIGN KEY (user_id) REFERENCES users(id),
    CONSTRAINT fk_consultation_replies_lawyer FOREIGN KEY (lawyer_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS ai_chat_history (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    KEY idx_ai_chat_history_user_created (user_id, created_at),
    CONSTRAINT fk_ai_chat_history_user FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS complaints (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    content TEXT NOT NULL,
    reason VARCHAR(100) NOT NULL,
    type VARCHAR(50) DEFAULT NULL,
    contact VARCHAR(100) DEFAULT NULL,
    consultation_id INT DEFAULT NULL,
    status ENUM('pending', 'investigating', 'resolved', 'dismissed') NOT NULL DEFAULT 'pending',
    handle_reason TEXT DEFAULT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    resolved_at DATETIME DEFAULT NULL,
    KEY idx_complaints_user_created (user_id, created_at),
    KEY idx_complaints_status (status),
    KEY idx_complaints_consultation_id (consultation_id),
    CONSTRAINT fk_complaints_user FOREIGN KEY (user_id) REFERENCES users(id),
    CONSTRAINT fk_complaints_consultation FOREIGN KEY (consultation_id) REFERENCES consultations(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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

CREATE TABLE IF NOT EXISTS audit_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    admin_id INT NOT NULL,
    target_type VARCHAR(50) NOT NULL,
    target_id INT NOT NULL,
    action VARCHAR(50) NOT NULL,
    reason TEXT DEFAULT NULL,
    old_status VARCHAR(50) DEFAULT NULL,
    new_status VARCHAR(50) DEFAULT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    KEY idx_audit_logs_admin (admin_id),
    KEY idx_audit_logs_target_type (target_type),
    CONSTRAINT fk_audit_logs_admin FOREIGN KEY (admin_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE OR REPLACE VIEW consultation_distribution AS
SELECT COALESCE(category, 'Uncategorized') AS category, COUNT(*) AS count
FROM consultations
WHERE deleted_by_admin = 0
GROUP BY COALESCE(category, 'Uncategorized');

