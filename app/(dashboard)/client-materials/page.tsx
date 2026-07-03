import { getClientMaterialLogs } from "./actions"
import { ClientMaterialsForm, ClientMaterialsLedger } from "@/components/client-materials/client-materials-client"

export const dynamic = 'force-dynamic'

export default async function ClientMaterialsPage() {
  const result = await getClientMaterialLogs()
  const logs = result.success ? result.data || [] : []

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-text-1 sm:hidden">Client Material Ledger</h1>
        <p className="text-sm text-text-3">
          Track inward and outward materials for client job works, manage powder stock, and monitor pending dispatches.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
        {/* Left Column: Log Inward Form */}
        <div className="xl:col-span-1">
          <ClientMaterialsForm />
        </div>

        {/* Right Column: Ledger Table and KPIs */}
        <div className="xl:col-span-2">
          <ClientMaterialsLedger logs={logs} />
        </div>
      </div>
    </div>
  )
}
