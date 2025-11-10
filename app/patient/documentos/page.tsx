"use client"

import { createClient } from "@/lib/supabase/client"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useEffect, useState } from "react"

interface Document {
  id: string
  document_type: string
  file_name: string
  description: string
  created_at: string
  appointment_date?: string
  procedure_name?: string
}

export default function DocumentosPage() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    loadDocuments()
  }, [])

  const loadDocuments = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from("patient_documents")
        .select(`
          *,
          appointments(appointment_date, procedures(name))
        `)
        .eq("patient_id", user.id)
        .order("created_at", { ascending: false })

      if (data) {
        const formatted = data.map((doc: any) => ({
          ...doc,
          appointment_date: doc.appointments?.appointment_date,
          procedure_name: doc.appointments?.procedures?.name,
        }))
        setDocuments(formatted)
      }
    } catch (error) {
      console.error("Erro ao carregar documentos:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const getDocumentIcon = (type: string) => {
    switch (type) {
      case "radiography":
        return "🖼️"
      case "exam":
        return "📋"
      case "certificate":
        return "📜"
      case "prescription":
        return "💊"
      default:
        return "📄"
    }
  }

  const getDocumentLabel = (type: string) => {
    const labels: Record<string, string> = {
      radiography: "Radiografia",
      exam: "Exame",
      certificate: "Certificado",
      prescription: "Prescrição",
      other: "Outro",
    }
    return labels[type] || type
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Documentos e Exames</h1>
        <p className="text-gray-600 mt-2">Seus documentos clínicos e exames</p>
      </div>

      {isLoading ? (
        <div className="text-center py-8">Carregando documentos...</div>
      ) : documents.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <p className="text-gray-600">Você ainda não possui documentos compartilhados</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {documents.map((doc) => (
            <Card key={doc.id} className="hover:shadow-md transition">
              <CardContent className="pt-6">
                <div className="space-y-3">
                  <div className="text-3xl">{getDocumentIcon(doc.document_type)}</div>
                  <div>
                    <p className="text-sm text-gray-600">Tipo</p>
                    <p className="font-semibold text-gray-900">{getDocumentLabel(doc.document_type)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Nome do Arquivo</p>
                    <p className="text-sm text-gray-800 break-words">{doc.file_name}</p>
                  </div>
                  {doc.procedure_name && (
                    <div>
                      <p className="text-sm text-gray-600">Procedimento</p>
                      <p className="text-sm text-gray-800">{doc.procedure_name}</p>
                    </div>
                  )}
                  {doc.description && (
                    <div>
                      <p className="text-sm text-gray-600">Descrição</p>
                      <p className="text-sm text-gray-800">{doc.description}</p>
                    </div>
                  )}
                  <div className="text-xs text-gray-500 pt-2 border-t border-gray-200">
                    {new Date(doc.created_at).toLocaleDateString("pt-BR")}
                  </div>
                  <Button className="w-full bg-blue-600 hover:bg-blue-700" size="sm">
                    Baixar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
