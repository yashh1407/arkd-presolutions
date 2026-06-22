"use server"

import { pool, initDB } from "@/lib/db"
import { revalidatePath } from "next/cache"

function optionalString(value: FormDataEntryValue | null) {
  if (typeof value !== "string") return null
  const trimmed = value.trim()
  return trimmed && trimmed !== "none" ? trimmed : null
}

function numberField(value: FormDataEntryValue | null) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function collectPunchingDetails(formData: FormData) {
  const details: Record<string, number> = {}
  let total = 0

  Array.from(formData.entries()).forEach(([key, value]) => {
    if (!key.startsWith("tool_")) return

    const qty = numberField(value)
    if (qty > 0) {
      details[key] = qty
      total += qty
    }
  })

  return {
    details,
    total,
    json: Object.keys(details).length > 0 ? JSON.stringify(details) : null,
  }
}

function parsePunchingDetails(value: unknown) {
  if (!value) return null
  if (typeof value === "object") return value as Record<string, number>

  if (typeof value === "string") {
    try {
      return JSON.parse(value) as Record<string, number>
    } catch {
      return null
    }
  }

  return null
}

function sumPunchingDetails(details: Record<string, number> | null) {
  if (!details) return 0
  return Object.values(details).reduce((sum, qty) => sum + Number(qty || 0), 0)
}

async function getEmployeeName(employeeId: string | null) {
  if (!employeeId) return null

  const [rows] = await pool.query(
    `SELECT name FROM employees WHERE employee_id = ? LIMIT 1`,
    [employeeId]
  ) as any[]

  return rows[0]?.name || null
}

export async function updateProductionEntryNumbers(id: number, formData: FormData) {
  try {
    await initDB()

    const [rows] = await pool.query(
      `SELECT cutting_outer_qty, cutting_middle_qty, cutting_inner_qty, punching_qty, punching_details
       FROM production_entries
       WHERE id = ?
       LIMIT 1`,
      [id]
    ) as any[]

    const current = rows[0]
    if (!current) {
      return { success: false, error: "Work log not found" }
    }

    const cuttingOuterQty = formData.has("cuttingOuterQty")
      ? numberField(formData.get("cuttingOuterQty"))
      : Number(current.cutting_outer_qty || 0)
    const cuttingMiddleQty = formData.has("cuttingMiddleQty")
      ? numberField(formData.get("cuttingMiddleQty"))
      : Number(current.cutting_middle_qty || 0)
    const cuttingInnerQty = formData.has("cuttingInnerQty")
      ? numberField(formData.get("cuttingInnerQty"))
      : Number(current.cutting_inner_qty || 0)
    const productionQty = cuttingOuterQty + cuttingMiddleQty + cuttingInnerQty

    const existingDetails = parsePunchingDetails(current.punching_details) || {}
    const updatedDetails = { ...existingDetails }

    Object.keys(updatedDetails).forEach((key) => {
      if (formData.has(key)) {
        updatedDetails[key] = numberField(formData.get(key))
      }
    })

    const positiveDetails = Object.fromEntries(
      Object.entries(updatedDetails).filter(([, qty]) => Number(qty || 0) > 0)
    ) as Record<string, number>

    const punchingQty = Object.keys(existingDetails).length > 0
      ? sumPunchingDetails(positiveDetails)
      : formData.has("punchingQty")
        ? numberField(formData.get("punchingQty"))
        : Number(current.punching_qty || 0)

    await pool.query(
      `UPDATE production_entries
       SET production_qty = ?, cutting_outer_qty = ?, cutting_middle_qty = ?, cutting_inner_qty = ?, punching_qty = ?, final_qty = ?, punching_details = ?
       WHERE id = ?`,
      [
        productionQty,
        cuttingOuterQty,
        cuttingMiddleQty,
        cuttingInnerQty,
        punchingQty,
        punchingQty,
        Object.keys(positiveDetails).length > 0 ? JSON.stringify(positiveDetails) : null,
        id,
      ]
    )

    revalidatePath("/production")
    revalidatePath("/employee-logs")
    revalidatePath("/dashboard")
    return { success: true }
  } catch (error: any) {
    console.error("Error updating production quantities:", error)
    return { success: false, error: error.message || "Failed to update work log quantities" }
  }
}

export async function saveProductionEntry(formData: FormData) {
  try {
    await initDB()
    const date = formData.get("date") as string
    const material = formData.get("material") as string || "Assorted Grades"
    const targetQty = numberField(formData.get("targetQty"))
    const grindingQty = numberField(formData.get("grindingQty"))
    
    // Machine outputs
    const machine1 = numberField(formData.get("machine1"))
    const machine2 = numberField(formData.get("machine2"))

    // New fields for restructured process
    const cuttingMachine = optionalString(formData.get("cuttingMachine"))
    
    // Trolleys
    const cuttingOuterGrade = optionalString(formData.get("cuttingOuterGrade"))
    const cuttingOuterQty = numberField(formData.get("cuttingOuterQty"))
    
    const cuttingMiddleGrade = optionalString(formData.get("cuttingMiddleGrade"))
    const cuttingMiddleQty = numberField(formData.get("cuttingMiddleQty"))
    
    const cuttingInnerGrade = optionalString(formData.get("cuttingInnerGrade"))
    const cuttingInnerQty = numberField(formData.get("cuttingInnerQty"))
    const cuttingTotal = cuttingOuterQty + cuttingMiddleQty + cuttingInnerQty
    const productionQty = numberField(formData.get("productionQty")) || cuttingTotal

    const punchingMachine = optionalString(formData.get("punchingMachine"))
    const punchingDetails = collectPunchingDetails(formData)
    const punchingQty = numberField(formData.get("punchingQty")) || punchingDetails.total
    const rejectedQty = numberField(formData.get("rejectedQty"))
    const finalQty = numberField(formData.get("finalQty")) || punchingQty
    const grindingMachine = optionalString(formData.get("grindingMachine"))
    
    const employeeId = optionalString(formData.get("employeeId"))
    const operatorName = optionalString(formData.get("operatorName")) || await getEmployeeName(employeeId)
    const trolleyType = optionalString(formData.get("trolleyType"))

    // Using raw SQL query with mysql2/promise pool
    const [result] = await pool.query(
      `INSERT INTO production_entries 
       (date, material_name, production_qty, target_qty, grinding_qty, machine1_qty, machine2_qty, cutting_machine, punching_machine, punching_qty, rejected_qty, final_qty, grinding_machine, operator_name, employee_id, cutting_outer_grade, cutting_outer_qty, cutting_middle_grade, cutting_middle_qty, cutting_inner_grade, cutting_inner_qty, trolley_type, punching_details) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [date, material, productionQty, targetQty, grindingQty, machine1, machine2, cuttingMachine, punchingMachine, punchingQty, rejectedQty, finalQty, grindingMachine, operatorName, employeeId, cuttingOuterGrade, cuttingOuterQty, cuttingMiddleGrade, cuttingMiddleQty, cuttingInnerGrade, cuttingInnerQty, trolleyType, punchingDetails.json]
    )

    revalidatePath("/production")
    revalidatePath("/employee-logs")
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
    const targetQty = numberField(formData.get("targetQty"))
    const grindingQty = numberField(formData.get("grindingQty"))
    
    // Machine outputs
    const machine1 = numberField(formData.get("machine1"))
    const machine2 = numberField(formData.get("machine2"))

    // New fields for restructured process
    const cuttingMachine = optionalString(formData.get("cuttingMachine"))
    
    // Trolleys
    const cuttingOuterGrade = optionalString(formData.get("cuttingOuterGrade"))
    const cuttingOuterQty = numberField(formData.get("cuttingOuterQty"))
    
    const cuttingMiddleGrade = optionalString(formData.get("cuttingMiddleGrade"))
    const cuttingMiddleQty = numberField(formData.get("cuttingMiddleQty"))
    
    const cuttingInnerGrade = optionalString(formData.get("cuttingInnerGrade"))
    const cuttingInnerQty = numberField(formData.get("cuttingInnerQty"))
    const cuttingTotal = cuttingOuterQty + cuttingMiddleQty + cuttingInnerQty
    const productionQty = numberField(formData.get("productionQty")) || cuttingTotal

    const punchingMachine = optionalString(formData.get("punchingMachine"))
    const punchingDetails = collectPunchingDetails(formData)
    const punchingQty = numberField(formData.get("punchingQty")) || punchingDetails.total
    const rejectedQty = numberField(formData.get("rejectedQty"))
    const finalQty = numberField(formData.get("finalQty")) || punchingQty
    const grindingMachine = optionalString(formData.get("grindingMachine"))
    
    const employeeId = optionalString(formData.get("employeeId"))
    const operatorName = optionalString(formData.get("operatorName")) || await getEmployeeName(employeeId)
    const trolleyType = optionalString(formData.get("trolleyType"))

    await pool.query(
      `UPDATE production_entries 
       SET date = ?, material_name = ?, production_qty = ?, target_qty = ?, grinding_qty = ?, machine1_qty = ?, machine2_qty = ?, cutting_machine = ?, punching_machine = ?, punching_qty = ?, rejected_qty = ?, final_qty = ?, grinding_machine = ?, operator_name = COALESCE(?, operator_name), employee_id = COALESCE(?, employee_id), cutting_outer_grade = ?, cutting_outer_qty = ?, cutting_middle_grade = ?, cutting_middle_qty = ?, cutting_inner_grade = ?, cutting_inner_qty = ?, trolley_type = ?, punching_details = ?
       WHERE id = ?`,
      [date, material, productionQty, targetQty, grindingQty, machine1, machine2, cuttingMachine, punchingMachine, punchingQty, rejectedQty, finalQty, grindingMachine, operatorName, employeeId, cuttingOuterGrade, cuttingOuterQty, cuttingMiddleGrade, cuttingMiddleQty, cuttingInnerGrade, cuttingInnerQty, trolleyType, punchingDetails.json, id]
    )

    revalidatePath("/production")
    revalidatePath("/employee-logs")
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
    revalidatePath("/employee-logs")
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
    const [rows] = await pool.query(`
      SELECT p.*, COALESCE(e.name, p.operator_name) as employee_name
      FROM production_entries p
      LEFT JOIN employees e ON p.employee_id = e.employee_id
      ORDER BY p.id DESC
      LIMIT 50
    `)
    // Convert Dates to strings to pass back to client
    const safeRows = (rows as any[]).map(row => ({
      ...row,
      employee_name: row.employee_name || row.operator_name || '',
      punching_details: parsePunchingDetails(row.punching_details),
      date: row.date ? new Date(row.date).toLocaleDateString() : '',
      created_at: row.created_at ? new Date(row.created_at).toLocaleString() : ''
    }))
    return { success: true, data: safeRows }
  } catch (error: any) {
    console.error("Error fetching production entries:", error)
    return { success: false, error: error.message || "Failed to fetch entries" }
  }
}
