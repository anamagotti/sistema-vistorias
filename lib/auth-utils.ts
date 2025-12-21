import { createServerClient } from "@/lib/supabase/server"

export async function getCurrentUser() {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data: profile } = await supabase.from("users").select("*").eq("id", user.id).single()

  // Forçar admin para o email específico (Hardcoded fix)
  const isHardcodedAdmin = user.email === "analuisamagotti@gmail.com"

  return {
    ...user,
    role: isHardcodedAdmin ? "admin" : (profile?.role || "user"),
    franchise_id: profile?.franchise_id,
  }
}

export async function isAdmin() {
  const user = await getCurrentUser()
  return user?.role === "admin"
}

export async function requireAdmin() {
  const admin = await isAdmin()
  if (!admin) {
    throw new Error("Acesso negado. Apenas administradores podem acessar.")
  }
  return true
}
