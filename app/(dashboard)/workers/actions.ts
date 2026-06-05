"use server"

import { pool } from "@/lib/db"
import { revalidatePath } from "next/cache"

export async function getWorkerMaterials() {
  const connection = await pool.getConnection()
  try {
    const [rows] = await connection.query(`
      SELECT * FROM worker_materials
      ORDER BY date DESC, id DESC
    `)
    return rows as any[]
  } catch (error) {
    console.error("Error fetching worker materials:", error)
    return []
  } finally {
    connection.release()
  }
}

export async function addWorkerMaterial(data: {
  date: string
  employee_name: string
  item_name: string
  qty: number
}) {
  const connection = await pool.getConnection()
  try {
    await connection.query(`
      INSERT INTO worker_materials (date, employee_name, item_name, qty)
      VALUES (?, ?, ?, ?)
    `, [data.date, data.employee_name, data.item_name, data.qty])
    
    revalidatePath("/workers")
    return { success: true }
  } catch (error: any) {
    console.error("Error adding worker material:", error)
    return { success: false, error: error.message }
  } finally {
    connection.release()
  }
}

export async function deleteWorkerMaterial(id: number) {
  const connection = await pool.getConnection()
  try {
    await connection.query(`DELETE FROM worker_materials WHERE id = ?`, [id])
    revalidatePath("/workers")
    return { success: true }
  } catch (error: any) {
    console.error("Error deleting worker material:", error)
    return { success: false, error: error.message }
  } finally {
    connection.release()
  }
}
