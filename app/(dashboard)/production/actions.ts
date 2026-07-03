"use server"

import { pool, initDB } from "@/lib/db"
import { revalidatePath } from "next/cache"

function optionalString(value: FormDataEntryValue | null) {
  if (typeof value !== "string") return null
  const trimmed = value.trim()
  return trimmed && trimmed !== "none" ? trimmed : null
}

function numberField(value: FormDataEntryValue | null) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function calculatePunchingQty(details: Record<string, number> | null | undefined) {
  if (!details || Object.keys(details).length === 0) return 0
  const gradeMins: Record<string, number> = {}
  Object.entries(details).forEach(([key, qty]) => {
    if (!key.startsWith("tool_")) return
    const parts = key.split("_")
    const grade = parts[1] || "unknown"
    const val = Number(qty || 0)
    if (gradeMins[grade] === undefined || val < gradeMins[grade]) {
      gradeMins[grade] = val
    }
  })
  return Object.values(gradeMins).reduce((sum, min) => sum + min, 0)
}

function collectPunchingDetails(formData: FormData) {
  const details: Record<string, number> = {}
  const scrapDetails: Record<string, number> = {}
  let totalScrap = 0

  Array.from(formData.entries()).forEach(([key, value]) => {
    if (key.startsWith("tool_")) {
      const qty = numberField(value)
      if (qty > 0) {
        details[key] = qty
      }
    } else if (key.startsWith("scrap_")) {
      const scrap = numberField(value)
      if (scrap > 0) {
        scrapDetails[key] = scrap
        totalScrap += scrap
      }
    }
  })

  const total = calculatePunchingQty(details)

  return {
    details,
    scrapDetails,
    total,
    totalScrap,
    json: Object.keys(details).length > 0 ? JSON.stringify(details) : null,
    scrapJson: Object.keys(scrapDetails).length > 0 ? JSON.stringify(scrapDetails) : null,
  }
}

function parsePunchingDetails(value: unknown) {
  if (!value) return null
  if (typeof value === "object") return value as Record<string, number>

  if (typeof value === "string") {
    try {
      return JSON.parse(value) as Record<string, number>
    } catch {
      return null
    }
  }

  return null
}

function sumPunchingDetails(details: Record<string, number> | null) {
  if (!details) return 0
  return Object.values(details).reduce((sum, qty) => sum + Number(qty || 0), 0)
}

async function getEmployeeName(employeeId: string | null) {
  if (!employeeId) return null

  const [rows] = await pool.query(
    `SELECT name FROM employees WHERE employee_id = ? LIMIT 1`,
    [employeeId]
  ) as any[]

  return rows[0]?.name || null
}

export async function updateProductionEntryNumbers(id: number, formData: FormData) {
  try {
    await initDB()

    const [rows] = await pool.query(
      `SELECT cutting_outer_qty, cutting_middle_qty, cutting_inner_qty, punching_qty, punching_details, punching_scrap_kg, cutting_outer_scrap_qty, cutting_middle_scrap_qty, cutting_inner_scrap_qty, punching_rejected_details
       FROM production_entries
       WHERE id = ?
       LIMIT 1`,
      [id]
    ) as any[]

    const current = rows[0]
    if (!current) {
      return { success: false, error: "Work log not found" }
    }

    const cuttingOuterQty = formData.has("cuttingOuterQty")
      ? numberField(formData.get("cuttingOuterQty"))
      : Number(current.cutting_outer_qty || 0)
    const cuttingMiddleQty = formData.has("cuttingMiddleQty")
      ? numberField(formData.get("cuttingMiddleQty"))
      : Number(current.cutting_middle_qty || 0)
    const cuttingInnerQty = formData.has("cuttingInnerQty")
      ? numberField(formData.get("cuttingInnerQty"))
      : Number(current.cutting_inner_qty || 0)
    const rawProductionQty = cuttingOuterQty + cuttingMiddleQty + cuttingInnerQty

    const cuttingOuterScrapQty = formData.has("cuttingOuterScrapQty")
      ? numberField(formData.get("cuttingOuterScrapQty"))
      : Number(current.cutting_outer_scrap_qty || 0)
    const cuttingMiddleScrapQty = formData.has("cuttingMiddleScrapQty")
      ? numberField(formData.get("cuttingMiddleScrapQty"))
      : Number(current.cutting_middle_scrap_qty || 0)
    const cuttingInnerScrapQty = formData.has("cuttingInnerScrapQty")
      ? numberField(formData.get("cuttingInnerScrapQty"))
      : Number(current.cutting_inner_scrap_qty || 0)

    const existingDetails = parsePunchingDetails(current.punching_details) || {}
    const updatedDetails = { ...existingDetails }

    const existingScrapDetails = parsePunchingDetails(current.punching_rejected_details) || {}
    const updatedScrapDetails = { ...existingScrapDetails }

    const suffixes = Array.from(new Set([
      ...Object.keys(existingDetails).map(k => k.replace(/^tool_/, "")),
      ...Object.keys(existingScrapDetails).map(k => k.replace(/^scrap_/, ""))
    ]))

    suffixes.forEach((suffix) => {
      const toolKey = `tool_${suffix}`
      const scrapKey = `scrap_${suffix}`
      
      if (formData.has(toolKey)) {
        updatedDetails[toolKey] = numberField(formData.get(toolKey))
      }
      if (formData.has(scrapKey)) {
        updatedScrapDetails[scrapKey] = numberField(formData.get(scrapKey))
      }
    })

    const positiveDetails = Object.fromEntries(
      Object.entries(updatedDetails).filter(([, qty]) => Number(qty || 0) > 0)
    ) as Record<string, number>

    const positiveScrapDetails = Object.fromEntries(
      Object.entries(updatedScrapDetails).filter(([, qty]) => Number(qty || 0) > 0)
    ) as Record<string, number>

    const punchingQty = Object.keys(existingDetails).length > 0 || Object.keys(existingScrapDetails).length > 0
      ? calculatePunchingQty(positiveDetails)
      : formData.has("punchingQty")
        ? numberField(formData.get("punchingQty"))
        : Number(current.punching_qty || 0)

    const punchingScrapKg = formData.has("punchingScrapKg")
      ? numberField(formData.get("punchingScrapKg"))
      : Number(current.punching_scrap_kg || 0)

    const totalCuttingScrap = cuttingOuterScrapQty + cuttingMiddleScrapQty + cuttingInnerScrapQty
    const productionQty = rawProductionQty + totalCuttingScrap
    const totalRejectedQty = totalCuttingScrap + sumPunchingDetails(positiveScrapDetails)
    const finalQty = rawProductionQty > 0 ? rawProductionQty - sumPunchingDetails(positiveScrapDetails) : punchingQty

    await pool.query(
      `UPDATE production_entries
       SET production_qty = ?, cutting_outer_qty = ?, cutting_middle_qty = ?, cutting_inner_qty = ?, punching_qty = ?, final_qty = ?, punching_details = ?, punching_scrap_kg = ?, cutting_outer_scrap_qty = ?, cutting_middle_scrap_qty = ?, cutting_inner_scrap_qty = ?, punching_rejected_details = ?, rejected_qty = ?
       WHERE id = ?`,
      [
        productionQty,
        cuttingOuterQty,
        cuttingMiddleQty,
        cuttingInnerQty,
        punchingQty,
        finalQty,
        Object.keys(positiveDetails).length > 0 ? JSON.stringify(positiveDetails) : null,
        punchingScrapKg,
        cuttingOuterScrapQty,
        cuttingMiddleScrapQty,
        cuttingInnerScrapQty,
        Object.keys(positiveScrapDetails).length > 0 ? JSON.stringify(positiveScrapDetails) : null,
        totalRejectedQty,
        id,
      ]
    )

    revalidatePath("/production")
    revalidatePath("/employee-logs")
    revalidatePath("/dashboard")
    return { success: true }
  } catch (error: any) {
    console.error("Error updating production quantities:", error)
    return { success: false, error: error.message || "Failed to update work log quantities" }
  }
}

export async function saveProductionEntry(formData: FormData) {
  try {
    await initDB()
    const date = formData.get("date") as string
    const material = formData.get("material") as string || "Assorted Grades"
    
    // Cutting Stage inputs
    const cuttingMachine = optionalString(formData.get("cuttingMachine"))
    
    const cuttingOuterGrade = optionalString(formData.get("cuttingOuterGrade"))
    const cuttingOuterQty = numberField(formData.get("cuttingOuterQty"))
    const cuttingOuterScrap = numberField(formData.get("cuttingOuterScrap"))
    const cuttingOuterEmployeeId = optionalString(formData.get("cuttingOuterEmployeeId"))

    const cuttingMiddleGrade = optionalString(formData.get("cuttingMiddleGrade"))
    const cuttingMiddleQty = numberField(formData.get("cuttingMiddleQty"))
    const cuttingMiddleScrap = numberField(formData.get("cuttingMiddleScrap"))
    const cuttingMiddleEmployeeId = optionalString(formData.get("cuttingMiddleEmployeeId"))

    const cuttingInnerGrade = optionalString(formData.get("cuttingInnerGrade"))
    const cuttingInnerQty = numberField(formData.get("cuttingInnerQty"))
    const cuttingInnerScrap = numberField(formData.get("cuttingInnerScrap"))
    const cuttingInnerEmployeeId = optionalString(formData.get("cuttingInnerEmployeeId"))

    // Punching Stage inputs
    const trolleyType = optionalString(formData.get("trolleyType"))
    const punchingScrapKg = numberField(formData.get("punchingScrapKg"))
    const scrapEmployeeId = optionalString(formData.get("scrapEmployeeId"))

    // Validate Cutting inputs
    if ((cuttingOuterQty > 0 || cuttingOuterScrap > 0) && !cuttingOuterEmployeeId) {
      return { success: false, error: `Please select a worker for Cutting Outer Grade (${cuttingOuterGrade || "Outer"}).` }
    }
    if ((cuttingMiddleQty > 0 || cuttingMiddleScrap > 0) && !cuttingMiddleEmployeeId) {
      return { success: false, error: `Please select a worker for Cutting Middle Grade (${cuttingMiddleGrade || "Middle"}).` }
    }
    if ((cuttingInnerQty > 0 || cuttingInnerScrap > 0) && !cuttingInnerEmployeeId) {
      return { success: false, error: `Please select a worker for Cutting Inner Grade (${cuttingInnerGrade || "Inner"}).` }
    }

    // Validate Scrap
    if (punchingScrapKg > 0 && !scrapEmployeeId) {
      return { success: false, error: "Please select a worker for Punching Scrap." }
    }

    // Group punching tools by employee ID
    const punchingGroups: Record<string, { details: Record<string, number>; scrapDetails: Record<string, number>; total: number; totalScrap: number }> = {}

    for (const [key, value] of formData.entries()) {
      if (!key.startsWith("tool_") && !key.startsWith("scrap_")) continue

      const qty = numberField(value)
      if (qty <= 0) continue

      let suffix = ""
      let isScrap = false
      
      if (key.startsWith("tool_")) {
        suffix = key.replace("tool_", "")
      } else if (key.startsWith("scrap_")) {
        suffix = key.replace("scrap_", "")
        isScrap = true
      }

      const empKey = `emp_${suffix}`
      const empId = optionalString(formData.get(empKey))
      if (!empId) {
        const parts = suffix.split("_")
        const toolName = parts.slice(1).join(" ")
        return { success: false, error: `Please select a worker for the punching tool: ${toolName}.` }
      }

      if (!punchingGroups[empId]) {
        punchingGroups[empId] = { details: {}, scrapDetails: {}, total: 0, totalScrap: 0 }
      }
      
      if (isScrap) {
        punchingGroups[empId].scrapDetails[`scrap_${suffix}`] = qty
        punchingGroups[empId].totalScrap += qty
      } else {
        punchingGroups[empId].details[`tool_${suffix}`] = qty
      }
    }

    Object.values(punchingGroups).forEach((group) => {
      group.total = calculatePunchingQty(group.details)
    })

    const hasCuttingData = !!(cuttingOuterQty > 0 || cuttingMiddleQty > 0 || cuttingInnerQty > 0 || cuttingOuterScrap > 0 || cuttingMiddleScrap > 0 || cuttingInnerScrap > 0)
    const hasPunchingData = !!(Object.keys(punchingGroups).length > 0 || punchingScrapKg > 0)

    if (!hasCuttingData && !hasPunchingData) {
      return { success: false, error: "Please fill in details for at least one stage (Cutting or Punching)." }
    }

    let lastInsertId = null
    let insertCount = 0

    // 1. Insert Outer Grade cutting row
    if ((cuttingOuterQty > 0 || cuttingOuterScrap > 0) && cuttingOuterEmployeeId) {
      const cuttingOperatorName = await getEmployeeName(cuttingOuterEmployeeId)
      const [result] = await pool.query(
        `INSERT INTO production_entries 
         (date, material_name, production_qty, target_qty, grinding_qty, machine1_qty, machine2_qty, cutting_machine, punching_machine, punching_qty, rejected_qty, final_qty, grinding_machine, operator_name, employee_id, cutting_outer_grade, cutting_outer_qty, cutting_middle_grade, cutting_middle_qty, cutting_inner_grade, cutting_inner_qty, trolley_type, punching_details, punching_scrap_kg, cutting_outer_scrap_qty, cutting_middle_scrap_qty, cutting_inner_scrap_qty, punching_rejected_details) 
         VALUES (?, ?, ?, 0, 0, 0, 0, ?, NULL, 0, ?, ?, NULL, ?, ?, ?, ?, NULL, 0, NULL, 0, NULL, NULL, 0, ?, 0, 0, NULL)`,
        [
          date, 
          material, 
          cuttingOuterQty + cuttingOuterScrap, // production_qty (gross: Qty + Scrap)
          cuttingMachine, 
          cuttingOuterScrap, // rejected_qty
          cuttingOuterQty, // final_qty (net cutting output: Qty)
          cuttingOperatorName, 
          cuttingOuterEmployeeId, 
          cuttingOuterGrade, 
          cuttingOuterQty,
          cuttingOuterScrap
        ]
      )
      lastInsertId = (result as any).insertId
      insertCount++
    }

    // 2. Insert Middle Grade cutting row
    if ((cuttingMiddleQty > 0 || cuttingMiddleScrap > 0) && cuttingMiddleEmployeeId) {
      const cuttingOperatorName = await getEmployeeName(cuttingMiddleEmployeeId)
      const [result] = await pool.query(
        `INSERT INTO production_entries 
         (date, material_name, production_qty, target_qty, grinding_qty, machine1_qty, machine2_qty, cutting_machine, punching_machine, punching_qty, rejected_qty, final_qty, grinding_machine, operator_name, employee_id, cutting_outer_grade, cutting_outer_qty, cutting_middle_grade, cutting_middle_qty, cutting_inner_grade, cutting_inner_qty, trolley_type, punching_details, punching_scrap_kg, cutting_outer_scrap_qty, cutting_middle_scrap_qty, cutting_inner_scrap_qty, punching_rejected_details) 
         VALUES (?, ?, ?, 0, 0, 0, 0, ?, NULL, 0, ?, ?, NULL, ?, ?, NULL, 0, ?, ?, NULL, 0, NULL, NULL, 0, 0, ?, 0, NULL)`,
        [
          date, 
          material, 
          cuttingMiddleQty + cuttingMiddleScrap, // production_qty (gross: Qty + Scrap)
          cuttingMachine, 
          cuttingMiddleScrap, // rejected_qty
          cuttingMiddleQty, // final_qty (net cutting output: Qty)
          cuttingOperatorName, 
          cuttingMiddleEmployeeId, 
          cuttingMiddleGrade, 
          cuttingMiddleQty,
          cuttingMiddleScrap
        ]
      )
      lastInsertId = (result as any).insertId
      insertCount++
    }

    // 3. Insert Inner Grade cutting row
    if ((cuttingInnerQty > 0 || cuttingInnerScrap > 0) && cuttingInnerEmployeeId) {
      const cuttingOperatorName = await getEmployeeName(cuttingInnerEmployeeId)
      const [result] = await pool.query(
        `INSERT INTO production_entries 
         (date, material_name, production_qty, target_qty, grinding_qty, machine1_qty, machine2_qty, cutting_machine, punching_machine, punching_qty, rejected_qty, final_qty, grinding_machine, operator_name, employee_id, cutting_outer_grade, cutting_outer_qty, cutting_middle_grade, cutting_middle_qty, cutting_inner_grade, cutting_inner_qty, trolley_type, punching_details, punching_scrap_kg, cutting_outer_scrap_qty, cutting_middle_scrap_qty, cutting_inner_scrap_qty, punching_rejected_details) 
         VALUES (?, ?, ?, 0, 0, 0, 0, ?, NULL, 0, ?, ?, NULL, ?, ?, NULL, 0, NULL, 0, ?, ?, NULL, NULL, 0, 0, 0, ?, NULL)`,
        [
          date, 
          material, 
          cuttingInnerQty + cuttingInnerScrap, // production_qty (gross: Qty + Scrap)
          cuttingMachine, 
          cuttingInnerScrap, // rejected_qty
          cuttingInnerQty, // final_qty (net cutting output: Qty)
          cuttingOperatorName, 
          cuttingInnerEmployeeId, 
          cuttingInnerGrade, 
          cuttingInnerQty,
          cuttingInnerScrap
        ]
      )
      lastInsertId = (result as any).insertId
      insertCount++
    }

    // 4. Insert grouped Punching tool rows
    for (const [empId, group] of Object.entries(punchingGroups)) {
      const punchingOperatorName = await getEmployeeName(empId)
      const [result] = await pool.query(
        `INSERT INTO production_entries 
         (date, material_name, production_qty, target_qty, grinding_qty, machine1_qty, machine2_qty, cutting_machine, punching_machine, punching_qty, rejected_qty, final_qty, grinding_machine, operator_name, employee_id, cutting_outer_grade, cutting_outer_qty, cutting_middle_grade, cutting_middle_qty, cutting_inner_grade, cutting_inner_qty, trolley_type, punching_details, punching_scrap_kg, cutting_outer_scrap_qty, cutting_middle_scrap_qty, cutting_inner_scrap_qty, punching_rejected_details) 
         VALUES (?, ?, 0, 0, 0, 0, 0, NULL, ?, ?, ?, ?, NULL, ?, ?, NULL, 0, NULL, 0, NULL, 0, ?, ?, 0, 0, 0, 0, ?)`,
        [
          date, 
          material, 
          null, // punching_machine
          group.total, // punching_qty
          group.totalScrap, // rejected_qty
          group.total, // final_qty (minimum of tools good qty represents net output)
          punchingOperatorName, 
          empId, 
          trolleyType, 
          Object.keys(group.details).length > 0 ? JSON.stringify(group.details) : null,
          Object.keys(group.scrapDetails).length > 0 ? JSON.stringify(group.scrapDetails) : null
        ]
      )
      lastInsertId = (result as any).insertId
      insertCount++
    }

    // 5. Insert Punching Scrap row
    if (punchingScrapKg > 0 && scrapEmployeeId) {
      const scrapOperatorName = await getEmployeeName(scrapEmployeeId)
      const [result] = await pool.query(
        `INSERT INTO production_entries 
         (date, material_name, production_qty, target_qty, grinding_qty, machine1_qty, machine2_qty, cutting_machine, punching_machine, punching_qty, rejected_qty, final_qty, grinding_machine, operator_name, employee_id, cutting_outer_grade, cutting_outer_qty, cutting_middle_grade, cutting_middle_qty, cutting_inner_grade, cutting_inner_qty, trolley_type, punching_details, punching_scrap_kg) 
         VALUES (?, ?, 0, 0, 0, 0, 0, NULL, NULL, 0, 0, 0, NULL, ?, ?, NULL, 0, NULL, 0, NULL, 0, ?, NULL, ?)`,
        [
          date, 
          material, 
          scrapOperatorName, 
          scrapEmployeeId, 
          trolleyType, 
          punchingScrapKg
        ]
      )
      lastInsertId = (result as any).insertId
      insertCount++
    }

    revalidatePath("/production")
    revalidatePath("/employee-logs")
    revalidatePath("/dashboard")
    return { success: true, insertId: lastInsertId }
    
  } catch (error: any) {
    console.error("Error saving production entry:", error)
    return { success: false, error: error.message || "Failed to save production entry" }
  }
}

export async function updateProductionEntry(id: number, formData: FormData) {
  try {
    await initDB()
    const date = formData.get("date") as string
    const material = formData.get("material") as string || "Assorted Grades"
    const targetQty = numberField(formData.get("targetQty"))
    const grindingQty = numberField(formData.get("grindingQty"))
    
    // Machine outputs
    const machine1 = numberField(formData.get("machine1"))
    const machine2 = numberField(formData.get("machine2"))

    // New fields for restructured process
    const cuttingMachine = optionalString(formData.get("cuttingMachine"))
    
    // Trolleys
    const cuttingOuterGrade = optionalString(formData.get("cuttingOuterGrade"))
    const cuttingOuterQty = numberField(formData.get("cuttingOuterQty"))
    const cuttingOuterScrapQty = numberField(formData.get("cuttingOuterScrapQty"))
    
    const cuttingMiddleGrade = optionalString(formData.get("cuttingMiddleGrade"))
    const cuttingMiddleQty = numberField(formData.get("cuttingMiddleQty"))
    const cuttingMiddleScrapQty = numberField(formData.get("cuttingMiddleScrapQty"))
    
    const cuttingInnerGrade = optionalString(formData.get("cuttingInnerGrade"))
    const cuttingInnerQty = numberField(formData.get("cuttingInnerQty"))
    const cuttingInnerScrapQty = numberField(formData.get("cuttingInnerScrapQty"))
    const cuttingTotal = cuttingOuterQty + cuttingMiddleQty + cuttingInnerQty
    const rawProductionQty = numberField(formData.get("productionQty")) || cuttingTotal
    const totalCuttingScrap = cuttingOuterScrapQty + cuttingMiddleScrapQty + cuttingInnerScrapQty
    const productionQty = rawProductionQty + totalCuttingScrap

    const punchingMachine = optionalString(formData.get("punchingMachine"))
    const punchingDetails = collectPunchingDetails(formData)
    const punchingQty = numberField(formData.get("punchingQty")) || punchingDetails.total
    const rejectedQty = numberField(formData.get("rejectedQty")) || (totalCuttingScrap + punchingDetails.totalScrap)
    const finalQty = numberField(formData.get("finalQty")) || (cuttingTotal > 0 ? cuttingTotal - punchingDetails.totalScrap : punchingQty)
    const grindingMachine = optionalString(formData.get("grindingMachine"))
    
    const employeeId = optionalString(formData.get("employeeId"))
    const operatorName = optionalString(formData.get("operatorName")) || await getEmployeeName(employeeId)
    const trolleyType = optionalString(formData.get("trolleyType"))
    const punchingScrapKg = numberField(formData.get("punchingScrapKg"))

    await pool.query(
      `UPDATE production_entries 
       SET date = ?, material_name = ?, production_qty = ?, target_qty = ?, grinding_qty = ?, machine1_qty = ?, machine2_qty = ?, cutting_machine = ?, punching_machine = ?, punching_qty = ?, rejected_qty = ?, final_qty = ?, grinding_machine = ?, operator_name = COALESCE(?, operator_name), employee_id = COALESCE(?, employee_id), cutting_outer_grade = ?, cutting_outer_qty = ?, cutting_middle_grade = ?, cutting_middle_qty = ?, cutting_inner_grade = ?, cutting_inner_qty = ?, trolley_type = ?, punching_details = ?, punching_scrap_kg = ?, cutting_outer_scrap_qty = ?, cutting_middle_scrap_qty = ?, cutting_inner_scrap_qty = ?, punching_rejected_details = ?
       WHERE id = ?`,
      [date, material, productionQty, targetQty, grindingQty, machine1, machine2, cuttingMachine, punchingMachine, punchingQty, rejectedQty, finalQty, grindingMachine, operatorName, employeeId, cuttingOuterGrade, cuttingOuterQty, cuttingMiddleGrade, cuttingMiddleQty, cuttingInnerGrade, cuttingInnerQty, trolleyType, punchingDetails.json, punchingScrapKg, cuttingOuterScrapQty, cuttingMiddleScrapQty, cuttingInnerScrapQty, punchingDetails.scrapJson, id]
    )

    revalidatePath("/production")
    revalidatePath("/employee-logs")
    revalidatePath("/dashboard")
    return { success: true }
  } catch (error: any) {
    console.error("Error updating production entry:", error)
    return { success: false, error: error.message || "Failed to update production entry" }
  }
}

export async function deleteProductionEntry(id: number) {
  try {
    await initDB()
    await pool.query(`DELETE FROM production_entries WHERE id = ?`, [id])
    
    revalidatePath("/production")
    revalidatePath("/employee-logs")
    revalidatePath("/dashboard")
    return { success: true }
  } catch (error: any) {
    console.error("Error deleting production entry:", error)
    return { success: false, error: error.message || "Failed to delete production entry" }
  }
}

export async function getProductionEntries() {
  try {
    await initDB()
    const [rows] = await pool.query(`
      SELECT p.*, COALESCE(e.name, p.operator_name) as employee_name
      FROM production_entries p
      LEFT JOIN employees e ON p.employee_id = e.employee_id
      ORDER BY p.id DESC
      LIMIT 50
    `)
    // Convert Dates to strings to pass back to client
    const safeRows = (rows as any[]).map(row => ({
      ...row,
      employee_name: row.employee_name || row.operator_name || '',
      punching_details: parsePunchingDetails(row.punching_details),
      punching_rejected_details: parsePunchingDetails(row.punching_rejected_details),
      date: row.date ? new Date(row.date).toLocaleDateString() : '',
      created_at: row.created_at ? new Date(row.created_at).toLocaleString() : ''
    }))
    return { success: true, data: safeRows }
  } catch (error: any) {
    console.error("Error fetching production entries:", error)
    return { success: false, error: error.message || "Failed to fetch entries" }
  }
}
