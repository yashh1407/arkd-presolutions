"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { checkOut, getTodayAttendance } from "../actions"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, LogOut, AlertCircle } from "lucide-react"
import Link from "next/link"

export default function CheckOutPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [attendance, setAttendance] = useState<any>(null)
  const [fetching, setFetching] = useState(true)

  useEffect(() => {
    const fetchAttendance = async () => {
      const res = await getTodayAttendance()
      if (res.success && res.data) {
        setAttendance(res.data)
      } else {
        toast.error("Could not find active check-in record.")
        router.push("/pwa")
      }
      setFetching(false)
    }
    fetchAttendance()
  }, [router])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    if (!confirm("Are you sure you want to check out? You cannot add more logs today after checking out.")) {
      return
    }

    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const result = await checkOut(attendance.id, formData)

    setLoading(false)

    if (result.success) {
      toast.success("Checked out successfully!")
      router.push("/pwa")
    } else {
      toast.error(result.error || "Failed to check out.")
    }
  }

  if (fetching) {
    return <div className="flex justify-center p-10"><div className="w-8 h-8 border-4 border-brand border-t-transparent rounded-full animate-spin"></div></div>
  }

  if (!attendance) return null

  // Calculate rough working hours to show preview
  const checkInDate = new Date(attendance.check_in_time)
  const checkOutDate = new Date()
  const diffHours = (checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60)

  return (
    <div className="max-w-md mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/pwa" className="p-2 bg-white rounded-full shadow-sm">
          <ArrowLeft className="w-5 h-5 text-slate-700" />
        </Link>
        <h1 className="text-xl font-bold text-slate-800">Check Out</h1>
      </div>

      <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-500 font-medium">Check In Time:</span>
              <span className="font-bold text-slate-800">{checkInDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-500 font-medium">Current Time:</span>
              <span className="font-bold text-slate-800">{checkOutDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
            </div>
            <div className="pt-3 border-t border-slate-200 flex justify-between items-center">
              <span className="text-slate-700 font-semibold">Est. Working Hours:</span>
              <span className="text-lg font-black text-brand">{diffHours.toFixed(2)} hrs</span>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-800 font-medium leading-relaxed">
              Once you check out, your shift is ended. You will not be able to submit any more production logs for today.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="remarks" className="text-slate-700 font-semibold">Final Remarks (Optional)</Label>
            <Textarea id="remarks" name="remarks" placeholder="Any final notes before leaving?" className="bg-slate-50 border-slate-200 min-h-[80px]" />
          </div>

          <Button type="submit" disabled={loading} className="w-full h-14 text-lg font-bold bg-rose-500 hover:bg-rose-600 text-white rounded-xl shadow-md transition-all mt-4">
            {loading ? (
              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <div className="flex items-center gap-2">
                <LogOut className="w-5 h-5" />
                Confirm Check Out
              </div>
            )}
          </Button>
        </form>
      </div>
    </div>
  )
}
