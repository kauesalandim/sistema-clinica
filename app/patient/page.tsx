"use client"

import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useEffect, useState } from "react"
import Link from "next/link"

interface AppointmentInfo {
  upcoming: number
  completed: number
  pending: number
}

export default function PatientHomePage() {
  const [appointments, setAppointments] = useState<AppointmentInfo>({
    upcoming: 0,
    completed: 0,
    pending: 0,
  })
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const loadAppointments = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user) return

        const today = new Date().toISOString().split("T")[0]

        // Consultas futuras
        const { data: upcoming } = await supabase
          .from("appointments")
          .select("count")
          .eq("patient_id", user.id)
          .gte("appointment_date", today)
          .neq("status", "cancelled")

        // Consultas realizadas
        const { data: completed } = await supabase
          .from("appointments")
          .select("count")
          .eq("patient_id", user.id)
          .eq("status", "completed")

        // Consultas pendentes (não confirmadas)
        const { data: pending } = await supabase
          .from("appointments")
          .select("count")
          .eq("patient_id", user.id)
          .eq("status", "scheduled")
          .eq("confirmed_by_patient", false)

        setAppointments({
          upcoming: upcoming?.length || 0,
          completed: completed?.length || 0,
          pending: pending?.length || 0,
        })
      } catch (error) {
        console.error("Erro ao carregar agendamentos:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadAppointments()
  }, [supabase])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Bem-vindo ao Portal do Paciente</h1>
        <p className="text-gray-600 mt-2">Gerencie suas consultas e documentos</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Próximas Consultas</CardTitle>
            <span className="text-2xl">📅</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{appointments.upcoming}</div>
            <p className="text-xs text-gray-600 mt-2">
              <Link href="/patient/agendamentos" className="text-blue-600 hover:underline">
                Ver detalhes →
              </Link>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendentes de Confirmação</CardTitle>
            <span className="text-2xl">⏳</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{appointments.pending}</div>
            <p className="text-xs text-gray-600 mt-2">
              <Link href="/patient/agendamentos" className="text-blue-600 hover:underline">
                Confirmar agora →
              </Link>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Consultas Realizadas</CardTitle>
            <span className="text-2xl">✓</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{appointments.completed}</div>
            <p className="text-xs text-gray-600 mt-2">
              <Link href="/patient/historico" className="text-blue-600 hover:underline">
                Ver histórico →
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ações Rápidas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button className="bg-blue-600 hover:bg-blue-700 justify-start h-auto py-4">
              <div className="text-left">
                <div className="font-semibold">Agendar Consulta</div>
                <div className="text-xs opacity-90">Marque uma nova consulta</div>
              </div>
            </Button>
            <Button variant="outline" className="justify-start h-auto py-4 bg-transparent">
              <div className="text-left">
                <div className="font-semibold">Minhas Notificações</div>
                <div className="text-xs text-gray-600">Lembretes de consultas</div>
              </div>
            </Button>
            <Button variant="outline" className="justify-start h-auto py-4 bg-transparent">
              <div className="text-left">
                <div className="font-semibold">Baixar Atestado</div>
                <div className="text-xs text-gray-600">Certificados médicos</div>
              </div>
            </Button>
            <Button variant="outline" className="justify-start h-auto py-4 bg-transparent">
              <div className="text-left">
                <div className="font-semibold">Falar com Suporte</div>
                <div className="text-xs text-gray-600">WhatsApp da clínica</div>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-900">Informações Importantes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-blue-800">
          <p>
            📍 <strong>Endereço:</strong> Localize-nos no Google Maps para rotas de acesso
          </p>
          <p>
            ⏰ <strong>Funcionamento:</strong> Segunda a sexta, 8h às 18h
          </p>
          <p>
            💬 <strong>WhatsApp:</strong> Conecte-se com a clínica para remarcações e dúvidas
          </p>
          <p>
            ✓ <strong>Confirmação:</strong> Confirme sua consulta 24h antes para evitar cancelamentos
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
