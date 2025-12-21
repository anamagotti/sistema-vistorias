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
