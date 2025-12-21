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
  inspection: {
    id: string
    franchise_id: string
    inspection_date: string
    sector: string
    inspector_id?: string
  }
  items: Array<{
    id: string
    category: string
    item_name: string
    status: string
    points: number
    observation: string | null
    responsible: string | null
    photo_url: string | null
    photos: string[] | null
  }>
  franchises: Franchise[]
  users: { id: string; full_name: string; email: string }[]
  userId: string
}

type ItemResponse = {
  id: string
  status: "OK" | "NO"
  observation: string
  responsible: string
  photos: string[]
}

export default function InspectionEditForm({ inspection, items, franchises, users, userId }: Props) {
  const router = useRouter()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [franchiseId, setFranchiseId] = useState(inspection.franchise_id)
  const [inspectorId, setInspectorId] = useState(inspection.inspector_id || userId)
  const [inspectionDate, setInspectionDate] = useState(inspection.inspection_date)
  const [responses, setResponses] = useState<Record<string, ItemResponse>>(
    items.reduce(
      (acc, item) => {
        acc[item.id] = {
          id: item.id,
          status: item.status as "OK" | "NO",
          observation: item.observation || "",
          responsible: item.responsible || "",
          photos: item.photos || (item.photo_url ? [item.photo_url] : []),
        }
        return acc
      },
      {} as Record<string, ItemResponse>,
    ),
  )
  const [uploadingPhoto, setUploadingPhoto] = useState<string | null>(null)

  const handlePhotoUpload = async (itemId: string, file: File) => {
    try {
      setUploadingPhoto(itemId)
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
        const currentPhotos = prev[itemId]?.photos || []
        return {
          ...prev,
          [itemId]: {
            ...prev[itemId],
            photos: [...currentPhotos, publicUrl],
          },
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

  const removePhoto = (itemId: string, photoUrl: string) => {
    setResponses((prev) => {
      const currentPhotos = prev[itemId]?.photos || []
      return {
        ...prev,
        [itemId]: {
          ...prev[itemId],
          photos: currentPhotos.filter(p => p !== photoUrl),
        },
      }
    })
  }

  const handleItemChange = (itemId: string, field: keyof Omit<ItemResponse, "id">, value: string | string[]) => {
    setResponses((prev) => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        [field]: value,
      },
    }))
  }

  const calculateScore = () => {
    let totalPoints = 0
    let achievedPoints = 0

    items.forEach((item) => {
      totalPoints += item.points
      if (responses[item.id]?.status === "OK") {
        achievedPoints += item.points
      }
    })

    const percentage = totalPoints > 0 ? (achievedPoints / totalPoints) * 100 : 0

    return { total: totalPoints, achieved: achievedPoints, percentage }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const score = calculateScore()
      const rating = calculateRating(score.percentage)

      // Atualizar a vistoria
      const inspectionResponse = await fetch(`/api/inspections/${inspection.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          franchise_id: franchiseId,
          inspector_id: inspectorId,
          inspection_date: inspectionDate,
          total_points: score.total,
          points_achieved: score.achieved,
          percentage: score.percentage,
          rating,
        }),
      })

      if (!inspectionResponse.ok) throw new Error("Erro ao atualizar vistoria")

      // Atualizar os itens
      const updatePromises = Object.values(responses).map((response) =>
        fetch(`/api/checklist-items/${response.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: response.status,
            observation: response.observation,
            responsible: response.responsible,
            photos: response.photos,
          }),
        }),
      )

      await Promise.all(updatePromises)

      toast({
        title: "Sucesso!",
        description: "Vistoria atualizada com sucesso",
      })

      router.push(`/dashboard/inspection/${inspection.id}`)
    } catch (error) {
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao atualizar vistoria",
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
          <CardDescription>Atualize os dados da vistoria</CardDescription>
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
          <CardTitle>Pontuação</CardTitle>
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

      {Object.entries(
        items.reduce(
          (acc, item) => {
            if (!acc[item.category]) {
              acc[item.category] = []
            }
            acc[item.category].push(item)
            return acc
          },
          {} as Record<string, typeof items>,
        ),
      ).map(([category, categoryItems]) => (
        <Card key={category}>
          <CardHeader>
            <CardTitle>{category}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {categoryItems.map((item) => {
              const response = responses[item.id]

              return (
                <div key={item.id} className="space-y-3 rounded-lg border p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <p className="font-medium">{item.item_name}</p>
                      <p className="text-sm text-muted-foreground">{item.points} pontos</p>
                    </div>
                    <RadioGroup
                      value={response.status}
                      onValueChange={(value) => handleItemChange(item.id, "status", value)}
                      className="flex gap-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="OK" id={`${item.id}-ok`} />
                        <Label htmlFor={`${item.id}-ok`} className="cursor-pointer font-normal">
                          OK
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="NO" id={`${item.id}-no`} />
                        <Label htmlFor={`${item.id}-no`} className="cursor-pointer font-normal">
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
                              onClick={() => removePhoto(item.id, photo)}
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
                        id={`photo-${item.id}`}
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) {
                            handlePhotoUpload(item.id, file)
                            e.target.value = ""
                          }
                        }}
                        disabled={uploadingPhoto === item.id}
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
                          const input = document.getElementById(`photo-${item.id}`)
                          if (input) input.click()
                        }}
                      >
                        {uploadingPhoto === item.id ? (
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
                        <Label htmlFor={`${item.id}-obs`} className="text-sm">
                          Observação
                        </Label>
                        <Textarea
                          id={`${item.id}-obs`}
                          value={response.observation}
                          onChange={(e) => handleItemChange(item.id, "observation", e.target.value)}
                          placeholder="Descreva o problema..."
                          rows={2}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`${item.id}-resp`} className="text-sm">
                          Responsável
                        </Label>
                        <Input
                          id={`${item.id}-resp`}
                          value={response.responsible}
                          onChange={(e) => handleItemChange(item.id, "responsible", e.target.value)}
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

      <div className="flex gap-4">
        <Button type="button" variant="outline" asChild>
          <Link href={`/dashboard/inspection/${inspection.id}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Cancelar
          </Link>
        </Button>
        <Button type="submit" disabled={isSubmitting} className="flex-1">
          <Save className="mr-2 h-4 w-4" />
          {isSubmitting ? "Salvando..." : "Salvar Alterações"}
        </Button>
      </div>
    </form>
  )
}
