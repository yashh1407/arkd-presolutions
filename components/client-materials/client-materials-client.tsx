"use client"

import { useState } from "react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Loader2,
  Plus,
  Edit2,
  Trash2,
  ArrowRightLeft,
  Truck,
  User,
  Calendar,
  Layers,
  Scale,
  Sparkles,
  Info,
  Download
} from "lucide-react"
import * as XLSX from "xlsx"
import {
  saveClientMaterialLog,
  updateClientMaterialLog,
  deleteClientMaterialLog
} from "@/app/(dashboard)/client-materials/actions"

type ClientMaterialLog = {
  id: number
  client_name: string
  material_in_date: string
  in_qty_kg: number
  reference_name: string | null
  in_vehicle_no: string | null
  powder_supplied_kg: number
  powder_colour: string | null
  material_out_date: string | null
  out_qty_kg: number
  out_vehicle_no: string | null
  neelay_powder_use: number
  our_powder_use: number
  remark: string | null
  created_at: string
}

export function ClientMaterialsForm() {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)

    const formData = new FormData(e.currentTarget)
    const result = await saveClientMaterialLog(formData)

    if (result.success) {
      toast.success("Inward material log saved successfully")
      ;(e.target as HTMLFormElement).reset()
      router.refresh()
    } else {
      toast.error(result.error || "Failed to save log")
    }

    setIsLoading(false)
  }

  return (
    <Card className="rounded-card border-border-color shadow-sm bg-surface overflow-hidden">
      <div className="p-4 border-b border-border-color bg-brand/5 flex items-center gap-2">
        <ArrowRightLeft className="w-5 h-5 text-brand" />
        <h2 className="font-semibold text-text-1">Log Inward Material (Received)</h2>
      </div>
      <CardContent className="p-5">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="clientName">Client Name</Label>
            <Input id="clientName" name="clientName" type="text" required placeholder="e.g. Neelay Industries" className="bg-canvas text-sm" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="materialInDate">Material In Date</Label>
              <Input id="materialInDate" name="materialInDate" type="date" required defaultValue={new Date().toISOString().split('T')[0]} className="bg-canvas text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="inQtyKg">Inward Quantity (KG)</Label>
              <Input id="inQtyKg" name="inQtyKg" type="number" step="0.01" min="0.01" required placeholder="e.g. 275.00" className="bg-canvas text-sm" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="referenceName">Reference Person</Label>
              <Input id="referenceName" name="referenceName" type="text" placeholder="e.g. Suresh Chitte" className="bg-canvas text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="inVehicleNo">Inward Vehicle No.</Label>
              <Input id="inVehicleNo" name="inVehicleNo" type="text" placeholder="e.g. MH15FV5933" className="bg-canvas text-sm" />
            </div>
          </div>

          <div className="p-3 bg-canvas/50 border border-border-color rounded-card space-y-3">
            <h3 className="text-xs font-semibold text-text-2 uppercase tracking-wider">Client Powder Supplied</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="powderSuppliedKg">Powder Supplied (KG)</Label>
                <Input id="powderSuppliedKg" name="powderSuppliedKg" type="number" step="0.01" min="0" defaultValue="0" className="bg-surface text-sm" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="powderColour">Powder Colour/Code</Label>
                <Input id="powderColour" name="powderColour" type="text" placeholder="e.g. black mat / 7035" className="bg-surface text-sm" />
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="remark">Remarks</Label>
            <Textarea id="remark" name="remark" rows={3} placeholder="Add any details, like paint specifications or packaging notes..." className="bg-canvas text-sm" />
          </div>

          <Button type="submit" disabled={isLoading} className="w-full bg-brand hover:bg-brand/90 text-white font-semibold">
            {isLoading ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</>
            ) : (
              <><Plus className="mr-2 h-4 w-4" /> Save Material Inward</>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

export function ClientMaterialsLedger({ logs }: { logs: ClientMaterialLog[] }) {
  const router = useRouter()
  const [selectedLog, setSelectedLog] = useState<ClientMaterialLog | null>(null)
  const [isUpdateOpen, setIsUpdateOpen] = useState(false)
  const [isDeleteLoading, setIsDeleteLoading] = useState<number | null>(null)
  const [deleteLogId, setDeleteLogId] = useState<number | null>(null)
  const [isUpdateLoading, setIsUpdateLoading] = useState(false)

  // Calculate overall metrics
  const totalReceived = logs.reduce((sum, log) => sum + Number(log.in_qty_kg || 0), 0)
  const totalDispatched = logs.reduce((sum, log) => sum + Number(log.out_qty_kg || 0), 0)
  const pendingDispatch = logs.reduce((sum, log) => sum + (Number(log.in_qty_kg || 0) - Number(log.out_qty_kg || 0)), 0)
  
  // Total powder supplied minus used
  const totalClientPowderSupplied = logs.reduce((sum, log) => sum + Number(log.powder_supplied_kg || 0), 0)
  const totalClientPowderUsed = logs.reduce((sum, log) => sum + Number(log.neelay_powder_use || 0), 0)
  const pendingClientPowder = totalClientPowderSupplied - totalClientPowderUsed

  const exportToExcel = () => {
    try {
      const data = logs.map((log) => {
        const clientShort = log.client_name ? log.client_name.split(' ')[0] : "Client"
        const pendingQty = Number(log.in_qty_kg || 0) - Number(log.out_qty_kg || 0)
        const pendingPdr = Number(log.powder_supplied_kg || 0) - Number(log.neelay_powder_use || 0)

        return {
          "Client Name": log.client_name,
          "Reference Person": log.reference_name || "",
          "Material In Date": log.material_in_date,
          "Inward Qty (KG)": log.in_qty_kg,
          "Inward Vehicle No": log.in_vehicle_no || "",
          "Powder Supplied (KG)": log.powder_supplied_kg || 0,
          "Powder Colour": log.powder_colour || "",
          "Material Out Date": log.material_out_date || "",
          "Dispatched Qty (KG)": log.out_qty_kg || 0,
          "Outward Vehicle No": log.out_vehicle_no || "",
          [`${clientShort} Powder Use (KG)`]: log.neelay_powder_use || 0,
          "Our Powder Use (KG)": log.our_powder_use || 0,
          "Pending Dispatch (KG)": pendingQty,
          [`${clientShort} Pending Powder (KG)`]: pendingPdr,
          "Remark": log.remark || ""
        }
      })

      const worksheet = XLSX.utils.json_to_sheet(data)
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, "Client Materials")

      // Auto-fit column widths
      const maxColWidths = data.reduce((acc: Record<string, number>, row: any) => {
        Object.keys(row).forEach(key => {
          const valStr = String(row[key] || "")
          acc[key] = Math.max(acc[key] || 10, key.length, valStr.length)
        })
        return acc
      }, {})

      worksheet["!cols"] = Object.keys(maxColWidths).map(key => ({
        wch: maxColWidths[key] + 3
      }))

      XLSX.writeFile(workbook, `Client_Materials_Export_${new Date().toISOString().split('T')[0]}.xlsx`)
      toast.success("Excel sheet downloaded successfully!")
    } catch (error: any) {
      console.error("Failed to export to Excel:", error)
      toast.error("Failed to download Excel file.")
    }
  }

  const handleDelete = async (id: number) => {
    setIsDeleteLoading(id)
    const result = await deleteClientMaterialLog(id)
    if (result.success) {
      toast.success("Log deleted successfully")
      router.refresh()
    } else {
      toast.error(result.error || "Failed to delete log")
    }
    setIsDeleteLoading(null)
  }

  const handleOpenUpdate = (log: ClientMaterialLog) => {
    setSelectedLog(log)
    setIsUpdateOpen(true)
  }

  const handleUpdateSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!selectedLog) return
    setIsUpdateLoading(true)

    const formData = new FormData(e.currentTarget)
    const result = await updateClientMaterialLog(selectedLog.id, formData)

    if (result.success) {
      toast.success("Material log updated successfully")
      setIsUpdateOpen(false)
      setSelectedLog(null)
      router.refresh()
    } else {
      toast.error(result.error || "Failed to update log")
    }
    setIsUpdateLoading(false)
  }

  return (
    <div className="space-y-6">
      {/* Visual KPI Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="rounded-card border-border-color shadow-sm bg-surface p-4 flex flex-col justify-between transition-all hover:shadow-md">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[11px] font-semibold text-text-3 uppercase tracking-wider">Total Received</span>
            <div className="w-8 h-8 rounded-full bg-brand/10 flex items-center justify-center text-brand">
              <Scale className="w-4 h-4" />
            </div>
          </div>
          <div>
            <h4 className="text-xl font-bold text-text-1 tabular-nums">{totalReceived.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h4>
            <span className="text-xs text-text-3 font-medium">KG</span>
          </div>
        </Card>

        <Card className="rounded-card border-border-color shadow-sm bg-surface p-4 flex flex-col justify-between transition-all hover:shadow-md">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[11px] font-semibold text-text-3 uppercase tracking-wider">Total Dispatched</span>
            <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <div>
            <h4 className="text-xl font-bold text-text-1 tabular-nums">{totalDispatched.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h4>
            <span className="text-xs text-text-3 font-medium">KG</span>
          </div>
        </Card>

        <Card className="rounded-card border-border-color shadow-sm bg-surface p-4 flex flex-col justify-between transition-all hover:shadow-md">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[11px] font-semibold text-text-3 uppercase tracking-wider">Pending Dispatch</span>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${pendingDispatch > 0 ? 'bg-amber-500/10 text-amber-500 animate-pulse' : 'bg-slate-500/10 text-slate-500'}`}>
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div>
            <h4 className={`text-xl font-bold tabular-nums ${pendingDispatch > 0 ? 'text-amber-600' : 'text-text-1'}`}>{pendingDispatch.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h4>
            <span className="text-xs text-text-3 font-medium">KG</span>
          </div>
        </Card>

        <Card className="rounded-card border-border-color shadow-sm bg-surface p-4 flex flex-col justify-between transition-all hover:shadow-md">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[11px] font-semibold text-text-3 uppercase tracking-wider">Pending Powder</span>
            <div className="w-8 h-8 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-500">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div>
            <h4 className="text-xl font-bold text-text-1 tabular-nums">{pendingClientPowder.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h4>
            <span className="text-xs text-text-3 font-medium">KG</span>
          </div>
        </Card>
      </div>

      {/* Ledger Table Container */}
      <Card className="rounded-card border-border-color shadow-sm bg-surface overflow-hidden flex flex-col h-[650px]">
        <div className="p-4 border-b border-border-color bg-canvas flex items-center justify-between">
          <h3 className="font-semibold text-text-1 flex items-center gap-2">
            <Layers className="w-4 h-4 text-text-2" />
            Job Ledger Details
          </h3>
          <div className="flex items-center gap-2">
            <Button
              onClick={exportToExcel}
              size="sm"
              variant="outline"
              className="bg-white border-border-color hover:bg-canvas/50 text-text-2 font-semibold flex items-center gap-1.5 h-8 text-xs"
            >
              <Download className="w-3.5 h-3.5" />
              Download Excel
            </Button>
            <span className="text-xs font-bold bg-white border border-border-color text-text-2 px-2.5 py-1 rounded-chip h-8 flex items-center">
              {logs.length} entries
            </span>
          </div>
        </div>

        <div className="flex-1 overflow-auto custom-scrollbar">
          {logs.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center text-text-3 gap-3">
              <Layers className="w-12 h-12 opacity-25" />
              <p className="text-sm">No client material logs recorded yet.</p>
            </div>
          ) : (
            <div className="min-w-full inline-block align-middle">
              <table className="min-w-full divide-y divide-border-color text-sm text-left border-collapse">
                <thead className="bg-canvas text-xs text-text-2 uppercase sticky top-0 z-10">
                  <tr>
                    <th className="px-4 py-3 border-r border-b border-border-color font-semibold">Client / Ref</th>
                    <th className="px-4 py-3 border-r border-b border-border-color font-semibold text-center" colSpan={4}>Inward Details</th>
                    <th className="px-4 py-3 border-r border-b border-border-color font-semibold text-center" colSpan={4}>Outward / Dispatch</th>
                    <th className="px-4 py-3 border-r border-b border-border-color font-semibold text-center" colSpan={2}>Balances (KG)</th>
                    <th className="px-4 py-3 border-r border-b border-border-color font-semibold">Remark</th>
                    <th className="px-4 py-3 border-b border-border-color"></th>
                  </tr>
                  <tr className="bg-white/50 text-[10px] border-b border-border-color">
                    <th className="px-3 py-1.5 border-r border-border-color font-medium">Name / Person</th>
                    <th className="px-3 py-1.5 border-r border-border-color font-medium text-center">Date & Vehicle</th>
                    <th className="px-3 py-1.5 border-r border-border-color font-medium text-right bg-brand/5 text-brand">Qty (KG)</th>
                    <th className="px-3 py-1.5 border-r border-border-color font-medium text-right">Powder (KG)</th>
                    <th className="px-3 py-1.5 border-r border-border-color font-medium text-center">Colour</th>
                    <th className="px-3 py-1.5 border-r border-border-color font-medium text-center">Date & Vehicle</th>
                    <th className="px-3 py-1.5 border-r border-border-color font-medium text-right bg-emerald-500/5 text-emerald-600">Qty (KG)</th>
                    <th className="px-3 py-1.5 border-r border-border-color font-medium text-right">Client Use</th>
                    <th className="px-3 py-1.5 border-r border-border-color font-medium text-right">Our Use</th>
                    <th className="px-3 py-1.5 border-r border-border-color font-bold text-right bg-amber-500/5 text-amber-600">Pending Qty</th>
                    <th className="px-3 py-1.5 border-r border-border-color font-bold text-right bg-indigo-500/5 text-indigo-600">Client Powder</th>
                    <th className="px-3 py-1.5 border-r border-border-color font-medium">Notes</th>
                    <th className="px-3 py-1.5"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-color bg-white">
                  {logs.map((log) => {
                    const pendingQty = Number(log.in_qty_kg || 0) - Number(log.out_qty_kg || 0)
                    const pendingPdr = Number(log.powder_supplied_kg || 0) - Number(log.neelay_powder_use || 0)
                    const inDate = new Date(log.material_in_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' })
                    const outDate = log.material_out_date 
                      ? new Date(log.material_out_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' }) 
                      : null

                    return (
                      <tr key={log.id} className="hover:bg-canvas/40 transition-colors">
                        <td className="px-3 py-2.5 border-r border-border-color">
                          <div className="font-medium text-text-1 leading-normal">{log.client_name}</div>
                          {log.reference_name && (
                            <div className="text-[11px] text-text-3 font-medium flex items-center gap-1 mt-0.5">
                              <User className="w-3 h-3 text-text-3" /> {log.reference_name}
                            </div>
                          )}
                        </td>

                        <td className="px-3 py-2.5 border-r border-border-color">
                          <div className="text-xs text-text-2 font-medium flex items-center gap-1 justify-center">
                            <Calendar className="w-3 h-3 text-text-3" /> {inDate}
                          </div>
                          {log.in_vehicle_no && (
                            <div className="text-[11px] text-text-3 font-mono mt-0.5 text-center">{log.in_vehicle_no}</div>
                          )}
                        </td>
                        <td className="px-3 py-2.5 border-r border-border-color text-right font-medium text-text-1 tabular-nums bg-brand/5">
                          {log.in_qty_kg.toFixed(2)}
                        </td>
                        <td className="px-3 py-2.5 border-r border-border-color text-right text-text-2 tabular-nums">
                          {log.powder_supplied_kg > 0 ? log.powder_supplied_kg.toFixed(2) : "-"}
                        </td>
                        <td className="px-3 py-2.5 border-r border-border-color text-center text-xs text-text-2 font-medium">
                          {log.powder_colour || "-"}
                        </td>

                        <td className="px-3 py-2.5 border-r border-border-color">
                          {outDate ? (
                            <>
                              <div className="text-xs text-text-2 font-medium flex items-center gap-1 justify-center">
                                <Calendar className="w-3 h-3 text-text-3" /> {outDate}
                              </div>
                              {log.out_vehicle_no && (
                                <div className="text-[11px] text-text-3 font-mono mt-0.5 text-center">{log.out_vehicle_no}</div>
                              )}
                            </>
                          ) : (
                            <div className="text-[11px] text-text-3 italic text-center text-amber-600 font-medium">Pending</div>
                          )}
                        </td>
                        <td className="px-3 py-2.5 border-r border-border-color text-right font-medium text-text-1 tabular-nums bg-emerald-500/5">
                          {log.out_qty_kg > 0 ? log.out_qty_kg.toFixed(2) : "-"}
                        </td>

                        <td className="px-3 py-2.5 border-r border-border-color text-right text-text-2 tabular-nums">
                          {log.neelay_powder_use > 0 ? log.neelay_powder_use.toFixed(2) : "-"}
                        </td>
                        <td className="px-3 py-2.5 border-r border-border-color text-right text-text-2 tabular-nums">
                          {log.our_powder_use > 0 ? log.our_powder_use.toFixed(2) : "-"}
                        </td>

                        <td className={`px-3 py-2.5 border-r border-border-color text-right font-bold tabular-nums bg-amber-500/5 ${pendingQty > 0 ? 'text-amber-600' : 'text-slate-400'}`}>
                          {pendingQty.toFixed(2)}
                        </td>
                        <td className={`px-3 py-2.5 border-r border-border-color text-right font-bold tabular-nums bg-indigo-500/5 ${pendingPdr > 0 ? 'text-indigo-600' : 'text-slate-400'}`}>
                          {pendingPdr.toFixed(2)}
                        </td>

                        <td className="px-3 py-2.5 border-r border-border-color text-xs text-text-2 max-w-[150px] truncate" title={log.remark || ""}>
                          {log.remark || "-"}
                        </td>

                        <td className="px-3 py-2.5 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button 
                              onClick={() => handleOpenUpdate(log)} 
                              size="icon" 
                              variant="ghost" 
                              className="w-7 h-7 text-text-2 hover:text-brand hover:bg-brand-weak"
                              title={log.out_qty_kg > 0 ? "Edit Record" : "Log Dispatch"}
                            >
                              {log.out_qty_kg > 0 ? (
                                <Edit2 className="w-3.5 h-3.5" />
                              ) : (
                                <Truck className="w-3.5 h-3.5" />
                              )}
                            </Button>
                             <Button 
                              onClick={() => setDeleteLogId(log.id)} 
                              disabled={isDeleteLoading === log.id}
                              size="icon" 
                              variant="ghost" 
                              className="w-7 h-7 text-text-3 hover:text-status-down hover:bg-status-down/10"
                              title="Delete Record"
                            >
                              {isDeleteLoading === log.id ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Trash2 className="w-3.5 h-3.5" />
                              )}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Card>

      {/* Dialog for Edit / Dispatch Update */}
      <Dialog open={isUpdateOpen} onOpenChange={setIsUpdateOpen}>
        <DialogContent className="sm:max-w-[550px] bg-surface text-text-1 border-border-color max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-bold">
              <Edit2 className="w-5 h-5 text-brand" />
              Update Material Job Record
            </DialogTitle>
            <DialogDescription className="text-text-3 text-sm">
              Update inward details, or record the dispatch weights and powder coating usage for this job lifecycle.
            </DialogDescription>
          </DialogHeader>

          {selectedLog && (
            <form onSubmit={handleUpdateSubmit} className="space-y-4 py-2">
              {/* Inward Details Section */}
              <div className="p-3 bg-canvas border border-border-color rounded-card space-y-3">
                <h4 className="text-xs font-semibold text-text-2 uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="w-3 h-3 text-brand" />
                  Inward Information
                </h4>
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="updateClientName">Client Name</Label>
                    <Input id="updateClientName" name="clientName" type="text" required defaultValue={selectedLog.client_name} className="bg-surface text-sm" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="updateMaterialInDate">Material In Date</Label>
                      <Input id="updateMaterialInDate" name="materialInDate" type="date" required defaultValue={selectedLog.material_in_date} className="bg-surface text-sm" />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="updateInQtyKg">Inward Quantity (KG)</Label>
                      <Input id="updateInQtyKg" name="inQtyKg" type="number" step="0.01" min="0.01" required defaultValue={selectedLog.in_qty_kg} className="bg-surface text-sm" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="updateReferenceName">Reference Person</Label>
                      <Input id="updateReferenceName" name="referenceName" type="text" defaultValue={selectedLog.reference_name || ""} className="bg-surface text-sm" />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="updateInVehicleNo">Inward Vehicle No.</Label>
                      <Input id="updateInVehicleNo" name="inVehicleNo" type="text" defaultValue={selectedLog.in_vehicle_no || ""} className="bg-surface text-sm" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="updatePowderSuppliedKg">Powder Supplied (KG)</Label>
                      <Input id="updatePowderSuppliedKg" name="powderSuppliedKg" type="number" step="0.01" min="0" defaultValue={selectedLog.powder_supplied_kg} className="bg-surface text-sm" />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="updatePowderColour">Powder Colour/Code</Label>
                      <Input id="updatePowderColour" name="powderColour" type="text" defaultValue={selectedLog.powder_colour || ""} className="bg-surface text-sm" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Outward & Usage Details Section */}
              <div className="p-3 border border-border-color rounded-card bg-emerald-500/[0.02] space-y-3">
                <h4 className="text-xs font-semibold text-emerald-600 uppercase tracking-wider flex items-center gap-1.5">
                  <Truck className="w-3.5 h-3.5 text-emerald-500" />
                  Outward & Usage Details (Dispatch)
                </h4>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="materialOutDate">Material Out Date</Label>
                      <Input id="materialOutDate" name="materialOutDate" type="date" defaultValue={selectedLog.material_out_date || ""} className="bg-surface text-sm" />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="outQtyKg">Dispatched Qty (KG)</Label>
                      <Input id="outQtyKg" name="outQtyKg" type="number" step="0.01" min="0" defaultValue={selectedLog.out_qty_kg || ""} placeholder="e.g. 225.00" className="bg-surface text-sm" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="outVehicleNo">Outward Vehicle No.</Label>
                    <Input id="outVehicleNo" name="outVehicleNo" type="text" defaultValue={selectedLog.out_vehicle_no || ""} placeholder="e.g. MH15HH5097" className="bg-surface text-sm" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="neelayPowderUse">
                        {selectedLog.client_name ? selectedLog.client_name.split(' ')[0] : "Client"} Powder Used (KG)
                      </Label>
                      <Input id="neelayPowderUse" name="neelayPowderUse" type="number" step="0.01" min="0" defaultValue={selectedLog.neelay_powder_use || ""} placeholder="From client stock" className="bg-surface text-sm" />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="ourPowderUse">Our Powder Used (KG)</Label>
                      <Input id="ourPowderUse" name="ourPowderUse" type="number" step="0.01" min="0" defaultValue={selectedLog.our_powder_use || ""} placeholder="From our stock" className="bg-surface text-sm" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="updateRemark">Remarks</Label>
                <Textarea id="updateRemark" name="remark" rows={2} defaultValue={selectedLog.remark || ""} className="bg-canvas text-sm" />
              </div>

              <DialogFooter className="pt-2 border-t border-border-color mt-4">
                <Button type="button" variant="outline" onClick={() => setIsUpdateOpen(false)} className="border-border-color text-text-1">
                  Cancel
                </Button>
                <Button type="submit" disabled={isUpdateLoading} className="bg-brand hover:bg-brand/90 text-white font-semibold">
                  {isUpdateLoading ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={deleteLogId !== null} onOpenChange={(open) => !open && setDeleteLogId(null)}>
        <DialogContent className="max-w-[400px] bg-surface border-border-color shadow-2xl rounded-card p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-text-1">Delete Record</DialogTitle>
            <DialogDescription className="text-text-3 text-sm mt-2">
              Are you sure you want to delete this record? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3 mt-6">
            <Button
              type="button"
              variant="outline"
              disabled={isDeleteLoading !== null}
              onClick={() => setDeleteLogId(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={isDeleteLoading !== null}
              onClick={async () => {
                if (deleteLogId !== null) {
                  await handleDelete(deleteLogId)
                  setDeleteLogId(null)
                }
              }}
              className="bg-status-down hover:bg-status-down/90 text-white font-semibold"
            >
              {isDeleteLoading !== null ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
