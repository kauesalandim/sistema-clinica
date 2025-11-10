"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

interface Appointment {
  id: string
  appointment_date: string
  appointment_time: string
  location: string
  status: string
  procedure_id: string
  dentist_id: string
}

export function MyAppointments({ userId }: { userId: string }) {
  const [appointments, setAppointments] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const supabase = createClient()

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const { data: appointmentsData, error: appointmentsError } = await supabase
          .from("appointments")
          .select("*")
          .eq("patient_id", userId)
          .order("appointment_date", { ascending: true })

        console.log("[v0] Appointments query result:", { appointmentsData, appointmentsError })

        if (appointmentsError) {
          console.error("[v0] Erro ao buscar consultas:", appointmentsError)
          setIsLoading(false)
          return
        }

        if (!appointmentsData || appointmentsData.length === 0) {
          setAppointments([])
          setIsLoading(false)
          return
        }

        const enrichedAppointments = await Promise.all(
          appointmentsData.map(async (apt) => {
            const [{ data: procedure }, { data: dentist }, { data: dentistProfile }] = await Promise.all([
              supabase.from("procedures").select("name").eq("id", apt.procedure_id).single(),
              supabase.from("dentists").select("*").eq("id", apt.dentist_id).single(),
              supabase.from("user_profiles").select("full_name").eq("id", apt.dentist_id).single(),
            ])

            return {
              ...apt,
              procedure_name: procedure?.name || "Procedimento desconhecido",
              dentist_name: dentistProfile?.full_name || "Dentista desconhecido",
            }
          }),
        )

        console.log("[v0] Consultas enriquecidas:", enrichedAppointments)
        setAppointments(enrichedAppointments)
      } catch (err) {
        console.error("[v0] Erro geral:", err)
      }
      setIsLoading(false)
    }

    fetchAppointments()

    // Subscribe to changes
    const channel = supabase
      .channel(`appointments:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "appointments",
          filter: `patient_id=eq.${userId}`,
        },
        () => {
          fetchAppointments()
        },
      )
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [userId])

  const handleCancel = async (appointmentId: string) => {
    try {
      const { data, error } = await supabase
        .from("appointments")
        .update({ status: "cancelled" })
        .eq("id", appointmentId)

      console.log("[v0] Cancel result:", { data, error })

      if (error) {
        console.error("[v0] Erro ao cancelar consulta:", error)
        alert("Erro ao cancelar consulta: " + error.message)
        return
      }

      setAppointments(appointments.filter((apt) => apt.id !== appointmentId))
      alert("Consulta cancelada com sucesso!")
    } catch (err) {
      console.error("[v0] Erro geral ao cancelar:", err)
      alert("Erro ao cancelar consulta")
    }
  }

  if (isLoading) {
    return <div>Carregando...</div>
  }

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <CardTitle>Minhas Consultas</CardTitle>
        <CardDescription>Acompanhe todas as suas consultas agendadas</CardDescription>
      </CardHeader>
      <CardContent>
        {appointments.length === 0 ? (
          <p className="text-gray-500">Você não tem consultas agendadas</p>
        ) : (
          <div className="space-y-4">
            {appointments
              .filter((apt) => apt.status !== "cancelled")
              .map((apt) => (
                <div key={apt.id} className="border border-gray-200 rounded-lg p-4 flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-lg">{apt.procedure_name}</h3>
                    <p className="text-gray-600 text-sm">Dr. {apt.dentist_name}</p>
                    <p className="text-gray-600 text-sm">
                      Data: {apt.appointment_date.split("-").reverse().join("/")} às {apt.appointment_time}
                    </p>
                    <p className="text-gray-600 text-sm">Local: {apt.location}</p>
                    <p
                      className={`text-sm mt-2 font-semibold ${
                        apt.status === "confirmed"
                          ? "text-green-600"
                          : apt.status === "cancelled"
                            ? "text-red-600"
                            : "text-yellow-600"
                      }`}
                    >
                      {apt.status === "confirmed"
                        ? "Confirmada"
                        : apt.status === "cancelled"
                          ? "Cancelada"
                          : "Pendente"}
                    </p>
                  </div>
                  {apt.status !== "cancelled" && (
                    <Button variant="destructive" size="sm" onClick={() => handleCancel(apt.id)}>
                      Cancelar
                    </Button>
                  )}
                </div>
              ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
