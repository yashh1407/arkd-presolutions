"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import Link from "next/link"
import { Clock, LogOut, CheckCircle2, Scissors, Hammer, Save } from "lucide-react"
import { checkIn, checkOut, submitPWAProductionLog } from "./actions"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function PWAHomeClient({ initialAttendance, userName }: { initialAttendance: any, userName: string }) {
  const router = useRouter()
  const [attendance, setAttendance] = useState<any>(initialAttendance)
  const [loadingAction, setLoadingAction] = useState(false)
  const [savingForm, setSavingForm] = useState(false)
  const [trolleyType, setTrolleyType] = useState<string>("")

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

  const isCheckedIn = !!attendance && attendance.status !== "Checked Out"
  const isCheckedOut = !!attendance && attendance.status === "Checked Out"

  const handleCheckIn = async () => {
    setLoadingAction(true)
    const result = await checkIn(new FormData()) // No location/remarks needed for 1-click
    if (result.success) {
      toast.success("Checked in successfully!")
      setAttendance(result.data)
      router.refresh()
    } else {
      toast.error(result.error || "Failed to check in")
    }
    setLoadingAction(false)
  }

  const handleCheckOut = async () => {
    setLoadingAction(true)
    const result = await checkOut(attendance.id, new FormData())
    if (result.success) {
      toast.success("Checked out successfully! Great job today.")
      setAttendance(result.data)
      router.refresh()
    } else {
      toast.error(result.error || "Failed to check out")
    }
    setLoadingAction(false)
  }

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSavingForm(true)
    
    const formData = new FormData(e.currentTarget)
    // No need to append finalQty manually since the new action handles it

    const result = await submitPWAProductionLog(formData)
    
    if (result.success) {
      toast.success("Work log saved successfully!")
      ;(e.target as HTMLFormElement).reset()
      setTrolleyType("")
      router.refresh()
    } else {
      toast.error(result.error || "Failed to save work log")
    }
    setSavingForm(false)
  }

  return (
    <div className="space-y-6">
      {/* Welcome Card & Check-In/Out */}
      <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
        <h1 className="text-lg font-bold text-slate-900 mb-1">Hey, {userName} 👋</h1>
        
        {attendance ? (
          <p className="text-[11px] text-slate-500 mb-5">
            Last check-in was at {new Date(attendance.check_in_time).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute:'2-digit' })} · <Link href="/app/logs" className="text-slate-700 underline decoration-slate-300 underline-offset-2">View List</Link>
          </p>
        ) : (
          <p className="text-[11px] text-slate-500 mb-5">
            You haven't checked in today yet.
          </p>
        )}

        {!attendance || isCheckedOut ? (
          <button 
            onClick={handleCheckIn} 
            disabled={loadingAction}
            className="flex items-center justify-center gap-2 w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-3 rounded-lg text-sm transition-colors border border-slate-200 disabled:opacity-50"
          >
            {loadingAction ? <div className="w-4 h-4 border-2 border-slate-500 border-t-transparent rounded-full animate-spin"></div> : <Clock className="w-4 h-4" />}
            Check In
          </button>
        ) : (
          <button 
            onClick={handleCheckOut} 
            disabled={loadingAction}
            className="flex items-center justify-center gap-2 w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-3 rounded-lg text-sm transition-colors border border-slate-200 disabled:opacity-50"
          >
            {loadingAction ? <div className="w-4 h-4 border-2 border-slate-500 border-t-transparent rounded-full animate-spin"></div> : <LogOut className="w-4 h-4" />}
            Check Out
          </button>
        )}
      </div>

      {/* Production Form (Always visible now) */}
      <div className="mt-8">
        <form onSubmit={handleFormSubmit} className="space-y-6">
          <div className="grid grid-cols-1 gap-6">
            
            {/* 1. Date (Static Display) */}
            <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 flex justify-between items-center">
              <span className="text-sm font-bold text-slate-800">Date</span>
              <span className="text-sm text-slate-600">{new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-')}</span>
              <input type="hidden" name="date" value={new Date().toISOString().split('T')[0]} />
            </div>

            {/* 2. Cutting Stage */}
            <div className="bg-white p-5 rounded-xl border border-blue-100 shadow-sm space-y-5 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
              <div className="text-sm font-bold text-blue-800 flex items-center gap-2 pb-2">
                <Scissors className="w-4 h-4" />
                Cutting Stage
              </div>
              
              <div className="space-y-2">
                <Label className="text-xs text-slate-600 font-semibold">Machine</Label>
                <Select name="cuttingMachine">
                  <SelectTrigger className="bg-slate-50 border-slate-200">
                    <SelectValue placeholder="Select Machine" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="" className="text-slate-400 italic">Select Machine</SelectItem>
                    <SelectItem value="Cutting 1">Cutting 1</SelectItem>
                    <SelectItem value="Cutting 2">Cutting 2</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-4 pt-4 border-t border-slate-100">
                  <Label className="text-xs text-slate-800 font-bold">Trolley Details</Label>
                  
                  {/* Outer Trolley */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-[10px] text-slate-500 font-semibold uppercase">Outer Grade</Label>
                      <Select name="cuttingOuterGrade">
                        <SelectTrigger className="bg-slate-50 border-slate-200 text-sm">
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
                    <div className="space-y-1">
                      <Label className="text-[10px] text-slate-500 font-semibold uppercase">Outer Qty</Label>
                      <Input name="cuttingOuterQty" type="number" min="0" placeholder="0" className="bg-slate-50 border-slate-200 text-sm" />
                    </div>
                  </div>

                  {/* Middle Trolley */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-[10px] text-slate-500 font-semibold uppercase">Middle Grade</Label>
                      <Select name="cuttingMiddleGrade">
                        <SelectTrigger className="bg-slate-50 border-slate-200 text-sm">
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
                    <div className="space-y-1">
                      <Label className="text-[10px] text-slate-500 font-semibold uppercase">Middle Qty</Label>
                      <Input name="cuttingMiddleQty" type="number" min="0" placeholder="0" className="bg-slate-50 border-slate-200 text-sm" />
                    </div>
                  </div>

                  {/* Inner Trolley */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-[10px] text-slate-500 font-semibold uppercase">Inner Grade</Label>
                      <Select name="cuttingInnerGrade">
                        <SelectTrigger className="bg-slate-50 border-slate-200 text-sm">
                          <SelectValue placeholder="Grade" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="" className="text-slate-400 italic">Grade</SelectItem>
                          <SelectItem value="273">Inner - 273</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] text-slate-500 font-semibold uppercase">Inner Qty</Label>
                      <Input name="cuttingInnerQty" type="number" min="0" placeholder="0" className="bg-slate-50 border-slate-200 text-sm" />
                    </div>
                  </div>
              </div>
            </div>

            {/* 3. Punching Stage */}
            <div className="bg-white p-5 rounded-xl border border-purple-100 shadow-sm space-y-5 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-purple-500"></div>
              <div className="flex items-center gap-2 pb-2 border-b border-purple-100">
                <div className="text-sm font-bold text-purple-800 flex items-center gap-2">
                  <Hammer className="w-4 h-4" />
                  Punching Stage
                </div>
                <div className="flex items-center gap-2 ml-auto">
                  <Label className="text-xs text-slate-700 font-semibold whitespace-nowrap">Trolley</Label>
                  <Select name="trolleyType" value={trolleyType} onValueChange={(value) => setTrolleyType(value ?? "")}>
                    <SelectTrigger className="bg-white border-slate-200 w-[70px] h-8 text-xs focus-visible:ring-purple-600">
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
              </div>
              
              {trolleyType ? (
                <div className="space-y-4 mt-4">
                  {/* Outer Punching */}
                  <div className="bg-white p-3 rounded-lg border border-purple-100 shadow-sm space-y-3">
                    <Label className="text-sm text-slate-700 font-bold border-b border-slate-100 pb-2 block">Outer Tools ({trolleyData[trolleyType].outer.grade})</Label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {trolleyData[trolleyType].outer.tools.map((tool: string) => (
                        <div key={tool} className="space-y-1">
                          <Label className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">{tool}</Label>
                          <Input name={`tool_outer_${tool}`} type="number" min="0" placeholder="0" className="bg-slate-50 h-8 text-sm focus-visible:ring-purple-600" />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Middle Punching */}
                  {trolleyData[trolleyType].middle && (
                    <div className="bg-white p-3 rounded-lg border border-purple-100 shadow-sm space-y-3">
                      <Label className="text-sm text-slate-700 font-bold border-b border-slate-100 pb-2 block">Middle Tools ({trolleyData[trolleyType].middle.grade})</Label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {trolleyData[trolleyType].middle.tools.map((tool: string) => (
                          <div key={tool} className="space-y-1">
                            <Label className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">{tool}</Label>
                            <Input name={`tool_middle_${tool}`} type="number" min="0" placeholder="0" className="bg-slate-50 h-8 text-sm focus-visible:ring-purple-600" />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Inner Punching */}
                  {trolleyData[trolleyType].inner && (
                    <div className="bg-white p-3 rounded-lg border border-purple-100 shadow-sm space-y-3">
                      <Label className="text-sm text-slate-700 font-bold border-b border-slate-100 pb-2 block">Inner Tools ({trolleyData[trolleyType].inner.grade})</Label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {trolleyData[trolleyType].inner.tools.map((tool: string) => (
                          <div key={tool} className="space-y-1">
                            <Label className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">{tool}</Label>
                            <Input name={`tool_inner_${tool}`} type="number" min="0" placeholder="0" className="bg-slate-50 h-8 text-sm focus-visible:ring-purple-600" />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-xs text-slate-500 italic mt-4">
                  Select a Trolley Type to view punching tools.
                </div>
              )}
            </div>

            <button type="submit" disabled={savingForm || !isCheckedIn} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all disabled:opacity-50">
              {savingForm ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <Save className="w-5 h-5" />}
              {savingForm ? "Saving..." : !isCheckedIn ? "Check In Required to Submit" : "Submit Log"}
            </button>
            
          </div>
        </form>
      </div>

      {/* Logout option at the very bottom */}
      <div className="flex justify-center mt-6 mb-12">
        <Link href="/api/auth/signout?callbackUrl=/app/login" className="text-xs text-rose-500 font-semibold hover:underline">
          Sign Out
        </Link>
      </div>

    </div>
  )
}
