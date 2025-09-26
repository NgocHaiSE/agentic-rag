-- Schema for accounts table (lưu thông tin tài khoản)
-- Fields: role, họ tên (full_name), tên đăng nhập (username), mật khẩu (password_hash),
-- phòng ban (department), lĩnh vực (domain), vai trò/chức danh (title)

-- Extensions required
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Helper function to auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop table if needed (for idempotent dev runs)
DROP TABLE IF EXISTS accounts CASCADE;

-- Core table
CREATE TABLE accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Đăng nhập
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL, -- lưu hash mật khẩu, không lưu plaintext

    -- Hồ sơ
    full_name TEXT NOT NULL,
    department TEXT, -- phòng ban
    domain TEXT,     -- lĩnh vực/chuyên môn
    title TEXT,      -- vai trò/chức danh nội bộ

    -- Phân quyền
    role TEXT NOT NULL CHECK (role IN ('admin', 'manager', 'user')),

    -- Trạng thái & thời gian
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    last_login_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Thông tin mở rộng nếu cần
    metadata JSONB NOT NULL DEFAULT '{}'
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_accounts_username ON accounts (username);
CREATE INDEX IF NOT EXISTS idx_accounts_role ON accounts (role);
CREATE INDEX IF NOT EXISTS idx_accounts_department ON accounts (department);

-- Auto-update updated_at on UPDATE
DROP TRIGGER IF EXISTS trg_accounts_updated_at ON accounts;
CREATE TRIGGER trg_accounts_updated_at
BEFORE UPDATE ON accounts
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Optional sample data for local testing (comment out in production)
-- INSERT INTO accounts (username, password_hash, full_name, department, domain, title, role)
-- VALUES
--   ('admin',   '$2a$10$examplehash...', 'Quản trị hệ thống', 'CNTT',    'Hệ thống',           'Quản trị viên', 'admin'),
--   ('manager', '$2a$10$examplehash...', 'Trưởng phòng TL',  'Tài liệu', 'Quản trị tài liệu',  'Trưởng phòng', 'manager'),
--   ('user',    '$2a$10$examplehash...', 'Người dùng chuẩn', 'Kinh doanh','Bán hàng',          'Chuyên viên',  'user');

