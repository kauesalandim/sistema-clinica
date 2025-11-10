import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { appointmentId } = await request.json()

    const supabase = await createClient()

    // Verificar autorizações
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    // Obter agendamento
    const { data: appointment } = await supabase.from("appointments").select("*").eq("id", appointmentId).single()

    if (!appointment) {
      return NextResponse.json({ error: "Agendamento não encontrado" }, { status: 404 })
    }

    // Verificar permissão
    if (user.id !== appointment.patient_id) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 })
    }

    // Confirmar agendamento
    const { error } = await supabase
      .from("appointments")
      .update({
        confirmed_by_patient: true,
        confirmed_at: new Date().toISOString(),
      })
      .eq("id", appointmentId)

    if (error) {
      return NextResponse.json({ error: "Erro ao confirmar agendamento" }, { status: 500 })
    }

    // Notificar dentista e staff
    await supabase.from("notifications").insert({
      patient_id: appointment.patient_id,
      appointment_id: appointmentId,
      notification_type: "confirmation_request",
      message: "Paciente confirmou a consulta",
      channel: "in_app",
      status: "sent",
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Erro ao confirmar agendamento:", error)
    return NextResponse.json({ error: "Erro ao confirmar agendamento" }, { status: 500 })
  }
}
