"use server"

import { pool, initDB } from "@/lib/db"
import { revalidatePath } from "next/cache"

export async function getEmployees() {
  try {
    await initDB()
    const [rows] = await pool.query(`SELECT * FROM employees ORDER BY id DESC`)
    
    // Format dates to avoid serialization issues
    const safeRows = (rows as any[]).map(row => ({
      ...row,
      joining_date: row.joining_date ? new Date(row.joining_date).toISOString().split('T')[0] : '',
      created_at: row.created_at ? new Date(row.created_at).toLocaleString() : '',
      updated_at: row.updated_at ? new Date(row.updated_at).toLocaleString() : ''
    }))
    
    return { success: true, data: safeRows }
  } catch (error: any) {
    console.error("Error fetching employees:", error)
    return { success: false, error: error.message || "Failed to fetch employees" }
  }
}

export async function saveEmployee(formData: FormData) {
  try {
    await initDB()
    
    const employee_id = formData.get("employee_id") as string
    const name = formData.get("name") as string
    const email = formData.get("email") as string || null
    const phone = formData.get("phone") as string || null
    const department = formData.get("department") as string || null
    const designation = formData.get("designation") as string || null
    const joining_date = formData.get("joining_date") as string || null
    const salary = formData.get("salary") ? Number(formData.get("salary")) : null
    const address = formData.get("address") as string || null
    const status = formData.get("status") as string || 'Active'

    const [result] = await pool.query(
      `INSERT INTO employees 
       (employee_id, name, email, phone, department, designation, joining_date, salary, address, status) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [employee_id, name, email, phone, department, designation, joining_date, salary, address, status]
    )

    revalidatePath("/employees")
    revalidatePath("/dashboard")
    return { success: true, insertId: (result as any).insertId }
  } catch (error: any) {
    console.error("Error saving employee:", error)
    // Handle duplicate employee_id or email
    if (error.code === 'ER_DUP_ENTRY') {
       return { success: false, error: "Employee ID or Email already exists." }
    }
    return { success: false, error: error.message || "Failed to save employee" }
  }
}

export async function updateEmployee(id: number, formData: FormData) {
  try {
    await initDB()
    
    const employee_id = formData.get("employee_id") as string
    const name = formData.get("name") as string
    const email = formData.get("email") as string || null
    const phone = formData.get("phone") as string || null
    const department = formData.get("department") as string || null
    const designation = formData.get("designation") as string || null
    const joining_date = formData.get("joining_date") as string || null
    const salary = formData.get("salary") ? Number(formData.get("salary")) : null
    const address = formData.get("address") as string || null
    const status = formData.get("status") as string || 'Active'

    await pool.query(
      `UPDATE employees 
       SET employee_id = ?, name = ?, email = ?, phone = ?, department = ?, designation = ?, joining_date = ?, salary = ?, address = ?, status = ?
       WHERE id = ?`,
      [employee_id, name, email, phone, department, designation, joining_date, salary, address, status, id]
    )

    revalidatePath("/employees")
    revalidatePath("/dashboard")
    return { success: true }
  } catch (error: any) {
    console.error("Error updating employee:", error)
    if (error.code === 'ER_DUP_ENTRY') {
       return { success: false, error: "Employee ID or Email already exists." }
    }
    return { success: false, error: error.message || "Failed to update employee" }
  }
}

export async function deleteEmployee(id: number) {
  try {
    await initDB()
    await pool.query(`DELETE FROM employees WHERE id = ?`, [id])
    
    revalidatePath("/employees")
    revalidatePath("/dashboard")
    return { success: true }
  } catch (error: any) {
    console.error("Error deleting employee:", error)
    return { success: false, error: error.message || "Failed to delete employee" }
  }
}
