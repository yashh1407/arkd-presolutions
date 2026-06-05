"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { Lock, Mail, ArrowRight } from "lucide-react"
import Image from "next/image"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    })

    if (result?.error) {
      toast.error("Invalid credentials")
      setIsLoading(false)
    } else {
      toast.success("Login successful")
      router.push("/dashboard")
      router.refresh()
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4 font-sans relative bg-gradient-to-br from-white via-blue-100 to-blue-600 overflow-hidden">
      {/* Abstract background blobs for modern feel */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob"></div>
      <div className="absolute top-[20%] right-[-10%] w-96 h-96 bg-white rounded-full mix-blend-overlay filter blur-3xl opacity-60 animate-blob animation-delay-2000"></div>
      <div className="absolute bottom-[-20%] left-[20%] w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-blob animation-delay-4000"></div>

      <div className="w-full max-w-[440px] bg-white/80 backdrop-blur-xl rounded-[24px] shadow-2xl shadow-blue-900/10 border border-white p-10 relative z-10 transition-all">
        
        {/* Header/Logo */}
        <div className="mb-10 text-center flex flex-col items-center">
          <div className="mb-6 rounded-2xl overflow-hidden shadow-lg shadow-blue-500/20 bg-white p-2">
            <Image 
              src="/logo.jpeg" 
              alt="ARKD Presolutions Logo" 
              width={160} 
              height={160} 
              className="object-contain"
            />
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">
            Admin Login
          </h1>
          <p className="text-sm text-slate-500 font-medium px-4">
            Secure access to the ARKD manufacturing management portal.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2.5">
            <Label htmlFor="email" className="text-[13px] text-slate-700 font-bold uppercase tracking-wider ml-1">Username / Email</Label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors group-focus-within:text-blue-600">
                <Mail className="h-4 w-4 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
              </div>
              <Input
                id="email"
                type="text"
                placeholder="admin or email@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="pl-11 border-slate-200/60 text-slate-900 h-14 focus-visible:ring-blue-500/20 focus-visible:border-blue-500 bg-white/50 hover:bg-white transition-all rounded-xl font-medium shadow-sm"
              />
            </div>
          </div>
          
          <div className="space-y-2.5">
            <Label htmlFor="password" className="text-[13px] text-slate-700 font-bold uppercase tracking-wider ml-1">Password</Label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors group-focus-within:text-blue-600">
                <Lock className="h-4 w-4 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
              </div>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="pl-11 border-slate-200/60 text-slate-900 h-14 focus-visible:ring-blue-500/20 focus-visible:border-blue-500 bg-white/50 hover:bg-white transition-all rounded-xl font-medium shadow-sm"
              />
            </div>
          </div>

          <Button
            type="submit"
            className="w-full h-14 bg-gradient-to-r from-blue-600 to-blue-500 text-white hover:from-blue-700 hover:to-blue-600 shadow-xl shadow-blue-500/25 font-bold text-[16px] transition-all mt-8 rounded-xl flex items-center justify-center gap-2"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>Authenticating...</span>
              </>
            ) : (
              <>
                <span>Sign In</span>
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </Button>
        </form>
      </div>
    </div>
  )
}
