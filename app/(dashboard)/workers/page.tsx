import { getWorkerMaterials } from "./actions"
import { WorkerMaterialForm, WorkerActions } from "@/components/workers/worker-client"
import { Users, Package, ClipboardList } from "lucide-react"

export const dynamic = 'force-dynamic'

export default async function WorkersPage() {
  const materials = await getWorkerMaterials()

  // Calculate totals
  const totalItemsIssued = materials.reduce((sum, m) => sum + (Number(m.qty) || 0), 0)
  const uniqueWorkers = new Set(materials.map(m => m.employee_name)).size

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      
      {/* Header Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-surface rounded-card p-5 border border-border-color shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-brand/10 flex items-center justify-center text-brand">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-semibold text-text-3 uppercase tracking-wider">Total Items Issued</p>
            <h3 className="text-2xl font-bold text-text-1">{totalItemsIssued.toLocaleString()} <span className="text-sm text-text-3 font-medium">items</span></h3>
          </div>
        </div>
        <div className="bg-surface rounded-card p-5 border border-border-color shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-accent-target/10 flex items-center justify-center text-accent-target">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-semibold text-text-3 uppercase tracking-wider">Workers Supplied</p>
            <h3 className="text-2xl font-bold text-text-1">{uniqueWorkers} <span className="text-sm text-text-3 font-medium">employees</span></h3>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Column: Form */}
        <div className="lg:col-span-1">
          <WorkerMaterialForm />
        </div>

        {/* Right Column: Ledger Table */}
        <div className="lg:col-span-2 bg-surface rounded-card border border-border-color shadow-sm overflow-hidden flex flex-col h-[600px]">
          <div className="p-4 border-b border-border-color bg-canvas flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-text-2" />
              <h2 className="font-semibold text-text-1">Material Issue Log</h2>
            </div>
            <span className="text-xs font-bold bg-white px-2 py-1 rounded-chip border border-border-color text-text-2">
              {materials.length} Records
            </span>
          </div>
          
          <div className="flex-1 overflow-auto custom-scrollbar">
            {materials.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-text-3 p-8 text-center gap-3">
                <Users className="w-12 h-12 opacity-20" />
                <p>No materials issued yet.</p>
              </div>
            ) : (
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-text-2 uppercase bg-canvas sticky top-0 z-10">
                  <tr>
                    <th className="px-4 py-3 font-semibold whitespace-nowrap">Date</th>
                    <th className="px-4 py-3 font-semibold">Employee Name</th>
                    <th className="px-4 py-3 font-semibold">Item / Material</th>
                    <th className="px-4 py-3 font-semibold text-center">Qty</th>
                    <th className="px-4 py-3 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-color">
                  {materials.map((m) => {
                    const dateObj = new Date(m.date)
                    const dateStr = !isNaN(dateObj.getTime()) ? dateObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : m.date

                    return (
                      <tr key={m.id} className="hover:bg-canvas transition-colors">
                        <td className="px-4 py-3 whitespace-nowrap font-medium text-text-1">
                          {dateStr}
                        </td>
                        <td className="px-4 py-3 font-semibold text-brand">
                          {m.employee_name}
                        </td>
                        <td className="px-4 py-3 text-text-2">
                          <span className="inline-flex items-center rounded-md bg-text-1/5 px-2 py-1 text-xs font-medium text-text-1 ring-1 ring-inset ring-text-1/10">
                            {m.item_name}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-bold text-center">
                          {m.qty}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <WorkerActions id={m.id} />
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
