"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { Save } from "lucide-react"
import { saveEmployee, updateEmployee } from "@/app/(dashboard)/employees/actions"

interface EmployeeFormDialogProps {
  open: boolean
  setOpen: (open: boolean) => void
  employee?: any
  onSuccess: () => void
}

export function EmployeeFormDialog({ open, setOpen, employee, onSuccess }: EmployeeFormDialogProps) {
  const [loading, setLoading] = useState(false)
  const isEditing = !!employee

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    
    let result
    if (isEditing) {
      result = await updateEmployee(employee.id, formData)
    } else {
      result = await saveEmployee(formData)
    }

    setLoading(false)

    if (result.success) {
      toast.success(isEditing ? "Employee updated successfully!" : "Employee added successfully!")
      setOpen(false)
      onSuccess()
    } else {
      toast.error(result.error || "Failed to save employee")
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[600px] bg-canvas border-border-color p-0 overflow-hidden">
        <DialogHeader className="p-6 border-b border-border-color bg-surface">
          <DialogTitle className="text-xl font-bold text-text-1">
            {isEditing ? "Edit Employee" : "Add New Employee"}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-2">
              <Label htmlFor="employee_id" className="text-text-2 font-semibold">Employee ID *</Label>
              <Input 
                id="employee_id" 
                name="employee_id" 
                defaultValue={employee?.employee_id || ""}
                required 
                placeholder="e.g. EMP-001"
                className="bg-surface"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name" className="text-text-2 font-semibold">Full Name *</Label>
              <Input 
                id="name" 
                name="name" 
                defaultValue={employee?.name || ""}
                required 
                placeholder="John Doe"
                className="bg-surface"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email" className="text-text-2 font-semibold">Email Address</Label>
              <Input 
                id="email" 
                name="email" 
                type="email"
                defaultValue={employee?.email || ""}
                placeholder="john@example.com"
                className="bg-surface"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-text-2 font-semibold">Phone Number</Label>
              <Input 
                id="phone" 
                name="phone" 
                defaultValue={employee?.phone || ""}
                placeholder="+91 9876543210"
                className="bg-surface"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-text-2 font-semibold">Password / PIN</Label>
              <Input 
                id="password" 
                name="password" 
                type="text"
                placeholder={isEditing ? "Leave blank to keep current" : "Default: 123456"}
                className="bg-surface"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="department" className="text-text-2 font-semibold">Department</Label>
              <Input 
                id="department" 
                name="department" 
                defaultValue={employee?.department || ""}
                placeholder="Production, Sales, etc."
                className="bg-surface"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="designation" className="text-text-2 font-semibold">Role / Designation</Label>
              <Input 
                id="designation" 
                name="designation" 
                defaultValue={employee?.designation || ""}
                placeholder="Machine Operator, Manager"
                className="bg-surface"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="joining_date" className="text-text-2 font-semibold">Joining Date</Label>
              <Input 
                id="joining_date" 
                name="joining_date" 
                type="date"
                defaultValue={employee?.joining_date ? new Date(employee.joining_date).toISOString().split('T')[0] : ""}
                className="bg-surface"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="salary" className="text-text-2 font-semibold">Salary</Label>
              <Input 
                id="salary" 
                name="salary" 
                type="number"
                step="0.01"
                min="0"
                defaultValue={employee?.salary || ""}
                placeholder="0.00"
                className="bg-surface"
              />
            </div>
            
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="address" className="text-text-2 font-semibold">Address</Label>
              <Input 
                id="address" 
                name="address" 
                defaultValue={employee?.address || ""}
                placeholder="Full address"
                className="bg-surface"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status" className="text-text-2 font-semibold">Status</Label>
              <Select name="status" defaultValue={employee?.status || "Active"}>
                <SelectTrigger className="bg-surface">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-border-color">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setOpen(false)}
              className="mr-3 text-text-2"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={loading} 
              className="bg-brand hover:bg-brand-weak text-white px-6 font-bold"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              {isEditing ? "Save Changes" : "Add Employee"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
