import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import InspectionForm from "@/components/inspection-form"
import { requireAdmin } from "@/lib/auth-utils"

export default async function NewInspectionPage() {
  try {
    await requireAdmin()
  } catch {
    redirect("/dashboard")
  }

  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect("/auth/login")
  }

  // Buscar franquias disponíveis
  const { data: franchises, error } = await supabase.from("franchises").select("*").order("name")

  if (error) {
    console.error("Erro ao buscar franquias:", error)
  } else {
    console.log("Franquias encontradas:", franchises?.length)
  }

  // Buscar usuários para selecionar o inspetor (Apenas Robson)
  const { data: users } = await supabase
    .from("users")
    .select("id, full_name, email")
    .ilike("full_name", "%Robson%")
    .order("full_name")

  // Buscar dados do usuário para pegar a franquia padrão
  const { data: userData } = await supabase.from("users").select("franchise_id").eq("id", user.id).single()

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100">
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-orange-900">Nova Vistoria</h1>
          <p className="text-sm text-orange-700">Preencha o checklist da vistoria</p>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <InspectionForm
          userId={user.id}
          franchises={franchises || []}
          users={users || []}
          defaultFranchiseId={userData?.franchise_id || ""}
        />
      </main>
    </div>
  )
}
