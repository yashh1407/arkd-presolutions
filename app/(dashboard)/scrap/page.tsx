import { getPowderCoatingEntries } from "./actions"
import { PowderCoatingForm, PowderCoatingActions } from "@/components/scrap/powder-coating-client"
import { Trash2, Paintbrush, ShieldCheck, ShieldAlert, Award } from "lucide-react"

export const dynamic = 'force-dynamic'

export default async function ScrapPage() {
  const result = await getPowderCoatingEntries()
  const entries = result.success ? result.data || [] : []

  // Calculate totals
  const totalQty = entries.reduce((sum, e) => sum + e.qty, 0)
  const totalRejection = entries.reduce((sum, e) => sum + e.rejection, 0)
  const totalCoatingProd = entries.reduce((sum, e) => sum + (e.qty - e.rejection), 0)
  const totalPowderUsed = entries.reduce((sum, e) => sum + e.powder_used_kg, 0)
  const successRate = totalQty > 0 ? Math.round((totalCoatingProd / totalQty) * 100) : 100

  const kpis = [
    { title: "Coating Production", value: totalCoatingProd.toLocaleString(), sub: "Total Units", icon: Award, color: "text-accent-prod bg-accent-prod/10" },
    { title: "Total Rejections", value: totalRejection.toLocaleString(), sub: "Total Units", icon: ShieldAlert, color: "text-status-down bg-status-down/10" },
    { title: "Powder Used", value: `${totalPowderUsed.toLocaleString()} KG`, sub: "Total Used", icon: Paintbrush, color: "text-brand bg-brand/10" },
    { title: "Quality Rate", value: `${successRate}%`, sub: "Success Ratio", icon: ShieldCheck, color: "text-status-ok bg-status-ok/10" },
  ]

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-text-1 sm:hidden">Powder Coating & Scrap</h1>
        <p className="text-sm text-text-3">Manage powder coating operations, track product rejections, and monitor powder consumption.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon
          return (
            <div key={idx} className="bg-surface rounded-card p-5 border border-border-color shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-text-3 uppercase tracking-wider">{kpi.title}</p>
                <h3 className="text-2xl font-black text-text-1 mt-1.5 tabular-nums">{kpi.value}</h3>
                <span className="text-[11px] text-text-3 mt-1 block">{kpi.sub}</span>
              </div>
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${kpi.color}`}>
                <Icon className="w-5 h-5" />
              </div>
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
        {/* Left Column: Form */}
        <div className="xl:col-span-1">
          <PowderCoatingForm />
        </div>

        {/* Right Column: Ledger Table */}
        <div className="xl:col-span-2 bg-surface rounded-card border border-border-color shadow-sm overflow-hidden flex flex-col h-[750px]">
          <div className="p-4 border-b border-border-color bg-canvas flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-text-2" />
              <h2 className="font-semibold text-text-1">Powder Coating Ledger</h2>
            </div>
            <span className="text-xs font-bold bg-white px-2 py-1 rounded-chip border border-border-color text-text-2">
              {entries.length} Records
            </span>
          </div>

          <div className="flex-1 overflow-auto custom-scrollbar">
            {entries.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-text-3 p-8 text-center gap-3">
                <Paintbrush className="w-12 h-12 opacity-20" />
                <p>No powder coating records logged yet.</p>
              </div>
            ) : (
              <table className="w-full text-sm text-left border-collapse">
                <thead className="text-xs text-text-2 uppercase bg-canvas sticky top-0 z-10 border-b border-border-color">
                  <tr>
                    <th className="px-4 py-3 font-semibold border-r border-border-color">Date</th>
                    <th className="px-4 py-3 font-semibold border-r border-border-color">Material Type</th>
                    <th className="px-4 py-3 font-semibold text-right border-r border-border-color">Qty (Pcs)</th>
                    <th className="px-4 py-3 font-semibold text-right border-r border-border-color">Rejection (Pcs)</th>
                    <th className="px-4 py-3 font-semibold text-right border-r border-border-color bg-accent-prod/5">Coating Production</th>
                    <th className="px-4 py-3 font-semibold text-right border-r border-border-color">Use Powder (KG)</th>
                    <th className="px-4 py-3 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-color">
                  {entries.map((entry) => {
                    const coatingProd = entry.qty - entry.rejection
                    const dateObj = new Date(entry.date)
                    const dateStr = !isNaN(dateObj.getTime()) 
                      ? dateObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) 
                      : entry.date

                    return (
                      <tr key={entry.id} className="hover:bg-canvas/40 transition-colors">
                        <td className="px-4 py-3 whitespace-nowrap font-medium text-text-1 border-r border-border-color">{dateStr}</td>
                        <td className="px-4 py-3 font-semibold text-text-2 border-r border-border-color">{entry.material_type}</td>
                        <td className="px-4 py-3 text-right tabular-nums border-r border-border-color">{entry.qty.toLocaleString()}</td>
                        <td className="px-4 py-3 text-right text-status-down tabular-nums border-r border-border-color">{entry.rejection.toLocaleString()}</td>
                        <td className="px-4 py-3 text-right font-bold text-accent-prod tabular-nums border-r border-border-color bg-accent-prod/5">{coatingProd.toLocaleString()}</td>
                        <td className="px-4 py-3 text-right font-medium text-text-2 tabular-nums border-r border-border-color">{entry.powder_used_kg.toFixed(2)}</td>
                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          <PowderCoatingActions id={entry.id} />
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
