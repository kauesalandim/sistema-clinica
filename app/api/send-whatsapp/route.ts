import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    let { appointmentId, patientPhone } = body

    console.log("[v0] Iniciando envio WhatsApp para:", patientPhone)

    if (!patientPhone || patientPhone.trim() === "") {
      return NextResponse.json({ error: "Telefone do paciente não fornecido" }, { status: 400 })
    }

    patientPhone = patientPhone.trim()
    if (patientPhone.startsWith("+")) {
      patientPhone = patientPhone.substring(1)
    }
    if (!patientPhone.startsWith("55")) {
      patientPhone = "55" + patientPhone
    }

    const supabase = await createClient()

    const { data: appointments, error: appointmentError } = await supabase
      .from("appointments")
      .select("appointment_date, appointment_time, location, procedure_id, dentist_id")
      .eq("id", appointmentId)

    if (appointmentError) {
      console.error("[v0] Erro ao buscar consulta:", appointmentError.message)
      return NextResponse.json({ error: appointmentError.message }, { status: 500 })
    }

    if (!appointments || appointments.length === 0) {
      return NextResponse.json({ error: "Consulta não encontrada" }, { status: 404 })
    }

    const appointment = appointments[0]

    const { data: procedures } = await supabase.from("procedures").select("name").eq("id", appointment.procedure_id)

    const { data: dentists } = await supabase.from("user_profiles").select("full_name").eq("id", appointment.dentist_id)

    const procedureName = procedures?.[0]?.name || "Procedimento"
    const dentistName = dentists?.[0]?.full_name || "Dentista"

    const message = `
Olá! Sua consulta foi confirmada!

Detalhes da sua consulta:
📅 Data: ${appointment.appointment_date}
🕐 Horário: ${appointment.appointment_time}
🏥 Local: ${appointment.location}
🦷 Procedimento: ${procedureName}
👨‍⚕️ Dentista: Dr. ${dentistName}

Chegue 10 minutos antes do horário marcado.
Dúvidas? Entre em contato conosco!

Unicidental - Clínica Odontológica
    `.trim()

    if (process.env.N8N_WEBHOOK_URL) {
      try {
        const response = await fetch(process.env.N8N_WEBHOOK_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            phone: patientPhone,
            message: message,
          }),
        })

        if (!response.ok) {
          console.error("[v0] Erro ao enviar para n8n webhook:", response.status)
          return NextResponse.json(
            {
              error: "Erro ao enviar WhatsApp via n8n",
            },
            { status: response.status },
          )
        }

        console.log("[v0] ✅ Mensagem WhatsApp enviada via n8n para:", patientPhone)
      } catch (n8nError) {
        console.error("[v0] Erro ao chamar webhook n8n:", n8nError)
        return NextResponse.json(
          {
            error: `Erro ao enviar WhatsApp: ${n8nError instanceof Error ? n8nError.message : "Erro desconhecido"}`,
          },
          { status: 500 },
        )
      }
    } else {
      console.log("[v0] ⚠️ Variável N8N_WEBHOOK_URL não configurada. Simulando envio:")
      console.log(`Para: ${patientPhone}`)
      console.log(`Mensagem: ${message}`)
    }

    const { error: updateError } = await supabase
      .from("appointments")
      .update({ whatsapp_sent_at: new Date().toISOString() })
      .eq("id", appointmentId)

    if (updateError) {
      console.warn("[v0] Aviso ao atualizar timestamp:", updateError.message)
    }

    return NextResponse.json(
      {
        success: true,
        message: "Consulta confirmada e mensagem WhatsApp enviada!",
      },
      { status: 200 },
    )
  } catch (error) {
    console.error("[v0] Erro geral:", error)
    return NextResponse.json(
      {
        error: "Erro ao processar solicitação",
      },
      { status: 500 },
    )
  }
}
