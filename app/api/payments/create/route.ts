import { createClient } from "@/lib/supabase/server"
import { sendWhatsAppMessage } from "@/lib/twilio/client"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { budgetId, patientId, amount, paymentMethod } = await request.json()

    const supabase = await createClient()

    // Verificar autorizações
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

    // Criar pagamento
    const { data: payment, error } = await supabase
      .from("payments")
      .insert({
        budget_id: budgetId,
        patient_id: patientId,
        amount,
        payment_method: paymentMethod,
        status: paymentMethod === "cash" ? "completed" : "pending",
        payment_date: paymentMethod === "cash" ? new Date().toISOString() : null,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: "Erro ao registrar pagamento" }, { status: 500 })
    }

    // Enviar confirmação ao paciente
    const { data: patient } = await supabase
      .from("patients")
      .select("*, user_profiles(first_name, phone)")
      .eq("id", patientId)
      .single()

    if (patient?.user_profiles?.phone && paymentMethod === "cash") {
      const message = `Olá ${patient.user_profiles.first_name}!\n\nSeu pagamento de R$ ${amount.toFixed(2)} foi registrado com sucesso!\n\nObrigado! 🦷\nUnicidental`
      await sendWhatsAppMessage(patient.user_profiles.phone, message)
    }

    return NextResponse.json({
      success: true,
      paymentId: payment.id,
    })
  } catch (error) {
    console.error("Erro ao registrar pagamento:", error)
    return NextResponse.json({ error: "Erro ao registrar pagamento" }, { status: 500 })
  }
}
