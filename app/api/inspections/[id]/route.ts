import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

type Props = {
  params: Promise<{ id: string }>
}

export async function PATCH(request: Request, { params }: Props) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const body = await request.json()

    const { data, error } = await supabase.from("inspections").update(body).eq("id", id).select().single()

    if (error) throw error

    return NextResponse.json({ data })
  } catch (error) {
    console.error("[v0] Error updating inspection:", error)
    return NextResponse.json({ error: "Failed to update inspection" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: Props) {
  try {
    const { id } = await params
    const supabase = await createClient()

    // Primeiro deletar os itens do checklist (se não houver cascade no banco)
    const { error: itemsError } = await supabase.from("checklist_items").delete().eq("inspection_id", id)
    if (itemsError) throw itemsError

    // Depois deletar a vistoria
    const { error } = await supabase.from("inspections").delete().eq("id", id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error deleting inspection:", error)
    return NextResponse.json({ error: "Failed to delete inspection" }, { status: 500 })
  }
}
