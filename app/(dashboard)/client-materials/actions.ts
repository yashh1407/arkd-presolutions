"use server"

import { pool, initDB } from "@/lib/db"
import { revalidatePath } from "next/cache"

function numberField(value: FormDataEntryValue | null) {
  if (value === null || value === "") return 0
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function optionalString(value: FormDataEntryValue | null) {
  if (typeof value !== "string") return null
  const trimmed = value.trim()
  return trimmed && trimmed !== "none" ? trimmed : null
}

export async function getClientMaterialLogs() {
  try {
    await initDB()
    const [rows] = await pool.query(
      `SELECT * FROM client_material_logs ORDER BY material_in_date DESC, id DESC LIMIT 500`
    )
    
    // Format dates to strings safely
    const safeRows = (rows as any[]).map(row => ({
      ...row,
      in_qty_kg: Number(row.in_qty_kg || 0),
      powder_supplied_kg: Number(row.powder_supplied_kg || 0),
      out_qty_kg: Number(row.out_qty_kg || 0),
      neelay_powder_use: Number(row.neelay_powder_use || 0),
      our_powder_use: Number(row.our_powder_use || 0),
      material_in_date: row.material_in_date ? new Date(row.material_in_date).toISOString().split('T')[0] : '',
      material_out_date: row.material_out_date ? new Date(row.material_out_date).toISOString().split('T')[0] : null,
      created_at: row.created_at ? new Date(row.created_at).toLocaleString() : ''
    }))
    
    return { success: true, data: safeRows }
  } catch (error: any) {
    console.error("Error fetching client material logs:", error)
    return { success: false, error: error.message || "Failed to fetch client material logs" }
  }
}

export async function saveClientMaterialLog(formData: FormData) {
  try {
    await initDB()
    const clientName = optionalString(formData.get("clientName")) || "Neelay Industries"
    const materialInDate = formData.get("materialInDate") as string || new Date().toISOString().split('T')[0]
    const inQtyKg = numberField(formData.get("inQtyKg"))
    const referenceName = optionalString(formData.get("referenceName"))
    const inVehicleNo = optionalString(formData.get("inVehicleNo"))
    const powderSuppliedKg = numberField(formData.get("powderSuppliedKg"))
    const powderColour = optionalString(formData.get("powderColour"))
    const remark = optionalString(formData.get("remark"))

    if (!materialInDate) {
      return { success: false, error: "Material Inward Date is required" }
    }
    if (inQtyKg <= 0) {
      return { success: false, error: "Inward Quantity must be greater than 0 kg" }
    }

    await pool.query(
      `INSERT INTO client_material_logs 
       (client_name, material_in_date, in_qty_kg, reference_name, in_vehicle_no, powder_supplied_kg, powder_colour, remark)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [clientName, materialInDate, inQtyKg, referenceName, inVehicleNo, powderSuppliedKg, powderColour, remark]
    )

    revalidatePath("/client-materials")
    return { success: true }
  } catch (error: any) {
    console.error("Error saving client material log:", error)
    return { success: false, error: error.message || "Failed to save client material log" }
  }
}

export async function updateClientMaterialLog(id: number, formData: FormData) {
  try {
    await initDB()
    const clientName = optionalString(formData.get("clientName")) || "Neelay Industries"
    const materialInDate = formData.get("materialInDate") as string
    const inQtyKg = numberField(formData.get("inQtyKg"))
    const referenceName = optionalString(formData.get("referenceName"))
    const inVehicleNo = optionalString(formData.get("inVehicleNo"))
    const powderSuppliedKg = numberField(formData.get("powderSuppliedKg"))
    const powderColour = optionalString(formData.get("powderColour"))
    
    // Outward & Consumption fields
    const materialOutDate = optionalString(formData.get("materialOutDate"))
    const outQtyKg = formData.get("outQtyKg") !== null && formData.get("outQtyKg") !== "" 
      ? numberField(formData.get("outQtyKg")) 
      : 0
    const outVehicleNo = optionalString(formData.get("outVehicleNo"))
    const neelayPowderUse = formData.get("neelayPowderUse") !== null && formData.get("neelayPowderUse") !== ""
      ? numberField(formData.get("neelayPowderUse"))
      : 0
    const ourPowderUse = formData.get("ourPowderUse") !== null && formData.get("ourPowderUse") !== ""
      ? numberField(formData.get("ourPowderUse"))
      : 0
    const remark = optionalString(formData.get("remark"))

    if (!materialInDate) {
      return { success: false, error: "Material Inward Date is required" }
    }
    if (inQtyKg <= 0) {
      return { success: false, error: "Inward Quantity must be greater than 0 kg" }
    }

    await pool.query(
      `UPDATE client_material_logs 
       SET client_name = ?, 
           material_in_date = ?, 
           in_qty_kg = ?, 
           reference_name = ?, 
           in_vehicle_no = ?, 
           powder_supplied_kg = ?, 
           powder_colour = ?, 
           material_out_date = ?, 
           out_qty_kg = ?, 
           out_vehicle_no = ?, 
           neelay_powder_use = ?, 
           our_powder_use = ?, 
           remark = ?
       WHERE id = ?`,
      [
        clientName, 
        materialInDate, 
        inQtyKg, 
        referenceName, 
        inVehicleNo, 
        powderSuppliedKg, 
        powderColour, 
        materialOutDate, 
        outQtyKg, 
        outVehicleNo, 
        neelayPowderUse, 
        ourPowderUse, 
        remark, 
        id
      ]
    )

    revalidatePath("/client-materials")
    return { success: true }
  } catch (error: any) {
    console.error("Error updating client material log:", error)
    return { success: false, error: error.message || "Failed to update client material log" }
  }
}

export async function deleteClientMaterialLog(id: number) {
  try {
    await initDB()
    await pool.query(`DELETE FROM client_material_logs WHERE id = ?`, [id])

    revalidatePath("/client-materials")
    return { success: true }
  } catch (error: any) {
    console.error("Error deleting client material log:", error)
    return { success: false, error: error.message || "Failed to delete client material log" }
  }
}
