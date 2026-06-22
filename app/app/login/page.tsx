"use client"

import { useState, useEffect } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Briefcase, Lock, Factory, Download } from "lucide-react"

export default function PWALoginPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      // Show the install prompt
      deferredPrompt.prompt();
      // Wait for the user to respond to the prompt
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    } else {
      // Fallback for iOS or already installed
      toast.info("To install on iPhone: tap the Share button, then 'Add to Home Screen'. On Android, use the Chrome menu 'Add to Home screen'.");
    }
  }

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
        toast.error("Invalid credentials. Please check your Email and Password.")
      } else {
        toast.success("Login successful!")
        router.push("/app")
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
              <Label htmlFor="email" className="text-slate-700 font-semibold text-sm">Email Address</Label>
              <div className="relative">
                <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input 
                  id="email" 
                  name="email" 
                  type="email" 
                  required 
                  placeholder="e.g. employee@arkd.com" 
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

            <Button type="submit" disabled={loading} className="w-full h-12 text-base font-bold bg-brand hover:bg-brand/90 text-white rounded-xl shadow-md transition-all">
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>
        </div>
        
        <div className="flex flex-col items-center gap-6">
          <Button 
            type="button" 
            variant="outline" 
            onClick={handleInstallClick} 
            className="flex items-center gap-2 text-slate-600 border-slate-300 hover:bg-slate-100 rounded-xl"
          >
            <Download className="w-4 h-4" /> Download App
          </Button>

          <div className="text-center text-xs text-slate-400">
            &copy; {new Date().getFullYear()} ARKD Presolutions. All rights reserved.
          </div>
        </div>
      </div>
    </div>
  )
}
