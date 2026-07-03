import { getEmployees } from "./actions"
import EmployeeClient from "@/components/employees/employee-client"

export default async function EmployeesPage() {
  const result = await getEmployees()
  const initialEmployees = result.success ? (result.data || []) : []

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-text-1 sm:hidden">Employees</h1>
        <p className="text-sm text-text-3">Manage all employee records from one place</p>
      </div>
      
      <EmployeeClient initialEmployees={initialEmployees} />
    </div>
  )
}
