import { pool, initDB } from "@/lib/db"
import { EmployeeWorkLogsClient } from "@/components/employee-logs/employee-work-logs-client"

export const revalidate = 0

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

function formatDateInput(value: unknown) {
  if (!value) return ""
  if (typeof value === "string") return value.slice(0, 10)

  const date = new Date(value as string | number | Date)
  return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10)
}

function formatDateLabel(value: unknown) {
  const date = new Date(value as string | number | Date)
  return Number.isNaN(date.getTime()) ? "-" : date.toLocaleDateString("en-GB")
}

export default async function EmployeeLogsPage() {
  await initDB()

  const [rows] = await pool.query(`
    SELECT p.*, COALESCE(e.name, p.operator_name) as employee_name, e.department
    FROM production_entries p
    LEFT JOIN employees e ON p.employee_id = e.employee_id
    ORDER BY p.date DESC, p.id DESC
  `) as any[]

  const logs = rows.map((row: any) => ({
    id: Number(row.id),
    date: formatDateLabel(row.date),
    date_input: formatDateInput(row.date),
    employee_name: row.employee_name || null,
    department: row.department || null,
    cutting_machine: row.cutting_machine || null,
    cutting_outer_grade: row.cutting_outer_grade || null,
    cutting_outer_qty: Number(row.cutting_outer_qty || 0),
    cutting_middle_grade: row.cutting_middle_grade || null,
    cutting_middle_qty: Number(row.cutting_middle_qty || 0),
    cutting_inner_grade: row.cutting_inner_grade || null,
    cutting_inner_qty: Number(row.cutting_inner_qty || 0),
    trolley_type: row.trolley_type || null,
    punching_qty: Number(row.punching_qty || 0),
    punching_details: parsePunchingDetails(row.punching_details),
  }))

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-text-1">Employee Work Logs</h1>
        <p className="text-sm text-text-3">Track which employee worked on each cutting machine, trolley grade, and punching tool.</p>
      </div>

      <EmployeeWorkLogsClient initialLogs={logs} />
    </div>
  )
}
