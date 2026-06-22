"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Edit, Hammer, Loader2, Save, Scissors, Trash2, Users } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  deleteProductionEntry,
  updateProductionEntryNumbers,
} from "@/app/(dashboard)/production/actions"

type WorkLog = {
  id: number
  date: string
  date_input: string
  employee_name?: string | null
  department?: string | null
  cutting_machine?: string | null
  cutting_outer_grade?: string | null
  cutting_outer_qty?: number | null
  cutting_middle_grade?: string | null
  cutting_middle_qty?: number | null
  cutting_inner_grade?: string | null
  cutting_inner_qty?: number | null
  trolley_type?: string | null
  punching_qty?: number | null
  punching_details?: Record<string, number> | null
}

function getCuttingTotal(log: WorkLog) {
  return Number(log.cutting_outer_qty || 0) + Number(log.cutting_middle_qty || 0) + Number(log.cutting_inner_qty || 0)
}

function getToolTotal(details: Record<string, number> | null | undefined) {
  if (!details) return 0
  return Object.values(details).reduce((sum, qty) => sum + Number(qty || 0), 0)
}

function formatToolKey(key: string) {
  const [, section, ...toolParts] = key.split("_")
  const tool = toolParts.join(" ")
  return `${section || "tool"}: ${tool || key}`
}

function hasCuttingQuantity(log: WorkLog, field: "outer" | "middle" | "inner") {
  if (field === "outer") return Boolean(log.cutting_outer_grade) || Number(log.cutting_outer_qty || 0) > 0
  if (field === "middle") return Boolean(log.cutting_middle_grade) || Number(log.cutting_middle_qty || 0) > 0
  return Boolean(log.cutting_inner_grade) || Number(log.cutting_inner_qty || 0) > 0
}

export function EmployeeWorkLogsClient({
  initialLogs,
}: {
  initialLogs: WorkLog[]
}) {
  const router = useRouter()
  const [editingLog, setEditingLog] = useState<WorkLog | null>(null)
  const [deleteLog, setDeleteLog] = useState<WorkLog | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const stats = useMemo(() => {
    const totalCutting = initialLogs.reduce((sum, log) => sum + getCuttingTotal(log), 0)
    const totalPunching = initialLogs.reduce((sum, log) => {
      const detailTotal = getToolTotal(log.punching_details)
      return sum + (Number(log.punching_qty || 0) || detailTotal)
    }, 0)
    const uniqueEmployees = new Set(initialLogs.map((log) => log.employee_name).filter(Boolean)).size

    return { totalCutting, totalPunching, uniqueEmployees }
  }, [initialLogs])

  const handleUpdate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!editingLog) return

    setIsSaving(true)
    const result = await updateProductionEntryNumbers(editingLog.id, new FormData(event.currentTarget))

    if (result.success) {
      toast.success("Quantities updated.")
      setEditingLog(null)
      router.refresh()
    } else {
      toast.error(result.error || "Failed to update quantities")
    }

    setIsSaving(false)
  }

  const handleDelete = async () => {
    if (!deleteLog) return

    setDeletingId(deleteLog.id)
    const result = await deleteProductionEntry(deleteLog.id)

    if (result.success) {
      toast.success("Work log deleted.")
      setDeleteLog(null)
      router.refresh()
    } else {
      toast.error(result.error || "Failed to delete work log")
    }

    setDeletingId(null)
  }

  const hasPunchingDetails = editingLog?.punching_details && Object.keys(editingLog.punching_details).length > 0
  const showPunchingTotalFallback = !hasPunchingDetails && Number(editingLog?.punching_qty || 0) > 0

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-surface rounded-card border border-border-color p-5 shadow-sm flex items-center gap-4">
          <div className="w-11 h-11 rounded-full bg-brand/10 text-brand flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs uppercase tracking-wider text-text-3 font-semibold">Employees</div>
            <div className="text-2xl font-bold text-text-1">{stats.uniqueEmployees}</div>
          </div>
        </div>
        <div className="bg-surface rounded-card border border-border-color p-5 shadow-sm flex items-center gap-4">
          <div className="w-11 h-11 rounded-full bg-accent-prod/10 text-accent-prod flex items-center justify-center">
            <Scissors className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs uppercase tracking-wider text-text-3 font-semibold">Cutting Qty</div>
            <div className="text-2xl font-bold text-text-1">{stats.totalCutting.toLocaleString()}</div>
          </div>
        </div>
        <div className="bg-surface rounded-card border border-border-color p-5 shadow-sm flex items-center gap-4">
          <div className="w-11 h-11 rounded-full bg-accent-expense/10 text-accent-expense flex items-center justify-center">
            <Hammer className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs uppercase tracking-wider text-text-3 font-semibold">Punching Qty</div>
            <div className="text-2xl font-bold text-text-1">{stats.totalPunching.toLocaleString()}</div>
          </div>
        </div>
      </div>

      <Card className="bg-surface border-border-color shadow-sm">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-sm text-left border-collapse">
            <thead className="bg-canvas border-b border-border-color">
              <tr>
                <th className="px-6 py-4 text-xs font-semibold uppercase text-text-3 tracking-wider">Date</th>
                <th className="px-6 py-4 text-xs font-semibold uppercase text-text-3 tracking-wider">Employee</th>
                <th className="px-6 py-4 text-xs font-semibold uppercase text-text-3 tracking-wider">Cutting Work</th>
                <th className="px-6 py-4 text-xs font-semibold uppercase text-text-3 tracking-wider">Punching Tools</th>
                <th className="px-6 py-4 text-xs font-semibold uppercase text-text-3 tracking-wider text-right">Totals</th>
                <th className="px-6 py-4 text-xs font-semibold uppercase text-text-3 tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-color/50">
              {initialLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-16 h-16 bg-canvas rounded-full flex items-center justify-center mb-4">
                        <Hammer className="w-8 h-8 text-text-3" />
                      </div>
                      <p className="text-text-1 font-bold text-lg">No employee work logs found</p>
                    </div>
                  </td>
                </tr>
              ) : (
                initialLogs.map((log) => {
                  const cuttingTotal = getCuttingTotal(log)
                  const toolTotal = Number(log.punching_qty || 0) || getToolTotal(log.punching_details)

                  return (
                    <tr key={log.id} className="hover:bg-canvas/40 transition-colors align-top">
                      <td className="px-6 py-4 font-semibold text-text-2 whitespace-nowrap">{log.date}</td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-text-1">{log.employee_name || "Unknown"}</div>
                        {log.department && <div className="text-xs text-text-3 mt-0.5">{log.department}</div>}
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-text-1">{log.cutting_machine || "No cutting machine"}</div>
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {Number(log.cutting_outer_qty || 0) > 0 && (
                            <span className="rounded-chip bg-accent-prod/10 px-2 py-1 text-xs font-semibold text-accent-prod">Outer {log.cutting_outer_grade}: {log.cutting_outer_qty}</span>
                          )}
                          {Number(log.cutting_middle_qty || 0) > 0 && (
                            <span className="rounded-chip bg-accent-prod/10 px-2 py-1 text-xs font-semibold text-accent-prod">Middle {log.cutting_middle_grade}: {log.cutting_middle_qty}</span>
                          )}
                          {Number(log.cutting_inner_qty || 0) > 0 && (
                            <span className="rounded-chip bg-accent-prod/10 px-2 py-1 text-xs font-semibold text-accent-prod">Inner {log.cutting_inner_grade}: {log.cutting_inner_qty}</span>
                          )}
                          {cuttingTotal === 0 && <span className="text-text-3 text-xs">No cutting quantities</span>}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-text-1">{log.trolley_type ? `Trolley ${log.trolley_type}` : "No trolley selected"}</div>
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {log.punching_details && Object.keys(log.punching_details).length > 0 ? (
                            Object.entries(log.punching_details).map(([key, qty]) => (
                              <span key={key} className="rounded-chip bg-accent-expense/10 px-2 py-1 text-xs font-semibold text-accent-expense">
                                {formatToolKey(key)}: {qty}
                              </span>
                            ))
                          ) : (
                            <span className="text-text-3 text-xs">No punching tools logged</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        <div className="font-bold text-accent-prod">Cut {cuttingTotal.toLocaleString()}</div>
                        <div className="font-bold text-accent-expense mt-1">Punch {toolTotal.toLocaleString()}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setEditingLog(log)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-control border border-border-color text-text-2 hover:text-brand hover:bg-brand/10"
                            title="Edit quantities"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteLog(log)}
                            disabled={deletingId === log.id}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-control border border-border-color text-text-2 hover:text-status-down hover:bg-status-down/10 disabled:opacity-50"
                            title="Delete work log"
                          >
                            {deletingId === log.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Dialog open={!!editingLog} onOpenChange={(open) => !open && setEditingLog(null)}>
        <DialogContent className="w-[calc(100vw-2rem)] !max-w-[calc(100vw-2rem)] sm:!max-w-[760px] max-h-[88vh] overflow-hidden bg-surface border-border-color p-0 shadow-2xl">
          <DialogHeader className="border-b border-border-color px-6 py-5 pr-12">
            <DialogTitle className="text-xl font-bold leading-tight text-text-1">Edit Quantities</DialogTitle>
            <DialogDescription className="sr-only">Update numeric quantities for this production entry.</DialogDescription>
          </DialogHeader>

          {editingLog && (
            <form key={editingLog.id} onSubmit={handleUpdate} className="flex max-h-[calc(88vh-76px)] flex-col">
              <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
                <div className="grid grid-cols-2 overflow-hidden rounded-card border border-border-color bg-border-color md:grid-cols-4">
                  <ReadOnlyField label="Date" value={editingLog.date} />
                  <ReadOnlyField label="Employee" value={editingLog.employee_name || "Unknown"} />
                  <ReadOnlyField label="Machine" value={editingLog.cutting_machine || "-"} />
                  <ReadOnlyField label="Trolley" value={editingLog.trolley_type || "-"} />
                </div>

                <div className="grid grid-cols-1 gap-4 lg:grid-cols-[0.9fr_1.1fr]">
                  <QuantitySection
                    icon={<Scissors className="h-4 w-4" />}
                    title="Cutting Quantities"
                    tone="production"
                    total={getCuttingTotal(editingLog)}
                  >
                    {hasCuttingQuantity(editingLog, "outer") && (
                      <QuantityInput name="cuttingOuterQty" label={`Outer ${editingLog.cutting_outer_grade || ""}`} value={editingLog.cutting_outer_qty} />
                    )}
                    {hasCuttingQuantity(editingLog, "middle") && (
                      <QuantityInput name="cuttingMiddleQty" label={`Middle ${editingLog.cutting_middle_grade || ""}`} value={editingLog.cutting_middle_qty} />
                    )}
                    {hasCuttingQuantity(editingLog, "inner") && (
                      <QuantityInput name="cuttingInnerQty" label={`Inner ${editingLog.cutting_inner_grade || ""}`} value={editingLog.cutting_inner_qty} />
                    )}
                    {!hasCuttingQuantity(editingLog, "outer") && !hasCuttingQuantity(editingLog, "middle") && !hasCuttingQuantity(editingLog, "inner") && (
                      <EmptyQuantityState>No cutting quantities entered.</EmptyQuantityState>
                    )}
                  </QuantitySection>

                  <QuantitySection
                    icon={<Hammer className="h-4 w-4" />}
                    title="Punching Quantities"
                    tone="expense"
                    total={Number(editingLog.punching_qty || 0) || getToolTotal(editingLog.punching_details)}
                  >
                    {hasPunchingDetails && Object.entries(editingLog.punching_details || {}).map(([key, qty]) => (
                      <QuantityInput key={key} name={key} label={formatToolKey(key)} value={qty} />
                    ))}
                    {showPunchingTotalFallback && (
                      <QuantityInput name="punchingQty" label="Punching total" value={editingLog.punching_qty} />
                    )}
                    {!hasPunchingDetails && !showPunchingTotalFallback && (
                      <EmptyQuantityState>No punching quantities entered.</EmptyQuantityState>
                    )}
                  </QuantitySection>
                </div>
              </div>

              <div className="flex flex-col-reverse gap-3 border-t border-border-color bg-canvas/70 px-6 py-4 sm:flex-row sm:justify-end">
                <Button type="button" variant="outline" onClick={() => setEditingLog(null)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSaving} className="bg-brand hover:bg-brand/90 text-white gap-2">
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {isSaving ? "Saving..." : "Save Quantities"}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!deleteLog}
        onOpenChange={(open) => {
          if (!open && deletingId === null) setDeleteLog(null)
        }}
      >
        <DialogContent
          showCloseButton={deletingId === null}
          className="w-[calc(100vw-2rem)] !max-w-[420px] overflow-hidden bg-surface border-border-color p-0 shadow-2xl"
        >
          <DialogHeader className="border-b border-border-color px-6 py-5 pr-12">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-control bg-status-down/10 text-status-down">
                <Trash2 className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <DialogTitle className="text-lg font-bold leading-tight text-text-1">Delete work log?</DialogTitle>
                <DialogDescription className="mt-1 text-sm text-text-2">
                  This entry will be permanently removed from employee logs.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {deleteLog && (
            <div className="px-6 py-5">
              <div className="grid grid-cols-2 overflow-hidden rounded-card border border-border-color bg-border-color">
                <ReadOnlyField label="Date" value={deleteLog.date} />
                <ReadOnlyField label="Employee" value={deleteLog.employee_name || "Unknown"} />
                <ReadOnlyField label="Cutting" value={getCuttingTotal(deleteLog).toLocaleString()} />
                <ReadOnlyField label="Punching" value={(Number(deleteLog.punching_qty || 0) || getToolTotal(deleteLog.punching_details)).toLocaleString()} />
              </div>
            </div>
          )}

          <div className="flex flex-col-reverse gap-3 border-t border-border-color bg-canvas/70 px-6 py-4 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" disabled={deletingId !== null} onClick={() => setDeleteLog(null)}>
              Cancel
            </Button>
            <Button
              type="button"
              disabled={deletingId !== null}
              onClick={handleDelete}
              className="bg-status-down text-white hover:bg-status-down/90 gap-2"
            >
              {deletingId !== null ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              {deletingId !== null ? "Deleting..." : "Delete Log"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 bg-canvas/70 p-3">
      <div className="text-[11px] font-semibold uppercase tracking-wider text-text-3">{label}</div>
      <div className="mt-1 truncate text-sm font-bold text-text-1" title={value}>{value}</div>
    </div>
  )
}

function QuantitySection({
  icon,
  title,
  tone,
  total,
  children,
}: {
  icon: React.ReactNode
  title: string
  tone: "production" | "expense"
  total: number
  children: React.ReactNode
}) {
  const toneClasses =
    tone === "production"
      ? "text-accent-prod bg-accent-prod/5"
      : "text-accent-expense bg-accent-expense/5"

  return (
    <section className="overflow-hidden rounded-card border border-border-color bg-surface shadow-sm">
      <div className="flex items-center justify-between gap-3 border-b border-border-color bg-canvas/80 px-4 py-3">
        <div className="flex min-w-0 items-center gap-2">
          <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-control ${toneClasses}`}>
            {icon}
          </div>
          <h3 className="truncate text-sm font-bold text-text-1">{title}</h3>
        </div>
        <div className="rounded-chip bg-surface px-2.5 py-1 text-xs font-bold tabular-nums text-text-2 ring-1 ring-border-color">
          {total.toLocaleString()}
        </div>
      </div>
      <div className="divide-y divide-border-color/70">{children}</div>
    </section>
  )
}

function EmptyQuantityState({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-4 py-5 text-sm font-medium text-text-3">
      {children}
    </div>
  )
}

function QuantityInput({
  name,
  label,
  value,
}: {
  name: string
  label: string
  value?: number | null
}) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_104px] items-center gap-3 px-4 py-3">
      <Label className="min-w-0 break-words text-sm font-semibold leading-5 text-text-1">{label}</Label>
      <Input
        name={name}
        type="number"
        min="0"
        defaultValue={value ?? ""}
        className="h-9 rounded-control bg-canvas text-right font-bold tabular-nums text-text-1"
      />
    </div>
  )
}
