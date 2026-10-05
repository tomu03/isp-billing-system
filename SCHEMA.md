# ISP Billing System — Database Schema

SQLite database with 12 core tables, proper relationships, and indexes for optimal query performance.

---

## Tables

### roles
Defines user roles and their permissions.

```sql
CREATE TABLE roles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL,            -- super_admin, admin, billing_manager, support_staff
  description TEXT,
  permissions TEXT,                     -- JSON array of permission keys
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

**Seeded roles:**
1. `super_admin` — Full system access (permissions: `["*"]`)
2. `admin` — Manage all modules except super admin functions
3. `billing_manager` — Billing, invoices, payments, reports
4. `support_staff` — View customers & connections, limited edits

---

### users
System users/staff accounts.

```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  password_hash TEXT NOT NULL,           -- bcryptjs hashed
  role_id INTEGER NOT NULL REFERENCES roles(id),
  status TEXT NOT NULL DEFAULT 'active', -- active, disabled
  last_login DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

---

### packages
Internet service packages/plans.

```sql
CREATE TABLE packages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,                    -- e.g., "Home 10", "Business 100"
  speed_mbps REAL NOT NULL,              -- Download speed
  monthly_price REAL NOT NULL,           -- Recurring monthly fee
  installation_fee REAL DEFAULT 0,       -- One-time setup fee
  connection_type TEXT DEFAULT 'Fiber',  -- Fiber, Wireless, DSL
  description TEXT,
  status TEXT NOT NULL DEFAULT 'active', -- active, disabled
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

---

### customers
Internet subscriber accounts.

```sql
CREATE TABLE customers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_code TEXT UNIQUE NOT NULL,    -- e.g., CUS-00001
  name TEXT NOT NULL,
  guardian_name TEXT,                    -- Father's/Mother's name
  mobile TEXT NOT NULL,
  alt_mobile TEXT,
  email TEXT,
  nid_number TEXT,                       -- National ID
  address TEXT,
  area TEXT,                             -- Service area/zone
  connection_type TEXT DEFAULT 'Fiber',  -- Fiber, Wireless, DSL
  package_id INTEGER REFERENCES packages(id),
  monthly_bill REAL NOT NULL DEFAULT 0,  -- Monthly subscription cost
  ip_address TEXT,
  mac_address TEXT,
  router_info TEXT,                      -- ONU/Router model/ID
  connection_date DATE,
  billing_date INTEGER DEFAULT 1,        -- Day of month for billing
  due_date INTEGER DEFAULT 10,           -- Day of month payment is due
  status TEXT NOT NULL DEFAULT 'active', -- active, inactive, suspended
  notes TEXT,
  current_due REAL NOT NULL DEFAULT 0,   -- Outstanding balance
  created_by INTEGER REFERENCES users(id),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_customers_status ON customers(status);
CREATE INDEX idx_customers_area ON customers(area);
```

---

### connections
Network connections per customer.

```sql
CREATE TABLE connections (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  username TEXT,                         -- PPPoE/RADIUS username
  ip_address TEXT,
  mac_address TEXT,
  router_onu TEXT,                       -- Router/ONU identification
  connection_type TEXT DEFAULT 'Fiber',  -- Fiber, Wireless, DSL
  installation_date DATE,
  package_id INTEGER REFERENCES packages(id),
  status TEXT NOT NULL DEFAULT 'pending',-- active, suspended, disconnected, pending
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Index
CREATE INDEX idx_connections_customer ON connections(customer_id);
```

---

### invoices
Monthly billing invoices.

```sql
CREATE TABLE invoices (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  invoice_number TEXT UNIQUE NOT NULL,   -- e.g., INV-202609-00001
  customer_id INTEGER NOT NULL REFERENCES customers(id),
  package_id INTEGER REFERENCES packages(id),
  billing_period_start DATE NOT NULL,
  billing_period_end DATE NOT NULL,
  previous_due REAL NOT NULL DEFAULT 0,  -- Amount owed from prior months
  current_bill REAL NOT NULL DEFAULT 0,  -- This month's service cost
  discount REAL NOT NULL DEFAULT 0,      -- Discount applied
  late_fee REAL NOT NULL DEFAULT 0,      -- Penalty for late payment
  total_amount REAL NOT NULL DEFAULT 0,  -- Calculated: prev_due + current + late - discount
  paid_amount REAL NOT NULL DEFAULT 0,   -- Amount received so far
  due_amount REAL NOT NULL DEFAULT 0,    -- Remaining balance
  due_date DATE,
  status TEXT NOT NULL DEFAULT 'unpaid', -- paid, unpaid, partially_paid, overdue
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_invoices_customer ON invoices(customer_id);
CREATE INDEX idx_invoices_status ON invoices(status);
```

---

### invoice_items
Line items for invoices (for future detailed billing).

```sql
CREATE TABLE invoice_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  invoice_id INTEGER NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  description TEXT NOT NULL,             -- e.g., "Service charge", "Installation fee"
  amount REAL NOT NULL
);
```

---

### payments
Payment records linked to invoices.

```sql
CREATE TABLE payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  payment_code TEXT UNIQUE NOT NULL,     -- e.g., PAY-000120
  customer_id INTEGER NOT NULL REFERENCES customers(id),
  invoice_id INTEGER REFERENCES invoices(id),
  amount REAL NOT NULL,
  payment_method TEXT NOT NULL,          -- Cash, bKash, Nagad, Rocket, Bank Transfer, Online
  transaction_id TEXT,                   -- For card/online payments
  payment_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  collected_by INTEGER REFERENCES users(id),
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_payments_customer ON payments(customer_id);
CREATE INDEX idx_payments_date ON payments(payment_date);
```

---

### expenses
Operational cost tracking.

```sql
CREATE TABLE expenses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  category TEXT NOT NULL,                -- Internet Bandwidth, Electricity, Office Rent, Staff Salary, Maintenance, Equipment, Transportation, Marketing, Other
  amount REAL NOT NULL,
  expense_date DATE NOT NULL,
  paid_by TEXT,                          -- e.g., "Office Cash", "Bank"
  description TEXT,
  attachment_path TEXT,                  -- Future: for receipts/invoices
  created_by INTEGER REFERENCES users(id),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_expenses_date ON expenses(expense_date);
CREATE INDEX idx_expenses_category ON expenses(category);
```

---

### notifications
System alerts and events.

```sql
CREATE TABLE notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL,                    -- bill_due, overdue, payment_confirmation, new_customer, suspension, package_expiration
  title TEXT NOT NULL,
  message TEXT,
  customer_id INTEGER REFERENCES customers(id),
  channel TEXT DEFAULT 'system',         -- system, sms, whatsapp, email (future)
  is_read INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

---

### audit_logs
Complete audit trail for compliance and accountability.

```sql
CREATE TABLE audit_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER REFERENCES users(id),
  action TEXT NOT NULL,                  -- e.g., CUSTOMER_CREATED, INVOICE_PAID, USER_STATUS_CHANGED
  entity_type TEXT,                      -- customer, invoice, payment, user, etc.
  entity_id INTEGER,                     -- ID of affected record
  details TEXT,                          -- JSON with change details
  ip_address TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

---

### company_settings
Organization configuration (single row).

```sql
CREATE TABLE company_settings (
  id INTEGER PRIMARY KEY CHECK (id = 1), -- Ensures only one row
  company_name TEXT DEFAULT 'My ISP Ltd.',
  logo_url TEXT,
  address TEXT,
  phone TEXT,
  email TEXT,
  website TEXT,
  invoice_prefix TEXT DEFAULT 'INV',
  payment_prefix TEXT DEFAULT 'PAY',
  late_fee_flat REAL DEFAULT 0,          -- Flat late fee amount
  late_fee_percent REAL DEFAULT 0,       -- Percentage-based late fee
  billing_cycle_day INTEGER DEFAULT 1,   -- Day of month to generate bills
  currency TEXT DEFAULT 'BDT',
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

---

## Key Relationships

```
roles
  ↓
  └─── users
        ↓
        ├─── audit_logs
        ├─── customers (created_by)
        ├─── expenses (created_by)
        └─── payments (collected_by)

packages
  ↓
  ├─── customers (package_id)
  ├─── connections (package_id)
  └─── invoices (package_id)

customers
  ↓
  ├─── connections (customer_id) [cascading delete]
  ├─── invoices (customer_id)
  ├─── payments (customer_id)
  └─── notifications (customer_id)

invoices
  ↓
  ├─── invoice_items (invoice_id) [cascading delete]
  └─── payments (invoice_id)
```

---

## Important Queries

### Calculate outstanding due for a customer
```sql
SELECT SUM(due_amount) FROM invoices 
WHERE customer_id = ? AND status IN ('unpaid', 'partially_paid', 'overdue');
```

### Monthly revenue (all billed invoices in a period)
```sql
SELECT SUM(total_amount) FROM invoices 
WHERE billing_period_start >= ? AND billing_period_start <= ?;
```

### Monthly collection (all paid amounts in a period)
```sql
SELECT SUM(amount) FROM payments 
WHERE DATE(payment_date) >= ? AND DATE(payment_date) <= ?;
```

### Active customer count
```sql
SELECT COUNT(*) FROM customers WHERE status = 'active';
```

### Overdue invoices
```sql
SELECT COUNT(*) FROM invoices 
WHERE due_date < DATE('now') AND status IN ('unpaid', 'partially_paid');
```

### Expense breakdown by category
```sql
SELECT category, SUM(amount) as total FROM expenses 
WHERE expense_date >= ? AND expense_date <= ?
GROUP BY category ORDER BY total DESC;
```

---

## Indexes

All major foreign keys and frequently-queried columns are indexed for performance:

- `customers(status)` — For filtering by status
- `customers(area)` — For area-wise reports
- `invoices(customer_id)` — For customer invoice history
- `invoices(status)` — For dashboard filters
- `payments(customer_id)` — For payment history
- `payments(payment_date)` — For collection reports
- `expenses(expense_date)` — For date-range queries
- `expenses(category)` — For category breakdown

---

## Data Types & Constraints

- **Amounts** (prices, bills, payments) — REAL (floating point) for accurate currency calculations
- **Dates** — DATE for just the date, DATETIME for timestamps
- **Status fields** — TEXT with limited values (enforced at app layer, consider CHECK constraint)
- **Codes** — TEXT UNIQUE (customer_code, invoice_number, payment_code, etc.)
- **Foreign Keys** — With ON DELETE CASCADE where appropriate
- **Created/Updated** — DATETIME DEFAULT CURRENT_TIMESTAMP for audit trail

---

## Migrations / Scaling

### SQLite Limitations (for reference)
- SQLite supports single-writer concurrency
- Best for <100k records per table
- For larger deployments, migrate to PostgreSQL

### Migration to PostgreSQL
See `MIGRATION.md` for step-by-step instructions.

---

## Backup & Restore

### Backup
```bash
cp data/isp_billing.db backups/isp_billing_$(date +%Y%m%d_%H%M%S).db
```

### Restore
```bash
cp backups/isp_billing_YYYYMMDD_HHMMSS.db data/isp_billing.db
```

---

## Future Enhancements

- Add CHECK constraints for status fields
- Partition large tables by date range (if migrating to PostgreSQL)
- Add materialized views for reporting
- Soft deletes (archive deleted records vs hard delete)
- Customer credit/refund tracking
- Promotional packages/bundles
