import { getMyLogs } from "../actions"
import Link from "next/link"
import { ArrowLeft, FileText, Calendar, Layers, Clock, AlertCircle } from "lucide-react"

export default async function MyLogsPage() {
  const result = await getMyLogs()
  const logs = result.success ? result.data : []

  return (
    <div className="max-w-md mx-auto pb-20">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/pwa" className="p-2 bg-white rounded-full shadow-sm">
          <ArrowLeft className="w-5 h-5 text-slate-700" />
        </Link>
        <h1 className="text-xl font-bold text-slate-800">My Work Logs</h1>
      </div>

      <div className="space-y-4">
        {logs.length === 0 ? (
          <div className="bg-white p-8 rounded-2xl text-center border border-slate-200">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-bold text-slate-700">No logs yet</h3>
            <p className="text-sm text-slate-500 mt-1">Your submitted production logs will appear here.</p>
          </div>
        ) : (
          logs.map((log: any) => (
            <div key={log.id} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200">
              <div className="flex justify-between items-start mb-3 border-b border-slate-100 pb-3">
                <div>
                  <div className="font-bold text-slate-800 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-brand" /> {log.log_id}
                  </div>
                  <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> {new Date(log.date).toLocaleDateString()}
                  </div>
                </div>
                <div className={\`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider \${
                  log.work_status === 'Completed' ? 'bg-emerald-100 text-emerald-700' :
                  log.work_status === 'Pending' ? 'bg-amber-100 text-amber-700' :
                  log.work_status === 'Machine Issue' ? 'bg-rose-100 text-rose-700' :
                  'bg-blue-100 text-blue-700'
                }\`}>
                  {log.work_status}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-slate-50 p-2 rounded-lg">
                  <div className="text-slate-500 text-xs mb-1">Job Card</div>
                  <div className="font-medium text-slate-800 truncate">{log.job_card_number || '-'}</div>
                </div>
                <div className="bg-slate-50 p-2 rounded-lg">
                  <div className="text-slate-500 text-xs mb-1">Completed Qty</div>
                  <div className="font-bold text-slate-800">{log.total_completed_quantity || 0}</div>
                </div>
              </div>

              {(log.cutting_machine_issue === 'Yes' || log.punching_machine_issue === 'Yes') && (
                <div className="mt-3 flex items-center gap-2 text-xs text-rose-600 bg-rose-50 p-2 rounded-lg border border-rose-100">
                  <AlertCircle className="w-4 h-4" />
                  <span className="font-medium">Machine issue reported</span>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
