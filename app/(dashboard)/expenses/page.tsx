import { getExpenses } from "./actions"
import { ExpenseForm, ExpenseActions } from "@/components/expenses/expense-client"
import { Banknote, TrendingUp, Calendar, AlertCircle } from "lucide-react"

export const dynamic = 'force-dynamic'

export default async function ExpensesPage() {
  const expenses = await getExpenses()

  // Calculate totals
  const totalExpenses = expenses.reduce((sum, exp) => sum + Number(exp.amount), 0)
  
  // Format for IN currency
  const formatCurrency = (val: number) => new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(val)

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      
      {/* Header Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-surface rounded-card p-5 border border-border-color shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-accent-expense/10 flex items-center justify-center text-accent-expense">
            <Banknote className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-semibold text-text-3 uppercase tracking-wider">Total Expenses</p>
            <h3 className="text-2xl font-bold text-text-1">{formatCurrency(totalExpenses)}</h3>
          </div>
        </div>
        <div className="bg-surface rounded-card p-5 border border-border-color shadow-sm flex items-center gap-4 md:col-span-2">
          <div className="w-12 h-12 rounded-full bg-status-info/10 flex items-center justify-center text-status-info">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-semibold text-text-3 uppercase tracking-wider">Finance Overview</p>
            <h3 className="text-text-2 text-sm mt-1">Track factory expenditures, machine transport, unloading, and other operational costs.</h3>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Column: Form */}
        <div className="lg:col-span-1">
          <ExpenseForm />
        </div>

        {/* Right Column: Ledger Table */}
        <div className="lg:col-span-2 bg-surface rounded-card border border-border-color shadow-sm overflow-hidden flex flex-col h-[600px]">
          <div className="p-4 border-b border-border-color bg-canvas flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-text-2" />
              <h2 className="font-semibold text-text-1">Expense Ledger</h2>
            </div>
            <span className="text-xs font-bold bg-white px-2 py-1 rounded-chip border border-border-color text-text-2">
              {expenses.length} Records
            </span>
          </div>
          
          <div className="flex-1 overflow-auto custom-scrollbar">
            {expenses.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-text-3 p-8 text-center gap-3">
                <Banknote className="w-12 h-12 opacity-20" />
                <p>No expenses logged yet. Add your first expense using the form.</p>
              </div>
            ) : (
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-text-2 uppercase bg-canvas sticky top-0 z-10">
                  <tr>
                    <th className="px-4 py-3 font-semibold whitespace-nowrap">Date</th>
                    <th className="px-4 py-3 font-semibold">Remark</th>
                    <th className="px-4 py-3 font-semibold">Paid By</th>
                    <th className="px-4 py-3 font-semibold">Mode</th>
                    <th className="px-4 py-3 font-semibold text-right">Amount</th>
                    <th className="px-4 py-3 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-color">
                  {expenses.map((expense) => {
                    const dateObj = new Date(expense.date)
                    const dateStr = !isNaN(dateObj.getTime()) ? dateObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : expense.date

                    return (
                      <tr key={expense.id} className="hover:bg-canvas transition-colors">
                        <td className="px-4 py-3 whitespace-nowrap font-medium text-text-1">
                          {dateStr}
                        </td>
                        <td className="px-4 py-3 text-text-2 max-w-[200px] truncate" title={expense.remark}>
                          {expense.remark}
                        </td>
                        <td className="px-4 py-3 text-text-2">
                          <span className="inline-flex items-center rounded-md bg-brand/5 px-2 py-1 text-xs font-medium text-brand ring-1 ring-inset ring-brand/10">
                            {expense.paid_by}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-text-2 whitespace-nowrap">
                          {expense.payment_mode}
                        </td>
                        <td className="px-4 py-3 font-bold text-accent-expense text-right whitespace-nowrap">
                          {formatCurrency(Number(expense.amount))}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <ExpenseActions id={expense.id} />
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
