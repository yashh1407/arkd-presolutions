import { Card, CardContent } from "@/components/ui/card"
import { BarChart, Activity, AlertTriangle, IndianRupee, Layers, Package, Settings, Users, Factory, Info } from "lucide-react"
import { pool, initDB } from "@/lib/db"
import { ProductionTableActions } from "@/components/production/production-table-actions"

function calculateTotalProduction(entries: any[]) {
  const groups: Record<string, {
    gradeCutting: Record<string, number>
    gradePunching: Record<string, number>
    fallbackPunching: number
    toolQuantities: Record<string, number>
  }> = {}

  entries.forEach(row => {
    const dateKey = row.date 
      ? (row.date instanceof Date ? row.date.toISOString().split('T')[0] : String(row.date).slice(0, 10))
      : 'unknown'
      
    if (!groups[dateKey]) {
      groups[dateKey] = {
        gradeCutting: { outer: 0, middle: 0, inner: 0, unknown: 0 },
        gradePunching: { outer: 0, middle: 0, inner: 0, unknown: 0 },
        fallbackPunching: 0,
        toolQuantities: {}
      }
    }

    const group = groups[dateKey]

    group.gradeCutting.outer += Math.max(0, Number(row.cutting_outer_qty || 0) - Number(row.cutting_outer_scrap_qty || 0))
    group.gradeCutting.middle += Math.max(0, Number(row.cutting_middle_qty || 0) - Number(row.cutting_middle_scrap_qty || 0))
    group.gradeCutting.inner += Math.max(0, Number(row.cutting_inner_qty || 0) - Number(row.cutting_inner_scrap_qty || 0))

    let details = row.punching_details
    if (typeof details === 'string') {
      try {
        details = JSON.parse(details)
      } catch {
        details = null
      }
    }
    const punchQty = Number(row.punching_qty || 0)

    if (details && Object.keys(details).length > 0) {
      Object.entries(details).forEach(([key, qty]) => {
        if (!key.startsWith("tool_")) return
        group.toolQuantities[key] = (group.toolQuantities[key] || 0) + Number(qty || 0)
      })
    } else if (punchQty > 0) {
      group.fallbackPunching += punchQty
    }
  })

  let grandTotal = 0

  Object.values(groups).forEach(group => {
    const gradeToolTotals: Record<string, Record<string, number>> = {
      outer: {},
      middle: {},
      inner: {},
      unknown: {}
    }

    Object.entries(group.toolQuantities).forEach(([key, qty]) => {
      const parts = key.split("_")
      const grade = parts[1] || "unknown"
      const toolName = parts.slice(2).join("_") || "default"
      if (!gradeToolTotals[grade]) {
        gradeToolTotals[grade] = {}
      }
      gradeToolTotals[grade][toolName] = Number(qty || 0)
    })

    const grades = ["outer", "middle", "inner", "unknown"]
    grades.forEach(g => {
      const toolTotals = Object.values(gradeToolTotals[g] || {})
      if (toolTotals.length > 0) {
        group.gradePunching[g] = Math.min(...toolTotals)
      } else {
        group.gradePunching[g] = 0
      }
    })

    let dateProd = 0
    grades.forEach(g => {
      const cutVal = group.gradeCutting[g] || 0
      const punchVal = group.gradePunching[g] || 0
      dateProd += punchVal > 0 ? punchVal : cutVal
    })
    grandTotal += dateProd + group.fallbackPunching
  })

  return grandTotal
}

export default async function DashboardPage() {
  // Ensure tables exist before querying
  await initDB()
  
  // 1. Production Data
  const today = new Date()
  const todayStr = today.toISOString().split('T')[0] // YYYY-MM-DD
  
  const [todayProdRows] = await pool.query(
    `SELECT * FROM production_entries WHERE DATE(date) = ?`,
    [todayStr]
  ) as any[]
  
  const [totalProdRows] = await pool.query(
    `SELECT * FROM production_entries`
  ) as any[]

  // Calculate Target Achievement %
  const todayProductionQty = calculateTotalProduction(todayProdRows)
  const prodQty = calculateTotalProduction(totalProdRows)
  
  const [targetRows] = await pool.query(
    `SELECT SUM(target_qty) as totalTarget FROM production_entries`
  ) as any[]
  const targetQty = targetRows[0]?.totalTarget || 0
  const achievement = targetQty > 0 ? Math.round((prodQty / targetQty) * 100) : 0

  // 2. Dispatch Data (Mock for now since table isn't created in initDB yet)
  const pendingDispatch = 0

  // 3. Scrap Data
  const [scrapRows] = await pool.query(
    `SELECT SUM(punching_scrap_kg) as total_scrap_kg FROM production_entries`
  ) as any[]
  const totalScrap = scrapRows[0]?.total_scrap_kg || 0

  // 4. Expenses Data (Mock)
  const monthlyExpenses = 0

  // Fetch recent tables
  const [recentProduction] = await pool.query(
    `SELECT * FROM production_entries ORDER BY created_at DESC LIMIT 5`
  ) as any[]

  const activeIssues: any[] = [] // Mock for now

  const kpis = [
    { title: "Today Production", value: todayProductionQty.toLocaleString(), sub: "Qty", icon: Layers, semantic: "prod" },
    { title: "Pending Dispatch", value: pendingDispatch.toLocaleString(), sub: "Qty", icon: Package, semantic: "dispatch" },
    { title: "Total Scrap", value: totalScrap.toLocaleString(), sub: "kg", icon: AlertTriangle, semantic: "scrap" },
    { title: "Total Expenses", value: `₹${monthlyExpenses.toLocaleString()}`, sub: "This Month", icon: IndianRupee, semantic: "expense" },
  ]

  // Helper mapping for KPI semantics
  const getSemanticClasses = (semantic: string) => {
    switch (semantic) {
      case "prod": return { text: "text-accent-prod", bg: "bg-accent-prod/12" }
      case "target": return { text: "text-accent-target", bg: "bg-accent-target/12" }
      case "dispatch": return { text: "text-accent-dispatch", bg: "bg-accent-dispatch/12" }
      case "scrap": return { text: "text-accent-scrap", bg: "bg-accent-scrap/12" }
      case "expense": return { text: "text-accent-expense", bg: "bg-accent-expense/12" }
      default: return { text: "text-text-2", bg: "bg-canvas" }
    }
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {kpis.map((kpi, i) => {
          const Icon = kpi.icon
          const semantic = getSemanticClasses(kpi.semantic)
          return (
            <div 
              key={i} 
              className="bg-surface rounded-card shadow-sm border border-border-color p-6 transition-all duration-200 hover:shadow-md hover:-translate-y-[1px] flex flex-col justify-between"
            >
              <div className="flex justify-between items-start mb-4 gap-2">
                <div className="text-[12px] font-semibold uppercase tracking-[0.04em] text-text-3 leading-snug">
                  {kpi.title}
                </div>
                <div className={`w-10 h-10 shrink-0 rounded-full flex items-center justify-center ${semantic.bg}`}>
                  <Icon className={`w-5 h-5 ${semantic.text}`} />
                </div>
              </div>
              <div>
                <div className="text-[32px] md:text-[36px] font-bold text-text-1 tabular-nums leading-tight">
                  {kpi.value}
                </div>
                <div className="text-sm text-text-3 mt-1 font-medium">
                  {kpi.sub}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Panels */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        
        {/* Recent Production Panel */}
        <div className="bg-surface rounded-card shadow-sm border border-border-color flex flex-col h-[400px]">
          <div className="px-6 py-5 border-b border-border-color flex items-center gap-3 shrink-0">
            <div className="w-2 h-2 rounded-full bg-accent-prod"></div>
            <h2 className="text-base font-semibold text-text-1">Recent Production</h2>
          </div>
          <div className="flex-1 overflow-auto custom-scrollbar">
            <table className="w-full text-sm text-left border-collapse">
              <thead className="sticky top-0 bg-surface z-10 border-b border-border-color">
                <tr>
                  <th className="px-6 py-3 text-[11px] font-semibold uppercase text-text-3 tracking-wider">Date</th>
                  <th className="px-6 py-3 text-[11px] font-semibold uppercase text-text-3 tracking-wider">Material</th>
                  <th className="px-6 py-3 text-[11px] font-semibold uppercase text-text-3 tracking-wider text-right">Prod Qty</th>
                  <th className="px-4 py-3 w-[50px]"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-color/50">
                {recentProduction.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-6 py-16">
                      <div className="flex flex-col items-center justify-center text-center">
                        <div className="w-12 h-12 bg-canvas rounded-full flex items-center justify-center mb-4">
                          <Factory className="w-6 h-6 text-text-3" />
                        </div>
                        <p className="text-text-2 font-medium">No production data yet.</p>
                        <p className="text-text-3 text-sm mt-1">Navigate to Daily Production to start adding entries.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  recentProduction.map((prod: any) => (
                    <tr key={prod.id} className="hover:bg-canvas/50 transition-colors">
                      <td className="px-6 py-3.5 text-text-2">
                        {new Date(prod.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-6 py-3.5 text-text-1 font-medium">{prod.material_name || 'Unknown'}</td>
                      <td className="px-6 py-3.5 font-semibold text-text-1 tabular-nums text-right">
                        {prod.production_qty?.toLocaleString() || 0}
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <ProductionTableActions prod={prod} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Active Issues Panel */}
        <div className="bg-surface rounded-card shadow-sm border border-border-color flex flex-col h-[400px]">
          <div className="px-6 py-5 border-b border-border-color flex items-center gap-3 shrink-0">
            <div className="w-2 h-2 rounded-full bg-accent-dispatch"></div>
            <h2 className="text-base font-semibold text-text-1">Active Issues</h2>
          </div>
          <div className="flex-1 overflow-auto custom-scrollbar">
            <table className="w-full text-sm text-left border-collapse">
              <thead className="sticky top-0 bg-surface z-10 border-b border-border-color">
                <tr>
                  <th className="px-6 py-3 text-[11px] font-semibold uppercase text-text-3 tracking-wider">Machine</th>
                  <th className="px-6 py-3 text-[11px] font-semibold uppercase text-text-3 tracking-wider">Issue</th>
                  <th className="px-6 py-3 text-[11px] font-semibold uppercase text-text-3 tracking-wider text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-color/50">
                {activeIssues.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-6 py-16">
                      <div className="flex flex-col items-center justify-center text-center">
                        <div className="w-12 h-12 bg-status-ok/10 rounded-full flex items-center justify-center mb-4">
                          <Info className="w-6 h-6 text-status-ok" />
                        </div>
                        <p className="text-text-2 font-medium">All systems operational.</p>
                        <p className="text-text-3 text-sm mt-1">No active machine issues reported.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  activeIssues.map((issue: any) => (
                    <tr key={issue.id} className="hover:bg-canvas/50 transition-colors">
                      <td className="px-6 py-3.5 text-text-1 font-medium">{issue.machine_name || 'Unknown'}</td>
                      <td className="px-6 py-3.5 text-text-2 truncate max-w-[150px]">{issue.issue}</td>
                      <td className="px-6 py-3.5 text-right">
                        {/* Example Status Pill - hardcoded for mock data, logic should determine color */}
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-status-warning/12 text-status-warning">
                          WARNING
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  )
}
