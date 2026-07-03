"use client"

import { useState } from "react"
import { addExpense, deleteExpense } from "@/app/(dashboard)/expenses/actions"
import { toast } from "sonner"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Plus, Banknote, Trash2, IndianRupee } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export function ExpenseForm() {
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)

    const formData = new FormData(e.currentTarget)
    const result = await addExpense({
      date: formData.get("date") as string,
      amount: Number(formData.get("amount")),
      remark: formData.get("remark") as string,
      paid_by: formData.get("paid_by") as string,
      payment_mode: formData.get("payment_mode") as string,
    })

    if (result.success) {
      toast.success("Expense logged successfully")
      ;(e.target as HTMLFormElement).reset()
      // set date back to today
      const dateInput = (e.target as HTMLFormElement).elements.namedItem('date') as HTMLInputElement
      if(dateInput) dateInput.value = new Date().toISOString().split('T')[0]
    } else {
      toast.error(result.error || "Failed to log expense")
    }

    setIsLoading(false)
  }

  return (
    <Card className="rounded-card border-border-color shadow-sm bg-surface overflow-hidden">
      <div className="p-4 border-b border-border-color bg-brand/5 flex items-center gap-2">
        <Banknote className="w-5 h-5 text-brand" />
        <h2 className="font-semibold text-text-1">Log New Expense</h2>
      </div>
      <CardContent className="p-5">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="date">Date</Label>
              <Input 
                id="date" 
                name="date" 
                type="date" 
                required 
                defaultValue={new Date().toISOString().split('T')[0]} 
                className="bg-canvas"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="amount">Amount (₹)</Label>
              <Input 
                id="amount" 
                name="amount" 
                type="number" 
                min="0" 
                step="0.01" 
                required 
                placeholder="0.00"
                className="bg-canvas font-mono"
              />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="remark">Remark / Description</Label>
              <Input 
                id="remark" 
                name="remark" 
                type="text" 
                required 
                placeholder="e.g. Machine Transport"
                className="bg-canvas"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="paid_by">Paid By</Label>
              <Input 
                id="paid_by" 
                name="paid_by" 
                type="text" 
                required 
                placeholder="e.g. Priyansh"
                className="bg-canvas"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="payment_mode">Payment Mode</Label>
              <select
                id="payment_mode"
                name="payment_mode"
                required
                className="flex h-10 w-full rounded-md border border-border-color bg-canvas px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="Cash">Cash</option>
                <option value="UPI">UPI</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Cheque">Cheque</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>
          <div className="pt-2">
            <Button type="submit" disabled={isLoading} className="w-full bg-accent-expense hover:bg-accent-expense/90">
              {isLoading ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</>
              ) : (
                <><Plus className="mr-2 h-4 w-4" /> Add Expense</>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

export function ExpenseActions({ id }: { id: number }) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  const handleDelete = async () => {
    setIsDeleting(true)
    const res = await deleteExpense(id)
    if (res.success) {
      toast.success("Expense deleted")
    } else {
      toast.error(res.error || "Failed to delete expense")
      setIsDeleting(false)
      setIsOpen(false)
    }
  }

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)} 
        disabled={isDeleting}
        className="p-1.5 text-text-3 hover:text-status-down hover:bg-status-down/10 rounded-md transition-colors"
        title="Delete Expense"
      >
        {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
      </button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-[400px] bg-surface border-border-color shadow-2xl rounded-card p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-text-1">Delete Expense</DialogTitle>
            <DialogDescription className="text-text-3 text-sm mt-2">
              Are you sure you want to delete this expense? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3 mt-6">
            <Button
              type="button"
              variant="outline"
              disabled={isDeleting}
              onClick={() => setIsOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={isDeleting}
              onClick={handleDelete}
              className="bg-status-down hover:bg-status-down/90 text-white font-semibold"
            >
              {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
