"use server"

import { pool, initDB } from "@/lib/db"
import { revalidatePath } from "next/cache"

export async function saveProductionEntry(formData: FormData) {
  try {
    await initDB()
    const date = formData.get("date") as string
    const material = formData.get("material") as string || "Assorted Grades"
    const productionQty = Number(formData.get("productionQty")) || 0
    const targetQty = Number(formData.get("targetQty")) || 0
    const grindingQty = Number(formData.get("grindingQty")) || 0
    
    // Machine outputs
    const machine1 = Number(formData.get("machine1")) || 0
    const machine2 = Number(formData.get("machine2")) || 0

    // New fields for restructured process
    const cuttingMachine = formData.get("cuttingMachine") as string || null
    
    // Trolleys
    const cuttingOuterGrade = formData.get("cuttingOuterGrade") as string || null
    const cuttingOuterQty = Number(formData.get("cuttingOuterQty")) || 0
    const cuttingMiddleGrade = formData.get("cuttingMiddleGrade") as string || null
    const cuttingMiddleQty = Number(formData.get("cuttingMiddleQty")) || 0
    const cuttingInnerGrade = formData.get("cuttingInnerGrade") as string || null
    const cuttingInnerQty = Number(formData.get("cuttingInnerQty")) || 0

    const punchingMachine = formData.get("punchingMachine") as string || null
    const punchingQty = Number(formData.get("punchingQty")) || 0
    const rejectedQty = Number(formData.get("rejectedQty")) || 0
    const finalQty = Number(formData.get("finalQty")) || 0
    const grindingMachine = formData.get("grindingMachine") as string || null
    const operatorName = formData.get("operatorName") as string || null

    // Using raw SQL query with mysql2/promise pool
    const [result] = await pool.query(
      `INSERT INTO production_entries 
       (date, material_name, production_qty, target_qty, grinding_qty, machine1_qty, machine2_qty, cutting_machine, punching_machine, punching_qty, rejected_qty, final_qty, grinding_machine, operator_name, cutting_outer_grade, cutting_outer_qty, cutting_middle_grade, cutting_middle_qty, cutting_inner_grade, cutting_inner_qty) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [date, material, productionQty, targetQty, grindingQty, machine1, machine2, cuttingMachine, punchingMachine, punchingQty, rejectedQty, finalQty, grindingMachine, operatorName, cuttingOuterGrade, cuttingOuterQty, cuttingMiddleGrade, cuttingMiddleQty, cuttingInnerGrade, cuttingInnerQty]
    )

    revalidatePath("/production")
    revalidatePath("/dashboard")
    return { success: true, insertId: (result as any).insertId }
    
  } catch (error: any) {
    console.error("Error saving production entry:", error)
    return { success: false, error: error.message || "Failed to save production entry" }
  }
}

export async function updateProductionEntry(id: number, formData: FormData) {
  try {
    await initDB()
    const date = formData.get("date") as string
    const material = formData.get("material") as string || "Assorted Grades"
    const productionQty = Number(formData.get("productionQty")) || 0
    const targetQty = Number(formData.get("targetQty")) || 0
    const grindingQty = Number(formData.get("grindingQty")) || 0
    
    // Machine outputs
    const machine1 = Number(formData.get("machine1")) || 0
    const machine2 = Number(formData.get("machine2")) || 0

    // New fields for restructured process
    const cuttingMachine = formData.get("cuttingMachine") as string || null

    // Trolleys
    const cuttingOuterGrade = formData.get("cuttingOuterGrade") as string || null
    const cuttingOuterQty = Number(formData.get("cuttingOuterQty")) || 0
    const cuttingMiddleGrade = formData.get("cuttingMiddleGrade") as string || null
    const cuttingMiddleQty = Number(formData.get("cuttingMiddleQty")) || 0
    const cuttingInnerGrade = formData.get("cuttingInnerGrade") as string || null
    const cuttingInnerQty = Number(formData.get("cuttingInnerQty")) || 0

    const punchingMachine = formData.get("punchingMachine") as string || null
    const punchingQty = Number(formData.get("punchingQty")) || 0
    const rejectedQty = Number(formData.get("rejectedQty")) || 0
    const finalQty = Number(formData.get("finalQty")) || 0
    const grindingMachine = formData.get("grindingMachine") as string || null
    const operatorName = formData.get("operatorName") as string || null

    await pool.query(
      `UPDATE production_entries 
       SET date = ?, material_name = ?, production_qty = ?, target_qty = ?, grinding_qty = ?, machine1_qty = ?, machine2_qty = ?, cutting_machine = ?, punching_machine = ?, punching_qty = ?, rejected_qty = ?, final_qty = ?, grinding_machine = ?, operator_name = ?, cutting_outer_grade = ?, cutting_outer_qty = ?, cutting_middle_grade = ?, cutting_middle_qty = ?, cutting_inner_grade = ?, cutting_inner_qty = ?
       WHERE id = ?`,
      [date, material, productionQty, targetQty, grindingQty, machine1, machine2, cuttingMachine, punchingMachine, punchingQty, rejectedQty, finalQty, grindingMachine, operatorName, cuttingOuterGrade, cuttingOuterQty, cuttingMiddleGrade, cuttingMiddleQty, cuttingInnerGrade, cuttingInnerQty, id]
    )

    revalidatePath("/production")
    revalidatePath("/dashboard")
    return { success: true }
  } catch (error: any) {
    console.error("Error updating production entry:", error)
    return { success: false, error: error.message || "Failed to update production entry" }
  }
}

export async function deleteProductionEntry(id: number) {
  try {
    await initDB()
    await pool.query(`DELETE FROM production_entries WHERE id = ?`, [id])
    
    revalidatePath("/production")
    revalidatePath("/dashboard")
    return { success: true }
  } catch (error: any) {
    console.error("Error deleting production entry:", error)
    return { success: false, error: error.message || "Failed to delete production entry" }
  }
}

export async function getProductionEntries() {
  try {
    await initDB()
    const [rows] = await pool.query(`SELECT * FROM production_entries ORDER BY id DESC LIMIT 50`)
    // Convert Dates to strings to pass back to client
    const safeRows = (rows as any[]).map(row => ({
      ...row,
      date: row.date ? new Date(row.date).toLocaleDateString() : '',
      created_at: row.created_at ? new Date(row.created_at).toLocaleString() : ''
    }))
    return { success: true, data: safeRows }
  } catch (error: any) {
    console.error("Error fetching production entries:", error)
    return { success: false, error: error.message || "Failed to fetch entries" }
  }
}

