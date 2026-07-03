"use server"

import { pool, initDB } from "@/lib/db"
import { revalidatePath } from "next/cache"

function numberField(value: FormDataEntryValue | null) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function optionalString(value: FormDataEntryValue | null) {
  if (typeof value !== "string") return null
  const trimmed = value.trim()
  return trimmed && trimmed !== "none" ? trimmed : null
}

export async function getPowderCoatingEntries() {
  try {
    await initDB()
    const [rows] = await pool.query(
      `SELECT * FROM powder_coating_entries ORDER BY date DESC, id DESC LIMIT 100`
    )
    
    // Format dates to strings
    const safeRows = (rows as any[]).map(row => ({
      ...row,
      qty: Number(row.qty || 0),
      rejection: Number(row.rejection || 0),
      powder_used_kg: Number(row.powder_used_kg || 0),
      date: row.date ? new Date(row.date).toISOString().split('T')[0] : '',
      created_at: row.created_at ? new Date(row.created_at).toLocaleString() : ''
    }))
    
    return { success: true, data: safeRows }
  } catch (error: any) {
    console.error("Error fetching powder coating entries:", error)
    return { success: false, error: error.message || "Failed to fetch entries" }
  }
}

export async function savePowderCoatingEntry(formData: FormData) {
  try {
    await initDB()
    const date = formData.get("date") as string || new Date().toISOString().split('T')[0]
    const materialType = optionalString(formData.get("materialType"))
    const qty = numberField(formData.get("qty"))
    const rejection = numberField(formData.get("rejection"))
    const powderUsedKg = numberField(formData.get("powderUsedKg"))

    if (!materialType) {
      return { success: false, error: "Material Type is required" }
    }

    await pool.query(
      `INSERT INTO powder_coating_entries (date, material_type, qty, rejection, powder_used_kg)
       VALUES (?, ?, ?, ?, ?)`,
      [date, materialType, qty, rejection, powderUsedKg]
    )

    revalidatePath("/scrap")
    return { success: true }
  } catch (error: any) {
    console.error("Error saving powder coating entry:", error)
    return { success: false, error: error.message || "Failed to save entry" }
  }
}

export async function updatePowderCoatingEntry(id: number, formData: FormData) {
  try {
    await initDB()
    const date = formData.get("date") as string || new Date().toISOString().split('T')[0]
    const materialType = optionalString(formData.get("materialType"))
    const qty = numberField(formData.get("qty"))
    const rejection = numberField(formData.get("rejection"))
    const powderUsedKg = numberField(formData.get("powderUsedKg"))

    if (!materialType) {
      return { success: false, error: "Material Type is required" }
    }

    await pool.query(
      `UPDATE powder_coating_entries 
       SET date = ?, material_type = ?, qty = ?, rejection = ?, powder_used_kg = ?
       WHERE id = ?`,
      [date, materialType, qty, rejection, powderUsedKg, id]
    )

    revalidatePath("/scrap")
    return { success: true }
  } catch (error: any) {
    console.error("Error updating powder coating entry:", error)
    return { success: false, error: error.message || "Failed to update entry" }
  }
}

export async function deletePowderCoatingEntry(id: number) {
  try {
    await initDB()
    await pool.query(`DELETE FROM powder_coating_entries WHERE id = ?`, [id])

    revalidatePath("/scrap")
    return { success: true }
  } catch (error: any) {
    console.error("Error deleting powder coating entry:", error)
    return { success: false, error: error.message || "Failed to delete entry" }
  }
}
