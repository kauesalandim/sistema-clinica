"use client"

import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useEffect, useState } from "react"

interface DashboardStats {
  totalAppointments: number
  appointmentsToday: number
  totalPatients: number
  totalDentists: number
  pendingPayments: number
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalAppointments: 0,
    appointmentsToday: 0,
    totalPatients: 0,
    totalDentists: 0,
    pendingPayments: 0,
  })
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const loadStats = async () => {
      try {
        const today = new Date().toISOString().split("T")[0]

        // Total de agendamentos
        const { data: allAppointments } = await supabase.from("appointments").select("count")

        // Agendamentos hoje
        const { data: todayAppointments } = await supabase
          .from("appointments")
          .select("count")
          .eq("appointment_date", today)

        // Total de pacientes
        const { data: allPatients } = await supabase.from("patients").select("count")

        // Total de dentistas
        const { data: allDentists } = await supabase.from("dentists").select("count")

        // Pagamentos pendentes
        const { data: pendingPayments } = await supabase.from("payments").select("count").eq("status", "pending")

        setStats({
          totalAppointments: allAppointments?.length || 0,
          appointmentsToday: todayAppointments?.length || 0,
          totalPatients: allPatients?.length || 0,
          totalDentists: allDentists?.length || 0,
          pendingPayments: pendingPayments?.length || 0,
        })
      } catch (error) {
        console.error("Erro ao carregar estatísticas:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadStats()
  }, [supabase])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">Visão geral da clínica Unicidental</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Agendamentos</CardTitle>
            <span className="text-2xl">📅</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalAppointments}</div>
            <p className="text-xs text-gray-600">Todos os agendamentos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hoje</CardTitle>
            <span className="text-2xl">📋</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.appointmentsToday}</div>
            <p className="text-xs text-gray-600">Agendamentos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pacientes</CardTitle>
            <span className="text-2xl">👥</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPatients}</div>
            <p className="text-xs text-gray-600">Total cadastrados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Dentistas</CardTitle>
            <span className="text-2xl">🏥</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalDentists}</div>
            <p className="text-xs text-gray-600">Profissionais</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pagamentos</CardTitle>
            <span className="text-2xl">💰</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.pendingPayments}</div>
            <p className="text-xs text-gray-600">Pendentes</p>
          </CardContent>
        </Card>
      </div>

      <Card className="lg:col-span-4">
        <CardHeader>
          <CardTitle>Atalhos Rápidos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition text-left">
              <div className="text-2xl mb-2">📅</div>
              <div className="font-semibold text-sm">Agendar Consulta</div>
              <div className="text-xs text-gray-600">Novo agendamento</div>
            </button>
            <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition text-left">
              <div className="text-2xl mb-2">💰</div>
              <div className="font-semibold text-sm">Registrar Pagamento</div>
              <div className="text-xs text-gray-600">Novo pagamento</div>
            </button>
            <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition text-left">
              <div className="text-2xl mb-2">📊</div>
              <div className="font-semibold text-sm">Gerar Relatório</div>
              <div className="text-xs text-gray-600">Relatórios do período</div>
            </button>
            <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition text-left">
              <div className="text-2xl mb-2">📢</div>
              <div className="font-semibold text-sm">Enviar Lembrete</div>
              <div className="text-xs text-gray-600">Lembretes automáticos</div>
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
