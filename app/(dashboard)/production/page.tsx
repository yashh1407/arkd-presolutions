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



export default function ProductionPage() {
  const [loading, setLoading] = useState(false)
  const [trolleyType, setTrolleyType] = useState<string>("")
  const [employeeId, setEmployeeId] = useState<string>("")

  const [employees, setEmployees] = useState<any[]>([])

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
  }, [])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    
    const formData = new FormData(e.currentTarget)
    
    const result = await saveProductionEntry(formData)
    
    if (result.success) {
      toast.success("Production saved to Employee Work Logs.")
      ;(e.target as HTMLFormElement).reset()
      setEmployeeId("")
      setTrolleyType("")
    } else {
      toast.error(result.error || "Failed to save entry")
    }
    
    setLoading(false)
  }

  const selectedEmployeeName = employees.find((emp) => emp.employee_id === employeeId)?.name || ""

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
            
            {/* 1. Date & Employee */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-sm text-slate-700 font-semibold">Date</Label>
                <Input name="date" type="date" required className="bg-slate-50 border-slate-200 focus-visible:ring-blue-600 shadow-sm" />
              </div>
              <div className="space-y-2">
                <Label className="text-sm text-slate-700 font-semibold">Employee</Label>
                <Select name="employeeId" value={employeeId} onValueChange={(value) => setEmployeeId(value ?? "")}>
                  <SelectTrigger className="bg-white border-slate-200 focus-visible:ring-blue-600 shadow-sm">
                    <span className={`min-w-0 truncate ${selectedEmployeeName ? "text-slate-900" : "text-slate-400"}`}>
                      {selectedEmployeeName || "No employee selected"}
                    </span>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="" className="text-slate-500 italic">
                      No employee
                    </SelectItem>
                    {employees.filter(emp => emp.employee_id).map(emp => (
                      <SelectItem key={emp.employee_id || emp.id} value={emp.employee_id}>
                        {emp.name || "Unnamed employee"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                  <Label className="text-sm text-slate-700 font-semibold">Trolley Details</Label>
                  
                  {/* Outer Trolley */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs text-slate-600 font-semibold">Outer Grade</Label>
                      <Select name="cuttingOuterGrade">
                        <SelectTrigger className="bg-white border-slate-200">
                          <SelectValue placeholder="Grade" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="" className="text-slate-400 italic">Grade</SelectItem>
                          <SelectItem value="365">Outer - 365</SelectItem>
                          <SelectItem value="465">Outer - 465</SelectItem>
                          <SelectItem value="565">Outer - 565</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-slate-600 font-semibold">Outer Qty</Label>
                      <Input name="cuttingOuterQty" type="number" min="0" placeholder="0" className="bg-white" />
                    </div>
                  </div>

                  {/* Middle Trolley */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs text-slate-600 font-semibold">Middle Grade</Label>
                      <Select name="cuttingMiddleGrade">
                        <SelectTrigger className="bg-white border-slate-200">
                          <SelectValue placeholder="Grade" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="" className="text-slate-400 italic">Grade</SelectItem>
                          <SelectItem value="313">Middle - 313</SelectItem>
                          <SelectItem value="443">Middle - 443</SelectItem>
                          <SelectItem value="353">Middle - 353</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-slate-600 font-semibold">Middle Qty</Label>
                      <Input name="cuttingMiddleQty" type="number" min="0" placeholder="0" className="bg-white" />
                    </div>
                  </div>

                  {/* Inner Trolley */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs text-slate-600 font-semibold">Inner Grade</Label>
                      <Select name="cuttingInnerGrade">
                        <SelectTrigger className="bg-white border-slate-200">
                          <SelectValue placeholder="Grade" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="" className="text-slate-400 italic">Grade</SelectItem>
                          <SelectItem value="273">Inner - 273</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-slate-600 font-semibold">Inner Qty</Label>
                      <Input name="cuttingInnerQty" type="number" min="0" placeholder="0" className="bg-white" />
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. Punching Stage */}
              <div className="bg-purple-50/30 p-5 rounded-xl border border-purple-100 space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 border-b border-purple-100 pb-2">
                  <div className="text-sm font-bold text-purple-800 flex items-center gap-2">
                    <Hammer className="w-4 h-4" />
                    Punching Stage
                  </div>
                  <div className="flex items-center gap-3 ml-auto">
                    <Label className="text-sm text-slate-700 font-semibold">Trolley Details</Label>
                    <Select name="trolleyType" value={trolleyType} onValueChange={(value) => setTrolleyType(value ?? "")}>
                      <SelectTrigger className="bg-white border-slate-200 w-[120px] focus-visible:ring-purple-600">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="" className="text-slate-400 italic">None</SelectItem>
                        <SelectItem value="55">55</SelectItem>
                        <SelectItem value="65">65</SelectItem>
                        <SelectItem value="75">75</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                {trolleyType ? (
                  <div className="space-y-4">
                    {/* Outer Punching */}
                    <div className="bg-white p-4 rounded-lg border border-purple-100 shadow-sm space-y-4">
                      <Label className="text-sm text-slate-700 font-bold border-b border-slate-100 pb-2 block">Outer Tools ({trolleyData[trolleyType].outer.grade})</Label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                        {trolleyData[trolleyType].outer.tools.map((tool: string) => (
                          <div key={tool} className="space-y-1">
                            <Label className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">{tool}</Label>
                            <Input name={`tool_outer_${tool}`} type="number" min="0" placeholder="0" className="bg-slate-50 focus-visible:ring-purple-600" />
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Middle Punching */}
                    {trolleyData[trolleyType].middle && (
                      <div className="bg-white p-4 rounded-lg border border-purple-100 shadow-sm space-y-4">
                        <Label className="text-sm text-slate-700 font-bold border-b border-slate-100 pb-2 block">Middle Tools ({trolleyData[trolleyType].middle.grade})</Label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                          {trolleyData[trolleyType].middle.tools.map((tool: string) => (
                            <div key={tool} className="space-y-1">
                              <Label className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">{tool}</Label>
                              <Input name={`tool_middle_${tool}`} type="number" min="0" placeholder="0" className="bg-slate-50 focus-visible:ring-purple-600" />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Inner Punching */}
                    {trolleyData[trolleyType].inner && (
                      <div className="bg-white p-4 rounded-lg border border-purple-100 shadow-sm space-y-4">
                        <Label className="text-sm text-slate-700 font-bold border-b border-slate-100 pb-2 block">Inner Tools ({trolleyData[trolleyType].inner.grade})</Label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                          {trolleyData[trolleyType].inner.tools.map((tool: string) => (
                            <div key={tool} className="space-y-1">
                              <Label className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">{tool}</Label>
                              <Input name={`tool_inner_${tool}`} type="number" min="0" placeholder="0" className="bg-slate-50 focus-visible:ring-purple-600" />
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
