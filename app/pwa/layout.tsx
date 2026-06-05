"use client"

import { useSession, signOut } from "next-auth/react"
import { useRouter, usePathname } from "next/navigation"
import { useEffect } from "react"
import Link from "next/link"
import { Home, FileText, LogOut, ClipboardList } from "lucide-react"

export default function PWALayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (status === "unauthenticated" && !pathname.includes("/login")) {
      router.push("/pwa/login")
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
      <header className="bg-brand text-white p-4 shadow-md sticky top-0 z-10 flex justify-between items-center">
        <div className="font-bold text-lg tracking-wider">ARKD WORK LOGS</div>
        <button 
          onClick={() => signOut({ callbackUrl: "/pwa/login" })}
          className="p-1 rounded-full hover:bg-white/10 transition-colors"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 p-4">
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 flex justify-around items-center p-2 pb-safe shadow-[0_-2px_10px_rgba(0,0,0,0.05)] z-20">
        <Link href="/pwa" className={`flex flex-col items-center p-2 rounded-lg ${pathname === '/pwa' ? 'text-brand' : 'text-slate-500'}`}>
          <Home className="w-6 h-6 mb-1" />
          <span className="text-[10px] font-medium">Home</span>
        </Link>
        <Link href="/pwa/logs/new" className={`flex flex-col items-center p-2 rounded-lg ${pathname === '/pwa/logs/new' ? 'text-brand' : 'text-slate-500'}`}>
          <div className="bg-brand text-white p-3 rounded-full -mt-6 shadow-lg border-4 border-slate-50">
            <PlusIcon />
          </div>
          <span className="text-[10px] font-medium mt-1">Add Log</span>
        </Link>
        <Link href="/pwa/logs" className={`flex flex-col items-center p-2 rounded-lg ${pathname === '/pwa/logs' ? 'text-brand' : 'text-slate-500'}`}>
          <ClipboardList className="w-6 h-6 mb-1" />
          <span className="text-[10px] font-medium">My Logs</span>
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
