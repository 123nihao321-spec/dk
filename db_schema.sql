DROP TABLE IF EXISTS store_items;
DROP TABLE IF EXISTS transactions;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS invite_codes;

CREATE TABLE IF NOT EXISTS store_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    cost INTEGER NOT NULL,
    icon TEXT,
    desc TEXT,
    created_at INTEGER
);

CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    user_name TEXT,
    user_avatar TEXT,
    item_name TEXT NOT NULL,
    item_icon TEXT,
    cost INTEGER NOT NULL,
    timestamp INTEGER,
    date_str TEXT
);

-- 新增：用户表
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    nickname TEXT,
    avatar TEXT,
    created_at INTEGER
);

-- 新增：邀请码表
CREATE TABLE IF NOT EXISTS invite_codes (
    code TEXT PRIMARY KEY,
    is_used BOOLEAN DEFAULT 0,
    used_by TEXT,
    created_at INTEGER
);

-- 初始化一些数据（可选）
INSERT INTO store_items (name, cost, icon, desc, created_at) VALUES 
('补签卡', 50, '🎫', '错过打卡？用它复活！', 1700000000000),
('神秘盲盒', 100, '🎁', '随机获得 10-200 积分', 1700000000000);