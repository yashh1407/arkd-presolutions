"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { PlusCircle, Save, Hammer, Scissors } from "lucide-react"
import { saveProductionEntry } from "./actions"
import { getEmployees } from "@/app/(dashboard)/employees/actions"
import { cn } from "@/lib/utils"



export default function ProductionPage() {
  const [loading, setLoading] = useState(false)
  const [trolleyType, setTrolleyType] = useState<string>("")

  const [employees, setEmployees] = useState<any[]>([])
  const [selectedDate, setSelectedDate] = useState<string>("")
  const [selectedWorkers, setSelectedWorkers] = useState<Record<string, string>>({})

  const getWorkerName = (id?: string) => {
    if (!id) return "+ Assign Worker"
    const emp = employees.find(e => e.employee_id === id)
    return emp ? emp.name : "+ Assign Worker"
  }

  const trolleyData: Record<string, any> = {
    "55": {
      outer: { grade: "365", tools: ["2-Hole punch", "Lancing punch", "Dip"] },
      middle: { grade: "313", tools: ["5 hole punch", "Single Hole", "Apple-Cut", "Square"] },
      inner: { grade: "273", tools: ["Double Hole", "Square"] }
    },
    "65": {
      outer: { grade: "465", tools: ["3-Hole", "Single Hole", "Lancing", "Dip"] },
      middle: { grade: "443", tools: ["Double-Hole", "Square"] },
      inner: null
    },
    "75": {
      outer: { grade: "565", tools: ["3-Hole", "Single hole", "Lancing", "Dip"] },
      middle: { grade: "353", tools: ["Double hole", "Square"] },
      inner: null
    }
  }

  const fetchEmployees = async () => {
    const result = await getEmployees()
    if (result.success) {
      setEmployees(result.data || [])
    }
  }

  useEffect(() => {
    fetchEmployees()
    
    // Set default date to today on mount
    const today = new Date()
    const yyyy = today.getFullYear()
    const mm = String(today.getMonth() + 1).padStart(2, "0")
    const dd = String(today.getDate()).padStart(2, "0")
    setSelectedDate(`${yyyy}-${mm}-${dd}`)
  }, [])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    
    const formData = new FormData(e.currentTarget)
    
    const result = await saveProductionEntry(formData)
    
    if (result.success) {
      toast.success("Production saved to Employee Work Logs.")
      ;(e.target as HTMLFormElement).reset()
      setTrolleyType("")
      setSelectedWorkers({})
    } else {
      toast.error(result.error || "Failed to save entry")
    }
    
    setLoading(false)
  }

  return (
    <div className="space-y-6">
      <Card className="bg-white border-slate-200 shadow-sm overflow-hidden">
        <CardHeader className="border-b border-slate-100 pb-4 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <PlusCircle className="w-5 h-5 text-blue-600" />
            <CardTitle className="text-lg font-bold text-slate-900">Add Daily Production</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-8">
            
            {/* 1. Date */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-sm text-slate-700 font-semibold">Date</Label>
                <Input 
                  name="date" 
                  type="date" 
                  required 
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="bg-slate-50 border-slate-200 focus-visible:ring-blue-600 shadow-sm w-full md:w-1/2" 
                />
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* 2. Cutting Stage */}
              <div className="bg-blue-50/30 p-5 rounded-xl border border-blue-100 space-y-5">
                <div className="text-sm font-bold text-blue-800 flex items-center gap-2 border-b border-blue-100 pb-2">
                  <Scissors className="w-4 h-4" />
                  Cutting Stage
                </div>
                
                <div className="space-y-2">
                  <Label className="text-xs text-slate-600 font-semibold">Machine</Label>
                  <Select name="cuttingMachine">
                    <SelectTrigger className="bg-white border-slate-200 focus-visible:ring-blue-600 w-full sm:w-1/2">
                      <SelectValue placeholder="Select Machine" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="" className="text-slate-400 italic">Select Machine</SelectItem>
                      <SelectItem value="Cutting 1">Cutting 1</SelectItem>
                      <SelectItem value="Cutting 2">Cutting 2</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-4 pt-2 border-t border-blue-100/50">
                  <div className="flex items-center gap-2">
                    <Label className="text-sm text-slate-700 font-semibold">Trolley Details</Label>
                    <Select name="cuttingTrolleyType" value={trolleyType} onValueChange={(value) => setTrolleyType(value ?? "")}>
                      <SelectTrigger className="bg-white border-slate-200 w-[70px] h-8 text-xs focus-visible:ring-blue-600">
                        <SelectValue placeholder="-" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="" className="text-slate-400 italic">None</SelectItem>
                        <SelectItem value="55">55</SelectItem>
                        <SelectItem value="65">65</SelectItem>
                        <SelectItem value="75">75</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {trolleyType ? (
                    <div className="space-y-3 mt-3">
                      {/* Outer Grade */}
                      {trolleyData[trolleyType].outer && (
                        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm hover:border-blue-300 hover:shadow-md transition-all space-y-3">
                          <div className="flex items-center justify-between bg-slate-50/80 border-b border-slate-100 px-4 py-2.5 -mx-4 -mt-4 rounded-t-xl mb-4">
                            <div className="flex items-center gap-2">
                              <div className="w-1 h-3.5 rounded bg-blue-600"></div>
                              <span className="text-xs font-bold text-slate-700 tracking-wider uppercase">Outer Grade</span>
                            </div>
                            <span className="inline-flex items-center bg-blue-50 text-blue-700 text-xs font-black px-3 py-1 rounded-full border border-blue-200/60 shadow-xs">
                              {trolleyData[trolleyType].outer.grade}
                            </span>
                          </div>
                          <input type="hidden" name="cuttingOuterGrade" value={trolleyData[trolleyType].outer.grade} />
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div className="space-y-1">
                              <Label className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider block mb-1">Worker</Label>
                              <Select 
                                name="cuttingOuterEmployeeId"
                                value={selectedWorkers.cuttingOuterEmployeeId || ""}
                                onValueChange={(val) => setSelectedWorkers(prev => ({ ...prev, cuttingOuterEmployeeId: val ?? "" }))}
                              >
                                <SelectTrigger className={cn(
                                  "rounded-full h-8 text-xs transition-all px-3 w-fit",
                                  selectedWorkers.cuttingOuterEmployeeId
                                    ? "bg-blue-50 border-blue-200 text-blue-700 font-semibold hover:bg-blue-100 hover:border-blue-300"
                                    : "bg-slate-50/50 border-dashed border-slate-200 text-slate-400 hover:bg-slate-100 hover:border-slate-300"
                                )}>
                                  <span>{getWorkerName(selectedWorkers.cuttingOuterEmployeeId)}</span>
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="" className="text-slate-400 italic">None</SelectItem>
                                  {employees.filter(emp => emp.employee_id).map(emp => (
                                    <SelectItem key={emp.employee_id} value={emp.employee_id}>
                                      {emp.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-1">
                              <Label className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider block">Good Qty</Label>
                              <Input name="cuttingOuterQty" type="number" min="0" placeholder="0" className="bg-white border-slate-200 h-9 text-sm font-semibold focus-visible:ring-blue-600" />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider block">Scrap Qty</Label>
                              <Input name="cuttingOuterScrap" type="number" min="0" placeholder="0" className="bg-white border-slate-200 h-9 text-sm font-semibold focus-visible:ring-blue-600" />
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Middle Grade */}
                      {trolleyData[trolleyType].middle && (
                        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm hover:border-blue-300 hover:shadow-md transition-all space-y-3">
                          <div className="flex items-center justify-between bg-slate-50/80 border-b border-slate-100 px-4 py-2.5 -mx-4 -mt-4 rounded-t-xl mb-4">
                            <div className="flex items-center gap-2">
                              <div className="w-1 h-3.5 rounded bg-blue-600"></div>
                              <span className="text-xs font-bold text-slate-700 tracking-wider uppercase">Middle Grade</span>
                            </div>
                            <span className="inline-flex items-center bg-blue-50 text-blue-700 text-xs font-black px-3 py-1 rounded-full border border-blue-200/60 shadow-xs">
                              {trolleyData[trolleyType].middle.grade}
                            </span>
                          </div>
                          <input type="hidden" name="cuttingMiddleGrade" value={trolleyData[trolleyType].middle.grade} />
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div className="space-y-1">
                              <Label className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider block mb-1">Worker</Label>
                              <Select 
                                name="cuttingMiddleEmployeeId"
                                value={selectedWorkers.cuttingMiddleEmployeeId || ""}
                                onValueChange={(val) => setSelectedWorkers(prev => ({ ...prev, cuttingMiddleEmployeeId: val ?? "" }))}
                              >
                                <SelectTrigger className={cn(
                                  "rounded-full h-8 text-xs transition-all px-3 w-fit",
                                  selectedWorkers.cuttingMiddleEmployeeId
                                    ? "bg-blue-50 border-blue-200 text-blue-700 font-semibold hover:bg-blue-100 hover:border-blue-300"
                                    : "bg-slate-50/50 border-dashed border-slate-200 text-slate-400 hover:bg-slate-100 hover:border-slate-300"
                                )}>
                                  <span>{getWorkerName(selectedWorkers.cuttingMiddleEmployeeId)}</span>
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="" className="text-slate-400 italic">None</SelectItem>
                                  {employees.filter(emp => emp.employee_id).map(emp => (
                                    <SelectItem key={emp.employee_id} value={emp.employee_id}>
                                      {emp.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-1">
                              <Label className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider block">Good Qty</Label>
                              <Input name="cuttingMiddleQty" type="number" min="0" placeholder="0" className="bg-white border-slate-200 h-9 text-sm font-semibold focus-visible:ring-blue-600" />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider block">Scrap Qty</Label>
                              <Input name="cuttingMiddleScrap" type="number" min="0" placeholder="0" className="bg-white border-slate-200 h-9 text-sm font-semibold focus-visible:ring-blue-600" />
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Inner Grade */}
                      {trolleyData[trolleyType].inner && (
                        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm hover:border-blue-300 hover:shadow-md transition-all space-y-3">
                          <div className="flex items-center justify-between bg-slate-50/80 border-b border-slate-100 px-4 py-2.5 -mx-4 -mt-4 rounded-t-xl mb-4">
                            <div className="flex items-center gap-2">
                              <div className="w-1 h-3.5 rounded bg-blue-600"></div>
                              <span className="text-xs font-bold text-slate-700 tracking-wider uppercase">Inner Grade</span>
                            </div>
                            <span className="inline-flex items-center bg-blue-50 text-blue-700 text-xs font-black px-3 py-1 rounded-full border border-blue-200/60 shadow-xs">
                              {trolleyData[trolleyType].inner.grade}
                            </span>
                          </div>
                          <input type="hidden" name="cuttingInnerGrade" value={trolleyData[trolleyType].inner.grade} />
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div className="space-y-1">
                              <Label className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider block mb-1">Worker</Label>
                              <Select 
                                name="cuttingInnerEmployeeId"
                                value={selectedWorkers.cuttingInnerEmployeeId || ""}
                                onValueChange={(val) => setSelectedWorkers(prev => ({ ...prev, cuttingInnerEmployeeId: val ?? "" }))}
                              >
                                <SelectTrigger className={cn(
                                  "rounded-full h-8 text-xs transition-all px-3 w-fit",
                                  selectedWorkers.cuttingInnerEmployeeId
                                    ? "bg-blue-50 border-blue-200 text-blue-700 font-semibold hover:bg-blue-100 hover:border-blue-300"
                                    : "bg-slate-50/50 border-dashed border-slate-200 text-slate-400 hover:bg-slate-100 hover:border-slate-300"
                                )}>
                                  <span>{getWorkerName(selectedWorkers.cuttingInnerEmployeeId)}</span>
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="" className="text-slate-400 italic">None</SelectItem>
                                  {employees.filter(emp => emp.employee_id).map(emp => (
                                    <SelectItem key={emp.employee_id} value={emp.employee_id}>
                                      {emp.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-1">
                              <Label className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider block">Good Qty</Label>
                              <Input name="cuttingInnerQty" type="number" min="0" placeholder="0" className="bg-white border-slate-200 h-9 text-sm font-semibold focus-visible:ring-blue-600" />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider block">Scrap Qty</Label>
                              <Input name="cuttingInnerScrap" type="number" min="0" placeholder="0" className="bg-white border-slate-200 h-9 text-sm font-semibold focus-visible:ring-blue-600" />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-xs text-slate-500 italic mt-2">
                      Select a Trolley Type to view cutting grades.
                    </div>
                  )}
                </div>
              </div>

              {/* 3. Punching Stage */}
              <div className="bg-purple-50/30 p-5 rounded-xl border border-purple-100 space-y-5">
                <div className="text-sm font-bold text-purple-800 flex items-center gap-2 border-b border-purple-100 pb-2">
                  <Hammer className="w-4 h-4" />
                  Punching Stage
                </div>
                
                <input type="hidden" name="trolleyType" value={trolleyType} />
                
                {trolleyType ? (
                  <div className="space-y-5">
                    {/* Outer Punching */}
                    <div className="bg-white p-4 rounded-xl border border-purple-100 shadow-sm space-y-4">
                      <div className="flex items-center gap-2 border-b border-slate-100 pb-2 mb-3">
                        <span className="text-sm text-slate-800 font-bold">Outer Tools</span>
                        <span className="bg-purple-100 text-purple-700 text-[10px] font-bold px-2 py-0.5 rounded-md border border-purple-200/60 uppercase tracking-wider">
                          Grade {trolleyData[trolleyType].outer.grade}
                        </span>
                      </div>
                      <div className="space-y-3">
                        {trolleyData[trolleyType].outer.tools.map((tool: string) => (
                          <div key={tool} className="p-4 bg-slate-50/30 border border-slate-200 rounded-xl shadow-sm hover:border-purple-300 hover:bg-white hover:shadow-md transition-all space-y-3">
                            {/* Tool Name Header */}
                            <div className="flex items-center justify-between bg-slate-50/80 border-b border-slate-100 px-4 py-2.5 -mx-4 -mt-4 rounded-t-xl mb-4">
                              <div className="flex items-center gap-2">
                                <div className="w-1 h-3.5 rounded bg-purple-600"></div>
                                <span className="text-xs font-bold text-slate-700 tracking-wider uppercase">{tool}</span>
                              </div>
                              <span className="inline-flex items-center bg-purple-50 text-purple-700 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-purple-200/60 shadow-xs uppercase tracking-wider">
                                Punching Tool
                              </span>
                            </div>

                            {/* Controls Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                              <div className="space-y-1">
                                <Label className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider block mb-1">Worker</Label>
                                <Select 
                                  name={`emp_outer_${tool}`}
                                  value={selectedWorkers[`emp_outer_${tool}`] || ""}
                                  onValueChange={(val) => setSelectedWorkers(prev => ({ ...prev, [`emp_outer_${tool}`]: val ?? "" }))}
                                >
                                  <SelectTrigger className={cn(
                                    "rounded-full h-8 text-xs transition-all px-3 w-fit",
                                    selectedWorkers[`emp_outer_${tool}`]
                                      ? "bg-purple-50 border-purple-200 text-purple-700 font-semibold hover:bg-purple-100 hover:border-purple-300"
                                      : "bg-slate-50/50 border-dashed border-slate-200 text-slate-400 hover:bg-slate-100 hover:border-slate-300"
                                  )}>
                                    <span>{getWorkerName(selectedWorkers[`emp_outer_${tool}`])}</span>
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="" className="text-slate-400 italic">None</SelectItem>
                                    {employees.filter(emp => emp.employee_id).map(emp => (
                                      <SelectItem key={emp.employee_id} value={emp.employee_id}>
                                        {emp.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-1">
                                <Label className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider block">Good Qty</Label>
                                <Input name={`tool_outer_${tool}`} type="number" min="0" placeholder="0" className="bg-white border-slate-200 h-9 text-sm font-semibold focus-visible:ring-purple-600" />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider block">Scrap Qty</Label>
                                <Input name={`scrap_outer_${tool}`} type="number" min="0" placeholder="0" className="bg-white border-slate-200 h-9 text-sm font-semibold focus-visible:ring-purple-600" />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Middle Punching */}
                    {trolleyData[trolleyType].middle && (
                      <div className="bg-white p-4 rounded-xl border border-purple-100 shadow-sm space-y-4">
                        <div className="flex items-center gap-2 border-b border-slate-100 pb-2 mb-3">
                          <span className="text-sm text-slate-800 font-bold">Middle Tools</span>
                          <span className="bg-purple-100 text-purple-700 text-[10px] font-bold px-2 py-0.5 rounded-md border border-purple-200/60 uppercase tracking-wider">
                            Grade {trolleyData[trolleyType].middle.grade}
                          </span>
                        </div>
                        <div className="space-y-3">
                          {trolleyData[trolleyType].middle.tools.map((tool: string) => (
                            <div key={tool} className="p-4 bg-slate-50/30 border border-slate-200 rounded-xl shadow-sm hover:border-purple-300 hover:bg-white hover:shadow-md transition-all space-y-3">
                              {/* Tool Name Header */}
                              <div className="flex items-center justify-between bg-slate-50/80 border-b border-slate-100 px-4 py-2.5 -mx-4 -mt-4 rounded-t-xl mb-4">
                                <div className="flex items-center gap-2">
                                  <div className="w-1 h-3.5 rounded bg-purple-600"></div>
                                  <span className="text-xs font-bold text-slate-700 tracking-wider uppercase">{tool}</span>
                                </div>
                                <span className="inline-flex items-center bg-purple-50 text-purple-700 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-purple-200/60 shadow-xs uppercase tracking-wider">
                                  Punching Tool
                                </span>
                              </div>

                              {/* Controls Grid */}
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <div className="space-y-1">
                                  <Label className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider block mb-1">Worker</Label>
                                  <Select 
                                    name={`emp_middle_${tool}`}
                                    value={selectedWorkers[`emp_middle_${tool}`] || ""}
                                    onValueChange={(val) => setSelectedWorkers(prev => ({ ...prev, [`emp_middle_${tool}`]: val ?? "" }))}
                                  >
                                    <SelectTrigger className={cn(
                                      "rounded-full h-8 text-xs transition-all px-3 w-fit",
                                      selectedWorkers[`emp_middle_${tool}`]
                                        ? "bg-purple-50 border-purple-200 text-purple-700 font-semibold hover:bg-purple-100 hover:border-purple-300"
                                        : "bg-slate-50/50 border-dashed border-slate-200 text-slate-400 hover:bg-slate-100 hover:border-slate-300"
                                    )}>
                                      <span>{getWorkerName(selectedWorkers[`emp_middle_${tool}`])}</span>
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="" className="text-slate-400 italic">None</SelectItem>
                                      {employees.filter(emp => emp.employee_id).map(emp => (
                                        <SelectItem key={emp.employee_id} value={emp.employee_id}>
                                          {emp.name}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div className="space-y-1">
                                  <Label className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider block">Good Qty</Label>
                                  <Input name={`tool_middle_${tool}`} type="number" min="0" placeholder="0" className="bg-white border-slate-200 h-9 text-sm font-semibold focus-visible:ring-purple-600" />
                                </div>
                                <div className="space-y-1">
                                  <Label className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider block">Scrap Qty</Label>
                                  <Input name={`scrap_middle_${tool}`} type="number" min="0" placeholder="0" className="bg-white border-slate-200 h-9 text-sm font-semibold focus-visible:ring-purple-600" />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Inner Punching */}
                    {trolleyData[trolleyType].inner && (
                      <div className="bg-white p-4 rounded-xl border border-purple-100 shadow-sm space-y-4">
                        <div className="flex items-center gap-2 border-b border-slate-100 pb-2 mb-3">
                          <span className="text-sm text-slate-800 font-bold">Inner Tools</span>
                          <span className="bg-purple-100 text-purple-700 text-[10px] font-bold px-2 py-0.5 rounded-md border border-purple-200/60 uppercase tracking-wider">
                            Grade {trolleyData[trolleyType].inner.grade}
                          </span>
                        </div>
                        <div className="space-y-3">
                          {trolleyData[trolleyType].inner.tools.map((tool: string) => (
                            <div key={tool} className="p-4 bg-slate-50/30 border border-slate-200 rounded-xl shadow-sm hover:border-purple-300 hover:bg-white hover:shadow-md transition-all space-y-3">
                              {/* Tool Name Header */}
                              <div className="flex items-center justify-between bg-slate-50/80 border-b border-slate-100 px-4 py-2.5 -mx-4 -mt-4 rounded-t-xl mb-4">
                                <div className="flex items-center gap-2">
                                  <div className="w-1 h-3.5 rounded bg-purple-600"></div>
                                  <span className="text-xs font-bold text-slate-700 tracking-wider uppercase">{tool}</span>
                                </div>
                                <span className="inline-flex items-center bg-purple-50 text-purple-700 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-purple-200/60 shadow-xs uppercase tracking-wider">
                                  Punching Tool
                                </span>
                              </div>

                              {/* Controls Grid */}
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <div className="space-y-1">
                                  <Label className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider block mb-1">Worker</Label>
                                  <Select 
                                    name={`emp_inner_${tool}`}
                                    value={selectedWorkers[`emp_inner_${tool}`] || ""}
                                    onValueChange={(val) => setSelectedWorkers(prev => ({ ...prev, [`emp_inner_${tool}`]: val ?? "" }))}
                                  >
                                    <SelectTrigger className={cn(
                                      "rounded-full h-8 text-xs transition-all px-3 w-fit",
                                      selectedWorkers[`emp_inner_${tool}`]
                                        ? "bg-purple-50 border-purple-200 text-purple-700 font-semibold hover:bg-purple-100 hover:border-purple-300"
                                        : "bg-slate-50/50 border-dashed border-slate-200 text-slate-400 hover:bg-slate-100 hover:border-slate-300"
                                    )}>
                                      <span>{getWorkerName(selectedWorkers[`emp_inner_${tool}`])}</span>
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="" className="text-slate-400 italic">None</SelectItem>
                                      {employees.filter(emp => emp.employee_id).map(emp => (
                                        <SelectItem key={emp.employee_id} value={emp.employee_id}>
                                          {emp.name}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div className="space-y-1">
                                  <Label className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider block">Good Qty</Label>
                                  <Input name={`tool_inner_${tool}`} type="number" min="0" placeholder="0" className="bg-white border-slate-200 h-9 text-sm font-semibold focus-visible:ring-purple-600" />
                                </div>
                                <div className="space-y-1">
                                  <Label className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider block">Scrap Qty</Label>
                                  <Input name={`scrap_inner_${tool}`} type="number" min="0" placeholder="0" className="bg-white border-slate-200 h-9 text-sm font-semibold focus-visible:ring-purple-600" />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-sm text-slate-500 italic p-4 bg-white rounded-lg border border-purple-100 text-center">
                    Please select a Trolley Type in the Punching Stage to view available Punching Tools.
                  </div>
                )}


              </div>
            </div>



            <div className="flex justify-end pt-4 border-t border-slate-100">
              <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white shadow-md font-bold px-10 h-12 flex items-center gap-2 transition-all rounded-xl">
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <Save className="w-5 h-5" />
                )}
                {loading ? "Saving Entry..." : "Save Production"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

    </div>
  )
}
