"use client"

import { useState } from "react"
import { addTarget, deleteTarget } from "@/app/(dashboard)/targets/actions"
import { toast } from "sonner"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Plus, Target, Trash2 } from "lucide-react"

export function TargetForm() {
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)

    const formData = new FormData(e.currentTarget)
    const result = await addTarget({
      date: formData.get("date") as string,
      outer_365: Number(formData.get("outer_365")) || 0,
      middle_313: Number(formData.get("middle_313")) || 0,
      inner_273: Number(formData.get("inner_273")) || 0,
      hole_2: Number(formData.get("hole_2")) || 0,
      lancing: Number(formData.get("lancing")) || 0,
      dip: Number(formData.get("dip")) || 0,
      hole_5: Number(formData.get("hole_5")) || 0,
      square: Number(formData.get("square")) || 0,
      single_punch: Number(formData.get("single_punch")) || 0,
      apple_cut: Number(formData.get("apple_cut")) || 0,
      inner_1: Number(formData.get("inner_1")) || 0,
      inner_2: Number(formData.get("inner_2")) || 0,
    })

    if (result.success) {
      toast.success("Target set successfully")
      ;(e.target as HTMLFormElement).reset()
      const dateInput = (e.target as HTMLFormElement).elements.namedItem('date') as HTMLInputElement
      if(dateInput) dateInput.value = new Date().toISOString().split('T')[0]
    } else {
      toast.error(result.error || "Failed to set target")
    }

    setIsLoading(false)
  }

  return (
    <Card className="rounded-card border-border-color shadow-sm bg-surface overflow-hidden">
      <div className="p-4 border-b border-border-color bg-brand/5 flex items-center gap-2">
        <Target className="w-5 h-5 text-brand" />
        <h2 className="font-semibold text-text-1">Set Daily Target</h2>
      </div>
      <CardContent className="p-5">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-1.5">
            <Label htmlFor="date">Target Date</Label>
            <Input id="date" name="date" type="date" required defaultValue={new Date().toISOString().split('T')[0]} className="bg-canvas" />
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-text-2 uppercase tracking-wider border-b border-border-color pb-1">Cutting Targets</h3>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="outer_365" className="text-xs">Outer 365</Label>
                <Input id="outer_365" name="outer_365" type="number" min="0" placeholder="0" className="bg-canvas text-sm" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="middle_313" className="text-xs">Middle 313</Label>
                <Input id="middle_313" name="middle_313" type="number" min="0" placeholder="0" className="bg-canvas text-sm" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="inner_273" className="text-xs">Inner 273</Label>
                <Input id="inner_273" name="inner_273" type="number" min="0" placeholder="0" className="bg-canvas text-sm" />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-text-2 uppercase tracking-wider border-b border-border-color pb-1">Punching Targets</h3>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5"><Label className="text-xs">2 Hole</Label><Input name="hole_2" type="number" min="0" placeholder="0" className="bg-canvas text-sm" /></div>
              <div className="space-y-1.5"><Label className="text-xs">Lancing</Label><Input name="lancing" type="number" min="0" placeholder="0" className="bg-canvas text-sm" /></div>
              <div className="space-y-1.5"><Label className="text-xs">Dip</Label><Input name="dip" type="number" min="0" placeholder="0" className="bg-canvas text-sm" /></div>
              <div className="space-y-1.5"><Label className="text-xs">5 Hole</Label><Input name="hole_5" type="number" min="0" placeholder="0" className="bg-canvas text-sm" /></div>
              <div className="space-y-1.5"><Label className="text-xs">Square</Label><Input name="square" type="number" min="0" placeholder="0" className="bg-canvas text-sm" /></div>
              <div className="space-y-1.5"><Label className="text-xs">Single</Label><Input name="single_punch" type="number" min="0" placeholder="0" className="bg-canvas text-sm" /></div>
              <div className="space-y-1.5"><Label className="text-xs">Apple Cut</Label><Input name="apple_cut" type="number" min="0" placeholder="0" className="bg-canvas text-sm" /></div>
              <div className="space-y-1.5"><Label className="text-xs">Inner 1</Label><Input name="inner_1" type="number" min="0" placeholder="0" className="bg-canvas text-sm" /></div>
              <div className="space-y-1.5"><Label className="text-xs">Inner 2</Label><Input name="inner_2" type="number" min="0" placeholder="0" className="bg-canvas text-sm" /></div>
            </div>
          </div>

          <div className="pt-2">
            <Button type="submit" disabled={isLoading} className="w-full bg-accent-target hover:bg-accent-target/90 text-white">
              {isLoading ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</>
              ) : (
                <><Plus className="mr-2 h-4 w-4" /> Save Targets</>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

export function TargetActions({ id }: { id: number }) {
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this target?")) return
    setIsDeleting(true)
    const res = await deleteTarget(id)
    if (res.success) {
      toast.success("Target deleted")
    } else {
      toast.error(res.error || "Failed to delete target")
      setIsDeleting(false)
    }
  }

  return (
    <button 
      onClick={handleDelete} 
      disabled={isDeleting}
      className="p-1.5 text-text-3 hover:text-status-down hover:bg-status-down/10 rounded-md transition-colors"
      title="Delete Target"
    >
      {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
    </button>
  )
}
