"use client"

import { useState } from "react"
import { savePowderCoatingEntry, deletePowderCoatingEntry } from "@/app/(dashboard)/scrap/actions"
import { toast } from "sonner"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Plus, Trash2, Paintbrush } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export function PowderCoatingForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [materialType, setMaterialType] = useState("")

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)

    const formData = new FormData(e.currentTarget)
    formData.append("materialType", materialType)

    const result = await savePowderCoatingEntry(formData)

    if (result.success) {
      toast.success("Powder Coating entry logged successfully")
      ;(e.target as HTMLFormElement).reset()
      setMaterialType("")
      const dateInput = (e.target as HTMLFormElement).elements.namedItem('date') as HTMLInputElement
      if (dateInput) dateInput.value = new Date().toISOString().split('T')[0]
    } else {
      toast.error(result.error || "Failed to log entry")
    }

    setIsLoading(false)
  }

  const materialOptions = [
    "Outer 365",
    "Middle 313",
    "Inner 273",
    "Outer 465",
    "Middle 443",
    "Outer 565",
    "Middle 353",
  ]

  return (
    <Card className="rounded-card border-border-color shadow-sm bg-surface overflow-hidden">
      <div className="p-4 border-b border-border-color bg-accent-prod/5 flex items-center gap-2">
        <Paintbrush className="w-5 h-5 text-accent-prod" />
        <h2 className="font-semibold text-text-1">Log Powder Coating</h2>
      </div>
      <CardContent className="p-5">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-1.5">
            <Label htmlFor="date">Date</Label>
            <Input id="date" name="date" type="date" required defaultValue={new Date().toISOString().split('T')[0]} className="bg-canvas" />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="materialType">Material Type</Label>
            <Select onValueChange={(val) => setMaterialType(val ?? "")} value={materialType} required>
              <SelectTrigger className="bg-canvas border-border-color">
                <SelectValue placeholder="Select Material Grade" />
              </SelectTrigger>
              <SelectContent className="bg-surface border-border-color text-text-1">
                {materialOptions.map((opt) => (
                  <SelectItem key={opt} value={opt}>
                    {opt}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="qty">Total Qty (Pcs)</Label>
              <Input id="qty" name="qty" type="number" min="1" required placeholder="e.g. 2000" className="bg-canvas text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="rejection">Rejection (Pcs)</Label>
              <Input id="rejection" name="rejection" type="number" min="0" required placeholder="e.g. 10" className="bg-canvas text-sm" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="powderUsedKg">Used Powder (KG)</Label>
            <Input id="powderUsedKg" name="powderUsedKg" type="number" step="0.01" min="0" required placeholder="e.g. 5.50" className="bg-canvas text-sm" />
          </div>

          <div className="pt-2">
            <Button type="submit" disabled={isLoading || !materialType} className="w-full bg-accent-prod hover:bg-accent-prod/90 text-white font-bold">
              {isLoading ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</>
              ) : (
                <><Plus className="mr-2 h-4 w-4" /> Save Record</>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

export function PowderCoatingActions({ id }: { id: number }) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  const handleDelete = async () => {
    setIsDeleting(true)
    const res = await deletePowderCoatingEntry(id)
    if (res.success) {
      toast.success("Record deleted successfully")
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
              Are you sure you want to delete this powder coating record? This action cannot be undone.
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
