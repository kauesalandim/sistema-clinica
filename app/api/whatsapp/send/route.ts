import { createClient } from "@/lib/supabase/server"
import { sendWhatsAppMessage } from "@/lib/twilio/client"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { patientId, message, type } = await request.json()

    // Verificar se o usuário é staff (admin, recepcionista ou dentista)
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const { data: userProfile } = await supabase.from("user_profiles").select("role").eq("id", user.id).single()

    if (!userProfile || !["admin", "receptionist", "dentist"].includes(userProfile.role)) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 })
    }

    // Obter dados do paciente
    const { data: patient } = await supabase.from("patients").select("*").eq("id", patientId).single()

    if (!patient) {
      return NextResponse.json({ error: "Paciente não encontrado" }, { status: 404 })
    }

    const { data: userProfileData } = await supabase.from("user_profiles").select("phone").eq("id", patientId).single()

    if (!userProfileData?.phone) {
      return NextResponse.json({ error: "Telefone do paciente não cadastrado" }, { status: 400 })
    }

    // Enviar mensagem
    const result = await sendWhatsAppMessage(userProfileData.phone, message)

    if (result.success) {
      // Registrar notificação no banco
      await supabase.from("notifications").insert({
        patient_id: patientId,
        notification_type: type || "general_info",
        message,
        channel: "whatsapp",
        status: "sent",
        sent_at: new Date().toISOString(),
      })

      return NextResponse.json({ success: true, messageId: result.messageId })
    } else {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }
  } catch (error) {
    console.error("Erro ao enviar WhatsApp:", error)
    return NextResponse.json({ error: "Erro ao enviar mensagem" }, { status: 500 })
  }
}
