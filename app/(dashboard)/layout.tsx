"use client"

import { useState, useEffect } from "react"
import { useSession, signOut } from "next-auth/react"
import { usePathname, useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import {
  LayoutDashboard,
  Hammer,
  Users,
  Truck,
  Trash2,
  Wrench,
  Download,
  Menu,
  LogOut,
  Target,
  Banknote,
  Package,
  Database,
  Factory,
  Briefcase,
  CalendarCheck,
  ClipboardList
} from "lucide-react"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    }
  }, [status, router])

  if (status === "loading" || status === "unauthenticated") {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-brand border-t-transparent rounded-full animate-spin"></div>
          <div className="text-text-2 font-medium">Loading ARKD Dashboard...</div>
        </div>
      </div>
    )
  }

  const navItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, section: "Main" },
    { name: "Daily Production", href: "/production", icon: Hammer, section: "Production" },
    { name: "Worker & Machine Log", href: "/workers", icon: Users, section: "Production" },
    { name: "Dispatch", href: "/dispatch", icon: Truck, section: "Production" },
    { name: "Scrap & Rejection", href: "/scrap", icon: Trash2, section: "Production" },
    { name: "Employees", href: "/employees", icon: Briefcase, section: "Team" },
    { name: "Attendance", href: "/attendance", icon: CalendarCheck, section: "Team" },
    { name: "Employee Work Logs", href: "/employee-logs", icon: ClipboardList, section: "Team" },
    { name: "Machine Maintenance", href: "/maintenance", icon: Wrench, section: "Maintenance" },
    { name: "Expenses", href: "/expenses", icon: Banknote, section: "Finance" },
    { name: "Material Issue", href: "/material-issue", icon: Package, section: "Inventory" },
    { name: "Download Reports", href: "/reports", icon: Download, section: "Reports" },
  ]

  if (session?.user.role === "Admin") {
    navItems.push({ name: "Master Data", href: "/masters", icon: Database, section: "Settings" })
  }

  const sections = Array.from(new Set(navItems.map(item => item.section)))
  const pageTitle = navItems.find(item => item.href === pathname)?.name || "Dashboard"
  const currentDate = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })

  return (
    <div className="flex min-h-screen bg-canvas text-text-1 font-sans">
      {/* Sidebar - Dark Rail */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-[260px] bg-text-1 border-r border-[#1F2A3C] transform transition-transform duration-200 ease-in-out md:sticky md:top-0 md:h-screen md:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } flex flex-col`}
      >
        <div className="p-6 border-b border-[#1F2A3C] flex items-center justify-center">
          <div className="flex flex-col items-center">
            <div className="font-black text-3xl text-white tracking-[0.15em] flex items-center">
              ARKD
            </div>
            <div className="flex items-center gap-2 mt-1 opacity-90">
              <div className="w-4 h-[2px] bg-white/70"></div>
              <span className="text-[10px] text-white font-bold uppercase tracking-[0.25em] ml-1">Presolution</span>
              <div className="w-4 h-[2px] bg-white/70"></div>
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-6 custom-scrollbar px-3">
          {sections.map(section => (
            <div key={section} className="mb-6">
              <div className="text-[11px] uppercase tracking-[0.04em] text-text-3 font-semibold px-3 mb-2">{section}</div>
              <div className="space-y-2">
                {navItems.filter(item => item.section === section).map(item => {
                  const isActive = pathname.startsWith(item.href)
                  const Icon = item.icon
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setSidebarOpen(false)}
                      className={`relative flex items-center gap-3 px-3 py-2.5 rounded-control text-sm font-medium transition-all duration-150 ${
                        isActive
                          ? "bg-brand/10 text-brand-weak"
                          : "text-text-3 hover:bg-white/5 hover:text-white"
                      }`}
                    >
                      {isActive && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-[60%] bg-brand rounded-r-full" />
                      )}
                      <Icon className="w-4 h-4" />
                      {item.name}
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="p-4 border-t border-[#1F2A3C] text-xs text-text-3 font-medium text-center">
          ARKD Presolutions © {new Date().getFullYear()}
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 bg-canvas">
        {/* Topbar */}
        <header className="bg-surface border-b border-border-color px-6 py-4 flex items-center justify-between sticky top-0 z-40">
          <div className="flex items-center gap-4">
            <button
              className="md:hidden text-text-2 hover:text-text-1 transition-colors bg-canvas p-2 rounded-control border border-border-color focus-visible:outline-2 focus-visible:outline-brand"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-2xl font-bold text-text-1 hidden sm:block">{pageTitle}</h1>
          </div>
          
          <div className="flex items-center gap-5">
            <div className="text-[13px] text-text-2 font-medium bg-canvas px-3 py-1.5 rounded-chip hidden sm:block">
              {currentDate}
            </div>
            
            <div className="flex items-center gap-4 border-l border-border-color pl-5">
              <div className="text-right hidden md:block">
                <div className="font-semibold text-sm text-text-1">{session?.user?.name}</div>
                <div className="text-[13px] text-brand">{session?.user?.role}</div>
              </div>
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="p-2 text-text-3 hover:text-text-1 hover:bg-canvas rounded-control transition-colors focus-visible:outline-2 focus-visible:outline-brand"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 md:p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-text-1/40 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  )
}
