"use client"

import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useEffect, useState } from "react"

interface ReportData {
  totalAppointments: number
  completedAppointments: number
  cancelledAppointments: number
  noShowAppointments: number
  totalRevenue: number
  pendingPayments: number
  newPatients: number
  periodStart: string
  periodEnd: string
}

export default function RelatoriosPage() {
  const [reportData, setReportData] = useState<ReportData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [period, setPeriod] = useState<"month" | "quarter" | "year">("month")
  const supabase = createClient()

  useEffect(() => {
    loadReport()
  }, [period])

  const loadReport = async () => {
    try {
      const today = new Date()
      const startDate = new Date()

      if (period === "month") {
        startDate.setMonth(today.getMonth() - 1)
      } else if (period === "quarter") {
        startDate.setMonth(today.getMonth() - 3)
      } else {
        startDate.setFullYear(today.getFullYear() - 1)
      }

      const startStr = startDate.toISOString().split("T")[0]
      const endStr = today.toISOString().split("T")[0]

      const [
        { data: allAppts },
        { data: completedAppts },
        { data: cancelledAppts },
        { data: noShowAppts },
        { data: allPayments },
        { data: pendingPay },
        { data: newPatients },
      ] = await Promise.all([
        supabase
          .from("appointments")
          .select("count", { count: "exact" })
          .gte("appointment_date", startStr)
          .lte("appointment_date", endStr),
        supabase
          .from("appointments")
          .select("count", { count: "exact" })
          .eq("status", "completed")
          .gte("appointment_date", startStr)
          .lte("appointment_date", endStr),
        supabase
          .from("appointments")
          .select("count", { count: "exact" })
          .eq("status", "cancelled")
          .gte("appointment_date", startStr)
          .lte("appointment_date", endStr),
        supabase
          .from("appointments")
          .select("count", { count: "exact" })
          .eq("status", "no_show")
          .gte("appointment_date", startStr)
          .lte("appointment_date", endStr),
        supabase
          .from("payments")
          .select("amount")
          .eq("status", "completed")
          .gte("payment_date", startStr)
          .lte("payment_date", endStr),
        supabase.from("payments").select("count", { count: "exact" }).eq("status", "pending"),
        supabase
          .from("patients")
          .select("count", { count: "exact" })
          .gte("created_at", startStr)
          .lte("created_at", endStr),
      ])

      const totalRevenue = (allPayments as any[])?.reduce((sum: number, p: any) => sum + (p.amount || 0), 0) || 0

      setReportData({
        totalAppointments: allAppts?.length || 0,
        completedAppointments: completedAppts?.length || 0,
        cancelledAppointments: cancelledAppts?.length || 0,
        noShowAppointments: noShowAppts?.length || 0,
        totalRevenue,
        pendingPayments: (pendingPay as any)?.length || 0,
        newPatients: (newPatients as any)?.length || 0,
        periodStart: startStr,
        periodEnd: endStr,
      })
    } catch (error) {
      console.error("Erro ao carregar relatório:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const attendanceRate = reportData
    ? ((reportData.completedAppointments / reportData.totalAppointments) * 100).toFixed(1)
    : 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Relatórios</h1>
          <p className="text-gray-600 mt-2">Análise de performance da clínica</p>
        </div>
        <div className="flex gap-2">
          <Button variant={period === "month" ? "default" : "outline"} onClick={() => setPeriod("month")}>
            Mês
          </Button>
          <Button variant={period === "quarter" ? "default" : "outline"} onClick={() => setPeriod("quarter")}>
            Trimestre
          </Button>
          <Button variant={period === "year" ? "default" : "outline"} onClick={() => setPeriod("year")}>
            Ano
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-8">Carregando relatório...</div>
      ) : reportData ? (
        <>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Agendamentos</CardTitle>
                <span className="text-2xl">📅</span>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{reportData.totalAppointments}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Realizadas</CardTitle>
                <span className="text-2xl">✓</span>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{reportData.completedAppointments}</div>
                <p className="text-xs text-gray-600 mt-1">{attendanceRate}% de taxa</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Receita</CardTitle>
                <span className="text-2xl">💰</span>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">R$ {reportData.totalRevenue.toFixed(2)}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Novos Pacientes</CardTitle>
                <span className="text-2xl">👥</span>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{reportData.newPatients}</div>
              </CardContent>
            </Card>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Análise de Agendamentos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-700">Realizadas</span>
                    <span className="font-semibold text-green-600">{reportData.completedAppointments}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700">Canceladas</span>
                    <span className="font-semibold text-red-600">{reportData.cancelledAppointments}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700">Faltas</span>
                    <span className="font-semibold text-yellow-600">{reportData.noShowAppointments}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Financeiro</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600">Receita Total</p>
                    <p className="text-2xl font-bold text-blue-600">R$ {reportData.totalRevenue.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Média por Consulta</p>
                    <p className="text-lg font-semibold text-gray-900">
                      R${" "}
                      {reportData.completedAppointments > 0
                        ? (reportData.totalRevenue / reportData.completedAppointments).toFixed(2)
                        : "0.00"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Pagamentos Pendentes</p>
                    <p className="text-lg font-semibold text-yellow-600">{reportData.pendingPayments}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Período do Relatório</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700">
                De <span className="font-semibold">{new Date(reportData.periodStart).toLocaleDateString("pt-BR")}</span>{" "}
                até <span className="font-semibold">{new Date(reportData.periodEnd).toLocaleDateString("pt-BR")}</span>
              </p>
            </CardContent>
          </Card>

          <div className="flex gap-2">
            <Button className="bg-blue-600 hover:bg-blue-700">Exportar PDF</Button>
            <Button variant="outline">Exportar Excel</Button>
          </div>
        </>
      ) : null}
    </div>
  )
}
