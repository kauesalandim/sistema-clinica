import { createClient } from "@/lib/supabase/server"
import { sendWhatsAppMessage } from "@/lib/twilio/client"
import { NotificationTemplates } from "@/lib/notification-templates"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  // Verificar se é uma requisição interna
  const authHeader = request.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  try {
    const supabase = await createClient()

    // Buscar agendamentos de amanhã não confirmados
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const tomorrowStr = tomorrow.toISOString().split("T")[0]

    const { data: appointments } = await supabase
      .from("appointments")
      .select(`
        *,
        patients(*, user_profiles(first_name, phone)),
        dentists(user_profiles(first_name, last_name)),
        procedures(name)
      `)
      .eq("appointment_date", tomorrowStr)
      .eq("confirmed_by_patient", false)
      .neq("status", "cancelled")

    let sentCount = 0

    for (const apt of appointments || []) {
      if (apt.patients?.user_profiles?.phone) {
        const message = NotificationTemplates.confirmationRequest(
          apt.patients.user_profiles.first_name,
          new Date(apt.appointment_date).toLocaleDateString("pt-BR"),
          apt.appointment_time,
        )

        const result = await sendWhatsAppMessage(apt.patients.user_profiles.phone, message)

        if (result.success) {
          await supabase.from("appointments").update({ confirmation_sent: true }).eq("id", apt.id)

          sentCount++
        }
      }
    }

    return NextResponse.json({
      success: true,
      sentCount,
      message: `${sentCount} lembretes de confirmação enviados`,
    })
  } catch (error) {
    console.error("Erro ao enviar lembretes:", error)
    return NextResponse.json({ error: "Erro ao enviar lembretes" }, { status: 500 })
  }
}
