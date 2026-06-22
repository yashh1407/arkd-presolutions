"use server"

import { pool, initDB } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"

function generateLogId() {
  const prefix = "LOG"
  const timestamp = Date.now().toString().slice(-6)
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
  return `${prefix}-${timestamp}-${random}`
}

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

export async function getTodayAttendance() {
  try {
    await initDB()
    const session = await getServerSession(authOptions)
    if (!session || !session.user.employee_id) {
      return { success: false, error: "Unauthorized" }
    }

    const today = new Date().toISOString().split('T')[0]
    const [rows] = await pool.query(
      `SELECT * FROM employee_attendance WHERE employee_id = ? AND date = ? ORDER BY id DESC LIMIT 1`,
      [session.user.employee_id, today]
    ) as any[]

    return { success: true, data: rows[0] || null }
  } catch (error: any) {
    console.error("Error fetching attendance:", error)
    return { success: false, error: error.message }
  }
}

export async function checkIn(formData: FormData) {
  try {
    await initDB()
    const session = await getServerSession(authOptions)
    if (!session || !session.user.employee_id) {
      return { success: false, error: "Unauthorized" }
    }

    const now = new Date()
    const date = now.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' })
    const check_in_time = now
    const shift = formData.get("shift") as string
    const department = formData.get("department") as string
    const location = formData.get("location") as string
    const remarks = formData.get("remarks") as string

    // Verify if currently checked in
    const existing = await getTodayAttendance()
    if (existing.success && existing.data && existing.data.status !== "Checked Out") {
      return { success: false, error: "You are already checked in." }
    }

    const [result] = await pool.query(
      `INSERT INTO employee_attendance 
       (employee_id, date, shift, check_in_time, check_in_location, remarks) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [session.user.employee_id, date, shift, check_in_time, location, remarks]
    )

    revalidatePath("/app")
    const updated = await getTodayAttendance()
    return { success: true, data: updated.data }
  } catch (error: any) {
    console.error("Error checking in:", error)
    return { success: false, error: error.message }
  }
}

export async function checkOut(attendanceId: number, formData: FormData) {
  try {
    await initDB()
    const session = await getServerSession(authOptions)
    if (!session || !session.user.employee_id) {
      return { success: false, error: "Unauthorized" }
    }

    const now = new Date()
    const check_out_time = now
    const remarks = formData.get("remarks") as string

    // Get check in time to calculate total hours
    const [rows] = await pool.query(`SELECT check_in_time FROM employee_attendance WHERE id = ?`, [attendanceId]) as any[]
    let total_working_hours = 0
    if (rows[0] && rows[0].check_in_time) {
       const checkInDate = new Date(rows[0].check_in_time)
       const checkOutDate = now
       const diffHours = (checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60)
       total_working_hours = parseFloat(diffHours.toFixed(2))
    }

    await pool.query(
      `UPDATE employee_attendance 
       SET check_out_time = ?, remarks = CONCAT(IFNULL(remarks, ''), '\nCheckout: ', ?), total_working_hours = ?, status = 'Checked Out'
       WHERE id = ? AND employee_id = ?`,
      [check_out_time, remarks, total_working_hours, attendanceId, session.user.employee_id]
    )

    revalidatePath("/app")
    const updated = await getTodayAttendance()
    return { success: true, data: updated.data }
  } catch (error: any) {
    console.error("Error checking out:", error)
    return { success: false, error: error.message }
  }
}

export async function submitPWAProductionLog(formData: FormData) {
  try {
    await initDB()
    const session = await getServerSession(authOptions)
    if (!session || !session.user.employee_id) {
      return { success: false, error: "Unauthorized" }
    }

    const attendanceRes = await getTodayAttendance()
    if (!attendanceRes.success || !attendanceRes.data) {
       return { success: false, error: "You must check in before submitting a log." }
    }
    
    if (attendanceRes.data.status === 'Checked Out') {
       return { success: false, error: "You have already checked out today. You cannot submit more logs." }
    }

    const date = formData.get("date") as string || new Date().toISOString().split('T')[0]
    const material = "Assorted Grades"
    const targetQty = 0
    const grindingQty = 0
    const machine1 = 0
    const machine2 = 0

    // New fields for restructured process
    const cuttingMachine = optionalString(formData.get("cuttingMachine"))
    const cuttingOuterGrade = optionalString(formData.get("cuttingOuterGrade"))
    const cuttingOuterQty = numberField(formData.get("cuttingOuterQty"))
    const cuttingMiddleGrade = optionalString(formData.get("cuttingMiddleGrade"))
    const cuttingMiddleQty = numberField(formData.get("cuttingMiddleQty"))
    const cuttingInnerGrade = optionalString(formData.get("cuttingInnerGrade"))
    const cuttingInnerQty = numberField(formData.get("cuttingInnerQty"))
    const productionQty = cuttingOuterQty + cuttingMiddleQty + cuttingInnerQty

    const punchingMachine = optionalString(formData.get("punchingMachine"))
    const punchingDetails = collectPunchingDetails(formData)
    const punchingQty = numberField(formData.get("punchingQty")) || punchingDetails.total
    const rejectedQty = 0
    const finalQty = punchingQty
    const grindingMachine = null
    const operatorName = session.user.name // Save the user's name

    const trolleyType = optionalString(formData.get("trolleyType"))

    const [result] = await pool.query(
      `INSERT INTO production_entries 
       (date, material_name, production_qty, target_qty, grinding_qty, machine1_qty, machine2_qty, cutting_machine, punching_machine, punching_qty, rejected_qty, final_qty, grinding_machine, operator_name, cutting_outer_grade, cutting_outer_qty, cutting_middle_grade, cutting_middle_qty, cutting_inner_grade, cutting_inner_qty, employee_id, trolley_type, punching_details) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [date, material, productionQty, targetQty, grindingQty, machine1, machine2, cuttingMachine, punchingMachine, punchingQty, rejectedQty, finalQty, grindingMachine, operatorName, cuttingOuterGrade, cuttingOuterQty, cuttingMiddleGrade, cuttingMiddleQty, cuttingInnerGrade, cuttingInnerQty, session.user.employee_id, trolleyType, punchingDetails.json]
    )

    revalidatePath("/app")
    revalidatePath("/app/logs")
    revalidatePath("/production")
    revalidatePath("/employee-logs")
    revalidatePath("/dashboard")
    return { success: true }
  } catch (error: any) {
    console.error("Error submitting log:", error)
    return { success: false, error: error.message }
  }
}

export async function getMyLogs() {
  try {
    await initDB()
    const session = await getServerSession(authOptions)
    if (!session || !session.user.employee_id) {
      return { success: false, error: "Unauthorized" }
    }

    const [rows] = await pool.query(
      `SELECT * FROM production_entries WHERE employee_id = ? ORDER BY id DESC`,
      [session.user.employee_id]
    ) as any[]

    const safeRows = (rows as any[]).map(row => ({
      ...row,
      punching_details: parsePunchingDetails(row.punching_details),
      date: row.date ? new Date(row.date).toLocaleDateString() : '',
      created_at: row.created_at ? new Date(row.created_at).toLocaleString() : ''
    }))

    return { success: true, data: safeRows }
  } catch (error: any) {
    console.error("Error fetching logs:", error)
    return { success: false, error: error.message }
  }
}
