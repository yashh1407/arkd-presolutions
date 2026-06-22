"use client"

import { useSession, signOut } from "next-auth/react"
import { useRouter, usePathname } from "next/navigation"
import { useEffect } from "react"
import Link from "next/link"
import { Home, FileText, LogOut, ClipboardList, Bell, PlusCircle } from "lucide-react"

export default function PWALayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (status === "unauthenticated" && !pathname.includes("/login")) {
      router.push("/app/login")
    }
  }, [status, router, pathname])

  if (status === "loading" || (status === "unauthenticated" && !pathname.includes("/login"))) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-brand border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  // If on login page, don't show the PWA shell (bottom nav etc)
  if (pathname.includes("/login")) {
    return <>{children}</>
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 pb-16">
      {/* Top Header */}
      <header className="bg-white text-slate-900 px-4 py-3 border-b border-slate-100 sticky top-0 z-10 flex justify-between items-center">
        <div className="font-bold text-[15px] tracking-tight">ARKD HR</div>
        <div className="flex items-center gap-3">
          <button className="text-slate-500 hover:text-slate-800 transition-colors">
            <Bell className="w-5 h-5" />
          </button>
          <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 font-semibold text-sm">
            {session?.user?.name ? session.user.name.charAt(0).toUpperCase() : 'A'}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 p-4 max-w-md mx-auto w-full">
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 flex justify-around items-center p-1 pb-safe z-20">
        <Link href="/app" className={`flex flex-col items-center p-2 min-w-[64px] ${pathname === '/app' ? 'text-slate-900 font-semibold' : 'text-slate-400'}`}>
          <Home className="w-5 h-5 mb-1" />
          <span className="text-[10px] font-medium">Home</span>
        </Link>

        <Link href="/app/logs" className={`flex flex-col items-center p-2 min-w-[64px] ${pathname === '/app/logs' ? 'text-slate-900 font-semibold' : 'text-slate-400'}`}>
          <ClipboardList className="w-[22px] h-[22px] mb-1 stroke-[1.5]" />
          <span className="text-[10px]">My Logs</span>
        </Link>
      </nav>
    </div>
  )
}

function PlusIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19"></line>
      <line x1="5" y1="12" x2="19" y2="12"></line>
    </svg>
  )
}
