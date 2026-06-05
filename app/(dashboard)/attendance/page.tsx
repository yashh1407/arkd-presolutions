import { pool, initDB } from "@/lib/db"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CalendarCheck, Search } from "lucide-react"

export const revalidate = 0

export default async function AttendancePage() {
  await initDB()

  const [rows] = await pool.query(`
    SELECT a.*, e.name as employee_name, e.department 
    FROM employee_attendance a 
    JOIN employees e ON a.employee_id = e.employee_id 
    ORDER BY a.date DESC, a.check_in_time DESC
  `) as any[]

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-text-1">Employee Attendance</h1>
        <p className="text-sm text-text-3">View daily check-ins, check-outs, and working hours.</p>
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
                      <p className="text-text-1 font-bold text-lg">No attendance records found</p>
                    </div>
                  </td>
                </tr>
              ) : (
                rows.map((record: any) => (
                  <tr key={record.id} className="hover:bg-canvas/40 transition-colors">
                    <td className="px-6 py-4 font-semibold text-text-2">
                      {new Date(record.date).toLocaleDateString('en-GB')}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-text-1">{record.employee_name}</div>
                      <div className="text-xs text-text-3 mt-0.5">{record.employee_id}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-text-2">{record.shift}</div>
                      <div className="text-xs text-text-3 mt-0.5">{record.department}</div>
                    </td>
                    <td className="px-6 py-4 font-medium text-text-2">
                      {record.check_in_time ? new Date(record.check_in_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '-'}
                    </td>
                    <td className="px-6 py-4 font-medium text-text-2">
                      {record.check_out_time ? new Date(record.check_out_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '-'}
                    </td>
                    <td className="px-6 py-4 font-bold text-brand">
                      {record.total_working_hours ? \`\${record.total_working_hours} hrs\` : '-'}
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
