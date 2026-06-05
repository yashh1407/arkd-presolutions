"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { submitProductionLog } from "../../actions"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, ArrowRight, Save, CheckCircle } from "lucide-react"
import Link from "next/link"

export default function NewLogPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [formDataState, setFormDataState] = useState<any>({})

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormDataState({ ...formDataState, [e.target.name]: e.target.value })
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormDataState({ ...formDataState, [name]: value })
  }

  const handleNext = () => setStep(prev => prev + 1)
  const handlePrev = () => setStep(prev => prev - 1)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    // Quick validation before submitting
    if (step < 4) {
      handleNext()
      return
    }

    setLoading(true)
    const formData = new FormData()
    Object.keys(formDataState).forEach(key => {
      formData.append(key, formDataState[key])
    })

    const result = await submitProductionLog(formData)
    setLoading(false)

    if (result.success) {
      toast.success("Work log submitted successfully!")
      router.push("/pwa/logs")
    } else {
      toast.error(result.error || "Failed to submit log.")
    }
  }

  return (
    <div className="max-w-md mx-auto pb-20">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link href="/pwa" className="p-2 bg-white rounded-full shadow-sm">
            <ArrowLeft className="w-5 h-5 text-slate-700" />
          </Link>
          <h1 className="text-xl font-bold text-slate-800">Add Log</h1>
        </div>
        <div className="text-xs font-bold text-brand bg-brand/10 px-3 py-1 rounded-full">
          Step {step} of 4
        </div>
      </div>

      <div className="w-full bg-slate-200 h-2 rounded-full mb-6 overflow-hidden">
        <div className="bg-brand h-full transition-all" style={{ width: \`\${(step / 4) * 100}%\` }}></div>
      </div>

      <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200">
        <form onSubmit={handleSubmit} className="space-y-5">
          
          {/* STEP 1: Basic Log Details */}
          {step === 1 && (
            <div className="space-y-4 animate-in slide-in-from-right-4">
              <h2 className="text-lg font-bold text-slate-800 border-b pb-2 mb-4">Basic Log Details</h2>
              
              <div className="space-y-2">
                <Label>Job Card / Work Order No *</Label>
                <Input name="job_card_number" required value={formDataState.job_card_number || ''} onChange={handleChange} className="bg-slate-50" />
              </div>

              <div className="space-y-2">
                <Label>Client / Project Name</Label>
                <Input name="project_name" value={formDataState.project_name || ''} onChange={handleChange} className="bg-slate-50" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Material Name</Label>
                  <Input name="material_name" value={formDataState.material_name || ''} onChange={handleChange} className="bg-slate-50" />
                </div>
                <div className="space-y-2">
                  <Label>Thickness</Label>
                  <Input name="material_thickness" value={formDataState.material_thickness || ''} onChange={handleChange} className="bg-slate-50" />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Supervisor Name</Label>
                <Input name="supervisor_name" value={formDataState.supervisor_name || ''} onChange={handleChange} className="bg-slate-50" />
              </div>
            </div>
          )}

          {/* STEP 2: Cutting Machine Log */}
          {step === 2 && (
            <div className="space-y-4 animate-in slide-in-from-right-4">
              <h2 className="text-lg font-bold text-slate-800 border-b pb-2 mb-4">Cutting Machine Log</h2>
              
              <div className="space-y-2">
                <Label>Cutting Machine Used</Label>
                <Input name="cutting_machine" value={formDataState.cutting_machine || ''} onChange={handleChange} className="bg-slate-50" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Start Time</Label>
                  <Input type="datetime-local" name="cutting_start_time" value={formDataState.cutting_start_time || ''} onChange={handleChange} className="bg-slate-50" />
                </div>
                <div className="space-y-2">
                  <Label>End Time</Label>
                  <Input type="datetime-local" name="cutting_end_time" value={formDataState.cutting_end_time || ''} onChange={handleChange} className="bg-slate-50" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Qty Completed</Label>
                  <Input type="number" min="0" name="cutting_quantity" value={formDataState.cutting_quantity || ''} onChange={handleChange} className="bg-slate-50" />
                </div>
                <div className="space-y-2">
                  <Label>Rejected Qty</Label>
                  <Input type="number" min="0" name="cutting_rejected_quantity" value={formDataState.cutting_rejected_quantity || ''} onChange={handleChange} className="bg-slate-50" />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Machine Issue?</Label>
                <Select value={formDataState.cutting_machine_issue || 'No'} onValueChange={(v) => handleSelectChange('cutting_machine_issue', v)}>
                  <SelectTrigger className="bg-slate-50">
                    <SelectValue placeholder="No" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="No">No Issue</SelectItem>
                    <SelectItem value="Yes">Yes, there was an issue</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formDataState.cutting_machine_issue === 'Yes' && (
                <div className="space-y-2">
                  <Label>Issue Description</Label>
                  <Textarea name="cutting_issue_description" value={formDataState.cutting_issue_description || ''} onChange={handleChange} className="bg-slate-50" />
                </div>
              )}
            </div>
          )}

          {/* STEP 3: Punching Machine Log */}
          {step === 3 && (
            <div className="space-y-4 animate-in slide-in-from-right-4">
              <h2 className="text-lg font-bold text-slate-800 border-b pb-2 mb-4">Punching Machine Log</h2>
              
              <div className="space-y-2">
                <Label>Punching Machine Used</Label>
                <Input name="punching_machine" value={formDataState.punching_machine || ''} onChange={handleChange} className="bg-slate-50" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Start Time</Label>
                  <Input type="datetime-local" name="punching_start_time" value={formDataState.punching_start_time || ''} onChange={handleChange} className="bg-slate-50" />
                </div>
                <div className="space-y-2">
                  <Label>End Time</Label>
                  <Input type="datetime-local" name="punching_end_time" value={formDataState.punching_end_time || ''} onChange={handleChange} className="bg-slate-50" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Qty Completed</Label>
                  <Input type="number" min="0" name="punching_quantity" value={formDataState.punching_quantity || ''} onChange={handleChange} className="bg-slate-50" />
                </div>
                <div className="space-y-2">
                  <Label>Rejected Qty</Label>
                  <Input type="number" min="0" name="punching_rejected_quantity" value={formDataState.punching_rejected_quantity || ''} onChange={handleChange} className="bg-slate-50" />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Machine Issue?</Label>
                <Select value={formDataState.punching_machine_issue || 'No'} onValueChange={(v) => handleSelectChange('punching_machine_issue', v)}>
                  <SelectTrigger className="bg-slate-50">
                    <SelectValue placeholder="No" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="No">No Issue</SelectItem>
                    <SelectItem value="Yes">Yes, there was an issue</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formDataState.punching_machine_issue === 'Yes' && (
                <div className="space-y-2">
                  <Label>Issue Description</Label>
                  <Textarea name="punching_issue_description" value={formDataState.punching_issue_description || ''} onChange={handleChange} className="bg-slate-50" />
                </div>
              )}
            </div>
          )}

          {/* STEP 4: Final Summary */}
          {step === 4 && (
            <div className="space-y-4 animate-in slide-in-from-right-4">
              <h2 className="text-lg font-bold text-slate-800 border-b pb-2 mb-4">Final Summary</h2>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Total Planned Qty</Label>
                  <Input type="number" min="0" name="total_planned_quantity" value={formDataState.total_planned_quantity || ''} onChange={handleChange} className="bg-slate-50" />
                </div>
                <div className="space-y-2">
                  <Label>Total Completed</Label>
                  <Input type="number" min="0" name="total_completed_quantity" required value={formDataState.total_completed_quantity || ''} onChange={handleChange} className="bg-slate-50" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Total Good Qty</Label>
                  <Input type="number" min="0" name="total_good_quantity" value={formDataState.total_good_quantity || ''} onChange={handleChange} className="bg-slate-50" />
                </div>
                <div className="space-y-2">
                  <Label>Pending Qty</Label>
                  <Input type="number" min="0" name="pending_quantity" value={formDataState.pending_quantity || ''} onChange={handleChange} className="bg-slate-50" />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Work Status *</Label>
                <Select required value={formDataState.work_status || 'Pending'} onValueChange={(v) => handleSelectChange('work_status', v)}>
                  <SelectTrigger className="bg-slate-50">
                    <SelectValue placeholder="Select Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Completed">Completed</SelectItem>
                    <SelectItem value="Partially Completed">Partially Completed</SelectItem>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="Machine Issue">Machine Issue</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Final Remarks</Label>
                <Textarea name="final_remarks" value={formDataState.final_remarks || ''} onChange={handleChange} className="bg-slate-50" />
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex items-center gap-3 pt-4 mt-6 border-t border-slate-100">
            {step > 1 && (
              <Button type="button" variant="outline" onClick={handlePrev} className="flex-1 h-12">
                <ArrowLeft className="w-4 h-4 mr-2" /> Back
              </Button>
            )}
            
            {step < 4 ? (
              <Button type="submit" className="flex-1 h-12 bg-brand hover:bg-brand-weak text-white">
                Next <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button type="submit" disabled={loading} className="flex-1 h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-bold">
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5 mr-2" /> Submit Log
                  </>
                )}
              </Button>
            )}
          </div>

        </form>
      </div>
    </div>
  )
}
