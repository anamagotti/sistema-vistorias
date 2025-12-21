import { createClient } from "@/lib/supabase/server"
import { redirect, notFound } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { ArrowLeft, Edit } from "lucide-react"
import ExportPDFButton from "@/components/export-pdf-button"

type Props = {
  params: Promise<{ id: string }>
}

export default async function InspectionDetailPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect("/auth/login")
  }

  // Buscar vistoria
  const { data: inspection, error } = await supabase
    .from("inspections")
    .select("*, franchises(name, location)")
    .eq("id", id)
    .single()

  if (error) {
    console.error("Erro ao buscar vistoria:", error)
  }

  if (error || !inspection) {
    console.log("Vistoria não encontrada ou erro:", id)
    notFound()
  }

  // Buscar dados do inspetor separadamente para evitar erro de join
  const { data: inspector } = await supabase
    .from("users")
    .select("full_name, email")
    .eq("id", inspection.inspector_id)
    .single()

  // Combinar dados para o componente
  const inspectionWithUser = {
    ...inspection,
    users: inspector
  }

  // Buscar itens do checklist
  const { data: items } = await supabase.from("checklist_items").select("*").eq("inspection_id", id).order("created_at")

  // Agrupar itens por categoria
  const groupedItems = items?.reduce(
    (acc, item) => {
      if (!acc[item.category]) {
        acc[item.category] = []
      }
      acc[item.category].push(item)
      return acc
    },
    {} as Record<string, typeof items>,
  )

  const okCount = items?.filter((i) => i.status === "OK").length || 0
  const noCount = items?.filter((i) => i.status === "NO").length || 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100">
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-orange-900">Detalhes da Vistoria</h1>
              <p className="text-sm text-orange-700">Visualize e exporte o relatório completo</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" asChild>
                <Link href="/dashboard/history">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Voltar
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-6 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-2xl">Vistoria #{inspection.id.substring(0, 8)}</CardTitle>
                  <CardDescription className="mt-2">
                    {new Date(inspection.inspection_date).toLocaleDateString("pt-BR", {
                      dateStyle: "long",
                    })}
                  </CardDescription>
                </div>
                <Badge
                  className={`text-base ${
                    inspection.rating === "EXCELENTE"
                      ? "bg-green-500"
                      : inspection.rating === "BOM"
                        ? "bg-blue-500"
                        : "bg-red-500"
                  }`}
                >
                  {inspection.rating}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div>
                  <p className="text-sm text-muted-foreground">Franquia</p>
                  <p className="font-medium">{inspection.franchises?.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Setor</p>
                  <p className="font-medium capitalize">{inspection.sector}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Responsável pela Vistoria</p>
                  <p className="font-medium">{inspector?.full_name || inspector?.email || "Inspetor"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Data</p>
                  <p className="font-medium">{new Date(inspection.inspection_date).toLocaleDateString("pt-BR")}</p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-4">
                <Card className="border-2">
                  <CardContent className="pt-6">
                    <p className="text-sm text-muted-foreground">Pontos Possíveis</p>
                    <p className="text-3xl font-bold">{inspection.total_points}</p>
                  </CardContent>
                </Card>
                <Card className="border-2">
                  <CardContent className="pt-6">
                    <p className="text-sm text-muted-foreground">Pontos Alcançados</p>
                    <p className="text-3xl font-bold text-green-600">{inspection.points_achieved}</p>
                  </CardContent>
                </Card>
                <Card className="border-2">
                  <CardContent className="pt-6">
                    <p className="text-sm text-muted-foreground">Percentual</p>
                    <p className="text-3xl font-bold text-blue-600">{inspection.percentage?.toFixed(1)}%</p>
                  </CardContent>
                </Card>
                <Card className="border-2">
                  <CardContent className="pt-6">
                    <p className="text-sm text-muted-foreground">Items OK / NO</p>
                    <p className="text-3xl font-bold">
                      <span className="text-green-600">{okCount}</span> /{" "}
                      <span className="text-red-600">{noCount}</span>
                    </p>
                  </CardContent>
                </Card>
              </div>

              <div className="flex gap-2">
                <ExportPDFButton inspection={inspectionWithUser} items={items || []} />
                <Button variant="outline" asChild>
                  <Link href={`/dashboard/inspection/${id}/edit`}>
                    <Edit className="mr-2 h-4 w-4" />
                    Editar Vistoria
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {groupedItems &&
            Object.entries(groupedItems).map(([category, categoryItems]) => (
              <Card key={category}>
                <CardHeader>
                  <CardTitle>{category}</CardTitle>
                  <CardDescription>
                    {categoryItems.filter((i) => i.status === "OK").length} de {categoryItems.length} itens aprovados
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {categoryItems.map((item) => (
                      <div
                        key={item.id}
                        className={`rounded-lg border-2 p-4 ${
                          item.status === "OK" ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="font-medium">{item.item_name}</p>
                            <p className="text-sm text-muted-foreground">{item.points} pontos</p>
                          </div>
                          <Badge variant={item.status === "OK" ? "default" : "destructive"}>{item.status}</Badge>
                        </div>
                        {item.observation && (
                          <div className="mt-3 space-y-1">
                            <p className="text-sm font-medium">Observação:</p>
                            <p className="text-sm text-muted-foreground">{item.observation}</p>
                          </div>
                        )}
                        {item.responsible && (
                          <div className="mt-2">
                            <p className="text-sm">
                              <span className="font-medium">Responsável:</span> {item.responsible}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
        </div>
      </main>
    </div>
  )
}
