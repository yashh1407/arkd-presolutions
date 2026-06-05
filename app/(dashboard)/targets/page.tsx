import { getTargets } from "./actions"
import { TargetForm, TargetActions } from "@/components/targets/target-client"
import { Target, Activity } from "lucide-react"

export const dynamic = 'force-dynamic'

export default async function TargetsPage() {
  const targets = await getTargets()

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      
      {/* Header Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-surface rounded-card p-5 border border-border-color shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-accent-target/10 flex items-center justify-center text-accent-target">
            <Target className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-semibold text-text-3 uppercase tracking-wider">Targets Set</p>
            <h3 className="text-2xl font-bold text-text-1">{targets.length} <span className="text-sm text-text-3 font-medium">Days</span></h3>
          </div>
        </div>
        <div className="bg-surface rounded-card p-5 border border-border-color shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-status-warning/10 flex items-center justify-center text-status-warning">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-semibold text-text-3 uppercase tracking-wider">Target vs Production</p>
            <h3 className="text-text-2 text-sm mt-1">Daily benchmarks for cutting and punching machines.</h3>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
        {/* Left Column: Form */}
        <div className="xl:col-span-1">
          <TargetForm />
        </div>

        {/* Right Column: Ledger Table */}
        <div className="xl:col-span-2 bg-surface rounded-card border border-border-color shadow-sm overflow-hidden flex flex-col h-[750px]">
          <div className="p-4 border-b border-border-color bg-canvas flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-text-2" />
              <h2 className="font-semibold text-text-1">Target Ledger</h2>
            </div>
          </div>
          
          <div className="flex-1 overflow-auto custom-scrollbar">
            {targets.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-text-3 p-8 text-center gap-3">
                <Target className="w-12 h-12 opacity-20" />
                <p>No targets set yet.</p>
              </div>
            ) : (
              <table className="w-full text-sm text-left border-collapse min-w-[1200px]">
                <thead className="text-xs text-text-2 uppercase bg-canvas sticky top-0 z-10">
                  <tr>
                    <th className="px-3 py-3 font-semibold whitespace-nowrap border-b border-r border-border-color" rowSpan={2}>Date</th>
                    <th className="px-3 py-3 font-semibold text-center border-b border-r border-border-color" colSpan={3}>Cutting Targets</th>
                    <th className="px-3 py-3 font-semibold text-center border-b border-r border-border-color" colSpan={9}>Punching Targets</th>
                    <th className="px-3 py-3 font-semibold border-b border-border-color text-right" rowSpan={2}>Actions</th>
                  </tr>
                  <tr className="bg-white/50 text-[10px] border-b border-border-color">
                    <th className="px-2 py-1 font-medium text-center border-r border-border-color">Out 365</th>
                    <th className="px-2 py-1 font-medium text-center border-r border-border-color">Mid 313</th>
                    <th className="px-2 py-1 font-medium text-center border-r border-border-color">Inn 273</th>
                    
                    <th className="px-2 py-1 font-medium text-center border-r border-border-color">2 Hole</th>
                    <th className="px-2 py-1 font-medium text-center border-r border-border-color">Lancing</th>
                    <th className="px-2 py-1 font-medium text-center border-r border-border-color">Dip</th>
                    <th className="px-2 py-1 font-medium text-center border-r border-border-color">5 Hole</th>
                    <th className="px-2 py-1 font-medium text-center border-r border-border-color">Square</th>
                    <th className="px-2 py-1 font-medium text-center border-r border-border-color">Single</th>
                    <th className="px-2 py-1 font-medium text-center border-r border-border-color">Apple</th>
                    <th className="px-2 py-1 font-medium text-center border-r border-border-color">Inn 1</th>
                    <th className="px-2 py-1 font-medium text-center border-r border-border-color">Inn 2</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-color">
                  {targets.map((t) => {
                    const dateObj = new Date(t.date)
                    const dateStr = !isNaN(dateObj.getTime()) ? dateObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' }) : t.date

                    return (
                      <tr key={t.id} className="hover:bg-canvas transition-colors">
                        <td className="px-3 py-2 whitespace-nowrap font-bold text-brand border-r border-border-color">{dateStr}</td>
                        
                        <td className="px-2 py-2 text-center text-text-2 border-r border-border-color bg-accent-target/5">{t.outer_365 || '-'}</td>
                        <td className="px-2 py-2 text-center text-text-2 border-r border-border-color bg-accent-target/5">{t.middle_313 || '-'}</td>
                        <td className="px-2 py-2 text-center text-text-2 border-r border-border-color bg-accent-target/5">{t.inner_273 || '-'}</td>
                        
                        <td className="px-2 py-2 text-center text-text-2 border-r border-border-color">{t.hole_2 || '-'}</td>
                        <td className="px-2 py-2 text-center text-text-2 border-r border-border-color">{t.lancing || '-'}</td>
                        <td className="px-2 py-2 text-center text-text-2 border-r border-border-color">{t.dip || '-'}</td>
                        <td className="px-2 py-2 text-center text-text-2 border-r border-border-color">{t.hole_5 || '-'}</td>
                        <td className="px-2 py-2 text-center text-text-2 border-r border-border-color">{t.square || '-'}</td>
                        <td className="px-2 py-2 text-center text-text-2 border-r border-border-color">{t.single_punch || '-'}</td>
                        <td className="px-2 py-2 text-center text-text-2 border-r border-border-color">{t.apple_cut || '-'}</td>
                        <td className="px-2 py-2 text-center text-text-2 border-r border-border-color">{t.inner_1 || '-'}</td>
                        <td className="px-2 py-2 text-center text-text-2 border-r border-border-color">{t.inner_2 || '-'}</td>
                        
                        <td className="px-3 py-2 text-right">
                          <TargetActions id={t.id} />
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
