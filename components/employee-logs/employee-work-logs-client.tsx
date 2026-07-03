"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Edit, Hammer, Loader2, Save, Scissors, Trash2, Users, Calendar, Layers, Download } from "lucide-react"
import * as XLSX from "xlsx"
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
  cutting_outer_scrap_qty?: number | null
  cutting_middle_grade?: string | null
  cutting_middle_qty?: number | null
  cutting_middle_scrap_qty?: number | null
  cutting_inner_grade?: string | null
  cutting_inner_qty?: number | null
  cutting_inner_scrap_qty?: number | null
  trolley_type?: string | null
  punching_qty?: number | null
  punching_details?: Record<string, number> | null
  punching_rejected_details?: Record<string, number> | null
  punching_scrap_kg?: number | null
  final_qty?: number | null
}

function getCuttingTotal(log: WorkLog) {
  return Number(log.cutting_outer_qty || 0) + Number(log.cutting_middle_qty || 0) + Number(log.cutting_inner_qty || 0)
}

function getToolTotal(details: Record<string, number> | null | undefined) {
  if (!details || Object.keys(details).length === 0) return 0
  const gradeMins: Record<string, number> = {}
  Object.entries(details).forEach(([key, qty]) => {
    if (!key.startsWith("tool_")) return
    const parts = key.split("_")
    const grade = parts[1] || "unknown"
    const val = Number(qty || 0)
    if (gradeMins[grade] === undefined || val < gradeMins[grade]) {
      gradeMins[grade] = val
    }
  })
  return Object.values(gradeMins).reduce((sum, min) => sum + min, 0)
}

function getGradePunchingQty(log: WorkLog, grade: string) {
  const details = log.punching_details
  if (!details || Object.keys(details).length === 0) return 0
  
  let minVal: number | null = null
  let found = false
  
  Object.entries(details).forEach(([key, qty]) => {
    if (!key.startsWith(`tool_${grade}_`)) return
    found = true
    const val = Number(qty || 0)
    if (minVal === null || val < minVal) {
      minVal = val
    }
  })
  
  return found ? (minVal ?? 0) : 0
}

function formatToolKey(key: string) {
  const [, section, ...toolParts] = key.split("_")
  const tool = toolParts.join(" ")
  return `${section || "tool"}: ${tool || key}`
}

const TOOL_ORDER = [
  "2-hole punch",
  "3-hole",
  "double-hole",
  "double hole",
  "5-hole",
  "5 hole",
  "lancing punch",
  "lancing",
  "single hole",
  "apple-cut",
  "dip",
  "square"
]

function getToolOrderIndex(toolKey: string) {
  const normalizedKey = toolKey.toLowerCase().replace(/_/g, " ")
  const index = TOOL_ORDER.findIndex(orderTool => normalizedKey.includes(orderTool))
  return index === -1 ? 999 : index
}

function hasCuttingQuantity(log: WorkLog, field: "outer" | "middle" | "inner") {
  if (field === "outer") return Boolean(log.cutting_outer_grade) || Number(log.cutting_outer_qty || 0) > 0 || Number(log.cutting_outer_scrap_qty || 0) > 0
  if (field === "middle") return Boolean(log.cutting_middle_grade) || Number(log.cutting_middle_qty || 0) > 0 || Number(log.cutting_middle_scrap_qty || 0) > 0
  return Boolean(log.cutting_inner_grade) || Number(log.cutting_inner_qty || 0) > 0 || Number(log.cutting_inner_scrap_qty || 0) > 0
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
  const [viewMode, setViewMode] = useState<"employee" | "date">("employee")

  const handleExportToExcel = () => {
    try {
      const data = initialLogs.map(log => {
        const cuttingTotal = getCuttingTotal(log)
        const punchQty = Number(log.punching_qty || 0) || getToolTotal(log.punching_details)
        
        let workType = ""
        if (log.cutting_machine || cuttingTotal > 0) workType += "Cutting"
        if (log.trolley_type || punchQty > 0) workType += (workType ? " & " : "") + "Punching"
        if (Number(log.punching_scrap_kg || 0) > 0) workType += (workType ? " & " : "") + "Scrap"
        if (!workType) workType = "Other"

        const punchDetailsList: string[] = []
        if (log.punching_details) {
          Object.entries(log.punching_details).forEach(([k, v]) => {
            if (k.startsWith("tool_") && Number(v) > 0) {
              const [, section, ...toolParts] = k.split("_")
              const tool = toolParts.join(" ")
              punchDetailsList.push(`${section || "tool"}: ${tool || k} (${v})`)
            }
          })
        }

        const punchScrapList: string[] = []
        if (log.punching_rejected_details) {
          Object.entries(log.punching_rejected_details).forEach(([k, v]) => {
            if (k.startsWith("scrap_") && Number(v) > 0) {
              const [, section, ...toolParts] = k.split("_")
              const tool = toolParts.join(" ")
              punchScrapList.push(`${section || "scrap"}: ${tool || k} (${v})`)
            }
          })
        }

        return {
          "Log ID": log.id,
          "Date": log.date,
          "Employee Name": log.employee_name || "Unknown",
          "Department": log.department || "",
          "Work Type": workType,
          "Cutting Machine": log.cutting_machine || "",
          "Trolley Details": log.trolley_type ? `Trolley ${log.trolley_type}` : "",
          "Outer Grade": log.cutting_outer_grade || "",
          "Outer Qty (Good)": log.cutting_outer_qty || 0,
          "Outer Qty (Scrap)": log.cutting_outer_scrap_qty || 0,
          "Middle Grade": log.cutting_middle_grade || "",
          "Middle Qty (Good)": log.cutting_middle_qty || 0,
          "Middle Qty (Scrap)": log.cutting_middle_scrap_qty || 0,
          "Inner Grade": log.cutting_inner_grade || "",
          "Inner Qty (Good)": log.cutting_inner_qty || 0,
          "Inner Qty (Scrap)": log.cutting_inner_scrap_qty || 0,
          "Punching Details (Good)": punchDetailsList.join(", "),
          "Punching Details (Scrap)": punchScrapList.join(", "),
          "Punching Scrap (KG)": Number(log.punching_scrap_kg || 0),
          "Final Production Qty (Net)": Number(log.final_qty || 0)
        }
      })

      const worksheet = XLSX.utils.json_to_sheet(data)
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, "Production Logs")

      // Auto-fit column widths
      const maxColWidths = data.reduce((acc: Record<string, number>, row: any) => {
        Object.keys(row).forEach(key => {
          const valStr = String(row[key] || "")
          acc[key] = Math.max(acc[key] || 10, key.length, valStr.length)
        })
        return acc;
      }, {})

      worksheet["!cols"] = Object.keys(maxColWidths).map(key => ({
        wch: maxColWidths[key] + 3
      }))

      XLSX.writeFile(workbook, `Production_Logs_Export_${new Date().toISOString().split('T')[0]}.xlsx`)
      toast.success("Excel sheet downloaded successfully!")
    } catch (error: any) {
      console.error("Failed to export to Excel:", error)
      toast.error("Failed to download Excel file.")
    }
  }

  const logsByDate = useMemo(() => {
    const groups: Record<string, {
      dateLabel: string
      dateInput: string
      cuttingItems: Array<{
        id: number
        employeeName: string
        department: string | null
        machine: string
        outerGrade?: string | null
        outerQty: number
        outerScrap: number
        middleGrade?: string | null
        middleQty: number
        middleScrap: number
        innerGrade?: string | null
        innerQty: number
        innerScrap: number
        total: number
      }>
      punchingItems: Array<{
        id: number
        employeeName: string
        department: string | null
        trolleyType: string | null
        details: Record<string, number> | null
        rejectedDetails: Record<string, number> | null
        total: number
      }>
      scrapItems: Array<{
        id: number
        employeeName: string
        department: string | null
        scrapKg: number
      }>
      totalCutting: number
      totalProduction: number
      totalScrap: number
      gradeCutting: Record<string, number>
      gradePunching: Record<string, number>
      fallbackPunching: number
      toolQuantities: Record<string, number>
    }> = {}

    initialLogs.forEach(log => {
      const dateKey = log.date_input || log.date
      if (!groups[dateKey]) {
        groups[dateKey] = {
          dateLabel: log.date,
          dateInput: log.date_input,
          cuttingItems: [],
          punchingItems: [],
          scrapItems: [],
          totalCutting: 0,
          totalProduction: 0,
          totalScrap: 0,
          gradeCutting: { outer: 0, middle: 0, inner: 0, unknown: 0 },
          gradePunching: { outer: 0, middle: 0, inner: 0, unknown: 0 },
          fallbackPunching: 0,
          toolQuantities: {}
        }
      }

      const group = groups[dateKey]

      const cuttingTotal = Number(log.cutting_outer_qty || 0) + Number(log.cutting_middle_qty || 0) + Number(log.cutting_inner_qty || 0)
      const cuttingScrapTotal = Number(log.cutting_outer_scrap_qty || 0) + Number(log.cutting_middle_scrap_qty || 0) + Number(log.cutting_inner_scrap_qty || 0)
      if (log.cutting_machine || cuttingTotal > 0 || cuttingScrapTotal > 0) {
        group.cuttingItems.push({
          id: log.id,
          employeeName: log.employee_name || "Unknown",
          department: log.department || null,
          machine: log.cutting_machine || "Unknown",
          outerGrade: log.cutting_outer_grade,
          outerQty: Number(log.cutting_outer_qty || 0),
          outerScrap: Number(log.cutting_outer_scrap_qty || 0),
          middleGrade: log.cutting_middle_grade,
          middleQty: Number(log.cutting_middle_qty || 0),
          middleScrap: Number(log.cutting_middle_scrap_qty || 0),
          innerGrade: log.cutting_inner_grade,
          innerQty: Number(log.cutting_inner_qty || 0),
          innerScrap: Number(log.cutting_inner_scrap_qty || 0),
          total: cuttingTotal
        })
        group.totalCutting += cuttingTotal

        group.gradeCutting.outer += Math.max(0, Number(log.cutting_outer_qty || 0) - Number(log.cutting_outer_scrap_qty || 0))
        group.gradeCutting.middle += Math.max(0, Number(log.cutting_middle_qty || 0) - Number(log.cutting_middle_scrap_qty || 0))
        group.gradeCutting.inner += Math.max(0, Number(log.cutting_inner_qty || 0) - Number(log.cutting_inner_scrap_qty || 0))
      }

      const punchQty = Number(log.punching_qty || 0) || getToolTotal(log.punching_details)
      const punchScrapQty = getToolTotal(log.punching_rejected_details)
      if (log.trolley_type || punchQty > 0 || punchScrapQty > 0) {
        group.punchingItems.push({
          id: log.id,
          employeeName: log.employee_name || "Unknown",
          department: log.department || null,
          trolleyType: log.trolley_type || null,
          details: log.punching_details || null,
          rejectedDetails: log.punching_rejected_details || null,
          total: punchQty
        })

        if (log.punching_details && Object.keys(log.punching_details).length > 0) {
          Object.entries(log.punching_details).forEach(([key, qty]) => {
            if (!key.startsWith("tool_")) return
            group.toolQuantities[key] = (group.toolQuantities[key] || 0) + Number(qty || 0)
          })
        } else if (Number(log.punching_qty || 0) > 0) {
          group.fallbackPunching += Number(log.punching_qty || 0)
        }
      }

      const scrapKg = Number(log.punching_scrap_kg || 0)
      if (scrapKg > 0) {
        group.scrapItems.push({
          id: log.id,
          employeeName: log.employee_name || "Unknown",
          department: log.department || null,
          scrapKg: scrapKg
        })
        group.totalScrap += scrapKg
      }
    })

    Object.values(groups).forEach(group => {
      // Sort punchingItems so that the employee who worked on the earliest stage is listed first
      group.punchingItems.sort((a, b) => {
        const getMinToolIndex = (item: typeof a) => {
          const details = item.details || {}
          const scrapDetails = item.rejectedDetails || {}
          const suffixes = Array.from(new Set([
            ...Object.keys(details).map(k => k.replace(/^tool_/, "")),
            ...Object.keys(scrapDetails).map(k => k.replace(/^scrap_/, ""))
          ]))
          if (suffixes.length === 0) return 999
          return Math.min(...suffixes.map(s => getToolOrderIndex(s)))
        }
        return getMinToolIndex(a) - getMinToolIndex(b)
      })

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

      let prod = 0
      grades.forEach(g => {
        const cutVal = group.gradeCutting[g] || 0
        const punchVal = group.gradePunching[g] || 0
        prod += punchVal > 0 ? punchVal : cutVal
      })
      group.totalProduction = prod + group.fallbackPunching
    })

    return Object.entries(groups)
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([key, value]) => ({
        dateKey: key,
        ...value
      }))
  }, [initialLogs])

  const stats = useMemo(() => {
    const totalCutting = logsByDate.reduce((sum, group) => sum + group.totalCutting, 0)
    const totalProduction = logsByDate.reduce((sum, group) => sum + group.totalProduction, 0)
    const uniqueEmployees = new Set(initialLogs.map((log) => log.employee_name).filter(Boolean)).size

    return { totalCutting, totalProduction, uniqueEmployees }
  }, [logsByDate, initialLogs])

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

  const hasPunchingDetails = (editingLog?.punching_details && Object.keys(editingLog.punching_details).length > 0) || (editingLog?.punching_rejected_details && Object.keys(editingLog.punching_rejected_details).length > 0)
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
          <div className="w-11 h-11 rounded-full bg-accent-prod/10 text-accent-prod flex items-center justify-center">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs uppercase tracking-wider text-text-3 font-semibold">Production Qty</div>
            <div className="text-2xl font-bold text-text-1">{stats.totalProduction.toLocaleString()}</div>
          </div>
        </div>
      </div>

      {/* View Switcher Tabs & Export */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex bg-surface border border-border-color p-1 rounded-card shadow-sm w-fit">
          <button
            onClick={() => setViewMode("employee")}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold transition-all rounded-control cursor-pointer ${
              viewMode === "employee"
                ? "bg-brand text-white shadow-sm"
                : "text-text-3 hover:text-text-1 hover:bg-canvas/50"
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            View by Employee Work Logs
          </button>
          <button
            onClick={() => setViewMode("date")}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold transition-all rounded-control cursor-pointer ${
              viewMode === "date"
                ? "bg-brand text-white shadow-sm"
                : "text-text-3 hover:text-text-1 hover:bg-canvas/50"
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            View by Date Summary
          </button>
        </div>

        <Button
          onClick={handleExportToExcel}
          className="flex items-center gap-2 px-4 py-2 text-xs font-bold bg-brand hover:bg-brand/90 text-white transition-all rounded-control shadow-sm cursor-pointer w-full sm:w-auto justify-center"
        >
          <Download className="w-4 h-4" />
          Download Excel
        </Button>
      </div>

      <Card className="bg-surface border-border-color shadow-sm">
        <div className="overflow-x-auto custom-scrollbar">
          {viewMode === "employee" ? (
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
                            {(Number(log.cutting_outer_qty || 0) > 0 || Number(log.cutting_outer_scrap_qty || 0) > 0) && (
                              <span className="rounded-chip bg-accent-prod/10 px-2 py-1 text-xs font-semibold text-accent-prod">
                                Outer {log.cutting_outer_grade}: {log.cutting_outer_qty || 0}
                                {Number(log.cutting_outer_scrap_qty || 0) > 0 && ` (Scrap: ${log.cutting_outer_scrap_qty})`}
                              </span>
                            )}
                            {(Number(log.cutting_middle_qty || 0) > 0 || Number(log.cutting_middle_scrap_qty || 0) > 0) && (
                              <span className="rounded-chip bg-accent-prod/10 px-2 py-1 text-xs font-semibold text-accent-prod">
                                Middle {log.cutting_middle_grade}: {log.cutting_middle_qty || 0}
                                {Number(log.cutting_middle_scrap_qty || 0) > 0 && ` (Scrap: ${log.cutting_middle_scrap_qty})`}
                              </span>
                            )}
                            {(Number(log.cutting_inner_qty || 0) > 0 || Number(log.cutting_inner_scrap_qty || 0) > 0) && (
                              <span className="rounded-chip bg-accent-prod/10 px-2 py-1 text-xs font-semibold text-accent-prod">
                                Inner {log.cutting_inner_grade}: {log.cutting_inner_qty || 0}
                                {Number(log.cutting_inner_scrap_qty || 0) > 0 && ` (Scrap: ${log.cutting_inner_scrap_qty})`}
                              </span>
                            )}
                            {cuttingTotal === 0 && Number(log.cutting_outer_scrap_qty || 0) === 0 && Number(log.cutting_middle_scrap_qty || 0) === 0 && Number(log.cutting_inner_scrap_qty || 0) === 0 && <span className="text-text-3 text-xs">No cutting quantities</span>}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-semibold text-text-1">{log.trolley_type ? `Trolley ${log.trolley_type}` : "No trolley selected"}</div>
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {(() => {
                              const details = log.punching_details || {};
                              const scrapDetails = log.punching_rejected_details || {};
                              const suffixes = Array.from(new Set([
                                ...Object.keys(details).map(k => k.replace(/^tool_/, "")),
                                ...Object.keys(scrapDetails).map(k => k.replace(/^scrap_/, ""))
                              ])).sort((a, b) => getToolOrderIndex(a) - getToolOrderIndex(b));
                              if (suffixes.length === 0) {
                                return <span className="text-text-3 text-xs">No punching tools logged</span>;
                              }
                              return suffixes.map((suffix) => {
                                const toolKey = `tool_${suffix}`;
                                const scrapKey = `scrap_${suffix}`;
                                const qty = details[toolKey] || 0;
                                const scrap = scrapDetails[scrapKey] || 0;
                                return (
                                  <span key={suffix} className="rounded-chip bg-accent-expense/10 px-2 py-1 text-xs font-semibold text-accent-expense">
                                    {formatToolKey(toolKey)}: {qty}
                                    {scrap > 0 && ` (Scrap: ${scrap})`}
                                  </span>
                                );
                              });
                            })()}
                          </div>
                          {Number(log.punching_scrap_kg || 0) > 0 && (
                            <div className="mt-2 text-xs font-semibold text-status-down bg-status-down/5 border border-status-down/10 rounded px-2.5 py-1 inline-flex items-center gap-1.5">
                              <span className="inline-block w-1.5 h-1.5 rounded-full bg-status-down"></span>
                              Punching Scrap: {log.punching_scrap_kg} kg
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right whitespace-nowrap">
                          <div className="font-bold text-accent-prod">Cut {cuttingTotal.toLocaleString()}</div>
                          <div className="font-bold text-brand mt-1">Prod {Number(log.final_qty || 0).toLocaleString()}</div>
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
          ) : (
            <table className="w-full text-sm text-left border-collapse">
              <thead className="bg-canvas border-b border-border-color">
                <tr>
                  <th className="px-6 py-4 text-xs font-semibold uppercase text-text-3 tracking-wider w-[12%]">Date</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase text-text-3 tracking-wider w-[33%]">Cutting Operations</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase text-text-3 tracking-wider w-[33%]">Punching Operations</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase text-text-3 tracking-wider w-[12%]">Scrap Details</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase text-text-3 tracking-wider text-right w-[10%]">Daily Totals</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-color/50">
                {logsByDate.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <div className="w-16 h-16 bg-canvas rounded-full flex items-center justify-center mb-4">
                          <Hammer className="w-8 h-8 text-text-3" />
                        </div>
                        <p className="text-text-1 font-bold text-lg">No daily summaries found</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  logsByDate.map((group) => (
                    <tr key={group.dateKey} className="hover:bg-canvas/40 transition-colors align-top">
                      <td className="px-6 py-4 font-bold text-text-1 whitespace-nowrap">{group.dateLabel}</td>
                      <td className="px-6 py-4">
                        {group.cuttingItems.length === 0 ? (
                          <span className="text-text-3 text-xs italic">No cutting work logged</span>
                        ) : (
                          <div className="space-y-3">
                            {group.cuttingItems.map((item) => (
                              <div key={item.id} className="border-b border-border-color/40 last:border-0 pb-2.5 last:pb-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-bold text-text-1 text-sm px-2.5 py-1 rounded bg-brand/5 border border-brand/10 text-brand">
                                    {item.employeeName}
                                  </span>
                                  <span className="text-xs font-semibold text-text-3">
                                    on {item.machine}
                                  </span>
                                  <div className="inline-flex gap-1 ml-auto">
                                    <button
                                      type="button"
                                      onClick={() => setEditingLog(initialLogs.find(l => l.id === item.id) || null)}
                                      className="inline-flex h-6 w-6 items-center justify-center rounded border border-border-color text-text-3 hover:text-brand hover:bg-brand/5"
                                      title="Edit"
                                    >
                                      <Edit className="h-3.5 w-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setDeleteLog(initialLogs.find(l => l.id === item.id) || null)}
                                      disabled={deletingId === item.id}
                                      className="inline-flex h-6 w-6 items-center justify-center rounded border border-border-color text-text-3 hover:text-status-down hover:bg-status-down/5 disabled:opacity-50"
                                      title="Delete"
                                    >
                                      {deletingId === item.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                                    </button>
                                  </div>
                                </div>
                                <div className="flex flex-wrap gap-1 mt-1.5">
                                  {(item.outerQty > 0 || item.outerScrap > 0) && (
                                    <span className="rounded-chip bg-accent-prod/10 px-2.5 py-1 text-xs font-semibold text-accent-prod">
                                      Outer {item.outerGrade}: {item.outerQty}
                                      {item.outerScrap > 0 && ` (Scrap: ${item.outerScrap})`}
                                    </span>
                                  )}
                                  {(item.middleQty > 0 || item.middleScrap > 0) && (
                                    <span className="rounded-chip bg-accent-prod/10 px-2.5 py-1 text-xs font-semibold text-accent-prod">
                                      Middle {item.middleGrade}: {item.middleQty}
                                      {item.middleScrap > 0 && ` (Scrap: ${item.middleScrap})`}
                                    </span>
                                  )}
                                  {(item.innerQty > 0 || item.innerScrap > 0) && (
                                    <span className="rounded-chip bg-accent-prod/10 px-2.5 py-1 text-xs font-semibold text-accent-prod">
                                      Inner {item.innerGrade}: {item.innerQty}
                                      {item.innerScrap > 0 && ` (Scrap: ${item.innerScrap})`}
                                    </span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {group.punchingItems.length === 0 ? (
                          <span className="text-text-3 text-xs italic">No punching work logged</span>
                        ) : (
                          <div className="space-y-3">
                            {group.punchingItems.map((item) => (
                              <div key={item.id} className="border-b border-border-color/40 last:border-0 pb-2.5 last:pb-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-bold text-text-1 text-sm px-2.5 py-1 rounded bg-accent-expense/5 border border-accent-expense/10 text-accent-expense">
                                    {item.employeeName}
                                  </span>
                                  <span className="text-xs font-semibold text-text-3">
                                    Trolley {item.trolleyType}
                                  </span>
                                  <div className="inline-flex gap-1 ml-auto">
                                    <button
                                      type="button"
                                      onClick={() => setEditingLog(initialLogs.find(l => l.id === item.id) || null)}
                                      className="inline-flex h-6 w-6 items-center justify-center rounded border border-border-color text-text-3 hover:text-brand hover:bg-brand/5"
                                      title="Edit"
                                    >
                                      <Edit className="h-3.5 w-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setDeleteLog(initialLogs.find(l => l.id === item.id) || null)}
                                      disabled={deletingId === item.id}
                                      className="inline-flex h-6 w-6 items-center justify-center rounded border border-border-color text-text-3 hover:text-status-down hover:bg-status-down/5 disabled:opacity-50"
                                      title="Delete"
                                    >
                                      {deletingId === item.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                                    </button>
                                  </div>
                                </div>
                                <div className="flex flex-wrap gap-1 mt-1.5">
                                  {(() => {
                                    const details = item.details || {};
                                    const scrapDetails = item.rejectedDetails || {};
                                    const suffixes = Array.from(new Set([
                                      ...Object.keys(details).map(k => k.replace(/^tool_/, "")),
                                      ...Object.keys(scrapDetails).map(k => k.replace(/^scrap_/, ""))
                                    ])).sort((a, b) => getToolOrderIndex(a) - getToolOrderIndex(b));
                                    if (suffixes.length === 0) return null;
                                    return suffixes.map((suffix) => {
                                      const toolKey = `tool_${suffix}`;
                                      const scrapKey = `scrap_${suffix}`;
                                      const qty = details[toolKey] || 0;
                                      const scrap = scrapDetails[scrapKey] || 0;
                                      return (
                                        <span key={suffix} className="rounded-chip bg-accent-expense/10 px-2.5 py-1 text-xs font-semibold text-accent-expense">
                                          {formatToolKey(toolKey)}: {qty}
                                          {scrap > 0 && ` (Scrap: ${scrap})`}
                                        </span>
                                      );
                                    });
                                  })()}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {group.scrapItems.length === 0 ? (
                          <span className="text-text-3 text-xs italic">No scrap logged</span>
                        ) : (
                          <div className="space-y-2">
                            {group.scrapItems.map((item) => (
                              <div key={item.id} className="flex items-center justify-between border-b border-border-color/40 last:border-0 pb-1.5 last:pb-0">
                                <div>
                                  <div className="font-bold text-text-1 text-xs px-2 py-0.5 rounded bg-slate-50 border border-slate-200 text-slate-700 w-fit">{item.employeeName}</div>
                                  <div className="text-xs font-semibold text-status-down mt-1">{item.scrapKg} kg scrap</div>
                                </div>
                                <div className="inline-flex gap-1">
                                  <button
                                    type="button"
                                    onClick={() => setEditingLog(initialLogs.find(l => l.id === item.id) || null)}
                                    className="inline-flex h-5 w-5 items-center justify-center rounded border border-border-color text-text-3 hover:text-brand hover:bg-brand/5"
                                    title="Edit"
                                  >
                                    <Edit className="h-3 w-3" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setDeleteLog(initialLogs.find(l => l.id === item.id) || null)}
                                    disabled={deletingId === item.id}
                                    className="inline-flex h-5 w-5 items-center justify-center rounded border border-border-color text-text-3 hover:text-status-down hover:bg-status-down/5 disabled:opacity-50"
                                    title="Delete"
                                  >
                                    {deletingId === item.id ? <Loader2 className="h-2.5 w-2.5 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        <div className="font-bold text-accent-prod">Cut: {group.totalCutting.toLocaleString()}</div>
                        <div className="font-bold text-brand mt-1">Prod: {group.totalProduction.toLocaleString()}</div>
                        {group.totalScrap > 0 && (
                          <div className="font-bold text-status-down mt-1">Scrap: {group.totalScrap.toFixed(2)} kg</div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
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
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 border-b border-border-color/40 pb-3 last:border-0 last:pb-0">
                        <QuantityInput name="cuttingOuterQty" label={`Outer ${editingLog.cutting_outer_grade || ""} Qty`} value={editingLog.cutting_outer_qty} />
                        <QuantityInput name="cuttingOuterScrapQty" label="Scrap" value={editingLog.cutting_outer_scrap_qty} />
                      </div>
                    )}
                    {hasCuttingQuantity(editingLog, "middle") && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 border-b border-border-color/40 pb-3 last:border-0 last:pb-0">
                        <QuantityInput name="cuttingMiddleQty" label={`Middle ${editingLog.cutting_middle_grade || ""} Qty`} value={editingLog.cutting_middle_qty} />
                        <QuantityInput name="cuttingMiddleScrapQty" label="Scrap" value={editingLog.cutting_middle_scrap_qty} />
                      </div>
                    )}
                    {hasCuttingQuantity(editingLog, "inner") && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 border-b border-border-color/40 pb-3 last:border-0 last:pb-0">
                        <QuantityInput name="cuttingInnerQty" label={`Inner ${editingLog.cutting_inner_grade || ""} Qty`} value={editingLog.cutting_inner_qty} />
                        <QuantityInput name="cuttingInnerScrapQty" label="Scrap" value={editingLog.cutting_inner_scrap_qty} />
                      </div>
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
                    {(() => {
                      const details = editingLog.punching_details || {};
                      const scrapDetails = editingLog.punching_rejected_details || {};
                      const suffixes = Array.from(new Set([
                        ...Object.keys(details).map(k => k.replace(/^tool_/, "")),
                        ...Object.keys(scrapDetails).map(k => k.replace(/^scrap_/, ""))
                      ]));
                      if (suffixes.length === 0) return null;
                      return suffixes.map((suffix) => {
                        const toolKey = `tool_${suffix}`;
                        const scrapKey = `scrap_${suffix}`;
                        const qty = details[toolKey] || 0;
                        const scrap = scrapDetails[scrapKey] || 0;
                        return (
                          <div key={suffix} className="grid grid-cols-1 sm:grid-cols-2 gap-2 border-b border-border-color/40 pb-3 last:border-0 last:pb-0">
                            <QuantityInput name={toolKey} label={`${formatToolKey(toolKey)} Qty`} value={qty} />
                            <QuantityInput name={scrapKey} label="Scrap" value={scrap} />
                          </div>
                        );
                      });
                    })()}
                    {showPunchingTotalFallback && (
                      <QuantityInput name="punchingQty" label="Punching total" value={editingLog.punching_qty} />
                    )}
                    {!hasPunchingDetails && !showPunchingTotalFallback && (
                      <EmptyQuantityState>No punching quantities entered.</EmptyQuantityState>
                    )}
                    <div className="border-t border-border-color/70 mt-2 pt-2">
                      <QuantityInput name="punchingScrapKg" label="Punching Scrap (KG)" value={editingLog.punching_scrap_kg} />
                    </div>
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
