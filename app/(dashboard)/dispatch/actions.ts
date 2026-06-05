"use server"

import { pool } from "@/lib/db"
import { revalidatePath } from "next/cache"

export async function getDispatches() {
  const connection = await pool.getConnection()
  try {
    const [rows] = await connection.query(`
      SELECT * FROM dispatch_entries
      ORDER BY date DESC, id DESC
    `)
    return rows as any[]
  } catch (error) {
    console.error("Error fetching dispatches:", error)
    return []
  } finally {
    connection.release()
  }
}

export async function addDispatch(data: {
  date: string
  challan_no: string
  prod_outer_qty: number
  prod_middle_qty: number
  prod_inner_qty: number
  punch_outer_qty: number
  punch_middle_qty: number
  punch_inner_qty: number
}) {
  const total_prod = data.prod_outer_qty + data.prod_middle_qty + data.prod_inner_qty
  const total_punch = data.punch_outer_qty + data.punch_middle_qty + data.punch_inner_qty

  const connection = await pool.getConnection()
  try {
    await connection.query(`
      INSERT INTO dispatch_entries (
        date, challan_no, 
        prod_outer_qty, prod_middle_qty, prod_inner_qty, total_prod_qty,
        punch_outer_qty, punch_middle_qty, punch_inner_qty, total_punch_qty
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      data.date, data.challan_no, 
      data.prod_outer_qty, data.prod_middle_qty, data.prod_inner_qty, total_prod,
      data.punch_outer_qty, data.punch_middle_qty, data.punch_inner_qty, total_punch
    ])
    
    revalidatePath("/dispatch")
    return { success: true }
  } catch (error: any) {
    console.error("Error adding dispatch:", error)
    return { success: false, error: error.message }
  } finally {
    connection.release()
  }
}

export async function deleteDispatch(id: number) {
  const connection = await pool.getConnection()
  try {
    await connection.query(`DELETE FROM dispatch_entries WHERE id = ?`, [id])
    revalidatePath("/dispatch")
    return { success: true }
  } catch (error: any) {
    console.error("Error deleting dispatch:", error)
    return { success: false, error: error.message }
  } finally {
    connection.release()
  }
}
