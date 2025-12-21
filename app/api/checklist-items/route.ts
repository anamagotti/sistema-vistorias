import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { items } = await request.json()

    const { data, error } = await supabase.from("checklist_items").insert(items).select()

    if (error) throw error

    return NextResponse.json({ data })
  } catch (error) {
    console.error("[v0] Error creating checklist items:", error)
    return NextResponse.json({ error: "Failed to create checklist items" }, { status: 500 })
  }
}
