"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { WhatsAppPreviewModal } from "./whatsapp-preview-modal"

interface Appointment {
  id: string
  appointment_date: string
  appointment_time: string
  location: string
  status: string
  patient_id: string
  procedure_id: string
}

export function DentistAppointmentsList({ dentistId }: { dentistId: string }) {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [enrichedAppointments, setEnrichedAppointments] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [confirming, setConfirming] = useState<string | null>(null)
  const [showPreview, setShowPreview] = useState(false)
  const [previewData, setPreviewData] = useState<{
    appointmentId: string
    message: string
    patientName: string
    patientPhone: string
  } | null>(null)

  const supabase = createClient()

  useEffect(() => {
    const fetchAppointments = async () => {
      console.log("[v0] Buscando consultas para dentista:", dentistId)

      const { data: appointmentsData, error: aptsError } = await supabase
        .from("appointments")
        .select("*")
        .eq("dentist_id", dentistId)
        .eq("status", "pending")
        .order("appointment_date", { ascending: true })

      console.log("[v0] Consultas retornadas:", appointmentsData)
      console.log("[v0] Erro ao buscar consultas:", aptsError)

      if (aptsError) {
        console.error("[v0] Erro ao buscar consultas:", aptsError)
        setIsLoading(false)
        return
      }

      if (!appointmentsData || appointmentsData.length === 0) {
        console.log("[v0] Nenhuma consulta pendente encontrada")
        setAppointments([])
        setEnrichedAppointments([])
        setIsLoading(false)
        return
      }

      setAppointments(appointmentsData)

      const enriched = await Promise.all(
        appointmentsData.map(async (apt: any) => {
          console.log("[v0] Enriquecendo consulta:", apt.id, "Patient ID:", apt.patient_id)

          const { data: patientData, error: patientError } = await supabase.rpc("get_patient_info", {
            patient_id: apt.patient_id,
          })

          const { data: procedureData, error: procedureError } = await supabase
            .from("procedures")
            .select("name")
            .eq("id", apt.procedure_id)

          console.log("[v0] Dados do paciente:", patientData)
          console.log("[v0] Erro ao buscar paciente:", patientError)

          const patient = Array.isArray(patientData) && patientData.length > 0 ? patientData[0] : null

          return {
            ...apt,
            patient_name: patient?.full_name || "Paciente desconhecido",
            patient_phone: patient?.phone || "",
            procedure_name: procedureData?.[0]?.name || "Procedimento desconhecido",
          }
        }),
      )

      console.log("[v0] Consultas enriquecidas:", enriched)
      setEnrichedAppointments(enriched)
      setIsLoading(false)
    }

    fetchAppointments()

    // Subscribe to changes
    const channel = supabase
      .channel(`dentist-appointments:${dentistId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "appointments",
          filter: `dentist_id=eq.${dentistId}`,
        },
        () => {
          fetchAppointments()
        },
      )
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [dentistId])

  const handleConfirmClick = async (apt: any) => {
    const { data: dentistData } = await supabase.from("user_profiles").select("full_name").eq("id", apt.dentist_id)

    const dentistName = dentistData?.[0]?.full_name || "Dentista"

    const message = `Olá! Sua consulta foi confirmada!

Detalhes da sua consulta:
📅 Data: ${apt.appointment_date}
🕐 Horário: ${apt.appointment_time}
🏥 Local: ${apt.location}
🦷 Procedimento: ${apt.procedure_name}
👨‍⚕️ Dentista: Dr. ${dentistName}

Chegue 10 minutos antes do horário marcado.
Dúvidas? Entre em contato conosco!

Unicidental - Clínica Odontológica`

    setPreviewData({
      appointmentId: apt.id,
      message,
      patientName: apt.patient_name,
      patientPhone: apt.patient_phone,
    })
    setShowPreview(true)
  }

  const handleConfirmFromPreview = async () => {
    if (!previewData) return

    setConfirming(previewData.appointmentId)

    try {
      const { error } = await supabase
        .from("appointments")
        .update({
          status: "confirmed",
          confirmed_by_dentist_at: new Date().toISOString(),
        })
        .eq("id", previewData.appointmentId)

      if (error) throw error

      await sendWhatsAppNotification(previewData.appointmentId, previewData.patientPhone)

      setEnrichedAppointments(enrichedAppointments.filter((apt) => apt.id !== previewData.appointmentId))
      setShowPreview(false)
    } catch (err) {
      console.error("Erro ao confirmar consulta:", err)
      alert("Erro ao confirmar consulta")
    } finally {
      setConfirming(null)
    }
  }

  const sendWhatsAppNotification = async (appointmentId: string, patientPhone: string) => {
    try {
      if (!patientPhone || patientPhone.trim() === "") {
        console.error("[v0] ❌ Telefone do paciente vazio.")
        alert("Erro: Paciente não tem telefone cadastrado.")
        return
      }

      let formattedPhone = patientPhone.trim()
      if (!formattedPhone.startsWith("+")) {
        formattedPhone = "+55" + formattedPhone
      }

      console.log("[v0] Enviando WhatsApp para:", formattedPhone)
      const response = await fetch("/api/send-whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appointmentId,
          patientPhone: formattedPhone,
        }),
      })

      let responseData
      try {
        responseData = await response.json()
      } catch {
        responseData = { error: "Erro ao processar resposta do servidor" }
      }

      if (!response.ok) {
        console.error("[v0] Erro ao enviar WhatsApp:", responseData)
      } else {
        console.log("[v0] ✅ WhatsApp enviado com sucesso:", responseData)
      }
    } catch (err) {
      console.error("[v0] Erro ao enviar WhatsApp:", err)
    }
  }

  if (isLoading) {
    return <div>Carregando consultas...</div>
  }

  return (
    <>
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle>Consultas Pendentes</CardTitle>
          <CardDescription>Revise e confirme as consultas agendadas</CardDescription>
        </CardHeader>
        <CardContent>
          {enrichedAppointments.length === 0 ? (
            <p className="text-gray-500">Nenhuma consulta pendente</p>
          ) : (
            <div className="space-y-4">
              {enrichedAppointments.map((apt) => (
                <div
                  key={apt.id}
                  className="border border-gray-200 rounded-lg p-4 flex justify-between items-start bg-white hover:shadow-md transition"
                >
                  <div>
                    <h3 className="font-semibold text-lg">{apt.procedure_name}</h3>
                    <p className="text-gray-600 text-sm">Paciente: {apt.patient_name}</p>
                    <p className="text-gray-600 text-sm">Telefone: {apt.patient_phone}</p>
                    <p className="text-gray-600 text-sm">
                      Data: {apt.appointment_date} às {apt.appointment_time}
                    </p>
                    <p className="text-gray-600 text-sm">Local: {apt.location}</p>
                  </div>
                  <Button
                    className="bg-green-600 hover:bg-green-700"
                    onClick={() => handleConfirmClick(apt)}
                    disabled={confirming === apt.id}
                  >
                    {confirming === apt.id ? "Confirmando..." : "Confirmar"}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <WhatsAppPreviewModal
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        onConfirm={handleConfirmFromPreview}
        message={previewData?.message || ""}
        patientName={previewData?.patientName || ""}
        isLoading={confirming !== null}
      />
    </>
  )
}
