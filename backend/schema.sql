-- Smart Form Validator Database Schema
-- MySQL 8.0+ with InnoDB Engine
-- Character Set: utf8mb4 for full Unicode support

-- Drop existing tables if they exist (in reverse order of dependencies)
DROP TABLE IF EXISTS audit_logs;
DROP TABLE IF EXISTS password_resets;
DROP TABLE IF EXISTS form_permissions;
DROP TABLE IF EXISTS group_members;
DROP TABLE IF EXISTS groups;
DROP TABLE IF EXISTS submission_data;
DROP TABLE IF EXISTS submissions;
DROP TABLE IF EXISTS form_fields;
DROP TABLE IF EXISTS forms;
DROP TABLE IF EXISTS users;

-- ============================================================================
-- TABLE: users
-- Description: System users with role-based access control
-- ============================================================================
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL COMMENT 'Bcrypt hashed password',
    role ENUM('admin', 'user') NOT NULL DEFAULT 'user',
    account_id INT NULL COMMENT 'Self-referential FK for multi-tenancy',
    is_account_owner BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    -- Indexes
    INDEX idx_users_role (role),
    INDEX idx_users_account_id (account_id),
    INDEX idx_users_created_at (created_at),
    
    -- Self-referential foreign key for multi-tenancy
    CONSTRAINT fk_users_account 
        FOREIGN KEY (account_id) 
        REFERENCES users(id) 
        ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABLE: forms
-- Description: Dynamic form definitions created by administrators
-- ============================================================================
CREATE TABLE forms (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    created_by INT NOT NULL,
    account_id INT NULL COMMENT 'Account owner for multi-tenancy',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    -- Indexes
    INDEX idx_forms_created_by (created_by),
    INDEX idx_forms_account_id (account_id),
    INDEX idx_forms_created_at (created_at),
    
    -- Foreign keys
    CONSTRAINT fk_forms_created_by 
        FOREIGN KEY (created_by) 
        REFERENCES users(id) 
        ON DELETE CASCADE,
    CONSTRAINT fk_forms_account 
        FOREIGN KEY (account_id) 
        REFERENCES users(id) 
        ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABLE: form_fields
-- Description: Individual field configurations within forms
-- ============================================================================
CREATE TABLE form_fields (
    id INT AUTO_INCREMENT PRIMARY KEY,
    form_id INT NOT NULL,
    label VARCHAR(255) NOT NULL,
    type ENUM('text', 'email', 'number', 'textarea', 'phone', 'date', 'select', 'checkbox', 'file') NOT NULL,
    is_required BOOLEAN DEFAULT FALSE,
    ai_validation_enabled BOOLEAN DEFAULT FALSE,
    expected_entity VARCHAR(50) DEFAULT 'none' COMMENT 'Expected NLP entity type',
    expected_sentiment VARCHAR(50) DEFAULT 'any' COMMENT 'Expected sentiment (positive, negative, neutral, any)',
    options TEXT NULL COMMENT 'JSON options for select/checkbox fields',
    
    -- Indexes
    INDEX idx_form_fields_form_id (form_id),
    INDEX idx_form_fields_type (type),
    INDEX idx_form_fields_ai_enabled (ai_validation_enabled),
    
    -- Foreign key
    CONSTRAINT fk_form_fields_form 
        FOREIGN KEY (form_id) 
        REFERENCES forms(id) 
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABLE: submissions
-- Description: Form submission instances
-- ============================================================================
CREATE TABLE submissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    form_id INT NOT NULL,
    submitted_by INT NULL COMMENT 'NULL for anonymous submissions',
    submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    -- Indexes
    INDEX idx_submissions_form_id (form_id),
    INDEX idx_submissions_submitted_by (submitted_by),
    INDEX idx_submissions_submitted_at (submitted_at),
    INDEX idx_submissions_form_date (form_id, submitted_at),
    
    -- Foreign keys
    CONSTRAINT fk_submissions_form 
        FOREIGN KEY (form_id) 
        REFERENCES forms(id) 
        ON DELETE CASCADE,
    CONSTRAINT fk_submissions_user 
        FOREIGN KEY (submitted_by) 
        REFERENCES users(id) 
        ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABLE: submission_data
-- Description: Individual field values with AI validation results
-- ============================================================================
CREATE TABLE submission_data (
    id INT AUTO_INCREMENT PRIMARY KEY,
    submission_id INT NOT NULL,
    field_id INT NOT NULL,
    value TEXT NOT NULL,
    ai_sentiment_flag BOOLEAN DEFAULT FALSE COMMENT 'Sentiment mismatch detected',
    ai_entity_flag BOOLEAN DEFAULT FALSE COMMENT 'Entity mismatch detected',
    ai_not_evaluated BOOLEAN DEFAULT FALSE COMMENT 'AI validation skipped/failed',
    ai_errors TEXT NULL COMMENT 'JSON array of AI error details',
    
    -- Indexes
    INDEX idx_submission_data_submission_id (submission_id),
    INDEX idx_submission_data_field_id (field_id),
    INDEX idx_submission_data_ai_flags (ai_sentiment_flag, ai_entity_flag),
    INDEX idx_submission_data_composite (submission_id, field_id),
    
    -- Foreign keys
    CONSTRAINT fk_submission_data_submission 
        FOREIGN KEY (submission_id) 
        REFERENCES submissions(id) 
        ON DELETE CASCADE,
    CONSTRAINT fk_submission_data_field 
        FOREIGN KEY (field_id) 
        REFERENCES form_fields(id) 
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABLE: groups
-- Description: Collaboration groups for form sharing
-- ============================================================================
CREATE TABLE groups (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT NULL,
    created_by INT NOT NULL,
    account_id INT NULL COMMENT 'Account owner for multi-tenancy',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    -- Indexes
    INDEX idx_groups_created_by (created_by),
    INDEX idx_groups_account_id (account_id),
    INDEX idx_groups_name (name),
    
    -- Foreign keys
    CONSTRAINT fk_groups_created_by 
        FOREIGN KEY (created_by) 
        REFERENCES users(id) 
        ON DELETE CASCADE,
    CONSTRAINT fk_groups_account 
        FOREIGN KEY (account_id) 
        REFERENCES users(id) 
        ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABLE: group_members
-- Description: User memberships in groups
-- ============================================================================
CREATE TABLE group_members (
    id INT AUTO_INCREMENT PRIMARY KEY,
    group_id INT NOT NULL,
    user_id INT NOT NULL,
    role ENUM('owner', 'admin', 'member') DEFAULT 'member',
    joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    -- Indexes
    INDEX idx_group_members_group_id (group_id),
    INDEX idx_group_members_user_id (user_id),
    INDEX idx_group_members_role (role),
    
    -- Unique constraint: User can only join a group once
    UNIQUE KEY uk_group_members_group_user (group_id, user_id),
    
    -- Foreign keys
    CONSTRAINT fk_group_members_group 
        FOREIGN KEY (group_id) 
        REFERENCES groups(id) 
        ON DELETE CASCADE,
    CONSTRAINT fk_group_members_user 
        FOREIGN KEY (user_id) 
        REFERENCES users(id) 
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABLE: form_permissions
-- Description: Fine-grained access control for forms shared with groups
-- ============================================================================
CREATE TABLE form_permissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    form_id INT NOT NULL,
    group_id INT NOT NULL,
    permission_type ENUM('view', 'edit', 'submit') NOT NULL,
    granted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    -- Indexes
    INDEX idx_form_permissions_form_id (form_id),
    INDEX idx_form_permissions_group_id (group_id),
    INDEX idx_form_permissions_type (permission_type),
    
    -- Unique constraint: Each group can have one permission type per form
    UNIQUE KEY uk_form_permissions_form_group (form_id, group_id, permission_type),
    
    -- Foreign keys
    CONSTRAINT fk_form_permissions_form 
        FOREIGN KEY (form_id) 
        REFERENCES forms(id) 
        ON DELETE CASCADE,
    CONSTRAINT fk_form_permissions_group 
        FOREIGN KEY (group_id) 
        REFERENCES groups(id) 
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABLE: password_resets
-- Description: Token-based password recovery system
-- ============================================================================
CREATE TABLE password_resets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    token VARCHAR(255) NOT NULL UNIQUE,
    expires_at DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    used BOOLEAN DEFAULT FALSE,
    
    -- Indexes
    INDEX idx_password_resets_user_id (user_id),
    INDEX idx_password_resets_token (token),
    INDEX idx_password_resets_expires_at (expires_at),
    INDEX idx_password_resets_used (used),
    
    -- Foreign key
    CONSTRAINT fk_password_resets_user 
        FOREIGN KEY (user_id) 
        REFERENCES users(id) 
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABLE: audit_logs
-- Description: System activity tracking and audit trail
-- ============================================================================
CREATE TABLE audit_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NULL COMMENT 'NULL for system actions',
    action VARCHAR(255) NOT NULL,
    entity_type VARCHAR(100) NULL,
    entity_id INT NULL,
    details TEXT NULL COMMENT 'Additional JSON details',
    ip_address VARCHAR(45) NULL COMMENT 'IPv4 or IPv6 address',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    -- Indexes
    INDEX idx_audit_logs_user_id (user_id),
    INDEX idx_audit_logs_action (action),
    INDEX idx_audit_logs_entity (entity_type, entity_id),
    INDEX idx_audit_logs_created_at (created_at),
    INDEX idx_audit_logs_composite (user_id, created_at),
    
    -- Foreign key
    CONSTRAINT fk_audit_logs_user 
        FOREIGN KEY (user_id) 
        REFERENCES users(id) 
        ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- SAMPLE DATA (Optional - Remove in production)
-- ============================================================================

-- Insert admin user (password: Admin@123)
INSERT INTO users (username, email, password, role, is_account_owner) VALUES
('Admin User', 'admin@smartform.com', '$2a$10$YourHashedPasswordHere', 'admin', TRUE);

-- Insert regular user (password: User@123)
INSERT INTO users (username, email, password, role, is_account_owner) VALUES
('Test User', 'user@smartform.com', '$2a$10$YourHashedPasswordHere', 'user', TRUE);

-- ============================================================================
-- DATABASE SETUP COMPLETE
-- ============================================================================
-- Total Tables: 10
-- - users (authentication & multi-tenancy)
-- - forms (form definitions)
-- - form_fields (field configurations)
-- - submissions (submission records)
-- - submission_data (field values with AI flags)
-- - groups (collaboration groups)
-- - group_members (group membership)
-- - form_permissions (access control)
-- - password_resets (password recovery)
-- - audit_logs (activity tracking)
-- ============================================================================
