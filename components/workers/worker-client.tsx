"use client"

import { useState } from "react"
import { addWorkerMaterial, deleteWorkerMaterial } from "@/app/(dashboard)/workers/actions"
import { toast } from "sonner"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Plus, Users, Trash2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export function WorkerMaterialForm() {
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)

    const formData = new FormData(e.currentTarget)
    const result = await addWorkerMaterial({
      date: formData.get("date") as string,
      employee_name: formData.get("employee_name") as string,
      item_name: formData.get("item_name") as string,
      qty: Number(formData.get("qty")) || 1,
    })

    if (result.success) {
      toast.success("Material issued successfully")
      ;(e.target as HTMLFormElement).reset()
      const dateInput = (e.target as HTMLFormElement).elements.namedItem('date') as HTMLInputElement
      if(dateInput) dateInput.value = new Date().toISOString().split('T')[0]
    } else {
      toast.error(result.error || "Failed to log material issue")
    }

    setIsLoading(false)
  }

  return (
    <Card className="rounded-card border-border-color shadow-sm bg-surface overflow-hidden">
      <div className="p-4 border-b border-border-color bg-brand/5 flex items-center gap-2">
        <Users className="w-5 h-5 text-brand" />
        <h2 className="font-semibold text-text-1">Issue Material to Worker</h2>
      </div>
      <CardContent className="p-5">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="date">Date</Label>
              <Input id="date" name="date" type="date" required defaultValue={new Date().toISOString().split('T')[0]} className="bg-canvas" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="employee_name">Employee Name</Label>
              <Input id="employee_name" name="employee_name" type="text" required placeholder="e.g. Pradip Kujar" className="bg-canvas" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="item_name">Item / Material</Label>
              <Input id="item_name" name="item_name" type="text" required placeholder="e.g. Handgloves, Pen" className="bg-canvas" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="qty">Quantity</Label>
              <Input id="qty" name="qty" type="number" min="1" required defaultValue={1} className="bg-canvas" />
            </div>
          </div>
          <div className="pt-2">
            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</>
              ) : (
                <><Plus className="mr-2 h-4 w-4" /> Log Material</>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

export function WorkerActions({ id }: { id: number }) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  const handleDelete = async () => {
    setIsDeleting(true)
    const res = await deleteWorkerMaterial(id)
    if (res.success) {
      toast.success("Record deleted")
    } else {
      toast.error(res.error || "Failed to delete record")
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
        title="Delete Record"
      >
        {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
      </button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-[400px] bg-surface border-border-color shadow-2xl rounded-card p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-text-1">Delete Record</DialogTitle>
            <DialogDescription className="text-text-3 text-sm mt-2">
              Are you sure you want to delete this record? This action cannot be undone.
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
