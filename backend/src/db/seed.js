const bcrypt = require('bcryptjs');
const db = require('./index');

function run() {
  const roleCount = db.prepare('SELECT COUNT(*) c FROM roles').get().c;
  if (roleCount === 0) {
    const insertRole = db.prepare('INSERT INTO roles (name, description, permissions) VALUES (?,?,?)');
    insertRole.run('super_admin', 'Full system access', JSON.stringify(['*']));
    insertRole.run('admin', 'Manage customers, billing, packages, reports', JSON.stringify([
      'customers.*', 'packages.*', 'billing.*', 'payments.*', 'expenses.*', 'reports.view', 'connections.*'
    ]));
    insertRole.run('billing_manager', 'Manage billing, invoices and payments', JSON.stringify([
      'billing.*', 'payments.*', 'customers.view', 'reports.view'
    ]));
    insertRole.run('support_staff', 'View customers and connections, limited edits', JSON.stringify([
      'customers.view', 'customers.edit', 'connections.*'
    ]));
    console.log('Roles seeded');
  }

  const userCount = db.prepare('SELECT COUNT(*) c FROM users').get().c;
  if (userCount === 0) {
    const superAdminRole = db.prepare("SELECT id FROM roles WHERE name = 'super_admin'").get();
    const adminRole = db.prepare("SELECT id FROM roles WHERE name = 'admin'").get();
    const billingRole = db.prepare("SELECT id FROM roles WHERE name = 'billing_manager'").get();
    const supportRole = db.prepare("SELECT id FROM roles WHERE name = 'support_staff'").get();

    const insertUser = db.prepare(`INSERT INTO users (name, email, phone, password_hash, role_id, status)
      VALUES (?,?,?,?,?, 'active')`);

    const pass = bcrypt.hashSync('password123', 10);
    insertUser.run('Super Admin', 'superadmin@ispbilling.com', '01700000001', pass, superAdminRole.id);
    insertUser.run('Rahim Uddin', 'admin@ispbilling.com', '01700000002', pass, adminRole.id);
    insertUser.run('Karim Ahmed', 'billing@ispbilling.com', '01700000003', pass, billingRole.id);
    insertUser.run('Support Desk', 'support@ispbilling.com', '01700000004', pass, supportRole.id);
    console.log('Users seeded (password for all: password123)');
  }

  const settingsCount = db.prepare('SELECT COUNT(*) c FROM company_settings').get().c;
  if (settingsCount === 0) {
    db.prepare(`INSERT INTO company_settings (id, company_name, address, phone, email, website, invoice_prefix, payment_prefix, late_fee_flat, currency)
      VALUES (1, 'SwiftNet Broadband Ltd.', 'House 12, Road 5, Dhanmondi, Dhaka-1205, Bangladesh', '+880 1711-000000', 'info@swiftnet.com.bd', 'www.swiftnet.com.bd', 'INV', 'PAY', 50, 'BDT')`).run();
    console.log('Company settings seeded');
  }

  const pkgCount = db.prepare('SELECT COUNT(*) c FROM packages').get().c;
  if (pkgCount === 0) {
    const insertPkg = db.prepare(`INSERT INTO packages (name, speed_mbps, monthly_price, installation_fee, connection_type, description, status)
      VALUES (?,?,?,?,?,?, 'active')`);
    insertPkg.run('Home 10', 10, 700, 1000, 'Fiber', 'Basic package for browsing and streaming', );
    insertPkg.run('Home 20', 20, 1000, 1000, 'Fiber', 'Great for small families', );
    insertPkg.run('Home 30', 30, 1300, 1000, 'Fiber', 'HD streaming and gaming', );
    insertPkg.run('Home 50', 50, 1800, 1500, 'Fiber', 'Multiple devices, 4K streaming', );
    insertPkg.run('Business 100', 100, 3500, 2000, 'Fiber', 'Dedicated bandwidth for business', );
    console.log('Packages seeded');
  }

  const custCount = db.prepare('SELECT COUNT(*) c FROM customers').get().c;
  if (custCount === 0) {
    const packages = db.prepare('SELECT id, monthly_price FROM packages').all();
    const areas = ['Dhanmondi', 'Mirpur', 'Uttara', 'Gulshan', 'Banani', 'Mohammadpur', 'Badda', 'Banasree'];
    const statuses = ['active', 'active', 'active', 'active', 'inactive', 'suspended'];
    const names = [
      ['Md. Abdul Karim', 'Md. Abdur Rahim'], ['Fatema Begum', 'Md. Yusuf Ali'], ['Md. Jahangir Alam', 'Md. Nurul Islam'],
      ['Sultana Akter', 'Md. Kamal Hossain'], ['Md. Rafiqul Islam', 'Md. Shafiqul Islam'], ['Nasrin Sultana', 'Md. Habibur Rahman'],
      ['Md. Shahidul Islam', 'Md. Amirul Islam'], ['Ayesha Siddika', 'Md. Faruk Hossain'], ['Md. Mahbubur Rahman', 'Md. Aminul Islam'],
      ['Rehana Parvin', 'Md. Sirajul Islam'], ['Md. Tariqul Islam', 'Md. Enamul Haque'], ['Salma Khatun', 'Md. Abul Bashar'],
      ['Md. Monirul Islam', 'Md. Golam Mostofa'], ['Rina Akter', 'Md. Ismail Hossain'], ['Md. Anisur Rahman', 'Md. Sohel Rana'],
      ['Nazma Begum', 'Md. Anwar Hossain'], ['Md. Delwar Hossain', 'Md. Jamal Uddin'], ['Shirin Akter', 'Md. Mostafizur Rahman'],
      ['Md. Zahirul Islam', 'Md. Nazrul Islam'], ['Farida Yasmin', 'Md. Aktar Hossain']
    ];
    const insertCust = db.prepare(`INSERT INTO customers
      (customer_code, name, guardian_name, mobile, alt_mobile, email, nid_number, address, area, connection_type,
       package_id, monthly_bill, ip_address, mac_address, router_info, connection_date, billing_date, due_date, status, notes, current_due)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`);
    const insertConn = db.prepare(`INSERT INTO connections
      (customer_id, username, ip_address, mac_address, router_onu, connection_type, installation_date, package_id, status)
      VALUES (?,?,?,?,?,?,?,?,?)`);

    for (let i = 0; i < names.length; i++) {
      const code = `CUS-${String(i + 1).padStart(5, '0')}`;
      const pkg = packages[i % packages.length];
      const area = areas[i % areas.length];
      const status = statuses[i % statuses.length];
      const ip = `10.10.${Math.floor(i / 254)}.${(i % 254) + 1}`;
      const mac = `00:1B:44:11:3A:${(10 + i).toString(16).padStart(2, '0').toUpperCase()}`;
      const connDate = `2024-${String((i % 12) + 1).padStart(2, '0')}-15`;
      const info = insertCust.run(
        code, names[i][0], names[i][1], `017${String(10000000 + i * 137).slice(0, 8)}`,
        `018${String(20000000 + i * 91).slice(0, 8)}`, `customer${i + 1}@example.com`,
        `19${85 + (i % 15)}${String(1000000 + i).slice(0, 7)}`,
        `House ${10 + i}, Road ${1 + (i % 20)}, ${area}, Dhaka`, area, 'Fiber',
        pkg.id, pkg.monthly_price, ip, mac, `ONU-${1000 + i}`, connDate, 5, 15, status,
        i % 7 === 0 ? 'VIP customer' : '', status === 'active' ? (i % 3 === 0 ? pkg.monthly_price : 0) : pkg.monthly_price
      );
      insertConn.run(info.lastInsertRowid, `user${i + 1}`, ip, mac, `ONU-${1000 + i}`, 'Fiber', connDate, pkg.id,
        status === 'active' ? 'active' : status === 'suspended' ? 'suspended' : 'disconnected');
    }
    console.log('Customers & connections seeded');
  }

  // Seed invoices + payments for the last 3 months
  const invCount = db.prepare('SELECT COUNT(*) c FROM invoices').get().c;
  if (invCount === 0) {
    const customers = db.prepare('SELECT * FROM customers').all();
    const insertInv = db.prepare(`INSERT INTO invoices
      (invoice_number, customer_id, package_id, billing_period_start, billing_period_end, previous_due, current_bill,
       discount, late_fee, total_amount, paid_amount, due_amount, due_date, status)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`);
    const insertPay = db.prepare(`INSERT INTO payments
      (payment_code, customer_id, invoice_id, amount, payment_method, transaction_id, payment_date, collected_by, notes)
      VALUES (?,?,?,?,?,?,?,?,?)`);

    const methods = ['Cash', 'bKash', 'Nagad', 'Rocket', 'Bank Transfer'];
    let invSeq = 1, paySeq = 1;
    const months = ['2026-07', '2026-08', '2026-09'];

    customers.forEach((c, ci) => {
      let prevDue = 0;
      months.forEach((month, mi) => {
        const start = `${month}-01`;
        const end = `${month}-28`;
        const dueDateStr = `${month}-${String(c.due_date).padStart(2, '0')}`;
        const currentBill = c.monthly_bill;
        const discount = ci % 10 === 0 ? 50 : 0;
        const isLastMonth = mi === months.length - 1;
        const lateFee = (prevDue > 0 && mi > 0) ? 30 : 0;
        const total = prevDue + currentBill + lateFee - discount;

        let paidAmount, status;
        if (c.status === 'suspended' && isLastMonth) {
          paidAmount = 0; status = 'overdue';
        } else if (ci % 6 === 0 && isLastMonth) {
          paidAmount = Math.round(total * 0.5); status = 'partially_paid';
        } else if (ci % 9 === 0 && isLastMonth) {
          paidAmount = 0; status = 'unpaid';
        } else {
          paidAmount = total; status = 'paid';
        }
        const dueAmount = Math.max(total - paidAmount, 0);
        const invNumber = `INV-${month.replace('-', '')}-${String(invSeq++).padStart(5, '0')}`;

        const invInfo = insertInv.run(invNumber, c.id, c.package_id, start, end, prevDue, currentBill, discount,
          lateFee, total, paidAmount, dueAmount, dueDateStr, status);

        if (paidAmount > 0) {
          const method = methods[(ci + mi) % methods.length];
          const payDate = `${month}-${String(Math.min(c.due_date + 2, 27)).padStart(2, '0')} 10:30:00`;
          insertPay.run(`PAY-${String(paySeq++).padStart(6, '0')}`, c.id, invInfo.lastInsertRowid, paidAmount, method,
            method === 'Cash' ? null : `TXN${100000 + paySeq}`, payDate, 2, '');
        }
        prevDue = dueAmount;
      });
      // sync customer's current_due to last invoice due amount
      db.prepare('UPDATE customers SET current_due = ? WHERE id = ?').run(prevDue, c.id);
    });
    console.log('Invoices & payments seeded');
  }

  // Seed expenses for last 3 months
  const expCount = db.prepare('SELECT COUNT(*) c FROM expenses').get().c;
  if (expCount === 0) {
    const insertExp = db.prepare(`INSERT INTO expenses (title, category, amount, expense_date, paid_by, description, created_by)
      VALUES (?,?,?,?,?,?,?)`);
    const items = [
      ['Bandwidth upstream bill', 'Internet Bandwidth', 85000, 'Office Cash', 'Monthly upstream bandwidth bill'],
      ['Office electricity bill', 'Electricity', 8500, 'Bank', 'DESCO monthly bill'],
      ['Office rent', 'Office Rent', 35000, 'Bank', 'Monthly office rent - Dhanmondi'],
      ['Staff salary', 'Staff Salary', 180000, 'Bank', 'Monthly salary for 6 staff'],
      ['Router replacement', 'Equipment', 12000, 'Office Cash', '5 new ONU devices'],
      ['Field maintenance', 'Maintenance', 6500, 'Office Cash', 'Cable repair - Mirpur area'],
      ['Facebook ad campaign', 'Marketing', 5000, 'Online', 'Local area promotion'],
      ['Fuel & transport', 'Transportation', 4200, 'Office Cash', 'Technician site visits'],
    ];
    const months = ['2026-07', '2026-08', '2026-09'];
    months.forEach((month) => {
      items.forEach((it, idx) => {
        insertExp.run(it[0], it[1], it[2] + (idx * 37), `${month}-${String(5 + (idx % 20)).padStart(2, '0')}`, it[3], it[4], 2);
      });
    });
    console.log('Expenses seeded');
  }

  // Notifications sample
  const notifCount = db.prepare('SELECT COUNT(*) c FROM notifications').get().c;
  if (notifCount === 0) {
    const overdueCustomers = db.prepare("SELECT c.id, c.name FROM customers c WHERE c.current_due > 0 LIMIT 5").all();
    const insertNotif = db.prepare(`INSERT INTO notifications (type, title, message, customer_id, channel) VALUES (?,?,?,?, 'system')`);
    overdueCustomers.forEach(c => {
      insertNotif.run('overdue', 'Overdue bill', `${c.name} has an overdue bill. Please follow up.`, c.id);
    });
    insertNotif.run('new_customer', 'New customer registered', 'A new customer was added to the system.', null);
    console.log('Notifications seeded');
  }

  console.log('\n✅ Seed complete.');
  console.log('Login with: admin@ispbilling.com / password123 (or superadmin@ispbilling.com)');
}

run();
