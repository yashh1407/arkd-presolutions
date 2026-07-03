"use client"

import { useState } from "react"
import { MoreHorizontal, Edit, Trash2, Save, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { deleteProductionEntry, updateProductionEntry } from "@/app/(dashboard)/production/actions"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export function ProductionTableActions({ prod }: { prod: any }) {
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)

  // Format date for the HTML date input (YYYY-MM-DD)
  const defaultDate = prod.date ? new Date(prod.date).toISOString().split('T')[0] : ""

  const handleDelete = async () => {
    setIsDeleting(true)
    const result = await deleteProductionEntry(prod.id)
    if (result.success) {
      toast.success("Entry deleted successfully")
    } else {
      toast.error(result.error || "Failed to delete entry")
    }
    setIsDeleting(false)
    setIsDeleteOpen(false)
  }

  const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsUpdating(true)
    
    const formData = new FormData(e.currentTarget)
    const result = await updateProductionEntry(prod.id, formData)
    
    if (result.success) {
      toast.success("Entry updated successfully")
      setIsEditOpen(false)
    } else {
      toast.error(result.error || "Failed to update entry")
    }
    
    setIsUpdating(false)
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger className="h-8 w-8 p-0 inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-400">
          <span className="sr-only">Open menu</span>
          <MoreHorizontal className="h-4 w-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="bg-white z-[99999]">
          <DropdownMenuGroup>
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setIsEditOpen(true)} className="cursor-pointer">
              <Edit className="mr-2 h-4 w-4" />
              Edit Entry
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => setIsDeleteOpen(true)} 
              disabled={isDeleting}
              className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
            >
              {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
              Delete
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-3xl bg-surface border-border-color">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-text-1">Edit Production Entry</DialogTitle>
            <DialogDescription>
              Update the details for this production record.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleUpdate} className="space-y-6 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label className="text-sm text-slate-700 font-semibold">Date</Label>
                <Input name="date" type="date" required defaultValue={defaultDate} className="bg-slate-50 border-slate-200" />
              </div>
              <div className="space-y-2">
                <Label className="text-sm text-slate-700 font-semibold">Cutting Material</Label>
                <Select name="material" required defaultValue={prod.material_name || "other"}>
                  <SelectTrigger className="bg-slate-50 border-slate-200 relative z-0">
                    <SelectValue placeholder="Select material" />
                  </SelectTrigger>
                  <SelectContent className="z-[99999]">
                    <SelectItem value="outer">Outer - 365</SelectItem>
                    <SelectItem value="middle">Middle - 313</SelectItem>
                    <SelectItem value="inner">Inner - 273</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                    <SelectItem value="Assorted Grades">Assorted Grades</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-sm text-slate-700 font-semibold">Production Qty</Label>
                <Input name="productionQty" type="number" defaultValue={prod.production_qty ?? ""} className="bg-slate-50 border-slate-200 font-medium" />
              </div>
              <div className="space-y-2">
                <Label className="text-sm text-slate-700 font-semibold">Target Qty</Label>
                <Input name="targetQty" type="number" defaultValue={prod.target_qty ?? ""} className="bg-slate-50 border-slate-200 font-medium" />
              </div>
              <div className="space-y-2">
                <Label className="text-sm text-slate-700 font-semibold">Grinding Qty</Label>
                <Input name="grindingQty" type="number" defaultValue={prod.grinding_qty ?? ""} className="bg-slate-50 border-slate-200 font-medium" />
              </div>
            </div>

            <div className="bg-slate-50/50 p-5 rounded-xl border border-slate-100 mt-6">
              <div className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                Cutting Machine Output
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <Label className="text-xs text-slate-600 font-semibold">Cutting Machine 1</Label>
                  <Input name="machine1" type="number" defaultValue={prod.machine1_qty ?? ""} className="bg-white border-slate-200" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-slate-600 font-semibold">Cutting Machine 2</Label>
                  <Input name="machine2" type="number" defaultValue={prod.machine2_qty ?? ""} className="bg-white border-slate-200" />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isUpdating} className="bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center gap-2">
                {isUpdating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {isUpdating ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="max-w-[400px] bg-surface border-border-color shadow-2xl rounded-card p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-text-1">Delete Production Entry</DialogTitle>
            <DialogDescription className="text-text-3 text-sm mt-2">
              Are you sure you want to delete this production entry? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3 mt-6">
            <Button
              type="button"
              variant="outline"
              disabled={isDeleting}
              onClick={() => setIsDeleteOpen(false)}
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
