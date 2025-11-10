import twilio from "twilio"

export function getTwilioClient() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID
  const authToken = process.env.TWILIO_AUTH_TOKEN
  const whatsappNumber = process.env.TWILIO_WHATSAPP_NUMBER

  if (!accountSid || !authToken) {
    throw new Error("Twilio credentials not configured")
  }

  return {
    client: twilio(accountSid, authToken),
    whatsappNumber: whatsappNumber || "whatsapp:+1234567890",
  }
}

export async function sendWhatsAppMessage(phoneNumber: string, message: string) {
  try {
    const { client, whatsappNumber } = getTwilioClient()

    const result = await client.messages.create({
      body: message,
      from: whatsappNumber,
      to: `whatsapp:+${phoneNumber.replace(/\D/g, "")}`,
    })

    return {
      success: true,
      messageId: result.sid,
    }
  } catch (error) {
    console.error("Erro ao enviar mensagem WhatsApp:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}
