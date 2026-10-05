const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '../../data/isp_billing.db');
fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

const schema = `
-- ========== ROLES ==========
CREATE TABLE IF NOT EXISTS roles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL,            -- super_admin, admin, billing_manager, support_staff
  description TEXT,
  permissions TEXT,                     -- JSON array of permission keys
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ========== USERS ==========
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  password_hash TEXT NOT NULL,
  role_id INTEGER NOT NULL REFERENCES roles(id),
  status TEXT NOT NULL DEFAULT 'active', -- active, disabled
  last_login DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ========== PACKAGES ==========
CREATE TABLE IF NOT EXISTS packages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  speed_mbps REAL NOT NULL,
  monthly_price REAL NOT NULL,
  installation_fee REAL DEFAULT 0,
  connection_type TEXT DEFAULT 'Fiber', -- Fiber, Wireless, DSL
  description TEXT,
  status TEXT NOT NULL DEFAULT 'active', -- active, disabled
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ========== CUSTOMERS ==========
CREATE TABLE IF NOT EXISTS customers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_code TEXT UNIQUE NOT NULL,     -- e.g. CUS-00001
  name TEXT NOT NULL,
  guardian_name TEXT,                     -- Father's/Mother's Name
  mobile TEXT NOT NULL,
  alt_mobile TEXT,
  email TEXT,
  nid_number TEXT,
  address TEXT,
  area TEXT,
  connection_type TEXT DEFAULT 'Fiber',
  package_id INTEGER REFERENCES packages(id),
  monthly_bill REAL NOT NULL DEFAULT 0,
  ip_address TEXT,
  mac_address TEXT,
  router_info TEXT,
  connection_date DATE,
  billing_date INTEGER DEFAULT 1,         -- day of month
  due_date INTEGER DEFAULT 10,            -- day of month
  status TEXT NOT NULL DEFAULT 'active',  -- active, inactive, suspended
  notes TEXT,
  current_due REAL NOT NULL DEFAULT 0,
  created_by INTEGER REFERENCES users(id),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ========== CONNECTIONS ==========
CREATE TABLE IF NOT EXISTS connections (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  username TEXT,
  ip_address TEXT,
  mac_address TEXT,
  router_onu TEXT,
  connection_type TEXT DEFAULT 'Fiber',
  installation_date DATE,
  package_id INTEGER REFERENCES packages(id),
  status TEXT NOT NULL DEFAULT 'pending', -- active, suspended, disconnected, pending
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ========== INVOICES ==========
CREATE TABLE IF NOT EXISTS invoices (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  invoice_number TEXT UNIQUE NOT NULL,
  customer_id INTEGER NOT NULL REFERENCES customers(id),
  package_id INTEGER REFERENCES packages(id),
  billing_period_start DATE NOT NULL,
  billing_period_end DATE NOT NULL,
  previous_due REAL NOT NULL DEFAULT 0,
  current_bill REAL NOT NULL DEFAULT 0,
  discount REAL NOT NULL DEFAULT 0,
  late_fee REAL NOT NULL DEFAULT 0,
  total_amount REAL NOT NULL DEFAULT 0,
  paid_amount REAL NOT NULL DEFAULT 0,
  due_amount REAL NOT NULL DEFAULT 0,
  due_date DATE,
  status TEXT NOT NULL DEFAULT 'unpaid', -- paid, unpaid, partially_paid, overdue
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS invoice_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  invoice_id INTEGER NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  amount REAL NOT NULL
);

-- ========== PAYMENTS ==========
CREATE TABLE IF NOT EXISTS payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  payment_code TEXT UNIQUE NOT NULL,
  customer_id INTEGER NOT NULL REFERENCES customers(id),
  invoice_id INTEGER REFERENCES invoices(id),
  amount REAL NOT NULL,
  payment_method TEXT NOT NULL, -- Cash, bKash, Nagad, Rocket, Bank Transfer, Online
  transaction_id TEXT,
  payment_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  collected_by INTEGER REFERENCES users(id),
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ========== EXPENSES ==========
CREATE TABLE IF NOT EXISTS expenses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  category TEXT NOT NULL, -- Internet Bandwidth, Electricity, Office Rent, Staff Salary, Maintenance, Equipment, Transportation, Marketing, Other
  amount REAL NOT NULL,
  expense_date DATE NOT NULL,
  paid_by TEXT,
  description TEXT,
  attachment_path TEXT,
  created_by INTEGER REFERENCES users(id),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ========== NOTIFICATIONS ==========
CREATE TABLE IF NOT EXISTS notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL, -- bill_due, overdue, payment_confirmation, new_customer, suspension, package_expiration
  title TEXT NOT NULL,
  message TEXT,
  customer_id INTEGER REFERENCES customers(id),
  channel TEXT DEFAULT 'system', -- system, sms, whatsapp, email (future)
  is_read INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ========== AUDIT LOGS ==========
CREATE TABLE IF NOT EXISTS audit_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER REFERENCES users(id),
  action TEXT NOT NULL,       -- e.g. CUSTOMER_CREATED, INVOICE_PAID
  entity_type TEXT,
  entity_id INTEGER,
  details TEXT,               -- JSON string
  ip_address TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ========== COMPANY SETTINGS ==========
CREATE TABLE IF NOT EXISTS company_settings (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  company_name TEXT DEFAULT 'My ISP Ltd.',
  logo_url TEXT,
  address TEXT,
  phone TEXT,
  email TEXT,
  website TEXT,
  invoice_prefix TEXT DEFAULT 'INV',
  payment_prefix TEXT DEFAULT 'PAY',
  late_fee_flat REAL DEFAULT 0,
  late_fee_percent REAL DEFAULT 0,
  billing_cycle_day INTEGER DEFAULT 1,
  currency TEXT DEFAULT 'BDT',
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_customers_status ON customers(status);
CREATE INDEX IF NOT EXISTS idx_customers_area ON customers(area);
CREATE INDEX IF NOT EXISTS idx_invoices_customer ON invoices(customer_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_payments_customer ON payments(customer_id);
CREATE INDEX IF NOT EXISTS idx_payments_date ON payments(payment_date);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(expense_date);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category);
`;

db.exec(schema);

module.exports = db;
