"use client"

import { createClient } from "@/lib/supabase/client"
import { Card, CardContent } from "@/components/ui/card"
import { useEffect, useState } from "react"

interface PatientRecord {
  id: string
  appointment_id: string
  clinical_notes: string
  diagnosis: string
  treatment_plan: string
  dentist_name?: string
  procedure_name?: string
  appointment_date?: string
  created_at: string
}

export default function HistoricPage() {
  const [records, setRecords] = useState<PatientRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    loadRecords()
  }, [])

  const loadRecords = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from("patient_records")
        .select(`
          *,
          appointments(appointment_date, procedures(name)),
          dentists(user_profiles(first_name, last_name))
        `)
        .eq("patient_id", user.id)
        .order("created_at", { ascending: false })

      if (data) {
        const formatted = data.map((record: any) => ({
          ...record,
          dentist_name: `${record.dentists?.user_profiles?.first_name} ${record.dentists?.user_profiles?.last_name}`,
          procedure_name: record.appointments?.procedures?.name,
          appointment_date: record.appointments?.appointment_date,
        }))
        setRecords(formatted)
      }
    } catch (error) {
      console.error("Erro ao carregar histórico:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Histórico de Atendimentos</h1>
        <p className="text-gray-600 mt-2">Seu histórico completo de consultas</p>
      </div>

      {isLoading ? (
        <div className="text-center py-8">Carregando histórico...</div>
      ) : records.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <p className="text-gray-600">Você ainda não possui histórico de atendimentos</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {records.map((record) => (
            <Card key={record.id} className="hover:shadow-md transition">
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Procedimento</p>
                      <p className="font-semibold text-gray-900">{record.procedure_name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Dentista</p>
                      <p className="font-semibold text-gray-900">{record.dentist_name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Data</p>
                      <p className="font-semibold text-gray-900">
                        {new Date(record.appointment_date || "").toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                  </div>

                  {record.diagnosis && (
                    <div className="pt-4 border-t border-gray-200">
                      <p className="text-sm font-semibold text-gray-900 mb-2">Diagnóstico</p>
                      <p className="text-gray-700">{record.diagnosis}</p>
                    </div>
                  )}

                  {record.treatment_plan && (
                    <div className="pt-4">
                      <p className="text-sm font-semibold text-gray-900 mb-2">Plano de Tratamento</p>
                      <p className="text-gray-700">{record.treatment_plan}</p>
                    </div>
                  )}

                  {record.clinical_notes && (
                    <div className="pt-4">
                      <p className="text-sm font-semibold text-gray-900 mb-2">Observações</p>
                      <p className="text-gray-700">{record.clinical_notes}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
