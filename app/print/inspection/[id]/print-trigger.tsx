"use client"

import { useEffect } from "react"

export default function PrintTrigger() {
  useEffect(() => {
    // Pequeno delay para garantir que imagens carregaram
    const timer = setTimeout(() => {
      window.print()
    }, 1000)
    return () => clearTimeout(timer)
  }, [])
  return null
}
