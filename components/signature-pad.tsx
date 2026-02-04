"use client"

import React, { useRef, useState, useImperativeHandle, forwardRef } from "react"
import SignatureCanvas from "react-signature-canvas"
import { Button } from "@/components/ui/button"

type SignaturePadProps = {
  onChange: (dataUrl: string | null) => void
  label: string
}

export type SignaturePadRef = {
  clear: () => void
  isEmpty: () => boolean
}

const SignaturePad = forwardRef<SignaturePadRef, SignaturePadProps>(({ onChange, label }, ref) => {
  const sigCanvas = useRef<SignatureCanvas>(null)
  const [isEmpty, setIsEmpty] = useState(true)

  useImperativeHandle(ref, () => ({
    clear: () => {
      sigCanvas.current?.clear()
      setIsEmpty(true)
      onChange(null)
    },
    isEmpty: () => {
      return sigCanvas.current?.isEmpty() ?? true
    }
  }))

  const handleEnd = () => {
    if (sigCanvas.current) {
      if (sigCanvas.current.isEmpty()) {
        setIsEmpty(true)
        onChange(null)
      } else {
        setIsEmpty(false)
        // Obter a imagem em base64 e passar para o pai
        // Usamos PNG com fundo transparente por padrão, mas podemos forçar um fundo branco se necessário
        const dataUrl = sigCanvas.current.getTrimmedCanvas().toDataURL("image/png")
        onChange(dataUrl)
      }
    }
  }

  return (
    <div className="flex flex-col gap-2 w-full">
      <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
        {label}
      </label>
      <div className="border rounded-md overflow-hidden bg-white">
        <SignatureCanvas
          ref={sigCanvas}
          penColor="black"
          backgroundColor="white"
          canvasProps={{
            // Largura e altura do canvas. Ajuste conforme necessário ou use CSS para responsividade
            // Uma largura fixa pode ser melhor para consistência, ou width: 100% no style
            className: "w-full h-40 border-b",
          }}
          onEnd={handleEnd}
        />
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => {
            sigCanvas.current?.clear()
            setIsEmpty(true)
            onChange(null)
        }}
        className="w-fit"
        disabled={isEmpty}
      >
        Limpar Assinatura
      </Button>
    </div>
  )
})

SignaturePad.displayName = "SignaturePad"

export default SignaturePad
