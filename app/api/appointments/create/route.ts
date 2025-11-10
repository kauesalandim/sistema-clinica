import { createClient } from "@/lib/supabase/server"
import { sendWhatsAppMessage } from "@/lib/twilio/client"
import { NotificationTemplates } from "@/lib/notification-templates"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { patientId, dentistId, procedureId, appointmentDate, appointmentTime } = await request.json()

    const supabase = await createClient()

    // Verificar autorizações
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    // Verificar se é staff ou o próprio paciente
    const { data: userProfile } = await supabase.from("user_profiles").select("role").eq("id", user.id).single()

    if (!userProfile || (userProfile.role === "patient" && user.id !== patientId)) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 })
    }

    // Validar se dentista está disponível
    const { data: existingAppointment } = await supabase
      .from("appointments")
      .select("id")
      .eq("dentist_id", dentistId)
      .eq("appointment_date", appointmentDate)
      .eq("appointment_time", appointmentTime)
      .neq("status", "cancelled")

    if (existingAppointment && existingAppointment.length > 0) {
      return NextResponse.json({ error: "Horário não disponível" }, { status: 400 })
    }

    // Criar agendamento
    const { data: appointment, error } = await supabase
      .from("appointments")
      .insert({
        patient_id: patientId,
        dentist_id: dentistId,
        procedure_id: procedureId,
        appointment_date: appointmentDate,
        appointment_time: appointmentTime,
        status: "scheduled",
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: "Erro ao criar agendamento" }, { status: 500 })
    }

    // Obter dados para enviar notificação
    const { data: patient } = await supabase
      .from("patients")
      .select("*, user_profiles(first_name, last_name, phone)")
      .eq("id", patientId)
      .single()

    const { data: dentist } = await supabase
      .from("dentists")
      .select("*, user_profiles(first_name, last_name)")
      .eq("id", dentistId)
      .single()

    const { data: procedure } = await supabase.from("procedures").select("*").eq("id", procedureId).single()

    // Enviar mensagem de confirmação
    if (patient?.user_profiles?.phone) {
      const message = NotificationTemplates.appointmentReminder(
        patient.user_profiles.first_name,
        new Date(appointmentDate).toLocaleDateString("pt-BR"),
        appointmentTime,
        `${dentist?.user_profiles?.first_name} ${dentist?.user_profiles?.last_name}`,
      )

      await sendWhatsAppMessage(patient.user_profiles.phone, message)

      // Registrar notificação
      await supabase.from("notifications").insert({
        patient_id: patientId,
        appointment_id: appointment.id,
        notification_type: "appointment_reminder",
        message,
        channel: "whatsapp",
        status: "sent",
        sent_at: new Date().toISOString(),
      })
    }

    return NextResponse.json({
      success: true,
      appointment: appointment.id,
    })
  } catch (error) {
    console.error("Erro ao criar agendamento:", error)
    return NextResponse.json({ error: "Erro ao criar agendamento" }, { status: 500 })
  }
}
