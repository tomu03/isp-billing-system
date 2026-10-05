# ISP Billing System — API Documentation

## Base URL
```
http://localhost:5000/api
```

## Authentication
All protected endpoints require a JWT token in the `Authorization` header:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Tokens expire after 12 hours. Obtain a token via `/auth/login`.

---

## Authentication Endpoints

### POST /auth/login
Log in and get a JWT token.

**Request:**
```json
{
  "email": "admin@ispbilling.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 2,
    "name": "Rahim Uddin",
    "email": "admin@ispbilling.com",
    "role": "admin",
    "permissions": ["customers.*", "packages.*", ...]
  }
}
```

### GET /auth/me
Get current logged-in user info.

**Response:**
```json
{
  "user": {
    "id": 2,
    "name": "Rahim Uddin",
    "email": "admin@ispbilling.com",
    "role": "admin"
  }
}
```

### GET /auth/roles
Get all role definitions. (Public, no auth needed)

**Response:**
```json
{
  "roles": [
    {
      "id": 1,
      "name": "super_admin",
      "description": "Full system access",
      "permissions": ["*"]
    },
    {
      "id": 2,
      "name": "admin",
      "description": "Manage customers, billing, packages, reports",
      "permissions": ["customers.*", "packages.*", ...]
    },
    ...
  ]
}
```

### GET /auth/users
List all system users. (**Admin only**)

**Query Parameters:** None

**Response:**
```json
{
  "users": [
    {
      "id": 1,
      "name": "Super Admin",
      "email": "superadmin@ispbilling.com",
      "phone": "01700000001",
      "status": "active",
      "role": "super_admin",
      "last_login": "2026-09-27T10:15:00.000Z",
      "created_at": "2026-09-27T00:00:00.000Z"
    },
    ...
  ]
}
```

### POST /auth/users
Create a new user. (**Admin only**)

**Request:**
```json
{
  "name": "New Staff Member",
  "email": "newuser@ispbilling.com",
  "phone": "01712345678",
  "password": "securepassword123",
  "role": "support_staff"
}
```

**Response:**
```json
{
  "id": 5
}
```

### PUT /auth/users/:id/status
Enable or disable a user account. (**Admin only**)

**Request:**
```json
{
  "status": "disabled"
}
```

**Response:**
```json
{
  "success": true
}
```

---

## Customer Endpoints

### GET /customers
List customers with search, filter, and pagination.

**Query Parameters:**
- `search` — Search by name, phone, customer_code, IP, MAC
- `status` — Filter by status (active, inactive, suspended)
- `area` — Filter by area name
- `package_id` — Filter by package
- `page` — Page number (default: 1)
- `limit` — Results per page (default: 20)

**Example:** `GET /customers?search=Dhaka&status=active&page=1&limit=10`

**Response:**
```json
{
  "customers": [
    {
      "id": 1,
      "customer_code": "CUS-00001",
      "name": "Md. Abdul Karim",
      "guardian_name": "Md. Abdur Rahim",
      "mobile": "01700000001",
      "alt_mobile": "01800000001",
      "email": "customer1@example.com",
      "nid_number": "1985XXXXX",
      "address": "House 12, Road 5, Dhanmondi",
      "area": "Dhanmondi",
      "connection_type": "Fiber",
      "package_id": 1,
      "package_name": "Home 10",
      "speed_mbps": 10,
      "monthly_bill": 700,
      "ip_address": "10.10.0.1",
      "mac_address": "00:1B:44:11:3A:B7",
      "router_info": "ONU-1000",
      "connection_date": "2024-01-15",
      "billing_date": 5,
      "due_date": 15,
      "status": "active",
      "notes": "VIP customer",
      "current_due": 0,
      "created_at": "2026-07-20T10:30:00.000Z",
      "updated_at": "2026-09-15T14:22:00.000Z"
    },
    ...
  ],
  "total": 120,
  "page": 1,
  "limit": 10
}
```

### GET /customers/areas
Get unique area names for filtering.

**Response:**
```json
{
  "areas": [
    "Dhanmondi",
    "Mirpur",
    "Uttara",
    "Gulshan",
    "Banani",
    ...
  ]
}
```

### GET /customers/:id
Get customer details with invoices, payments, and connections.

**Response:**
```json
{
  "customer": {
    "id": 1,
    "customer_code": "CUS-00001",
    "name": "Md. Abdul Karim",
    ...
  },
  "invoices": [
    {
      "id": 45,
      "invoice_number": "INV-202609-00001",
      "billing_period_start": "2026-09-01",
      "billing_period_end": "2026-09-28",
      "total_amount": 700,
      "paid_amount": 700,
      "due_amount": 0,
      "status": "paid",
      ...
    },
    ...
  ],
  "payments": [
    {
      "id": 120,
      "payment_code": "PAY-000120",
      "amount": 700,
      "payment_method": "Cash",
      "payment_date": "2026-09-05T10:15:00.000Z",
      ...
    },
    ...
  ],
  "connection": {
    "id": 1,
    "customer_id": 1,
    "username": "cus-00001",
    "ip_address": "10.10.0.1",
    "mac_address": "00:1B:44:11:3A:B7",
    "status": "active",
    ...
  }
}
```

### POST /customers
Create a new customer. (**Billing Manager, Admin, Support Staff**)

**Request:**
```json
{
  "name": "Fatema Begum",
  "guardian_name": "Md. Yusuf Ali",
  "mobile": "01711111111",
  "alt_mobile": "01811111111",
  "email": "fatema@example.com",
  "nid_number": "1987XXXXX",
  "address": "Apartment 5, Block C, Mirpur",
  "area": "Mirpur",
  "connection_type": "Fiber",
  "package_id": 2,
  "monthly_bill": 1000,
  "ip_address": "10.10.0.50",
  "mac_address": "00:1B:44:11:3A:C0",
  "router_info": "ONU-1050",
  "connection_date": "2026-09-01",
  "billing_date": 5,
  "due_date": 15,
  "status": "active",
  "notes": "Corporate account"
}
```

**Response:**
```json
{
  "id": 21,
  "customer_code": "CUS-00021"
}
```

### PUT /customers/:id
Update customer details. (**Billing Manager, Admin, Support Staff**)

**Request:** (partial update, include only fields to change)
```json
{
  "name": "Fatema Begum Updated",
  "monthly_bill": 1200,
  "status": "active"
}
```

**Response:**
```json
{
  "success": true
}
```

### PUT /customers/:id/status
Change customer status (active, inactive, suspended). (**Billing Manager, Admin, Support Staff**)

**Request:**
```json
{
  "status": "suspended"
}
```

**Response:**
```json
{
  "success": true
}
```
Also updates all associated connections to match.

### DELETE /customers/:id
Delete a customer and all related records. (**Admin only**)

**Response:**
```json
{
  "success": true
}
```

---

## Package Endpoints

### GET /packages
List all internet packages.

**Response:**
```json
{
  "packages": [
    {
      "id": 1,
      "name": "Home 10",
      "speed_mbps": 10,
      "monthly_price": 700,
      "installation_fee": 1000,
      "connection_type": "Fiber",
      "description": "Basic package for browsing and streaming",
      "status": "active",
      "customer_count": 25,
      "created_at": "2026-07-20T00:00:00.000Z",
      "updated_at": "2026-07-20T00:00:00.000Z"
    },
    ...
  ]
}
```

### POST /packages
Create a new internet package. (**Admin only**)

**Request:**
```json
{
  "name": "Premium 150",
  "speed_mbps": 150,
  "monthly_price": 4500,
  "installation_fee": 2500,
  "connection_type": "Fiber",
  "description": "Premium high-speed for businesses",
  "status": "active"
}
```

**Response:**
```json
{
  "id": 6
}
```

### PUT /packages/:id
Update package details. (**Admin only**)

**Request:**
```json
{
  "monthly_price": 5000,
  "description": "Updated premium package"
}
```

**Response:**
```json
{
  "success": true
}
```

### PUT /packages/:id/status
Enable or disable a package. (**Admin only**)

**Request:**
```json
{
  "status": "disabled"
}
```

**Response:**
```json
{
  "success": true
}
```

### DELETE /packages/:id
Delete a package. Only works if no customers are using it. (**Admin only**)

**Response:**
```json
{
  "success": true
}
```

---

## Invoice & Billing Endpoints

### GET /invoices
List invoices with search and filter.

**Query Parameters:**
- `search` — Search by invoice number, customer name, customer code
- `status` — Filter by status (paid, unpaid, partially_paid, overdue)
- `customer_id` — Filter by customer
- `page` — Page number
- `limit` — Results per page

**Response:**
```json
{
  "invoices": [
    {
      "id": 45,
      "invoice_number": "INV-202609-00001",
      "customer_id": 1,
      "customer_name": "Md. Abdul Karim",
      "customer_code": "CUS-00001",
      "mobile": "01700000001",
      "package_name": "Home 10",
      "billing_period_start": "2026-09-01",
      "billing_period_end": "2026-09-28",
      "previous_due": 0,
      "current_bill": 700,
      "discount": 0,
      "late_fee": 0,
      "total_amount": 700,
      "paid_amount": 700,
      "due_amount": 0,
      "due_date": "2026-09-15",
      "status": "paid",
      "notes": null,
      "created_at": "2026-09-01T10:00:00.000Z",
      "updated_at": "2026-09-05T14:30:00.000Z"
    },
    ...
  ],
  "total": 120,
  "page": 1,
  "limit": 15
}
```

### GET /invoices/:id
Get invoice detail with payment records.

**Response:**
```json
{
  "invoice": {
    "id": 45,
    "invoice_number": "INV-202609-00001",
    "customer_name": "Md. Abdul Karim",
    "customer_code": "CUS-00001",
    "address": "House 12, Road 5, Dhanmondi",
    "area": "Dhanmondi",
    "mobile": "01700000001",
    "package_name": "Home 10",
    "speed_mbps": 10,
    "billing_period_start": "2026-09-01",
    "billing_period_end": "2026-09-28",
    "previous_due": 0,
    "current_bill": 700,
    "discount": 0,
    "late_fee": 0,
    "total_amount": 700,
    "paid_amount": 700,
    "due_amount": 0,
    "due_date": "2026-09-15",
    "status": "paid",
    ...
  },
  "payments": [
    {
      "id": 120,
      "payment_code": "PAY-000120",
      "amount": 700,
      "payment_method": "Cash",
      "payment_date": "2026-09-05T10:15:00.000Z",
      ...
    }
  ],
  "company": {
    "company_name": "SwiftNet Broadband Ltd.",
    "address": "House 12, Road 5, Dhanmondi, Dhaka-1205",
    "phone": "+880 1711-000000",
    "email": "info@swiftnet.com.bd"
  }
}
```

### POST /invoices/generate
Create a single invoice for one customer. (**Billing Manager, Admin**)

**Request:**
```json
{
  "customer_id": 1,
  "billing_period_start": "2026-10-01",
  "billing_period_end": "2026-10-28",
  "discount": 0,
  "late_fee": 0,
  "notes": "October billing"
}
```

**Response:**
```json
{
  "id": 46,
  "invoice_number": "INV-202610-00001",
  "total": 700
}
```

**Formula:** `Total = Previous Due + Current Bill + Late Fee − Discount`

### POST /invoices/generate-monthly
Bulk-generate invoices for all active/suspended customers for a billing period. (**Billing Manager, Admin**)

**Request:**
```json
{
  "billing_period_start": "2026-10-01",
  "billing_period_end": "2026-10-28",
  "late_fee_for_overdue": 30
}
```

**Response:**
```json
{
  "created": 18,
  "skipped": 2,
  "message": "Generated 18 invoices, skipped 2 (already billed)."
}
```

Skipped invoices are those customers who already have an invoice for that period.

### PUT /invoices/:id
Update invoice discount, late fee, or notes. (**Billing Manager, Admin**)

**Request:**
```json
{
  "discount": 100,
  "late_fee": 50,
  "notes": "Discount applied due to loyalty"
}
```

**Response:**
```json
{
  "success": true
}
```

Automatically recalculates `total_amount`, `due_amount`, and `status`.

### POST /invoices/mark-overdue
Mark all past-due unpaid/partially-paid invoices as "overdue". (**Billing Manager, Admin**)

**Response:**
```json
{
  "updated": 5
}
```

---

## Payment Endpoints

### GET /payments
List payment records with filters.

**Query Parameters:**
- `search` — Search by payment code, customer, txn ID
- `method` — Filter by payment method
- `date_from`, `date_to` — Date range filter
- `page`, `limit` — Pagination

**Response:**
```json
{
  "payments": [
    {
      "id": 120,
      "payment_code": "PAY-000120",
      "customer_id": 1,
      "customer_name": "Md. Abdul Karim",
      "customer_code": "CUS-00001",
      "invoice_id": 45,
      "invoice_number": "INV-202609-00001",
      "amount": 700,
      "payment_method": "Cash",
      "transaction_id": null,
      "payment_date": "2026-09-05T10:15:00.000Z",
      "collected_by_name": "Rahim Uddin",
      "notes": null,
      "created_at": "2026-09-05T10:15:00.000Z"
    },
    ...
  ],
  "total": 150,
  "page": 1,
  "limit": 15
}
```

### GET /payments/:id
Get payment detail (for receipt printing).

**Response:**
```json
{
  "payment": {
    "id": 120,
    "payment_code": "PAY-000120",
    "customer_name": "Md. Abdul Karim",
    "customer_code": "CUS-00001",
    "address": "House 12, Road 5, Dhanmondi",
    "invoice_number": "INV-202609-00001",
    "payment_method": "Cash",
    "payment_date": "2026-09-05T10:15:00.000Z",
    "collected_by_name": "Rahim Uddin",
    "amount": 700,
    ...
  },
  "company": {
    "company_name": "SwiftNet Broadband Ltd.",
    "address": "House 12, Road 5, Dhanmondi, Dhaka-1205",
    ...
  }
}
```

### POST /payments
Record a payment and auto-update the invoice. (**Billing Manager, Admin**)

**Request:**
```json
{
  "customer_id": 1,
  "invoice_id": 45,
  "amount": 700,
  "payment_method": "Cash",
  "transaction_id": null,
  "notes": "Collected by Rahim"
}
```

**Response:**
```json
{
  "id": 121,
  "payment_code": "PAY-000121"
}
```

If `invoice_id` is not provided, payment is applied to the customer's oldest unpaid invoice. If no unpaid invoices exist, customer's general due balance is reduced.

The invoice status is auto-updated:
- Paid → if `paid_amount >= total_amount`
- Partially paid → if `0 < paid_amount < total_amount`
- Unpaid → if `paid_amount = 0`

---

## Other Endpoints (Summary)

### Expenses
```
GET    /expenses?category=...&date_from=...&date_to=...
POST   /expenses
PUT    /expenses/:id
DELETE /expenses/:id
```

### Connections
```
GET    /connections?status=...&search=...
PUT    /connections/:id
```

### Dashboard
```
GET    /dashboard/stats        → KPIs
GET    /dashboard/charts       → Chart data
```

### Reports
```
GET    /reports/collection     → Payments in date range
GET    /reports/due            → Outstanding dues
GET    /reports/customers      → Customer list
GET    /reports/expenses       → Expense breakdown
GET    /reports/revenue        → Billing vs collection
GET    /reports/packages       → Package stats
```

### Notifications
```
GET    /notifications
PUT    /notifications/:id/read
PUT    /notifications/read-all
```

### Settings
```
GET    /settings
PUT    /settings
GET    /settings/audit-logs
```

---

## Error Responses

### 400 Bad Request
```json
{
  "error": "Name and mobile are required"
}
```

### 401 Unauthorized
```json
{
  "error": "No token provided"
}
```

### 403 Forbidden
```json
{
  "error": "You do not have permission to perform this action"
}
```

### 404 Not Found
```json
{
  "error": "Customer not found"
}
```

### 409 Conflict
```json
{
  "error": "Email already exists"
}
```

### 500 Internal Server Error
```json
{
  "error": "Failed to create user"
}
```

---

## Testing with cURL

### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@ispbilling.com","password":"password123"}'
```

### List customers with auth
```bash
TOKEN="your_jwt_token_here"
curl http://localhost:5000/api/customers \
  -H "Authorization: Bearer $TOKEN"
```

### Create invoice
```bash
curl -X POST http://localhost:5000/api/invoices/generate \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "customer_id": 1,
    "billing_period_start": "2026-10-01",
    "billing_period_end": "2026-10-28",
    "discount": 0,
    "late_fee": 0
  }'
```

---

For more examples and testing, use Postman with the included collection or refer to the frontend code for real-world usage patterns.
