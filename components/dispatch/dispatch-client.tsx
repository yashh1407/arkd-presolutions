"use client"

import { useState } from "react"
import { addDispatch, deleteDispatch } from "@/app/(dashboard)/dispatch/actions"
import { toast } from "sonner"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Plus, Truck, Trash2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export function DispatchForm() {
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)

    const formData = new FormData(e.currentTarget)
    const result = await addDispatch({
      date: formData.get("date") as string,
      challan_no: formData.get("challan_no") as string,
      prod_outer_qty: Number(formData.get("prod_outer_qty")) || 0,
      prod_middle_qty: Number(formData.get("prod_middle_qty")) || 0,
      prod_inner_qty: Number(formData.get("prod_inner_qty")) || 0,
      punch_outer_qty: Number(formData.get("punch_outer_qty")) || 0,
      punch_middle_qty: Number(formData.get("punch_middle_qty")) || 0,
      punch_inner_qty: Number(formData.get("punch_inner_qty")) || 0,
    })

    if (result.success) {
      toast.success("Dispatch logged successfully")
      ;(e.target as HTMLFormElement).reset()
      const dateInput = (e.target as HTMLFormElement).elements.namedItem('date') as HTMLInputElement
      if(dateInput) dateInput.value = new Date().toISOString().split('T')[0]
    } else {
      toast.error(result.error || "Failed to log dispatch")
    }

    setIsLoading(false)
  }

  return (
    <Card className="rounded-card border-border-color shadow-sm bg-surface overflow-hidden">
      <div className="p-4 border-b border-border-color bg-brand/5 flex items-center gap-2">
        <Truck className="w-5 h-5 text-brand" />
        <h2 className="font-semibold text-text-1">Log Dispatch</h2>
      </div>
      <CardContent className="p-5">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="date">Date</Label>
              <Input id="date" name="date" type="date" required defaultValue={new Date().toISOString().split('T')[0]} className="bg-canvas" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="challan_no">Challan No</Label>
              <Input id="challan_no" name="challan_no" type="text" required placeholder="e.g. CH-1029" className="bg-canvas" />
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-text-2 uppercase tracking-wider border-b border-border-color pb-1">Production Qty</h3>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="prod_outer_qty" className="text-xs">Outer 365</Label>
                <Input id="prod_outer_qty" name="prod_outer_qty" type="number" min="0" placeholder="0" className="bg-canvas text-sm" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="prod_middle_qty" className="text-xs">Middle 313</Label>
                <Input id="prod_middle_qty" name="prod_middle_qty" type="number" min="0" placeholder="0" className="bg-canvas text-sm" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="prod_inner_qty" className="text-xs">Inner 273</Label>
                <Input id="prod_inner_qty" name="prod_inner_qty" type="number" min="0" placeholder="0" className="bg-canvas text-sm" />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-text-2 uppercase tracking-wider border-b border-border-color pb-1">Punching Material Qty</h3>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="punch_outer_qty" className="text-xs">Outer 365</Label>
                <Input id="punch_outer_qty" name="punch_outer_qty" type="number" min="0" placeholder="0" className="bg-canvas text-sm" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="punch_middle_qty" className="text-xs">Middle 313</Label>
                <Input id="punch_middle_qty" name="punch_middle_qty" type="number" min="0" placeholder="0" className="bg-canvas text-sm" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="punch_inner_qty" className="text-xs">Inner 273</Label>
                <Input id="punch_inner_qty" name="punch_inner_qty" type="number" min="0" placeholder="0" className="bg-canvas text-sm" />
              </div>
            </div>
          </div>

          <div className="pt-2">
            <Button type="submit" disabled={isLoading} className="w-full bg-accent-dispatch hover:bg-accent-dispatch/90">
              {isLoading ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</>
              ) : (
                <><Plus className="mr-2 h-4 w-4" /> Save Dispatch Record</>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

export function DispatchActions({ id }: { id: number }) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  const handleDelete = async () => {
    setIsDeleting(true)
    const res = await deleteDispatch(id)
    if (res.success) {
      toast.success("Dispatch deleted")
    } else {
      toast.error(res.error || "Failed to delete dispatch")
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
        title="Delete Dispatch"
      >
        {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
      </button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-[400px] bg-surface border-border-color shadow-2xl rounded-card p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-text-1">Delete Dispatch</DialogTitle>
            <DialogDescription className="text-text-3 text-sm mt-2">
              Are you sure you want to delete this dispatch record? This action cannot be undone.
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
