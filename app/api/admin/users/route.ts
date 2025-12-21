import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { requireAdmin } from "@/lib/auth-utils"

export async function POST(request: NextRequest) {
  try {
    // Verificar se é admin
    await requireAdmin()

    const body = await request.json()
    const { email, password, role, franchise_id } = body

    if (!email || !password) {
      return NextResponse.json({ error: "Email e senha são obrigatórios" }, { status: 400 })
    }

    // Usar cliente admin para criar usuário (Service Role)
    const supabaseAdmin = createAdminClient()

    // Criar usuário no Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 })
    }

    // Atualizar perfil com role e franchise
    // Usamos o admin client aqui também para garantir permissão de escrita na tabela users/profiles se necessário
    const { error: profileError } = await supabaseAdmin
      .from("users") // ou profiles, dependendo de como está sua tabela
      .update({
        role: role || "user",
        franchise_id: franchise_id || null,
      })
      .eq("id", authData.user.id)

    if (profileError) {
      return NextResponse.json({ error: "Erro ao atualizar perfil do usuário" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      user: authData.user,
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao criar usuário" },
      { status: 403 },
    )
  }
}
