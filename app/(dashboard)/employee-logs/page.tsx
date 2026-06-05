import { pool, initDB } from "@/lib/db"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ClipboardList, AlertCircle, CheckCircle2 } from "lucide-react"

export const revalidate = 0

export default async function EmployeeLogsPage() {
  await initDB()

  const [rows] = await pool.query(`
    SELECT l.*, e.name as employee_name 
    FROM production_logs l 
    JOIN employees e ON l.employee_id = e.employee_id 
    ORDER BY l.date DESC, l.id DESC
  `) as any[]

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-text-1">Production Logs</h1>
        <p className="text-sm text-text-3">View all work logs submitted by employees via the PWA.</p>
      </div>

      <Card className="bg-surface border-border-color shadow-sm">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-sm text-left border-collapse">
            <thead className="bg-canvas border-b border-border-color">
              <tr>
                <th className="px-6 py-4 text-xs font-semibold uppercase text-text-3 tracking-wider">Log ID & Date</th>
                <th className="px-6 py-4 text-xs font-semibold uppercase text-text-3 tracking-wider">Employee</th>
                <th className="px-6 py-4 text-xs font-semibold uppercase text-text-3 tracking-wider">Job Card</th>
                <th className="px-6 py-4 text-xs font-semibold uppercase text-text-3 tracking-wider text-center">Cutting Qty</th>
                <th className="px-6 py-4 text-xs font-semibold uppercase text-text-3 tracking-wider text-center">Punching Qty</th>
                <th className="px-6 py-4 text-xs font-semibold uppercase text-text-3 tracking-wider text-center">Total Completed</th>
                <th className="px-6 py-4 text-xs font-semibold uppercase text-text-3 tracking-wider text-center">Issues</th>
                <th className="px-6 py-4 text-xs font-semibold uppercase text-text-3 tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-color/50">
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-16 h-16 bg-canvas rounded-full flex items-center justify-center mb-4">
                        <ClipboardList className="w-8 h-8 text-text-3" />
                      </div>
                      <p className="text-text-1 font-bold text-lg">No production logs found</p>
                    </div>
                  </td>
                </tr>
              ) : (
                rows.map((log: any) => (
                  <tr key={log.id} className="hover:bg-canvas/40 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-brand">{log.log_id}</div>
                      <div className="text-xs text-text-3 mt-0.5">{new Date(log.date).toLocaleDateString('en-GB')}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-text-1">{log.employee_name}</div>
                      <div className="text-xs text-text-3 mt-0.5">{log.employee_id}</div>
                    </td>
                    <td className="px-6 py-4 font-medium text-text-2">
                      {log.job_card_number || '-'}
                    </td>
                    <td className="px-6 py-4 text-center font-bold text-text-2">
                      {log.cutting_quantity || 0}
                    </td>
                    <td className="px-6 py-4 text-center font-bold text-text-2">
                      {log.punching_quantity || 0}
                    </td>
                    <td className="px-6 py-4 text-center font-black text-brand">
                      {log.total_completed_quantity || 0}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {(log.cutting_machine_issue === 'Yes' || log.punching_machine_issue === 'Yes') ? (
                        <div className="flex justify-center" title={log.cutting_issue_description || log.punching_issue_description}>
                          <AlertCircle className="w-5 h-5 text-status-error" />
                        </div>
                      ) : (
                        <div className="flex justify-center text-text-3">-</div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant="outline" className={
                        log.work_status === "Completed" 
                          ? "bg-status-ok/10 text-status-ok border-status-ok/20" 
                          : log.work_status === "Pending" ? "bg-status-warning/10 text-status-warning border-status-warning/20"
                          : log.work_status === "Machine Issue" ? "bg-status-error/10 text-status-error border-status-error/20"
                          : "bg-status-info/10 text-status-info border-status-info/20"
                      }>
                        {log.work_status}
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
