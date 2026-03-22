-- Logs de eventos do sistema
CREATE TABLE IF NOT EXISTS logs (
  id SERIAL PRIMARY KEY,
  level VARCHAR(16) NOT NULL,
  message TEXT NOT NULL,
  username VARCHAR(64),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- Schema for FinFlow Pro

-- Users table for authentication
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS accounts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  name VARCHAR(255) NOT NULL,
  balance DECIMAL(10,2) NOT NULL,
  icon VARCHAR(10),
  color VARCHAR(50),
  type VARCHAR(20) CHECK (type IN ('checking', 'savings', 'wallet', 'credit_card'))
);

CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  name VARCHAR(255) NOT NULL,
  type VARCHAR(10) CHECK (type IN ('income', 'expense')),
  icon VARCHAR(10),
  budget_limit DECIMAL(10,2)
);

CREATE TABLE IF NOT EXISTS transactions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  account_id INTEGER REFERENCES accounts(id),
  type VARCHAR(10) CHECK (type IN ('income', 'expense')),
  amount DECIMAL(10,2) NOT NULL,
  category VARCHAR(255),
  description TEXT,
  date DATE NOT NULL,
  installments INTEGER,
  current_installment INTEGER,
  parent_id INTEGER REFERENCES transactions(id),
  recurring BOOLEAN DEFAULT FALSE,
  recurring_day INTEGER
);

CREATE TABLE IF NOT EXISTS credit_cards (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  name VARCHAR(255) NOT NULL,
  icon VARCHAR(10),
  "limit" DECIMAL(10,2) NOT NULL,
  used DECIMAL(10,2) DEFAULT 0,
  closing_day INTEGER NOT NULL,
  due_day INTEGER NOT NULL,
  color VARCHAR(50)
);

CREATE TABLE IF NOT EXISTS goals (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  name VARCHAR(255) NOT NULL,
  target DECIMAL(10,2) NOT NULL,
  current DECIMAL(10,2) DEFAULT 0,
  deadline DATE,
  color VARCHAR(50)
);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(20) CHECK (type IN ('warning', 'info', 'success', 'danger')),
  date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  read BOOLEAN DEFAULT FALSE
);

-- Monthly Plans
CREATE TABLE IF NOT EXISTS monthly_plans (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  month VARCHAR(7) NOT NULL, -- "2026-03"
  expected_income DECIMAL(10,2) NOT NULL,
  expected_expense DECIMAL(10,2) NOT NULL,
  notes TEXT,
  UNIQUE(user_id, month)
);

-- Settings
CREATE TABLE IF NOT EXISTS settings (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) UNIQUE,
  user_name VARCHAR(255),
  email VARCHAR(255),
  currency VARCHAR(3) DEFAULT 'BRL',
  language VARCHAR(10) DEFAULT 'pt-BR',
  notifications_enabled BOOLEAN DEFAULT TRUE,
  alert_days_before INTEGER DEFAULT 3,
  monthly_budget DECIMAL(10,2),
  dark_mode BOOLEAN DEFAULT TRUE
);

-- Budgets (separate from categories for flexibility)
CREATE TABLE IF NOT EXISTS budgets (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  category_id INTEGER REFERENCES categories(id),
  month VARCHAR(7) NOT NULL, -- "2026-03"
  amount DECIMAL(10,2) NOT NULL,
  UNIQUE(user_id, category_id, month)
);