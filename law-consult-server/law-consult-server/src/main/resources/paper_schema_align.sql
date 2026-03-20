USE law_consult;

ALTER TABLE lawyer_info
    MODIFY COLUMN total_consultations INT DEFAULT 0 AFTER experience_years;

ALTER TABLE announcements
    MODIFY COLUMN is_pinned TINYINT(1) DEFAULT 0 AFTER content;

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

ALTER TABLE carousel_items
    MODIFY COLUMN category VARCHAR(100) DEFAULT '' AFTER image_url;

CREATE OR REPLACE VIEW consultation_distribution AS
SELECT COALESCE(category, 'Uncategorized') AS category, COUNT(*) AS count
FROM consultations
WHERE deleted_by_admin = 0
GROUP BY COALESCE(category, 'Uncategorized');
