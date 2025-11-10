export const NotificationTemplates = {
  appointmentReminder: (patientName: string, appointmentDate: string, appointmentTime: string, dentistName: string) => `
Olá ${patientName}!

Lembrete: Você tem uma consulta agendada!

📅 Data: ${appointmentDate}
⏰ Hora: ${appointmentTime}
🏥 Dentista: ${dentistName}

Por favor, confirme sua presença respondendo com SIM ou clique aqui para confirmar no nosso portal.

Dúvidas? Fale conosco!
Unicidental 🦷
  `,

  confirmationRequest: (patientName: string, appointmentDate: string, appointmentTime: string) => `
Olá ${patientName}!

Confirme sua consulta agendada para:
📅 ${appointmentDate} às ${appointmentTime}

Responda SIM para confirmar ou NÃO para cancelar.

Se precisar remarcar, fale conosco pelo WhatsApp.

Unicidental 🦷
  `,

  paymentReminder: (patientName: string, amount: string, dueDate: string) => `
Olá ${patientName}!

Você tem um pagamento pendente:

💰 Valor: R$ ${amount}
📅 Vencimento: ${dueDate}

Clique aqui para pagar ou fale conosco para parcelar.

Unicidental 🦷
  `,

  postCareInstructions: (patientName: string, instructions: string) => `
Olá ${patientName}!

Cuidados pós-procedimento:

${instructions}

Em caso de dúvidas, nos contacte imediatamente.

Unicidental 🦷
  `,

  faqResponse: (patientName: string, question: string, answer: string) => `
Olá ${patientName}!

Sua pergunta: "${question}"

Resposta:
${answer}

Tem mais dúvidas? Responda aqui ou visite nosso portal.

Unicidental 🦷
  `,

  noShowNotification: (patientName: string) => `
Olá ${patientName}!

Notamos que você não compareceu à sua consulta.

Para remarcar, por favor:
1. Visite nosso portal
2. Ou responda este WhatsApp
3. Ou ligue para a clínica

Ficamos na espera de seu agendamento!

Unicidental 🦷
  `,
}
