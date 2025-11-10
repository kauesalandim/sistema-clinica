"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"

interface WhatsAppPreviewModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  message: string
  patientName: string
  isLoading?: boolean
}

export function WhatsAppPreviewModal({
  isOpen,
  onClose,
  onConfirm,
  message,
  patientName,
  isLoading = false,
}: WhatsAppPreviewModalProps) {
  const [confirmed, setConfirmed] = useState(false)

  const handleConfirm = async () => {
    setConfirmed(true)
    await onConfirm()
    setTimeout(() => {
      setConfirmed(false)
      onClose()
    }, 2000)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-green-600 to-green-700">
          <h2 className="text-white font-semibold">Prévia da Mensagem WhatsApp</h2>
          <button
            onClick={onClose}
            className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-1 transition"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-4">
          <div className="bg-gradient-to-b from-gray-50 to-gray-100 rounded-lg p-4 mb-4 max-h-96 overflow-y-auto">
            {/* Chat bubble - esquerda (paciente) */}
            <div className="flex items-end gap-2 mb-4">
              <div className="flex-1">
                <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-none px-4 py-3 shadow-sm">
                  <p className="text-sm font-medium text-gray-600">Olá {patientName}! 👋</p>
                </div>
              </div>
            </div>

            {/* Chat bubble - direita (clínica) */}
            <div className="flex items-end gap-2 mb-4 justify-end">
              <div className="flex-1 text-right">
                <div className="bg-green-100 border border-green-300 rounded-2xl rounded-br-none px-4 py-3 shadow-sm inline-block max-w-xs text-left">
                  {message.split("\n").map((line, idx) => (
                    <p key={idx} className="text-sm text-gray-800 leading-relaxed">
                      {line}
                    </p>
                  ))}
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  {new Date().toLocaleTimeString("pt-BR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
            <p className="text-xs text-blue-800">
              💬 Esta é uma prévia de como a mensagem WhatsApp aparecerá para o paciente. Confirme para enviar a
              consulta.
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1 bg-transparent"
              disabled={isLoading || confirmed}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleConfirm}
              className="flex-1 bg-green-600 hover:bg-green-700"
              disabled={isLoading || confirmed}
            >
              {confirmed ? "✓ Confirmado!" : isLoading ? "Enviando..." : "Confirmar Envio"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
