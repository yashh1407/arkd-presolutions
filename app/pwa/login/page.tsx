"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Briefcase, Lock, Factory } from "lucide-react"

export default function PWALoginPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const email = formData.get("email") as string
    const password = formData.get("password") as string

    try {
      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
      })

      if (res?.error) {
        toast.error("Invalid credentials. Please check your Employee ID/Email and Password.")
      } else {
        toast.success("Login successful!")
        router.push("/pwa")
      }
    } catch (error) {
      toast.error("An error occurred during login.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 px-6 py-12">
      <div className="w-full max-w-sm space-y-8">
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 bg-brand rounded-full flex items-center justify-center shadow-lg mb-4">
            <Factory className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-black tracking-wider text-slate-900 text-center">ARKD PWA</h2>
          <p className="text-slate-500 text-sm mt-2">Employee Work Logs Portal</p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-700 font-semibold text-sm">Employee ID / Email / Phone</Label>
              <div className="relative">
                <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input 
                  id="email" 
                  name="email" 
                  type="text" 
                  required 
                  placeholder="e.g. EMP-001 or 9876543210" 
                  className="pl-9 bg-slate-50 border-slate-200 h-12 text-base"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password" className="text-slate-700 font-semibold text-sm">Password / PIN</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input 
                  id="password" 
                  name="password" 
                  type="password" 
                  required 
                  placeholder="Enter your password/PIN" 
                  className="pl-9 bg-slate-50 border-slate-200 h-12 text-base"
                />
              </div>
            </div>

            <Button type="submit" disabled={loading} className="w-full h-12 text-base font-bold bg-brand hover:bg-brand-weak text-white rounded-xl shadow-md transition-all">
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>
        </div>
        
        <div className="text-center text-xs text-slate-400">
          &copy; {new Date().getFullYear()} ARKD Presolutions. All rights reserved.
        </div>
      </div>
    </div>
  )
}
