"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { PlusCircle, Save, Database, Hammer, Scissors, Ruler, CheckCircle } from "lucide-react"
import { saveProductionEntry, getProductionEntries } from "./actions"



export default function ProductionPage() {
  const [loading, setLoading] = useState(false)
  const [punchingQty, setPunchingQty] = useState<number>(0)
  const [entries, setEntries] = useState<any[]>([])

  const fetchEntries = async () => {
    const result = await getProductionEntries()
    if (result.success) {
      setEntries(result.data)
    }
  }

  useEffect(() => {
    fetchEntries()
  }, [])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    
    const formData = new FormData(e.currentTarget)
    // Pass punchingQty as finalQty for DB completeness
    formData.append("finalQty", punchingQty.toString())
    
    const result = await saveProductionEntry(formData)
    
    if (result.success) {
      toast.success("Production entry saved successfully!")
      ;(e.target as HTMLFormElement).reset()
      setPunchingQty(0)
      fetchEntries()
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
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="space-y-2 md:col-span-1">
                <Label className="text-sm text-slate-700 font-semibold">Date</Label>
                <Input name="date" type="date" required className="bg-slate-50 border-slate-200 focus-visible:ring-blue-600 shadow-sm" />
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
                          <SelectItem value="365">Outer - 365</SelectItem>
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
                          <SelectItem value="313">Middle - 313</SelectItem>
                          <SelectItem value="273">Middle - 273</SelectItem>
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
                          <SelectItem value="465">Inner - 465</SelectItem>
                          <SelectItem value="443">Inner - 443</SelectItem>
                          <SelectItem value="565">Inner - 565</SelectItem>
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
                <div className="text-sm font-bold text-purple-800 flex items-center gap-2 border-b border-purple-100 pb-2">
                  <Hammer className="w-4 h-4" />
                  Punching Stage
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs text-slate-600 font-semibold">Machine</Label>
                    <Select name="punchingMachine">
                      <SelectTrigger className="bg-white border-slate-200 focus-visible:ring-purple-600">
                        <SelectValue placeholder="Select Machine" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Punching 1">Punching 1</SelectItem>
                        <SelectItem value="Punching 2">Punching 2</SelectItem>
                        <SelectItem value="Punching 3">Punching 3</SelectItem>
                        <SelectItem value="Punching 4">Punching 4</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs text-slate-600 font-semibold">Punched Quantity</Label>
                    <Input 
                      name="punchingQty" 
                      type="number" 
                      min="0"
                      placeholder="0" 
                      value={punchingQty || ""}
                      onChange={(e) => setPunchingQty(Number(e.target.value))}
                      className="bg-white border-slate-200 focus-visible:ring-purple-600 font-medium" 
                    />
                  </div>
                </div>
              </div>
            </div>



            <div className="flex justify-end pt-4 border-t border-slate-100">
              <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white shadow-md font-bold px-10 h-12 flex items-center gap-2 transition-all rounded-xl">
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <Save className="w-5 h-5" />
                )}
                {loading ? "Saving Entry..." : "Save Production Log"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Production Log */}
      <Card className="bg-white border-slate-200 shadow-sm">
        <CardHeader className="border-b border-slate-100 pb-4">
          <CardTitle className="text-lg font-bold text-slate-900">Production Log</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-slate-600">
              <thead className="text-xs text-slate-700 uppercase bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">ID</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Cutting</th>
                  <th className="px-4 py-3">Punching</th>
                </tr>
              </thead>
              <tbody>
                {entries.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-slate-500">No production entries found.</td>
                  </tr>
                ) : (
                  entries.map((entry) => (
                    <tr key={entry.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium text-slate-900">#{entry.id}</td>
                      <td className="px-4 py-3">{entry.date}</td>
                      <td className="px-4 py-3">
                        <div className="text-xs">
                          {entry.cutting_machine && <div>{entry.cutting_machine}</div>}
                          {entry.cutting_outer_qty > 0 && <span className="text-blue-600">O:{entry.cutting_outer_qty} </span>}
                          {entry.cutting_middle_qty > 0 && <span className="text-blue-600">M:{entry.cutting_middle_qty} </span>}
                          {entry.cutting_inner_qty > 0 && <span className="text-blue-600">I:{entry.cutting_inner_qty}</span>}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {entry.punching_machine && <div className="text-xs">{entry.punching_machine}</div>}
                        {entry.punching_qty}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
