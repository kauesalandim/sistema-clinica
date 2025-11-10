"use client"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useState, useEffect } from "react"

interface Appointment {
  id: string
  patient_id: string
  dentist_id: string
  procedure_id: string
  appointment_date: string
  appointment_time: string
  status: string
  patient_name?: string
  dentist_name?: string
  procedure_name?: string
}

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    loadAppointments()
  }, [])

  const loadAppointments = async () => {
    try {
      const { data } = await supabase
        .from("appointments")
        .select(`
          *,
          patients(user_profiles(first_name, last_name)),
          dentists(user_profiles(first_name, last_name)),
          procedures(name)
        `)
        .order("appointment_date", { ascending: true })

      if (data) {
        const formatted = data.map((apt: any) => ({
          ...apt,
          patient_name: `${apt.patients?.user_profiles?.first_name} ${apt.patients?.user_profiles?.last_name}`,
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-green-100 text-green-800"
      case "scheduled":
        return "bg-blue-100 text-blue-800"
      case "completed":
        return "bg-gray-100 text-gray-800"
      case "cancelled":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Agendamentos</h1>
          <p className="text-gray-600 mt-2">Gerencie todas as consultas agendadas</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700">+ Novo Agendamento</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Agendamentos</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Carregando agendamentos...</div>
          ) : appointments.length === 0 ? (
            <div className="text-center py-8 text-gray-600">Nenhum agendamento encontrado</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-gray-200">
                  <tr>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Paciente</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Dentista</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Procedimento</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Data</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Hora</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {appointments.map((apt) => (
                    <tr key={apt.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">{apt.patient_name}</td>
                      <td className="py-3 px-4">{apt.dentist_name}</td>
                      <td className="py-3 px-4">{apt.procedure_name}</td>
                      <td className="py-3 px-4">{new Date(apt.appointment_date).toLocaleDateString("pt-BR")}</td>
                      <td className="py-3 px-4">{apt.appointment_time}</td>
                      <td className="py-3 px-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(apt.status)}`}>
                          {apt.status}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <button className="text-blue-600 hover:underline text-sm">Editar</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
