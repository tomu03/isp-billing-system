# SwiftNet Billing — ISP Management System

A professional, production-ready **Internet Service Provider (ISP) billing and management console** built with React, Node.js/Express, and SQLite. Manage customers, packages, invoices, payments, connections, and collections from a single unified dashboard.

![Version](https://img.shields.io/badge/version-1.0.0-blue) ![License](https://img.shields.io/badge/license-MIT-green) ![Built for Bangladesh ISPs](https://img.shields.io/badge/built%20for-Bangladesh%20ISPs-red)

---

## 🚀 Features

### Core Modules
- **Dashboard** — Real-time KPIs, 5 interactive charts, collection tracking
- **Customer Management** — Full CRUD with search, filter, bulk operations, status management, profile views
- **Internet Packages** — Configure speed tiers, pricing, installation fees, connection types
- **Billing System** — Auto-generate monthly invoices, handle previous due + late fees, discount tracking
- **Payment Recording** — Multiple payment methods (Cash, bKash, Nagad, Rocket, Bank Transfer), auto-invoice updates
- **Due & Collection** — Area-wise and package-wise due tracking, collection dashboard
- **Connections** — Track active/suspended/pending installations, IP/MAC management
- **Expenses** — Track all costs by category (bandwidth, rent, salary, maintenance, etc.)
- **Reports** — 6 report types with CSV/PDF export (collection, due, customer, revenue, expenses, packages)
- **User Management** — 4 role-based user roles with full audit logging
- **Notifications** — System alerts for bills, payments, overdue, suspensions
- **Settings** — Company info, billing config, late fees, currency, audit log viewer

### Technical Highlights
✅ **Role-Based Access Control** — Super Admin, Admin, Billing Manager, Support Staff  
✅ **JWT Authentication** — Secure token-based auth with session management  
✅ **Complete API** — 40+ endpoints with request validation and error handling  
✅ **Responsive Design** — Works on desktop, tablet, mobile  
✅ **Professional UI** — Dark sidebar, signal-green accents, Tailwind CSS + custom design tokens  
✅ **Charts & Analytics** — Recharts integration (line, bar, pie charts)  
✅ **Printable Invoices** — Invoice and receipt PDFs (browser print-to-PDF)  
✅ **Audit Trail** — Complete logging of all admin actions  
✅ **Seed Data** — 20 demo customers, 3 months of invoices/payments, 5 internet packages  

---

## 📋 Prerequisites

- **Node.js** v16+ (tested on v22.22.2)
- **npm** v8+ (tested on v10.9.7)
- **Git** (optional, for cloning)
- Any modern browser (Chrome, Firefox, Edge, Safari)

**No external databases needed** — SQLite is embedded and auto-initializes.

---

## 🛠️ Installation & Setup

### 1. Extract the project
```bash
unzip isp-billing-system.zip
cd isp-billing-system
```

### 2. Backend Setup

```bash
cd backend

# Copy environment variables
cp .env.example .env

# Install dependencies
npm install

# Start the server (auto-seeds database on first run)
npm start
```

The backend API will run at **http://localhost:5000**. You'll see:
```
✅ Seed complete.
Login with: admin@ispbilling.com / password123

🚀 ISP Billing API running on http://localhost:5000
```

### 3. Frontend Setup (in a new terminal)

```bash
cd frontend

# Install dependencies
npm install

# Start dev server (with API proxy to http://localhost:5000)
npm run dev
```

The frontend will open at **http://localhost:5173**.

---

## 🔑 Demo Login Credentials

All accounts use password: `password123`

| Email | Role | Access |
|-------|------|--------|
| superadmin@ispbilling.com | Super Admin | Full system access |
| admin@ispbilling.com | Admin | Manage all modules, user management, settings |
| billing@ispbilling.com | Billing Manager | Billing, invoices, payments, reports |
| support@ispbilling.com | Support Staff | View customers & connections, limited edits |

---

## 📁 Project Structure

```
isp-billing-system/
├── backend/
│   ├── src/
│   │   ├── server.js                 # Express app entry
│   │   ├── db/
│   │   │   ├── index.js             # SQLite connection & schema
│   │   │   └── seed.js              # Demo data seeder
│   │   ├── middleware/
│   │   │   └── auth.js              # JWT & role-based auth
│   │   └── routes/
│   │       ├── auth.js              # Login, user management
│   │       ├── customers.js         # CRUD + search/filter
│   │       ├── packages.js          # Package management
│   │       ├── invoices.js          # Billing & monthly generation
│   │       ├── payments.js          # Payment recording & auto-update
│   │       ├── expenses.js          # Expense tracking
│   │       ├── connections.js       # Connection status
│   │       ├── dashboard.js         # Stats & chart data
│   │       ├── reports.js           # 6 report types
│   │       ├── notifications.js     # System notifications
│   │       └── settings.js          # Company config & audit logs
│   ├── package.json
│   ├── .env.example
│   └── data/ (auto-created)
│       └── isp_billing.db           # SQLite database file
│
└── frontend/
    ├── src/
    │   ├── main.jsx                 # React entry
    │   ├── App.jsx                  # Routing & auth provider
    │   ├── index.css                # Tailwind + custom styles
    │   ├── api/
    │   │   └── client.js            # Axios with auth interceptor
    │   ├── context/
    │   │   └── AuthContext.jsx      # Auth state management
    │   ├── components/
    │   │   ├── Sidebar.jsx          # Main navigation
    │   │   ├── Topbar.jsx           # Search & notifications
    │   │   ├── Layout.jsx           # Page wrapper
    │   │   └── UI.jsx               # Reusable components
    │   └── pages/
    │       ├── Login.jsx
    │       ├── Dashboard.jsx
    │       ├── Customers.jsx
    │       ├── CustomerProfile.jsx
    │       ├── Packages.jsx
    │       ├── Billing.jsx
    │       ├── InvoiceDetail.jsx
    │       ├── Payments.jsx
    │       ├── DueCollection.jsx
    │       ├── Connections.jsx
    │       ├── Expenses.jsx
    │       ├── Reports.jsx
    │       ├── Users.jsx
    │       ├── Notifications.jsx
    │       └── Settings.jsx
    ├── index.html
    ├── vite.config.js
    ├── tailwind.config.js
    ├── postcss.config.js
    ├── package.json
    └── dist/ (after `npm run build`)
```

---

## 🗄️ Database Schema

**Tables:**
- `roles` — Role definitions with permissions
- `users` — Staff accounts with role assignments
- `customers` — ISP subscribers with connection details
- `packages` — Internet plans (speed, price, fees)
- `connections` — Network connection details per customer
- `invoices` — Monthly bills
- `invoice_items` — Line items (if needed for future expansion)
- `payments` — Payment records with auto-status updates
- `expenses` — Operational costs by category
- `notifications` — System alerts and events
- `audit_logs` — Action trail for admin accountability
- `company_settings` — Organization info and billing config

**Key Features:**
- Foreign keys + cascading deletes
- Indexed on frequently-queried columns (status, area, date)
- Proper timestamp tracking (created_at, updated_at)
- JSON fields for flexible metadata

See `SCHEMA.md` for full SQL definitions.

---

## 🔌 API Endpoints

### Auth
```
POST   /api/auth/login              — Login & get JWT token
GET    /api/auth/me                 — Current user info
GET    /api/auth/users              — List all users (admin)
POST   /api/auth/users              — Create user (admin)
PUT    /api/auth/users/:id/status   — Enable/disable user (admin)
GET    /api/auth/roles              — List roles
```

### Customers
```
GET    /api/customers               — List with search/filter/pagination
GET    /api/customers/:id           — Customer profile + history
GET    /api/customers/areas         — Unique areas
POST   /api/customers               — Add customer
PUT    /api/customers/:id           — Update customer
PUT    /api/customers/:id/status    — Change status
DELETE /api/customers/:id           — Delete customer
```

### Packages
```
GET    /api/packages                — List all packages
GET    /api/packages/:id            — Package details
POST   /api/packages                — Create package
PUT    /api/packages/:id            — Update package
PUT    /api/packages/:id/status     — Enable/disable package
DELETE /api/packages/:id            — Delete package
```

### Billing & Invoices
```
GET    /api/invoices                — List invoices (search/filter)
GET    /api/invoices/:id            — Invoice detail with payments
POST   /api/invoices/generate       — Create single invoice
POST   /api/invoices/generate-monthly — Bulk monthly billing
PUT    /api/invoices/:id            — Edit invoice (discount/late fee)
POST   /api/invoices/mark-overdue   — Auto-mark past-due
```

### Payments
```
GET    /api/payments                — List payments (search/filter)
GET    /api/payments/:id            — Payment detail for receipt
POST   /api/payments                — Record payment (auto-updates invoice)
```

### Reports
```
GET    /api/reports/collection      — Payments in date range
GET    /api/reports/due             — Outstanding dues by area/package
GET    /api/reports/customers       — Customer list report
GET    /api/reports/expenses        — Expense report
GET    /api/reports/revenue         — Billed vs collected
GET    /api/reports/packages        — Package stats
```

### Dashboard
```
GET    /api/dashboard/stats         — KPIs (customers, revenue, collection, bills)
GET    /api/dashboard/charts        — 6 months revenue, expenses, growth, etc.
```

### Other
```
GET    /api/connections             — List connections
PUT    /api/connections/:id         — Update connection status
GET    /api/expenses                — List expenses
POST   /api/expenses                — Add expense
PUT    /api/expenses/:id            — Update expense
DELETE /api/expenses/:id            — Delete expense
GET    /api/notifications           — List notifications
PUT    /api/notifications/:id/read  — Mark as read
PUT    /api/notifications/read-all  — Mark all as read
GET    /api/settings                — Company settings
PUT    /api/settings                — Update settings
GET    /api/settings/audit-logs     — Audit trail
```

See `API_DOCS.md` for detailed request/response examples.

---

## 🚀 Deployment

### Production Build (Frontend)
```bash
cd frontend
npm run build
# Output in ./dist/ — ready for any static hosting (Netlify, Vercel, AWS S3, etc.)
```

### Production Setup (Backend)
1. Set strong `JWT_SECRET` in `.env`
2. Update `CORS_ORIGIN` to your frontend domain
3. Run on a proper Node.js host (Railway, Render, Heroku, DigitalOcean, AWS EC2)
4. Use a reverse proxy (Nginx) in front of the Node process
5. Set up SSL/TLS certificates (Let's Encrypt)
6. Keep SQLite database backed up, or migrate to PostgreSQL for larger deployments

### Example `.env` for production:
```env
PORT=5000
JWT_SECRET=your_super_secret_key_here_min_32_chars
CORS_ORIGIN=https://yourdomain.com
DB_PATH=/var/lib/isp-billing/isp_billing.db
NODE_ENV=production
```

---

## 📝 Usage Guide

### Creating Monthly Invoices
1. Go to **Billing** → "Generate monthly bills"
2. Set billing period (e.g., 2026-10-01 to 2026-10-28)
3. Optionally set late fee for customers with existing due
4. Click "Generate" — creates invoices for all active/suspended customers
5. Formula: `Total = Previous Due + Current Bill + Late Fee − Discount`

### Recording a Payment
1. Go to **Payments** → "Record payment"
2. Select customer (shows current due)
3. Enter amount, choose payment method
4. Optionally add transaction ID and notes
5. Click "Record payment" — auto-updates invoice status and customer balance

### Generating Reports
1. Go to **Reports**
2. Choose report type (collection, due, customers, expenses, revenue, packages)
3. (Optional) Filter by date range
4. Click "Apply" → view results
5. **Export CSV** or **Print/PDF** buttons

### Managing Users
1. Go to **Settings** → (Admin only)
2. Click "Add user"
3. Enter name, email, phone, password, and role
4. Click "Create user"
5. User can log in with their email and password

### Viewing Audit Logs
1. Go to **Settings** → "Audit logs" tab (Admin only)
2. See all customer, invoice, payment, user creation/update events
3. Track who did what and when

---

## 🔒 Security Considerations

✅ **Passwords** — Hashed with bcryptjs (salt rounds: 10)  
✅ **Tokens** — JWT with 12-hour expiry  
✅ **Role-Based Access** — Every route checked for permissions  
✅ **SQL Injection** — Parameterized queries only (no string concatenation)  
✅ **Input Validation** — express-validator on all endpoints  
✅ **CORS** — Restricted to frontend origin  
✅ **Audit Trail** — All admin actions logged  

**Before deploying to production:**
- Change all demo passwords
- Set a strong `JWT_SECRET` (use `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`)
- Enable HTTPS/TLS
- Use environment-specific `.env` files (never commit secrets)
- Set up database backups
- Consider migrating to PostgreSQL for larger deployments

---

## 🐛 Troubleshooting

### "Port 5000 already in use"
```bash
# Kill process on port 5000
lsof -i :5000 | grep LISTEN | awk '{print $2}' | xargs kill -9
# Or use a different port: PORT=5001 npm start
```

### "Module not found" errors
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### Frontend shows "Unauthorized" on every page
- Check browser console (F12) for token errors
- Verify backend is running: `curl http://localhost:5000/api/health`
- Check Network tab: API requests should have `Authorization: Bearer <token>` header
- Clear localStorage: `localStorage.clear()` in console, refresh

### Database locked error
- SQLite with WAL mode supports concurrent reads but not concurrent writes
- For high concurrency, migrate to PostgreSQL (see `MIGRATION.md`)

### Charts not loading
- Check browser console for fetch errors
- Verify dashboard/charts endpoint returns data: `curl http://localhost:5000/api/dashboard/charts -H "Authorization: Bearer <token>"`

---

## 📚 Additional Documentation

- `SCHEMA.md` — Full database schema with table definitions
- `API_DOCS.md` — Detailed API endpoint reference with examples
- `DEPLOYMENT.md` — Production deployment guide
- `MIGRATION.md` — Upgrading from SQLite to PostgreSQL

---

## 🛣️ Roadmap

**v1.1.0** (Planned)
- SMS/WhatsApp billing reminders (Twilio integration)
- Email invoice delivery
- Customer self-service portal
- Advanced analytics (churn, LTV, MRR trends)
- Dark mode toggle

**v2.0.0** (Future)
- Multi-tenant support (manage multiple ISPs)
- Postpaid credit system
- Automated billing workflows
- Advanced fraud detection
- Mobile app (React Native)

---

## 📄 License

MIT License — Free to use and modify for personal and commercial projects.

---

## 💬 Support

For issues, questions, or feature requests:
1. Check the troubleshooting section above
2. Review API documentation in `API_DOCS.md`
3. Contact: support@swiftnet-isp.com (demo contact)

---

## 🙏 Acknowledgments

Built with ❤️ for Bangladesh ISPs  
Technologies: React, Node.js/Express, SQLite, Tailwind CSS, Recharts, Lucide Icons

---

**Happy billing! 🚀**

SwiftNet Billing © 2026
