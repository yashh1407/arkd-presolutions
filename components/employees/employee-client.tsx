"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, Plus, Filter, MoreHorizontal, Eye, Edit, Trash2, Users } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { EmployeeFormDialog } from "./employee-form-dialog"
import { deleteEmployee } from "@/app/(dashboard)/employees/actions"

export default function EmployeeClient({ initialEmployees }: { initialEmployees: any[] }) {
  const [employees, setEmployees] = useState(initialEmployees)
  const [searchQuery, setSearchQuery] = useState("")
  const [departmentFilter, setDepartmentFilter] = useState("All")
  const [statusFilter, setStatusFilter] = useState("All")

  const [formOpen, setFormOpen] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState<any>(null)

  // Handlers
  const handleDelete = async (id: number) => {
    if (confirm("Are you sure you want to delete this employee? This action cannot be undone.")) {
      const result = await deleteEmployee(id)
      if (result.success) {
        toast.success("Employee deleted successfully.")
        setEmployees(employees.filter(emp => emp.id !== id))
      } else {
        toast.error(result.error || "Failed to delete employee.")
      }
    }
  }

  const handleEdit = (employee: any) => {
    setEditingEmployee(employee)
    setFormOpen(true)
  }

  const handleAddNew = () => {
    setEditingEmployee(null)
    setFormOpen(true)
  }

  // Filtering Logic
  const filteredEmployees = employees.filter(emp => {
    const matchesSearch = 
      (emp.name?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
      (emp.employee_id?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
      (emp.email?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
      (emp.phone?.toLowerCase() || "").includes(searchQuery.toLowerCase())

    const matchesDept = departmentFilter === "All" || emp.department === departmentFilter
    const matchesStatus = statusFilter === "All" || emp.status === statusFilter

    return matchesSearch && matchesDept && matchesStatus
  })

  // Unique Departments for filter
  const departments = ["All", ...Array.from(new Set(employees.map(e => e.department).filter(Boolean)))]

  return (
    <div className="space-y-6">
      {/* Top Bar: Search, Filters, Add Button */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-wrap gap-4 items-center flex-1 w-full">
          <div className="relative max-w-sm w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-3" />
            <Input 
              placeholder="Search employees..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-surface border-border-color"
            />
          </div>
          
          <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
            <SelectTrigger className="w-[160px] bg-surface border-border-color">
              <SelectValue placeholder="Department" />
            </SelectTrigger>
            <SelectContent>
              {departments.map(dept => (
                <SelectItem key={dept} value={dept}>{dept}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px] bg-surface border-border-color">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Status</SelectItem>
              <SelectItem value="Active">Active</SelectItem>
              <SelectItem value="Inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button onClick={handleAddNew} className="bg-brand hover:bg-brand-weak text-white shrink-0 shadow-sm transition-all h-10 px-5 gap-2 rounded-control">
          <Plus className="w-4 h-4" />
          Add Employee
        </Button>
      </div>

      {/* Employee List / Table */}
      <Card className="bg-surface border-border-color shadow-sm">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-sm text-left border-collapse">
            <thead className="bg-canvas border-b border-border-color">
              <tr>
                <th className="px-6 py-4 text-xs font-semibold uppercase text-text-3 tracking-wider">Employee ID</th>
                <th className="px-6 py-4 text-xs font-semibold uppercase text-text-3 tracking-wider">Name & Contact</th>
                <th className="px-6 py-4 text-xs font-semibold uppercase text-text-3 tracking-wider">Department & Role</th>
                <th className="px-6 py-4 text-xs font-semibold uppercase text-text-3 tracking-wider">Joining Date</th>
                <th className="px-6 py-4 text-xs font-semibold uppercase text-text-3 tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-semibold uppercase text-text-3 tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-color/50">
              {filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16">
                    <div className="flex flex-col items-center justify-center text-center">
                      <div className="w-16 h-16 bg-canvas rounded-full flex items-center justify-center mb-4">
                        <Users className="w-8 h-8 text-text-3" />
                      </div>
                      <p className="text-text-1 font-bold text-lg">No employees found</p>
                      <p className="text-text-3 text-sm mt-1">Adjust your search or add a new employee.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-canvas/40 transition-colors">
                    <td className="px-6 py-4 font-semibold text-text-1">{emp.employee_id}</td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-text-1">{emp.name}</div>
                      <div className="text-xs text-text-3 mt-0.5">{emp.email || "No email"}</div>
                      <div className="text-xs text-text-3">{emp.phone || "No phone"}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-text-2">{emp.department || "-"}</div>
                      <div className="text-xs text-text-3 mt-0.5">{emp.designation || "-"}</div>
                    </td>
                    <td className="px-6 py-4 text-text-2">
                      {emp.joining_date ? new Date(emp.joining_date).toLocaleDateString('en-GB') : "-"}
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={emp.status === "Active" ? "default" : "secondary"} className={emp.status === "Active" ? "bg-status-ok/10 text-status-ok hover:bg-status-ok/20" : ""}>
                        {emp.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-text-3 hover:text-text-1">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                          <DropdownMenuItem onClick={() => handleEdit(emp)} className="cursor-pointer">
                            <Edit className="w-4 h-4 mr-2 text-brand" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDelete(emp.id)} className="cursor-pointer text-status-error focus:text-status-error focus:bg-status-error/10">
                            <Trash2 className="w-4 h-4 mr-2" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <EmployeeFormDialog 
        open={formOpen} 
        setOpen={setFormOpen} 
        employee={editingEmployee}
        // Force a page refresh or soft reload in parent component via router if desired, 
        // but revalidatePath in actions handles the server cache.
        onSuccess={() => window.location.reload()} 
      />
    </div>
  )
}
