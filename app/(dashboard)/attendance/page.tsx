import { pool, initDB } from "@/lib/db"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AttendanceFilterBar } from "@/components/attendance/attendance-filter-bar"
import { CalendarCheck, LogOut, Users } from "lucide-react"

export const revalidate = 0

type AttendancePageProps = {
  searchParams?: Promise<{
    date?: string | string[]
    employee?: string | string[]
  }>
}

type AttendanceSearchParams = {
  date?: string | string[]
  employee?: string | string[]
}

function singleParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

function getTodayInIndia() {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date())

  const day = parts.find((part) => part.type === "day")?.value || "01"
  const month = parts.find((part) => part.type === "month")?.value || "01"
  const year = parts.find((part) => part.type === "year")?.value || "1970"

  return `${year}-${month}-${day}`
}

function validDateInput(value: string | undefined, fallback: string) {
  return value && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : fallback
}

function formatDateInputLabel(value: string) {
  const [year, month, day] = value.split("-")
  return year && month && day ? `${day}/${month}/${year}` : value
}

function formatRecordDate(value: unknown) {
  const date = new Date(value as string | number | Date)
  return Number.isNaN(date.getTime()) ? "-" : date.toLocaleDateString("en-GB")
}

function formatTime(value: unknown) {
  if (!value) return "-"
  const date = new Date(value as string | number | Date)
  return Number.isNaN(date.getTime())
    ? "-"
    : date.toLocaleTimeString("en-IN", {
      timeZone: "Asia/Kolkata",
      hour: "2-digit",
      minute: "2-digit",
    })
}

function formatHours(value: unknown) {
  if (value === null || value === undefined || value === "") return "-"
  const hours = Number(value)
  return Number.isNaN(hours) ? `${value} hrs` : `${hours.toFixed(2)} hrs`
}

export default async function AttendancePage({ searchParams }: AttendancePageProps) {
  await initDB()

  const query: AttendanceSearchParams = searchParams ? await searchParams : {}
  const today = getTodayInIndia()
  const selectedDate = validDateInput(singleParam(query.date), today)
  const selectedEmployeeId = singleParam(query.employee) || ""

  const [employees] = await pool.query(`
    SELECT employee_id, name
    FROM employees
    WHERE employee_id IS NOT NULL AND employee_id <> ''
    ORDER BY name ASC
  `) as any[]

  const params: any[] = [selectedDate]
  const employeeClause = selectedEmployeeId ? "AND a.employee_id = ?" : ""

  if (selectedEmployeeId) {
    params.push(selectedEmployeeId)
  }

  const [rows] = await pool.query(`
    SELECT a.*, e.name as employee_name, e.department 
    FROM employee_attendance a 
    JOIN employees e ON a.employee_id = e.employee_id 
    WHERE DATE(a.date) = ?
    ${employeeClause}
    ORDER BY a.check_in_time DESC, a.id DESC
  `, params) as any[]

  const uniqueEmployeeCount = new Set(rows.map((record: any) => record.employee_id).filter(Boolean)).size
  const checkedOutCount = rows.filter((record: any) => record.status === "Checked Out").length
  const presentCount = rows.filter((record: any) => record.status !== "Checked Out").length
  const selectedEmployeeName = selectedEmployeeId
    ? employees.find((employee: any) => employee.employee_id === selectedEmployeeId)?.name || "Selected employee"
    : "All employees"

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold text-text-1">Employee Attendance</h1>
          <p className="text-sm text-text-3">Daily check-ins, check-outs, and working hours.</p>
        </div>
        <div className="rounded-chip bg-surface px-4 py-2 text-sm font-bold text-text-2 shadow-sm ring-1 ring-border-color">
          {formatDateInputLabel(selectedDate)} - {selectedEmployeeName}
        </div>
      </div>

      <AttendanceFilterBar
        employees={employees.map((employee: any) => ({
          employee_id: employee.employee_id,
          name: employee.name || "Unnamed employee",
        }))}
        selectedDate={selectedDate}
        selectedEmployeeId={selectedEmployeeId}
        today={today}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <AttendanceStat icon={<Users className="h-5 w-5" />} label="Employees" value={uniqueEmployeeCount.toLocaleString()} />
        <AttendanceStat icon={<CalendarCheck className="h-5 w-5" />} label="Active entries" value={presentCount.toLocaleString()} />
        <AttendanceStat icon={<LogOut className="h-5 w-5" />} label="Checked out" value={checkedOutCount.toLocaleString()} />
      </div>

      <Card className="bg-surface border-border-color shadow-sm">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-sm text-left border-collapse">
            <thead className="bg-canvas border-b border-border-color">
              <tr>
                <th className="px-6 py-4 text-xs font-semibold uppercase text-text-3 tracking-wider">Date</th>
                <th className="px-6 py-4 text-xs font-semibold uppercase text-text-3 tracking-wider">Employee</th>
                <th className="px-6 py-4 text-xs font-semibold uppercase text-text-3 tracking-wider">Shift & Dept</th>
                <th className="px-6 py-4 text-xs font-semibold uppercase text-text-3 tracking-wider">Check In</th>
                <th className="px-6 py-4 text-xs font-semibold uppercase text-text-3 tracking-wider">Check Out</th>
                <th className="px-6 py-4 text-xs font-semibold uppercase text-text-3 tracking-wider">Total Hrs</th>
                <th className="px-6 py-4 text-xs font-semibold uppercase text-text-3 tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-color/50">
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-16 h-16 bg-canvas rounded-full flex items-center justify-center mb-4">
                        <CalendarCheck className="w-8 h-8 text-text-3" />
                      </div>
                      <p className="text-text-1 font-bold text-lg">No attendance for {formatDateInputLabel(selectedDate)}</p>
                      <p className="mt-1 text-sm text-text-3">{selectedEmployeeName}</p>
                    </div>
                  </td>
                </tr>
              ) : (
                rows.map((record: any) => (
                  <tr key={record.id} className="hover:bg-canvas/40 transition-colors">
                    <td className="px-6 py-4 font-semibold text-text-2">
                      {formatRecordDate(record.date)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-text-1">{record.employee_name}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-text-2">{record.shift || "-"}</div>
                      {record.department && <div className="text-xs text-text-3 mt-0.5">{record.department}</div>}
                    </td>
                    <td className="px-6 py-4 font-medium text-text-2">
                      {formatTime(record.check_in_time)}
                    </td>
                    <td className="px-6 py-4 font-medium text-text-2">
                      {formatTime(record.check_out_time)}
                    </td>
                    <td className="px-6 py-4 font-bold text-brand">
                      {formatHours(record.total_working_hours)}
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant="outline" className={
                        record.status === "Checked Out" 
                          ? "bg-emerald-500/10 text-emerald-500 border-emerald-200" 
                          : "bg-blue-500/10 text-blue-500 border-blue-200"
                      }>
                        {record.status}
                      </Badge>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}

function AttendanceStat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: string
}) {
  return (
    <div className="flex items-center gap-4 rounded-card border border-border-color bg-surface p-5 shadow-sm">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand/10 text-brand">
        {icon}
      </div>
      <div>
        <div className="text-xs font-semibold uppercase tracking-wider text-text-3">{label}</div>
        <div className="text-2xl font-bold text-text-1">{value}</div>
      </div>
    </div>
  )
}
