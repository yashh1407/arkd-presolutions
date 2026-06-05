import { getDispatches } from "./actions"
import { DispatchForm, DispatchActions } from "@/components/dispatch/dispatch-client"
import { Truck, Package, PackageOpen } from "lucide-react"

export const dynamic = 'force-dynamic'

export default async function DispatchPage() {
  const dispatches = await getDispatches()

  // Calculate totals
  const totalProdDispatch = dispatches.reduce((sum, d) => sum + (Number(d.total_prod_qty) || 0), 0)
  const totalPunchDispatch = dispatches.reduce((sum, d) => sum + (Number(d.total_punch_qty) || 0), 0)

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      
      {/* Header Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-surface rounded-card p-5 border border-border-color shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-accent-dispatch/10 flex items-center justify-center text-accent-dispatch">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-semibold text-text-3 uppercase tracking-wider">Total Prod Dispatched</p>
            <h3 className="text-2xl font-bold text-text-1">{totalProdDispatch.toLocaleString()} <span className="text-sm text-text-3 font-medium">units</span></h3>
          </div>
        </div>
        <div className="bg-surface rounded-card p-5 border border-border-color shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-brand/10 flex items-center justify-center text-brand">
            <PackageOpen className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-semibold text-text-3 uppercase tracking-wider">Total Punch Dispatched</p>
            <h3 className="text-2xl font-bold text-text-1">{totalPunchDispatch.toLocaleString()} <span className="text-sm text-text-3 font-medium">units</span></h3>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
        {/* Left Column: Form */}
        <div className="xl:col-span-1">
          <DispatchForm />
        </div>

        {/* Right Column: Ledger Table */}
        <div className="xl:col-span-2 bg-surface rounded-card border border-border-color shadow-sm overflow-hidden flex flex-col h-[750px]">
          <div className="p-4 border-b border-border-color bg-canvas flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Truck className="w-5 h-5 text-text-2" />
              <h2 className="font-semibold text-text-1">Dispatch Ledger</h2>
            </div>
            <span className="text-xs font-bold bg-white px-2 py-1 rounded-chip border border-border-color text-text-2">
              {dispatches.length} Records
            </span>
          </div>
          
          <div className="flex-1 overflow-auto custom-scrollbar">
            {dispatches.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-text-3 p-8 text-center gap-3">
                <Truck className="w-12 h-12 opacity-20" />
                <p>No dispatches logged yet.</p>
              </div>
            ) : (
              <table className="w-full text-sm text-left border-collapse">
                <thead className="text-xs text-text-2 uppercase bg-canvas sticky top-0 z-10">
                  <tr>
                    <th className="px-3 py-3 font-semibold whitespace-nowrap border-b border-r border-border-color">Date</th>
                    <th className="px-3 py-3 font-semibold border-b border-r border-border-color">Challan</th>
                    <th className="px-3 py-3 font-semibold text-center border-b border-r border-border-color" colSpan={4}>Production (Qty)</th>
                    <th className="px-3 py-3 font-semibold text-center border-b border-r border-border-color" colSpan={4}>Punching (Qty)</th>
                    <th className="px-3 py-3 font-semibold border-b border-border-color text-right"></th>
                  </tr>
                  <tr className="bg-white/50 text-[10px] border-b border-border-color">
                    <th className="px-2 py-1 border-r border-border-color"></th>
                    <th className="px-2 py-1 border-r border-border-color"></th>
                    <th className="px-2 py-1 font-medium text-center border-r border-border-color">Out 365</th>
                    <th className="px-2 py-1 font-medium text-center border-r border-border-color">Mid 313</th>
                    <th className="px-2 py-1 font-medium text-center border-r border-border-color">Inn 273</th>
                    <th className="px-2 py-1 font-bold text-center border-r border-border-color bg-accent-dispatch/5">Total</th>
                    <th className="px-2 py-1 font-medium text-center border-r border-border-color">Out 365</th>
                    <th className="px-2 py-1 font-medium text-center border-r border-border-color">Mid 313</th>
                    <th className="px-2 py-1 font-medium text-center border-r border-border-color">Inn 273</th>
                    <th className="px-2 py-1 font-bold text-center border-r border-border-color bg-brand/5">Total</th>
                    <th className="px-2 py-1"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-color">
                  {dispatches.map((d) => {
                    const dateObj = new Date(d.date)
                    const dateStr = !isNaN(dateObj.getTime()) ? dateObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' }) : d.date

                    return (
                      <tr key={d.id} className="hover:bg-canvas transition-colors">
                        <td className="px-3 py-2 whitespace-nowrap font-medium text-text-1 border-r border-border-color">{dateStr}</td>
                        <td className="px-3 py-2 font-mono text-xs text-text-2 border-r border-border-color">{d.challan_no}</td>
                        
                        <td className="px-2 py-2 text-center text-text-2 border-r border-border-color">{d.prod_outer_qty || '-'}</td>
                        <td className="px-2 py-2 text-center text-text-2 border-r border-border-color">{d.prod_middle_qty || '-'}</td>
                        <td className="px-2 py-2 text-center text-text-2 border-r border-border-color">{d.prod_inner_qty || '-'}</td>
                        <td className="px-2 py-2 text-center font-bold text-accent-dispatch border-r border-border-color bg-accent-dispatch/5">{d.total_prod_qty || '-'}</td>
                        
                        <td className="px-2 py-2 text-center text-text-2 border-r border-border-color">{d.punch_outer_qty || '-'}</td>
                        <td className="px-2 py-2 text-center text-text-2 border-r border-border-color">{d.punch_middle_qty || '-'}</td>
                        <td className="px-2 py-2 text-center text-text-2 border-r border-border-color">{d.punch_inner_qty || '-'}</td>
                        <td className="px-2 py-2 text-center font-bold text-brand border-r border-border-color bg-brand/5">{d.total_punch_qty || '-'}</td>
                        
                        <td className="px-3 py-2 text-right">
                          <DispatchActions id={d.id} />
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
