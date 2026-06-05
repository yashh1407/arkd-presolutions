import mysql from 'mysql2/promise';

declare global {
  var _mysqlPool: mysql.Pool | undefined;
}

// 1. Create a centralized connection pool
export const pool = globalThis._mysqlPool || mysql.createPool({
  host: process.env.MYSQL_HOST || 'localhost',
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || 'arkd_infra',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Attach the pool to globalThis in development mode to prevent connection exhaustion during hot-reloads
if (process.env.NODE_ENV !== 'production') {
  globalThis._mysqlPool = pool;
}

let dbInitialized = false;

// 2. Auto-Migration (initDB) function
export async function initDB() {
  if (dbInitialized) return;
  const connection = await pool.getConnection();

  try {
    console.log("[initDB] Starting database auto-migration...");

    // 3. Define schema using CREATE TABLE IF NOT EXISTS
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL DEFAULT 'user',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Example CRM Tables needed for dashboard
    await connection.query(`
      CREATE TABLE IF NOT EXISTS production_entries (
        id INT AUTO_INCREMENT PRIMARY KEY,
        date DATE NOT NULL,
        material_name VARCHAR(255) NOT NULL,
        production_qty INT NOT NULL DEFAULT 0,
        target_qty INT NOT NULL DEFAULT 0,
        grinding_qty INT NOT NULL DEFAULT 0,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Dispatch Entries Table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS dispatch_entries (
        id INT AUTO_INCREMENT PRIMARY KEY,
        date DATE NOT NULL,
        challan_no VARCHAR(255),
        prod_outer_qty INT DEFAULT 0,
        prod_middle_qty INT DEFAULT 0,
        prod_inner_qty INT DEFAULT 0,
        punch_outer_qty INT DEFAULT 0,
        punch_middle_qty INT DEFAULT 0,
        punch_inner_qty INT DEFAULT 0,
        total_prod_qty INT DEFAULT 0,
        total_punch_qty INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Expense Entries Table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS expense_entries (
        id INT AUTO_INCREMENT PRIMARY KEY,
        date DATE NOT NULL,
        amount DECIMAL(10, 2) NOT NULL,
        remark VARCHAR(500),
        paid_by VARCHAR(255),
        payment_mode VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Worker Materials Table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS worker_materials (
        id INT AUTO_INCREMENT PRIMARY KEY,
        date DATE NOT NULL,
        employee_name VARCHAR(255) NOT NULL,
        item_name VARCHAR(255) NOT NULL,
        qty INT NOT NULL DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Daily Targets Table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS daily_targets (
        id INT AUTO_INCREMENT PRIMARY KEY,
        date DATE NOT NULL,
        outer_365 INT DEFAULT 0,
        middle_313 INT DEFAULT 0,
        inner_273 INT DEFAULT 0,
        hole_2 INT DEFAULT 0,
        lancing INT DEFAULT 0,
        dip INT DEFAULT 0,
        hole_5 INT DEFAULT 0,
        square INT DEFAULT 0,
        single_punch INT DEFAULT 0,
        apple_cut INT DEFAULT 0,
        inner_1 INT DEFAULT 0,
        inner_2 INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 4. Safe, idempotent migrations (adding columns safely)
    try {
      await connection.query(`ALTER TABLE users ADD COLUMN phone VARCHAR(20) NULL`);
      console.log("[initDB] Migration: Added 'phone' column to 'users' table.");
    } catch (e: any) {
      // ER_DUP_FIELDNAME (1060) means the column already exists. Ignore it safely.
      if (e.code !== 'ER_DUP_FIELDNAME') throw e;
    }

    const alterQueries = [
      `ALTER TABLE production_entries ADD COLUMN machine1_qty INT DEFAULT 0`,
      `ALTER TABLE production_entries ADD COLUMN machine2_qty INT DEFAULT 0`,
      `ALTER TABLE production_entries ADD COLUMN cutting_machine VARCHAR(255) NULL`,
      `ALTER TABLE production_entries ADD COLUMN punching_machine VARCHAR(255) NULL`,
      `ALTER TABLE production_entries ADD COLUMN punching_qty INT DEFAULT 0`,
      `ALTER TABLE production_entries ADD COLUMN rejected_qty INT DEFAULT 0`,
      `ALTER TABLE production_entries ADD COLUMN final_qty INT DEFAULT 0`,
      `ALTER TABLE production_entries ADD COLUMN grinding_machine VARCHAR(255) NULL`,
      `ALTER TABLE production_entries ADD COLUMN operator_name VARCHAR(255) NULL`,
      `ALTER TABLE production_entries ADD COLUMN cutting_outer_grade VARCHAR(255) NULL`,
      `ALTER TABLE production_entries ADD COLUMN cutting_outer_qty INT DEFAULT 0`,
      `ALTER TABLE production_entries ADD COLUMN cutting_middle_grade VARCHAR(255) NULL`,
      `ALTER TABLE production_entries ADD COLUMN cutting_middle_qty INT DEFAULT 0`,
      `ALTER TABLE production_entries ADD COLUMN cutting_inner_grade VARCHAR(255) NULL`,
      `ALTER TABLE production_entries ADD COLUMN cutting_inner_qty INT DEFAULT 0`
    ];

    for (const q of alterQueries) {
      try {
        await connection.query(q);
      } catch (e: any) {
        if (e.code !== 'ER_DUP_FIELDNAME') throw e;
      }
    }

    // 5. Seed default data safely
    const [rows] = await connection.query('SELECT COUNT(*) as count FROM users') as any[];
    if (rows[0].count === 0 && process.env.ADMIN_INITIAL_USERNAME && process.env.ADMIN_INITIAL_PASSWORD) {
      console.log(`[initDB] Seeding default admin user: ${process.env.ADMIN_INITIAL_USERNAME}...`);
      
      const bcrypt = await import('bcrypt');
      const hash = await bcrypt.hash(process.env.ADMIN_INITIAL_PASSWORD, 10);
      
      await connection.query(
        `INSERT IGNORE INTO users (name, email, password, role) VALUES (?, ?, ?, ?)`,
        ['Super Admin', process.env.ADMIN_INITIAL_USERNAME, hash, 'admin']
      );
    } else if (rows[0].count === 0) {
      console.warn("[initDB] WARNING: Users table is empty but ADMIN_INITIAL_USERNAME and ADMIN_INITIAL_PASSWORD are not set in .env!");
    }

    console.log("[initDB] Database auto-migration completed successfully.");
    dbInitialized = true;
  } catch (error) {
    console.error("[initDB] Migration failed:", error);
  } finally {
    // ALWAYS release the connection back to the pool
    connection.release();
  }
}
