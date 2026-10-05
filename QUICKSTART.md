# ISP Billing System — Quick Start (5 Minutes)

## Prerequisites
- Node.js v16+ ([download](https://nodejs.org/))
- npm v8+ (comes with Node.js)
- A modern web browser

## 1-Click Setup (Recommended)

### macOS / Linux
```bash
cd isp-billing-system
./setup.sh
```

### Windows (PowerShell)
```powershell
cd isp-billing-system
# Run the setup by opening the folder and running setup steps manually (see below)
```

---

## Manual Setup (3 Steps)

### Step 1: Backend Setup
```bash
cd backend
cp .env.example .env
npm install
npm start
```

Expected output:
```
✅ Seed complete.
Login with: admin@ispbilling.com / password123

🚀 ISP Billing API running on http://localhost:5000
```

### Step 2: Frontend Setup (New Terminal/Tab)
```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev
```

Expected output:
```
  ➜  Local:   http://localhost:5173/
  ➜  Network: http://192.0.2.2:5173/
```

### Step 3: Open in Browser
Go to **http://localhost:5173**

---

## Login Credentials

**Email:** `admin@ispbilling.com`  
**Password:** `password123`

Or try other demo accounts:
- `superadmin@ispbilling.com` — Super Admin
- `billing@ispbilling.com` — Billing Manager
- `support@ispbilling.com` — Support Staff

---

## First Steps

### 👥 View Customers
- Click **Customers** in the sidebar
- See 20 demo customers with invoices and payments

### 📊 Check Dashboard
- Click **Dashboard** (home icon)
- See real KPIs and charts from demo data

### 💰 Create an Invoice
- Go to **Billing** → "Generate monthly bills"
- Set date range (e.g., Oct 1-28, 2026)
- Click "Generate" — creates invoices for all active customers

### 💳 Record a Payment
- Go to **Payments** → "Record payment"
- Select a customer
- Enter amount and method (Cash, bKash, etc.)
- Click "Record payment" — auto-updates invoice status

### 📈 View Reports
- Go to **Reports**
- Choose report type (collection, due, customers, etc.)
- Filter by date range
- Export as CSV or Print/PDF

---

## Stopping the Servers

### Stop Backend
- Terminal 1: Press **Ctrl+C**

### Stop Frontend
- Terminal 2: Press **Ctrl+C**

---

## Troubleshooting

### Port already in use
```bash
# Kill process on port 5000
lsof -i :5000 | grep LISTEN | awk '{print $2}' | xargs kill -9

# Or use a different port
PORT=5001 npm start
```

### "Module not found"
```bash
rm -rf node_modules package-lock.json
npm install
```

### Login not working
- Check backend console for errors
- Verify backend is running at http://localhost:5000/api/health
- Clear browser cache: **Ctrl+Shift+Delete** → Clear all

### Charts not loading
- Open browser console (F12)
- Check Network tab for API errors
- Ensure backend is responding: `curl http://localhost:5000/api/dashboard/stats`

---

## Next Steps

1. **Read the full README** — `README.md`
2. **Explore API docs** — `API_DOCS.md`
3. **Understand database** — `SCHEMA.md`
4. **Customize settings** — Go to **Settings** to change company info, invoicing, etc.
5. **Add real customers** — Go to **Customers** → "Add customer"
6. **Configure packages** — Go to **Packages** → "Add package"

---

## Production Deployment

See `DEPLOYMENT.md` for detailed instructions on deploying to:
- Heroku / Railway (Backend)
- Vercel / Netlify (Frontend)
- Digital Ocean / AWS EC2
- Your own server

---

## Demo Data

The system comes with:
- ✅ 20 customers with realistic details
- ✅ 5 internet packages (10, 20, 30, 50, 100 Mbps)
- ✅ 3 months of invoices and payments
- ✅ Various expenses by category
- ✅ Sample notifications and audit logs

**To reset to fresh data:**
```bash
cd backend
rm -rf data/
npm start  # Auto-seeds on next run
```

---

## Common Tasks

### Find a customer by phone
- Go to **Customers**
- Use search bar (top-left)
- Type phone number → results appear instantly

### View customer's payment history
- Click customer in list
- Or go to customer detail page
- See all invoices and payments in one place

### Check how much is owed
- Go to **Due Collection**
- Filter by area or package
- See total outstanding
- Click "Collect" to record payment

### Export data for accounting
- Go to **Reports**
- Choose report (collection, revenue, expenses, etc.)
- Click **Export CSV**
- Open in Excel/Google Sheets

### Add a staff member
- Go to **Settings** → (Admin only)
- Click "Add user"
- Choose role (Admin, Billing Manager, Support Staff)

---

## Tips & Tricks

💡 **Search everywhere** — Use the top search bar to find any customer or invoice  
💡 **Print invoices** — Open any invoice, click "Print/PDF", use browser print  
💡 **Bulk billing** — Use "Generate monthly bills" to bill all customers at once  
💡 **Status tracking** — See connection status (active/suspended/disconnected) in real-time  
💡 **Audit trail** — View who did what and when in Settings → Audit logs  

---

## Need Help?

- **Backend issues?** Check `/tmp/server.log` or console for errors
- **Frontend issues?** Open F12 → Console tab in browser
- **API not responding?** Verify backend: `curl http://localhost:5000/api/health`
- **Database locked?** Restart backend: kill process, run `npm start` again

---

**That's it! You're ready to manage ISP billing. 🎉**

For detailed documentation, see the main `README.md` file.
