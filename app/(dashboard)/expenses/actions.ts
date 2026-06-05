"use server"

import { pool } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { RowDataPacket } from "mysql2"

export async function getExpenses() {
  const connection = await pool.getConnection()
  try {
    const [rows] = await connection.query(`
      SELECT * FROM expense_entries
      ORDER BY date DESC, id DESC
    `)
    return rows as any[]
  } catch (error) {
    console.error("Error fetching expenses:", error)
    return []
  } finally {
    connection.release()
  }
}

export async function addExpense(data: {
  date: string
  amount: number
  remark: string
  paid_by: string
  payment_mode: string
}) {
  const connection = await pool.getConnection()
  try {
    await connection.query(`
      INSERT INTO expense_entries (date, amount, remark, paid_by, payment_mode)
      VALUES (?, ?, ?, ?, ?)
    `, [data.date, data.amount, data.remark, data.paid_by, data.payment_mode])
    
    revalidatePath("/expenses")
    return { success: true }
  } catch (error: any) {
    console.error("Error adding expense:", error)
    return { success: false, error: error.message }
  } finally {
    connection.release()
  }
}

export async function deleteExpense(id: number) {
  const connection = await pool.getConnection()
  try {
    await connection.query(`DELETE FROM expense_entries WHERE id = ?`, [id])
    revalidatePath("/expenses")
    return { success: true }
  } catch (error: any) {
    console.error("Error deleting expense:", error)
    return { success: false, error: error.message }
  } finally {
    connection.release()
  }
}
