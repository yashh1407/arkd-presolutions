"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { checkIn } from "../actions"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Clock } from "lucide-react"
import Link from "next/link"

export default function CheckInPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const result = await checkIn(formData)

    setLoading(false)

    if (result.success) {
      toast.success("Checked in successfully!")
      router.push("/pwa")
    } else {
      toast.error(result.error || "Failed to check in.")
    }
  }

  return (
    <div className="max-w-md mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/pwa" className="p-2 bg-white rounded-full shadow-sm">
          <ArrowLeft className="w-5 h-5 text-slate-700" />
        </Link>
        <h1 className="text-xl font-bold text-slate-800">Check In</h1>
      </div>

      <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="flex items-center justify-center p-4 bg-emerald-50 rounded-xl mb-6 border border-emerald-100">
            <Clock className="w-8 h-8 text-emerald-600 mr-3" />
            <div className="text-emerald-800">
              <div className="text-sm font-semibold opacity-80">Current Time</div>
              <div className="text-xl font-bold">{new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-slate-700 font-semibold">Shift *</Label>
            <Select name="shift" required defaultValue="Day">
              <SelectTrigger className="h-12 bg-slate-50 border-slate-200">
                <SelectValue placeholder="Select shift" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Day">Day Shift</SelectItem>
                <SelectItem value="Night">Night Shift</SelectItem>
                <SelectItem value="Custom">Custom Shift</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-slate-700 font-semibold">Department *</Label>
            <Select name="department" required defaultValue="Production">
              <SelectTrigger className="h-12 bg-slate-50 border-slate-200">
                <SelectValue placeholder="Select department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Production">Production</SelectItem>
                <SelectItem value="Maintenance">Maintenance</SelectItem>
                <SelectItem value="Store">Store / Inventory</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="location" className="text-slate-700 font-semibold">Location / Unit</Label>
            <Input id="location" name="location" placeholder="e.g. Unit 1" className="h-12 bg-slate-50 border-slate-200" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="remarks" className="text-slate-700 font-semibold">Remarks (Optional)</Label>
            <Textarea id="remarks" name="remarks" placeholder="Any issues or notes?" className="bg-slate-50 border-slate-200 min-h-[80px]" />
          </div>

          <Button type="submit" disabled={loading} className="w-full h-14 text-lg font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-md transition-all mt-4">
            {loading ? (
              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              "Confirm Check In"
            )}
          </Button>
        </form>
      </div>
    </div>
  )
}
