import { getMyLogs } from "../actions"
import Link from "next/link"
import { ArrowLeft, FileText, Calendar, Scissors, Hammer } from "lucide-react"

function formatToolKey(key: string) {
  const [, section, ...toolParts] = key.split("_")
  const tool = toolParts.join(" ")
  return `${section || "tool"}: ${tool || key}`
}

export default async function MyLogsPage() {
  const result = await getMyLogs()
  const logs = result.success ? (result.data || []) : []

  return (
    <div className="max-w-md mx-auto pb-20">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/app" className="p-2 bg-white rounded-full shadow-sm">
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
                    <FileText className="w-4 h-4 text-brand" /> Log #{log.id}
                  </div>
                  <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> {new Date(log.date).toLocaleDateString('en-GB')}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {/* Cutting Stage Summary */}
                {(log.cutting_outer_qty > 0 || log.cutting_middle_qty > 0 || log.cutting_inner_qty > 0) && (
                  <div className="bg-blue-50/50 p-3 rounded-xl border border-blue-100">
                    <div className="flex items-center gap-2 text-xs font-bold text-blue-800 mb-2">
                      <Scissors className="w-3 h-3" />
                      Cutting Stage {log.cutting_machine ? `(${log.cutting_machine})` : ''}
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="bg-white p-2 rounded-lg border border-slate-100 shadow-sm text-center">
                        <div className="text-[10px] text-slate-500 font-semibold uppercase mb-1">Outer</div>
                        <div className="text-xs font-bold text-slate-800">{log.cutting_outer_qty || 0}</div>
                        <div className="text-[10px] text-blue-600 font-bold">{log.cutting_outer_grade || '-'}</div>
                      </div>
                      <div className="bg-white p-2 rounded-lg border border-slate-100 shadow-sm text-center">
                        <div className="text-[10px] text-slate-500 font-semibold uppercase mb-1">Middle</div>
                        <div className="text-xs font-bold text-slate-800">{log.cutting_middle_qty || 0}</div>
                        <div className="text-[10px] text-blue-600 font-bold">{log.cutting_middle_grade || '-'}</div>
                      </div>
                      <div className="bg-white p-2 rounded-lg border border-slate-100 shadow-sm text-center">
                        <div className="text-[10px] text-slate-500 font-semibold uppercase mb-1">Inner</div>
                        <div className="text-xs font-bold text-slate-800">{log.cutting_inner_qty || 0}</div>
                        <div className="text-[10px] text-blue-600 font-bold">{log.cutting_inner_grade || '-'}</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Punching Stage Summary */}
                {(log.punching_qty > 0 || log.punching_details) && (
                  <div className="bg-purple-50/50 p-3 rounded-xl border border-purple-100">
                    <div className="flex justify-between items-center gap-3">
                      <div className="flex items-center gap-2 text-xs font-bold text-purple-800">
                        <Hammer className="w-3 h-3" />
                        Punching Stage {log.trolley_type ? `(Trolley ${log.trolley_type})` : ''}
                      </div>
                      <div className="bg-white px-3 py-1.5 rounded-lg border border-slate-100 shadow-sm text-center">
                        <div className="text-[10px] text-slate-500 font-semibold uppercase mb-0.5">Quantity</div>
                        <div className="text-sm font-black text-slate-800">{log.punching_qty}</div>
                      </div>
                    </div>
                    {log.punching_details && Object.keys(log.punching_details).length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {Object.entries(log.punching_details).map(([key, qty]: [string, any]) => (
                          <span key={key} className="bg-white border border-purple-100 text-purple-700 rounded-lg px-2 py-1 text-[10px] font-bold">
                            {formatToolKey(key)}: {qty}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
