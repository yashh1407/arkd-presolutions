"use server"

import { pool } from "@/lib/db"
import { revalidatePath } from "next/cache"

export async function getTargets() {
  const connection = await pool.getConnection()
  try {
    const [rows] = await connection.query(`
      SELECT * FROM daily_targets
      ORDER BY date DESC, id DESC
    `)
    return rows as any[]
  } catch (error) {
    console.error("Error fetching targets:", error)
    return []
  } finally {
    connection.release()
  }
}

export async function addTarget(data: {
  date: string
  outer_365: number
  middle_313: number
  inner_273: number
  hole_2: number
  lancing: number
  dip: number
  hole_5: number
  square: number
  single_punch: number
  apple_cut: number
  inner_1: number
  inner_2: number
}) {
  const connection = await pool.getConnection()
  try {
    // Check if target for this date already exists to prevent duplicates
    const [existing] = await connection.query(`SELECT id FROM daily_targets WHERE date = ?`, [data.date]) as any[]
    
    if (existing.length > 0) {
      // Update existing
      await connection.query(`
        UPDATE daily_targets SET 
          outer_365=?, middle_313=?, inner_273=?, 
          hole_2=?, lancing=?, dip=?, hole_5=?, square=?, single_punch=?, apple_cut=?, inner_1=?, inner_2=?
        WHERE date = ?
      `, [
        data.outer_365, data.middle_313, data.inner_273,
        data.hole_2, data.lancing, data.dip, data.hole_5, data.square, data.single_punch, data.apple_cut, data.inner_1, data.inner_2,
        data.date
      ])
    } else {
      // Insert new
      await connection.query(`
        INSERT INTO daily_targets (
          date, outer_365, middle_313, inner_273, 
          hole_2, lancing, dip, hole_5, square, single_punch, apple_cut, inner_1, inner_2
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        data.date, data.outer_365, data.middle_313, data.inner_273,
        data.hole_2, data.lancing, data.dip, data.hole_5, data.square, data.single_punch, data.apple_cut, data.inner_1, data.inner_2
      ])
    }
    
    revalidatePath("/targets")
    return { success: true }
  } catch (error: any) {
    console.error("Error setting target:", error)
    return { success: false, error: error.message }
  } finally {
    connection.release()
  }
}

export async function deleteTarget(id: number) {
  const connection = await pool.getConnection()
  try {
    await connection.query(`DELETE FROM daily_targets WHERE id = ?`, [id])
    revalidatePath("/targets")
    return { success: true }
  } catch (error: any) {
    console.error("Error deleting target:", error)
    return { success: false, error: error.message }
  } finally {
    connection.release()
  }
}
