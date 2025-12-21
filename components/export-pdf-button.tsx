"use client"

import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"
import Link from "next/link"

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
  items: any[]
}

export default function ExportPDFButton({ inspection }: Props) {
  return (
    <Button asChild className="bg-orange-600 hover:bg-orange-700 text-white">
      <Link href={`/print/inspection/${inspection.id}`} target="_blank">
        <Download className="mr-2 h-4 w-4" />
        Exportar PDF / Imprimir
      </Link>
    </Button>
  )
}

