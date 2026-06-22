import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { getTodayAttendance } from "./actions"
import PWAInstallBanner from "@/components/pwa-install-banner"
import PWAHomeClient from "./home-client"

export default async function PWAHome() {
  const session = await getServerSession(authOptions)
  const attendanceRes = await getTodayAttendance()
  
  const attendance = attendanceRes.success ? attendanceRes.data : null
  const userName = session?.user?.name ? session.user.name.split(' ')[0] : 'Employee'

  return (
    <div className="space-y-6">
      <PWAInstallBanner />
      <PWAHomeClient initialAttendance={attendance} userName={userName} />
    </div>
  )
}
