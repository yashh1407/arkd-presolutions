"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, Database, RefreshCw } from "lucide-react"

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  const isDatabaseError = 
    error.message.includes("Can't reach database server") || 
    error.message.includes("ECONNREFUSED") ||
    error.message.includes("database server is running")

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <Card className="max-w-md w-full border-rose-100 shadow-sm">
        <CardHeader className="bg-rose-50/50 rounded-t-xl pb-6">
          <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-xl flex items-center justify-center mb-4">
            {isDatabaseError ? <Database className="w-6 h-6" /> : <AlertCircle className="w-6 h-6" />}
          </div>
          <CardTitle className="text-xl text-rose-900">
            {isDatabaseError ? "Database Connection Failed" : "Something went wrong"}
          </CardTitle>
          <CardDescription className="text-rose-600/80 mt-1.5">
            {isDatabaseError 
              ? "The CRM cannot connect to your MySQL server." 
              : "An unexpected error occurred while loading this page."}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          {isDatabaseError ? (
            <div className="space-y-3 text-sm text-slate-600">
              <p>Please make sure your database server is running:</p>
              <ul className="list-disc pl-5 space-y-1 text-slate-700">
                <li>Open <strong>XAMPP Control Panel</strong> (or WAMP/MAMP).</li>
                <li>Click <strong>Start</strong> next to the MySQL module.</li>
                <li>Ensure the port is set to 3306.</li>
              </ul>
            </div>
          ) : (
            <div className="p-3 bg-slate-50 text-slate-600 text-xs rounded-lg font-mono overflow-auto max-h-32">
              {error.message}
            </div>
          )}
          
          <Button 
            onClick={() => reset()} 
            className="w-full bg-slate-900 hover:bg-slate-800"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
