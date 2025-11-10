"use client"

import { createClient } from "@/lib/supabase/client"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useEffect, useState } from "react"

interface Appointment {
  id: string
  appointment_date: string
  appointment_time: string
  status: string
  confirmed_by_patient: boolean
  dentist_name?: string
  procedure_name?: string
}

export default function PatientAppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    loadAppointments()
  }, [])

  const loadAppointments = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from("appointments")
        .select(`
          *,
          dentists(user_profiles(first_name, last_name)),
          procedures(name)
        `)
        .eq("patient_id", user.id)
        .order("appointment_date", { ascending: true })

      if (data) {
        const formatted = data.map((apt: any) => ({
          ...apt,
          dentist_name: `${apt.dentists?.user_profiles?.first_name} ${apt.dentists?.user_profiles?.last_name}`,
          procedure_name: apt.procedures?.name,
        }))
        setAppointments(formatted)
      }
    } catch (error) {
      console.error("Erro ao carregar agendamentos:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const confirmAppointment = async (id: string) => {
    try {
      const { error } = await supabase
        .from("appointments")
        .update({ confirmed_by_patient: true, confirmed_at: new Date().toISOString() })
        .eq("id", id)

      if (error) throw error
      loadAppointments()
    } catch (error) {
      console.error("Erro ao confirmar agendamento:", error)
    }
  }

  const cancelAppointment = async (id: string) => {
    try {
      const { error } = await supabase.from("appointments").update({ status: "cancelled" }).eq("id", id)

      if (error) throw error
      loadAppointments()
    } catch (error) {
      console.error("Erro ao cancelar agendamento:", error)
    }
  }

  const getStatusBadge = (status: string, confirmed: boolean) => {
    if (status === "cancelled") return "bg-red-100 text-red-800"
    if (status === "completed") return "bg-green-100 text-green-800"
    if (confirmed) return "bg-green-100 text-green-800"
    return "bg-yellow-100 text-yellow-800"
  }

  const getStatusText = (status: string, confirmed: boolean) => {
    if (status === "cancelled") return "Cancelado"
    if (status === "completed") return "Realizado"
    if (confirmed) return "Confirmado"
    return "Pendente de Confirmação"
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Minhas Consultas</h1>
          <p className="text-gray-600 mt-2">Gerencie seus agendamentos</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700">+ Agendar Consulta</Button>
      </div>

      {isLoading ? (
        <div className="text-center py-8">Carregando agendamentos...</div>
      ) : appointments.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <p className="text-gray-600 mb-4">Você ainda não possui agendamentos</p>
              <Button className="bg-blue-600 hover:bg-blue-700">Agendar minha primeira consulta</Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {appointments.map((apt) => (
            <Card key={apt.id} className="hover:shadow-md transition">
              <CardContent className="pt-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-gray-600">Procedimento</p>
                        <p className="text-lg font-semibold text-gray-900">{apt.procedure_name}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Dentista</p>
                        <p className="font-medium text-gray-800">{apt.dentist_name}</p>
                      </div>
                    </div>
                  </div>
                  <div>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-gray-600">Data e Hora</p>
                        <p className="font-semibold text-gray-900">
                          {new Date(apt.appointment_date).toLocaleDateString("pt-BR")} às {apt.appointment_time}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Status</p>
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadge(apt.status, apt.confirmed_by_patient)}`}
                        >
                          {getStatusText(apt.status, apt.confirmed_by_patient)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 mt-4 pt-4 border-t border-gray-200">
                  {apt.status !== "cancelled" && apt.status !== "completed" && !apt.confirmed_by_patient && (
                    <Button onClick={() => confirmAppointment(apt.id)} className="bg-green-600 hover:bg-green-700">
                      Confirmar
                    </Button>
                  )}
                  {apt.status !== "cancelled" && apt.status !== "completed" && (
                    <Button onClick={() => cancelAppointment(apt.id)} variant="outline" className="text-red-600">
                      Cancelar
                    </Button>
                  )}
                  <Button variant="outline">Detalhes</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
