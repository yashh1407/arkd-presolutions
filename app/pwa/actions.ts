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

    const date = new Date().toISOString().split('T')[0]
    const check_in_time = new Date().toISOString().slice(0, 19).replace('T', ' ')
    const shift = formData.get("shift") as string
    const department = formData.get("department") as string
    const location = formData.get("location") as string
    const remarks = formData.get("remarks") as string

    // Verify if already checked in
    const [existing] = await pool.query(
      `SELECT id FROM employee_attendance WHERE employee_id = ? AND date = ? LIMIT 1`,
      [session.user.employee_id, date]
    ) as any[]

    if (existing.length > 0) {
      return { success: false, error: "You have already checked in today." }
    }

    const [result] = await pool.query(
      `INSERT INTO employee_attendance 
       (employee_id, date, shift, check_in_time, check_in_location, remarks) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [session.user.employee_id, date, shift, check_in_time, location, remarks]
    )

    revalidatePath("/pwa")
    return { success: true }
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

    const check_out_time = new Date().toISOString().slice(0, 19).replace('T', ' ')
    const remarks = formData.get("remarks") as string

    // Get check in time to calculate total hours
    const [rows] = await pool.query(`SELECT check_in_time FROM employee_attendance WHERE id = ?`, [attendanceId]) as any[]
    let total_working_hours = 0
    if (rows[0] && rows[0].check_in_time) {
       const checkInDate = new Date(rows[0].check_in_time)
       const checkOutDate = new Date() // roughly check_out_time
       const diffHours = (checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60)
       total_working_hours = parseFloat(diffHours.toFixed(2))
    }

    await pool.query(
      `UPDATE employee_attendance 
       SET check_out_time = ?, remarks = CONCAT(IFNULL(remarks, ''), '\nCheckout: ', ?), total_working_hours = ?, status = 'Checked Out'
       WHERE id = ? AND employee_id = ?`,
      [check_out_time, remarks, total_working_hours, attendanceId, session.user.employee_id]
    )

    revalidatePath("/pwa")
    return { success: true }
  } catch (error: any) {
    console.error("Error checking out:", error)
    return { success: false, error: error.message }
  }
}

export async function submitProductionLog(formData: FormData) {
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

    const attendance_id = attendanceRes.data.id
    const log_id = generateLogId()
    const date = new Date().toISOString().split('T')[0]
    const shift = attendanceRes.data.shift

    // Mapping Form Data
    const department = formData.get("department") as string
    const job_card_number = formData.get("job_card_number") as string
    const work_order_number = formData.get("work_order_number") as string
    const project_name = formData.get("project_name") as string
    const material_name = formData.get("material_name") as string
    const material_thickness = formData.get("material_thickness") as string
    const material_size = formData.get("material_size") as string
    const drawing_number = formData.get("drawing_number") as string
    const supervisor_name = formData.get("supervisor_name") as string

    const cutting_machine = formData.get("cutting_machine") as string
    const cutting_machine_id = formData.get("cutting_machine_id") as string
    const cutting_start_time = formData.get("cutting_start_time") ? new Date(formData.get("cutting_start_time") as string).toISOString().slice(0, 19).replace('T', ' ') : null
    const cutting_end_time = formData.get("cutting_end_time") ? new Date(formData.get("cutting_end_time") as string).toISOString().slice(0, 19).replace('T', ' ') : null
    const cutting_duration = formData.get("cutting_duration") ? Number(formData.get("cutting_duration")) : 0
    const cutting_quantity = formData.get("cutting_quantity") ? Number(formData.get("cutting_quantity")) : 0
    const cutting_dimensions = formData.get("cutting_dimensions") as string
    const cutting_scrap_quantity = formData.get("cutting_scrap_quantity") ? Number(formData.get("cutting_scrap_quantity")) : 0
    const cutting_rejected_quantity = formData.get("cutting_rejected_quantity") ? Number(formData.get("cutting_rejected_quantity")) : 0
    const cutting_machine_issue = formData.get("cutting_machine_issue") as string || 'No'
    const cutting_issue_description = formData.get("cutting_issue_description") as string

    const punching_machine = formData.get("punching_machine") as string
    const punching_machine_id = formData.get("punching_machine_id") as string
    const punching_start_time = formData.get("punching_start_time") ? new Date(formData.get("punching_start_time") as string).toISOString().slice(0, 19).replace('T', ' ') : null
    const punching_end_time = formData.get("punching_end_time") ? new Date(formData.get("punching_end_time") as string).toISOString().slice(0, 19).replace('T', ' ') : null
    const punching_duration = formData.get("punching_duration") ? Number(formData.get("punching_duration")) : 0
    const punching_quantity = formData.get("punching_quantity") ? Number(formData.get("punching_quantity")) : 0
    const punching_rejected_quantity = formData.get("punching_rejected_quantity") ? Number(formData.get("punching_rejected_quantity")) : 0
    const punching_machine_issue = formData.get("punching_machine_issue") as string || 'No'
    const punching_issue_description = formData.get("punching_issue_description") as string

    const total_planned_quantity = formData.get("total_planned_quantity") ? Number(formData.get("total_planned_quantity")) : 0
    const total_completed_quantity = formData.get("total_completed_quantity") ? Number(formData.get("total_completed_quantity")) : 0
    const total_good_quantity = formData.get("total_good_quantity") ? Number(formData.get("total_good_quantity")) : 0
    const total_rejected_quantity = formData.get("total_rejected_quantity") ? Number(formData.get("total_rejected_quantity")) : 0
    const total_scrap_quantity = formData.get("total_scrap_quantity") ? Number(formData.get("total_scrap_quantity")) : 0
    const pending_quantity = formData.get("pending_quantity") ? Number(formData.get("pending_quantity")) : 0
    const work_status = formData.get("work_status") as string
    const final_remarks = formData.get("final_remarks") as string

    await pool.query(
      `INSERT INTO production_logs (
        log_id, employee_id, attendance_id, date, shift, department, job_card_number, work_order_number, project_name, material_name, material_thickness, material_size, drawing_number, supervisor_name,
        cutting_machine, cutting_machine_id, cutting_start_time, cutting_end_time, cutting_duration, cutting_quantity, cutting_dimensions, cutting_scrap_quantity, cutting_rejected_quantity, cutting_machine_issue, cutting_issue_description,
        punching_machine, punching_machine_id, punching_start_time, punching_end_time, punching_duration, punching_quantity, punching_rejected_quantity, punching_machine_issue, punching_issue_description,
        total_planned_quantity, total_completed_quantity, total_good_quantity, total_rejected_quantity, total_scrap_quantity, pending_quantity, work_status, final_remarks
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        log_id, session.user.employee_id, attendance_id, date, shift, department, job_card_number, work_order_number, project_name, material_name, material_thickness, material_size, drawing_number, supervisor_name,
        cutting_machine, cutting_machine_id, cutting_start_time, cutting_end_time, cutting_duration, cutting_quantity, cutting_dimensions, cutting_scrap_quantity, cutting_rejected_quantity, cutting_machine_issue, cutting_issue_description,
        punching_machine, punching_machine_id, punching_start_time, punching_end_time, punching_duration, punching_quantity, punching_rejected_quantity, punching_machine_issue, punching_issue_description,
        total_planned_quantity, total_completed_quantity, total_good_quantity, total_rejected_quantity, total_scrap_quantity, pending_quantity, work_status, final_remarks
      ]
    )

    revalidatePath("/pwa")
    revalidatePath("/pwa/logs")
    return { success: true, log_id }
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
      `SELECT * FROM production_logs WHERE employee_id = ? ORDER BY id DESC`,
      [session.user.employee_id]
    ) as any[]

    return { success: true, data: rows }
  } catch (error: any) {
    console.error("Error fetching logs:", error)
    return { success: false, error: error.message }
  }
}
