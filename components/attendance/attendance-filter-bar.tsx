"use client"

import { usePathname, useRouter } from "next/navigation"
import { useTransition } from "react"
import { CalendarDays, RotateCcw, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

type EmployeeOption = {
  employee_id: string
  name: string
}

export function AttendanceFilterBar({
  employees,
  selectedDate,
  selectedEmployeeId,
  today,
}: {
  employees: EmployeeOption[]
  selectedDate: string
  selectedEmployeeId: string
  today: string
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [isPending, startTransition] = useTransition()

  const updateFilters = ({
    date = selectedDate,
    employeeId = selectedEmployeeId,
  }: {
    date?: string
    employeeId?: string
  }) => {
    const params = new URLSearchParams()

    if (date && date !== today) {
      params.set("date", date)
    }

    if (employeeId) {
      params.set("employee", employeeId)
    }

    const query = params.toString()
    startTransition(() => {
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false })
    })
  }

  return (
    <div className="rounded-card border border-border-color bg-surface p-4 shadow-sm">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-[minmax(180px,240px)_minmax(220px,320px)_auto] md:items-end">
        <div className="space-y-2">
          <Label htmlFor="attendance-date" className="text-xs font-semibold uppercase tracking-wider text-text-3">
            Date
          </Label>
          <div className="relative">
            <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-3" />
            <Input
              id="attendance-date"
              type="date"
              value={selectedDate}
              onChange={(event) => updateFilters({ date: event.target.value })}
              className="h-10 bg-canvas pl-9 font-semibold text-text-1"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-xs font-semibold uppercase tracking-wider text-text-3">
            Employee
          </Label>
          <Select
            value={selectedEmployeeId || "all"}
            onValueChange={(value) => updateFilters({ employeeId: !value || value === "all" ? "" : value })}
          >
            <SelectTrigger className="h-10 w-full bg-canvas font-semibold text-text-1">
              <div className="flex min-w-0 items-center gap-2">
                <Users className="h-4 w-4 shrink-0 text-text-3" />
                <SelectValue placeholder="All employees" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All employees</SelectItem>
              {employees.map((employee) => (
                <SelectItem key={employee.employee_id} value={employee.employee_id}>
                  {employee.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button
          type="button"
          variant="outline"
          disabled={isPending}
          onClick={() => updateFilters({ date: today, employeeId: "" })}
          className="h-10 gap-2 md:justify-self-end"
        >
          <RotateCcw className="h-4 w-4" />
          Today
        </Button>
      </div>
    </div>
  )
}
