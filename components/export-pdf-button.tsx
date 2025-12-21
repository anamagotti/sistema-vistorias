"use client"

import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useState } from "react"

type Props = {
  inspection: {
    id: string
    franchise_id: string
    inspection_date: string
    sector: string
    total_points: number
    points_achieved: number
    percentage: number
    rating: string
    franchises?: { name: string; location: string }
    users?: { full_name: string; email: string }
  }
  items: Array<{
    id: string
    category: string
    item_name: string
    status: string
    points: number
    observation: string | null
    responsible: string | null
  }>
}

export default function ExportPDFButton({ inspection, items }: Props) {
  const { toast } = useToast()
  const [isGenerating, setIsGenerating] = useState(false)

  const handleExport = async () => {
    setIsGenerating(true)

    // Abrir janela imediatamente para evitar bloqueio de popup
    const printWindow = window.open("", "_blank")
    if (printWindow) {
      printWindow.document.write("<html><body><h3>Gerando relatório... aguarde.</h3></body></html>")
    }

    try {
      const response = await fetch("/api/export-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          inspection, 
          items,
          origin: window.location.origin 
        }),
      })

      if (!response.ok) throw new Error("Erro ao gerar PDF")

      const { html } = await response.json()

      if (printWindow) {
        printWindow.document.open()
        printWindow.document.write(html)
        printWindow.document.close()
      } else {
        throw new Error("Pop-up bloqueado. Permita pop-ups para este site.")
      }

      toast({
        title: "Sucesso!",
        description: "Relatório gerado para impressão",
      })
    } catch (error) {
      if (printWindow) printWindow.close()
      
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Não foi possível exportar o PDF",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <Button onClick={handleExport} disabled={isGenerating}>
      <Download className="mr-2 h-4 w-4" />
      {isGenerating ? "Gerando PDF..." : "Exportar PDF"}
    </Button>
  )
}
