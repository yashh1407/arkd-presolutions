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

    // Employees Table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS employees (
        id INT AUTO_INCREMENT PRIMARY KEY,
        employee_id VARCHAR(50) UNIQUE,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        phone VARCHAR(20),
        department VARCHAR(100),
        designation VARCHAR(100),
        password VARCHAR(255),
        joining_date DATE,
        salary DECIMAL(10, 2),
        address TEXT,
        status ENUM('Active', 'Inactive') DEFAULT 'Active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // employee_attendance Table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS employee_attendance (
        id INT AUTO_INCREMENT PRIMARY KEY,
        employee_id VARCHAR(50) NOT NULL,
        date DATE NOT NULL,
        shift VARCHAR(50),
        check_in_time DATETIME,
        check_out_time DATETIME,
        total_working_hours DECIMAL(5,2),
        check_in_location VARCHAR(255),
        check_out_location VARCHAR(255),
        check_in_photo TEXT,
        check_out_photo TEXT,
        status VARCHAR(50) DEFAULT 'Present',
        remarks TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // production_logs Table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS production_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        log_id VARCHAR(50) UNIQUE,
        employee_id VARCHAR(50) NOT NULL,
        attendance_id INT,
        date DATE NOT NULL,
        shift VARCHAR(50),
        department VARCHAR(100),
        job_card_number VARCHAR(100),
        work_order_number VARCHAR(100),
        project_name VARCHAR(255),
        material_name VARCHAR(255),
        material_thickness VARCHAR(50),
        material_size VARCHAR(100),
        drawing_number VARCHAR(100),
        supervisor_name VARCHAR(255),
        
        cutting_machine VARCHAR(100),
        cutting_machine_id VARCHAR(100),
        cutting_start_time DATETIME,
        cutting_end_time DATETIME,
        cutting_duration DECIMAL(5,2),
        cutting_quantity INT DEFAULT 0,
        cutting_dimensions VARCHAR(100),
        cutting_scrap_quantity INT DEFAULT 0,
        cutting_rejected_quantity INT DEFAULT 0,
        cutting_machine_issue ENUM('Yes', 'No') DEFAULT 'No',
        cutting_issue_description TEXT,

        punching_machine VARCHAR(100),
        punching_machine_id VARCHAR(100),
        punching_start_time DATETIME,
        punching_end_time DATETIME,
        punching_duration DECIMAL(5,2),
        punching_quantity INT DEFAULT 0,
        punching_rejected_quantity INT DEFAULT 0,
        punching_machine_issue ENUM('Yes', 'No') DEFAULT 'No',
        punching_issue_description TEXT,

        total_planned_quantity INT DEFAULT 0,
        total_completed_quantity INT DEFAULT 0,
        total_good_quantity INT DEFAULT 0,
        total_rejected_quantity INT DEFAULT 0,
        total_scrap_quantity INT DEFAULT 0,
        pending_quantity INT DEFAULT 0,
        
        work_status VARCHAR(50),
        final_remarks TEXT,
        approval_status VARCHAR(50) DEFAULT 'Pending',
        approved_by VARCHAR(255),
        approved_at DATETIME,
        
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
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
      `ALTER TABLE production_entries ADD COLUMN cutting_inner_qty INT DEFAULT 0`,
      `ALTER TABLE production_entries ADD COLUMN employee_id VARCHAR(50) NULL`,
      `ALTER TABLE production_entries ADD COLUMN trolley_type VARCHAR(50) NULL`,
      `ALTER TABLE production_entries ADD COLUMN punching_outer_tool VARCHAR(255) NULL`,
      `ALTER TABLE production_entries ADD COLUMN punching_outer_qty INT DEFAULT 0`,
      `ALTER TABLE production_entries ADD COLUMN punching_middle_tool VARCHAR(255) NULL`,
      `ALTER TABLE production_entries ADD COLUMN punching_middle_qty INT DEFAULT 0`,
      `ALTER TABLE production_entries ADD COLUMN punching_inner_tool VARCHAR(255) NULL`,
      `ALTER TABLE production_entries ADD COLUMN punching_inner_qty INT DEFAULT 0`,
      `ALTER TABLE production_entries ADD COLUMN punching_details JSON NULL`,
      `ALTER TABLE employees ADD COLUMN password VARCHAR(255) NULL`
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
