import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { getTodayAttendance } from "./actions"
import Link from "next/link"
import { Clock, PlusCircle, ClipboardList, LogOut, CheckCircle2 } from "lucide-react"

export default async function PWAHome() {
  const session = await getServerSession(authOptions)
  const attendanceRes = await getTodayAttendance()
  
  const attendance = attendanceRes.success ? attendanceRes.data : null
  const isCheckedIn = !!attendance && attendance.status !== "Checked Out"
  const isCheckedOut = !!attendance && attendance.status === "Checked Out"

  const now = new Date()
  const dateStr = now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-brand text-white rounded-2xl p-6 shadow-md relative overflow-hidden">
        <div className="relative z-10">
          <h1 className="text-2xl font-bold">Hello, {session?.user?.name || "Employee"}</h1>
          <p className="text-brand-weak mt-1">{dateStr}</p>
        </div>
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
      </div>

      {/* Status Card */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200">
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">Today's Status</h2>
        
        {!attendance ? (
          <div className="flex items-center gap-3 text-amber-600 bg-amber-50 p-3 rounded-xl">
            <Clock className="w-5 h-5" />
            <span className="font-medium">Not checked in yet</span>
          </div>
        ) : isCheckedOut ? (
          <div className="flex items-center gap-3 text-slate-600 bg-slate-100 p-3 rounded-xl">
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Checked out at {new Date(attendance.check_out_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
          </div>
        ) : (
          <div className="flex items-center gap-3 text-emerald-600 bg-emerald-50 p-3 rounded-xl">
            <CheckCircle2 className="w-5 h-5" />
            <div className="flex flex-col">
              <span className="font-medium">Checked In</span>
              <span className="text-xs opacity-80">Since {new Date(attendance.check_in_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons Grid */}
      <div className="grid grid-cols-2 gap-4">
        {!attendance ? (
          <Link href="/pwa/checkin" className="col-span-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl p-4 flex flex-col items-center justify-center gap-3 shadow-md transition-transform active:scale-95">
            <Clock className="w-8 h-8" />
            <span className="font-bold text-lg">Check In</span>
          </Link>
        ) : isCheckedIn ? (
          <Link href="/pwa/checkout" className="col-span-2 bg-rose-500 hover:bg-rose-600 text-white rounded-2xl p-4 flex flex-col items-center justify-center gap-3 shadow-md transition-transform active:scale-95">
            <LogOut className="w-8 h-8" />
            <span className="font-bold text-lg">Check Out</span>
          </Link>
        ) : null}

        <Link 
          href={isCheckedIn ? "/pwa/logs/new" : "#"} 
          className={`col-span-2 sm:col-span-1 rounded-2xl p-5 flex flex-col items-center justify-center gap-3 shadow-sm border transition-transform ${isCheckedIn ? 'bg-white border-slate-200 active:scale-95 hover:border-brand/50' : 'bg-slate-50 border-slate-100 opacity-50 cursor-not-allowed'}`}
          onClick={(e) => {
            if (!isCheckedIn) {
              e.preventDefault()
              alert("You must check in first to add a log.")
            }
          }}
        >
          <div className="w-12 h-12 bg-brand/10 rounded-full flex items-center justify-center">
            <PlusCircle className="w-6 h-6 text-brand" />
          </div>
          <span className="font-semibold text-slate-700">Add Work Log</span>
        </Link>

        <Link href="/pwa/logs" className="col-span-2 sm:col-span-1 bg-white rounded-2xl p-5 flex flex-col items-center justify-center gap-3 shadow-sm border border-slate-200 transition-transform active:scale-95 hover:border-brand/50">
          <div className="w-12 h-12 bg-blue-500/10 rounded-full flex items-center justify-center">
            <ClipboardList className="w-6 h-6 text-blue-600" />
          </div>
          <span className="font-semibold text-slate-700">View My Logs</span>
        </Link>
      </div>

      {/* Info Notice */}
      {isCheckedOut && (
        <div className="bg-slate-100 p-4 rounded-xl text-center border border-slate-200">
          <p className="text-sm text-slate-600 font-medium">Your shift is over for today. Great job!</p>
        </div>
      )}
    </div>
  )
}
