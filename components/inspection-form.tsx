"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useToast } from "@/hooks/use-toast"
import { SECTORS, calculateRating } from "@/lib/checklist-data"
import type { Franchise } from "@/types/inspection"
import { ArrowLeft, Save, Camera, Loader2, Image as ImageIcon, X } from "lucide-react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"

type Props = {
  userId: string
  franchises: Franchise[]
  users: { id: string; full_name: string; email: string }[]
  defaultFranchiseId: string
}

type ItemResponse = {
  status: "OK" | "NO"
  observation: string
  responsible: string
  photos: string[]
}

export default function InspectionForm({ userId, franchises, users, defaultFranchiseId }: Props) {
  const router = useRouter()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [franchiseId, setFranchiseId] = useState(defaultFranchiseId)
  // Se houver usuários na lista (Robson), usa o primeiro como padrão. Caso contrário, usa o usuário logado.
  const [inspectorId, setInspectorId] = useState(users.length > 0 ? users[0].id : userId)
  const [inspectionDate, setInspectionDate] = useState(new Date().toISOString().split("T")[0])
  const [responses, setResponses] = useState<Record<string, ItemResponse>>({})
  const [uploadingPhoto, setUploadingPhoto] = useState<string | null>(null)

  const handlePhotoUpload = async (itemKey: string, file: File) => {
    try {
      setUploadingPhoto(itemKey)
      const supabase = createClient()
      
      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random()}.${fileExt}`
      const filePath = `${franchiseId}/${inspectionDate}/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('inspection-photos')
        .upload(filePath, file)

      if (uploadError) {
        throw uploadError
      }

      const { data: { publicUrl } } = supabase.storage
        .from('inspection-photos')
        .getPublicUrl(filePath)

      setResponses((prev) => {
        const currentItem = prev[itemKey] || {
          status: "NO",
          observation: "",
          responsible: "",
          photos: [],
        }
        const currentPhotos = currentItem.photos || []
        
        return {
          ...prev,
          [itemKey]: {
            ...currentItem,
            photos: [...currentPhotos, publicUrl]
          }
        }
      })
      
      toast({
        title: "Foto enviada",
        description: "A foto foi anexada com sucesso.",
      })
    } catch (error) {
      console.error("Erro ao enviar foto:", error)
      toast({
        title: "Erro no envio",
        description: "Não foi possível enviar a foto.",
        variant: "destructive",
      })
    } finally {
      setUploadingPhoto(null)
    }
  }

  const removePhoto = (itemKey: string, photoUrl: string) => {
    const currentPhotos = responses[itemKey]?.photos || []
    const newPhotos = currentPhotos.filter(p => p !== photoUrl)
    handleItemChange(itemKey, "photos", newPhotos)
  }

  const handleItemChange = (itemKey: string, field: keyof ItemResponse, value: string | string[]) => {
    setResponses((prev) => {
      const currentItem = prev[itemKey] || {
        status: "NO",
        observation: "",
        responsible: "",
        photos: [],
      }

      return {
        ...prev,
        [itemKey]: {
          ...currentItem,
          [field]: value,
        },
      }
    })
  }

  const calculateScore = () => {
    let totalPoints = 0
    let achievedPoints = 0

    // Calcular para TODOS os setores
    SECTORS.forEach((sector) => {
      sector.checklist.forEach((section) => {
        section.items.forEach((item) => {
          const key = `${sector.id}-${section.title}-${item.item}` // Chave única incluindo setor
          totalPoints += item.points

          // Se não tiver resposta, assume NO (ou poderia assumir OK, mas vamos ser estritos)
          // Se a resposta for OK, soma pontos
          if (responses[key]?.status === "OK") {
            achievedPoints += item.points
          }
        })
      })
    })

    const percentage = totalPoints > 0 ? (achievedPoints / totalPoints) * 100 : 0

    return { total: totalPoints, achieved: achievedPoints, percentage }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!franchiseId) {
      toast({
        title: "Erro",
        description: "Selecione a franquia",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      const score = calculateScore()
      const rating = calculateRating(score.percentage)

      // Criar a vistoria
      const inspectionResponse = await fetch("/api/inspections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          franchise_id: franchiseId,
          inspector_id: inspectorId,
          inspection_date: inspectionDate,
          sector: "Vistoria Completa", // Setor fixo para vistoria completa
          total_points: score.total,
          points_achieved: score.achieved,
          percentage: score.percentage,
          rating,
        }),
      })

      if (!inspectionResponse.ok) {
        const errorData = await inspectionResponse.json().catch(() => ({}))
        throw new Error(errorData.error || "Erro ao criar vistoria")
      }

      const { data: inspection } = await inspectionResponse.json()

      // Criar os itens do checklist de TODOS os setores
      const items = SECTORS.flatMap((sector) =>
        sector.checklist.flatMap((section) =>
          section.items.map((item) => {
            const key = `${sector.id}-${section.title}-${item.item}`
            const response = responses[key] || { status: "NO", observation: "", responsible: "", photos: [] }

            return {
              inspection_id: inspection.id,
              category: `${sector.name} - ${section.title}`, // Incluir nome do setor na categoria
              item_name: item.item,
              status: response.status,
              points: item.points,
              observation: response.observation,
              responsible: response.responsible,
              photos: response.photos,
            }
          }),
        ),
      )

      const itemsResponse = await fetch("/api/checklist-items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      })

      if (!itemsResponse.ok) {
        const errorData = await itemsResponse.json().catch(() => ({}))
        throw new Error(errorData.error || "Erro ao salvar itens")
      }

      toast({
        title: "Sucesso!",
        description: "Vistoria criada com sucesso",
      })

      router.push(`/dashboard/inspection/${inspection.id}`)
    } catch (error) {
      console.error("Erro ao salvar:", error)
      toast({
        title: "Erro",
        description: error instanceof Error && error.message ? error.message : "Erro ao salvar vistoria. Verifique o console.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const score = calculateScore()

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Informações da Vistoria</CardTitle>
          <CardDescription>Selecione a franquia, setor e data da vistoria</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="franchise">Franquia *</Label>
              <Select value={franchiseId} onValueChange={setFranchiseId} required>
                <SelectTrigger id="franchise">
                  <SelectValue placeholder="Selecione a franquia" />
                </SelectTrigger>
                <SelectContent>
                  {franchises.map((f) => (
                    <SelectItem key={f.id} value={f.id}>
                      {f.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="inspector">Responsável pela Vistoria</Label>
              <Select value={inspectorId} onValueChange={setInspectorId}>
                <SelectTrigger id="inspector">
                  <SelectValue placeholder="Selecione o responsável" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.full_name || u.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">Data *</Label>
              <Input
                id="date"
                type="date"
                value={inspectionDate}
                onChange={(e) => setInspectionDate(e.target.value)}
                required
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardHeader>
          <CardTitle>Pontuação Geral</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div>
              <p className="text-sm text-muted-foreground">Pontos Possíveis</p>
              <p className="text-2xl font-bold">{score.total}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Pontos Alcançados</p>
              <p className="text-2xl font-bold">{score.achieved}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Percentual</p>
              <p className="text-2xl font-bold">{score.percentage.toFixed(1)}%</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Avaliação</p>
              <p className="text-2xl font-bold">{calculateRating(score.percentage)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {SECTORS.map((sector) => (
        <div key={sector.id} className="space-y-6">
          <div className="flex items-center gap-2 border-b pb-2">
            <h2 className="text-2xl font-bold text-primary">{sector.name}</h2>
          </div>

          {sector.checklist.map((section, sectionIdx) => (
            <Card key={`${sector.id}-${sectionIdx}`}>
              <CardHeader>
                <CardTitle>{section.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {section.items.map((item, itemIdx) => {
                  const key = `${sector.id}-${section.title}-${item.item}`
                  const response = responses[key] || { status: "NO", observation: "", responsible: "", photoUrl: "" }

                  return (
                    <div key={itemIdx} className="space-y-3 rounded-lg border p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <p className="font-medium">{item.item}</p>
                          <p className="text-sm text-muted-foreground">{item.points} pontos</p>
                        </div>
                        <RadioGroup
                          value={response.status}
                          onValueChange={(value) => handleItemChange(key, "status", value)}
                          className="flex gap-4"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="OK" id={`${key}-ok`} />
                            <Label htmlFor={`${key}-ok`} className="cursor-pointer font-normal">
                              OK
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="NO" id={`${key}-no`} />
                            <Label htmlFor={`${key}-no`} className="cursor-pointer font-normal">
                              NO
                            </Label>
                          </div>
                        </RadioGroup>

                        <div className="flex flex-col items-end gap-2">
                          <div className="flex flex-wrap gap-2 justify-end">
                            {response.photos && response.photos.map((photo, idx) => (
                              <div key={idx} className="relative group">
                                <img src={photo} alt="Foto" className="h-12 w-12 object-cover rounded-md border" />
                                <button
                                  type="button"
                                  onClick={() => removePhoto(key, photo)}
                                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 shadow-sm"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                          <div className="flex items-center gap-2">
                           <input
                            type="file"
                            accept="image/*"
                            capture="environment"
                            className="hidden"
                            id={`photo-${key.replace(/\s+/g, '-')}`}
                            onChange={(e) => {
                              const file = e.target.files?.[0]
                              if (file) {
                                handlePhotoUpload(key, file)
                                e.target.value = ""
                              }
                            }}
                            disabled={uploadingPhoto === key}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className={`p-2 h-auto rounded-md hover:bg-slate-100 ${
                              response.photos && response.photos.length > 0 ? "text-blue-600 bg-blue-50" : "text-slate-500"
                            }`}
                            title="Anexar foto"
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              const input = document.getElementById(`photo-${key.replace(/\s+/g, '-')}`)
                              if (input) input.click()
                            }}
                          >
                            {uploadingPhoto === key ? (
                              <Loader2 className="h-5 w-5 animate-spin" />
                            ) : (
                              <Camera className="h-5 w-5" />
                            )}
                          </Button>
                          </div>
                        </div>
                      </div>

                      {response.status === "NO" && (
                        <div className="grid gap-3 md:grid-cols-2">
                          <div className="space-y-2">
                            <Label htmlFor={`${key}-obs`} className="text-sm">
                              Observação
                            </Label>
                            <Textarea
                              id={`${key}-obs`}
                              value={response.observation}
                              onChange={(e) => handleItemChange(key, "observation", e.target.value)}
                              placeholder="Descreva o problema..."
                              rows={2}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor={`${key}-resp`} className="text-sm">
                              Responsável
                            </Label>
                            <Input
                              id={`${key}-resp`}
                              value={response.responsible}
                              onChange={(e) => handleItemChange(key, "responsible", e.target.value)}
                              placeholder="Nome do responsável"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </CardContent>
            </Card>
          ))}
        </div>
      ))}

      <div className="flex gap-4">
        <Button type="button" variant="outline" asChild>
          <Link href="/dashboard">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Link>
        </Button>
        <Button type="submit" disabled={!franchiseId || isSubmitting} className="flex-1">
          <Save className="mr-2 h-4 w-4" />
          {isSubmitting ? "Salvando..." : "Salvar Vistoria"}
        </Button>
      </div>
    </form>
  )
}
