"use client"

import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useEffect, useState } from "react"

interface Payment {
  id: string
  amount: number
  payment_method: string
  status: string
  payment_date: string
  created_at: string
  budget_id: string
  transaction_id?: string
}

interface Budget {
  id: string
  total_amount: number
  status: string
  validity_days: number
  created_at: string
  expires_at: string
}

export default function PagamentosPage() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    loadPayments()
    loadBudgets()
  }, [])

  const loadPayments = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from("payments")
        .select("*")
        .eq("patient_id", user.id)
        .order("payment_date", { ascending: false })

      if (data) {
        setPayments(data as Payment[])
      }
    } catch (error) {
      console.error("Erro ao carregar pagamentos:", error)
    }
  }

  const loadBudgets = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from("budgets")
        .select("*")
        .eq("patient_id", user.id)
        .order("created_at", { ascending: false })

      if (data) {
        setBudgets(data as Budget[])
      }
    } catch (error) {
      console.error("Erro ao carregar orçamentos:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "failed":
        return "bg-red-100 text-red-800"
      case "refunded":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusText = (status: string) => {
    const labels: Record<string, string> = {
      completed: "Pago",
      pending: "Pendente",
      failed: "Falhou",
      refunded: "Reembolsado",
    }
    return labels[status] || status
  }

  const getPaymentMethodLabel = (method: string) => {
    const labels: Record<string, string> = {
      credit_card: "Cartão de Crédito",
      debit_card: "Cartão de Débito",
      cash: "Dinheiro",
      check: "Cheque",
      pix: "PIX",
    }
    return labels[method] || method
  }

  const calculateTotalPaid = () => {
    return payments.filter((p) => p.status === "completed").reduce((sum, p) => sum + p.amount, 0)
  }

  const calculateTotalPending = () => {
    return payments.filter((p) => p.status === "pending").reduce((sum, p) => sum + p.amount, 0)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Pagamentos</h1>
        <p className="text-gray-600 mt-2">Gerencie seus pagamentos e orçamentos</p>
      </div>

      {isLoading ? (
        <div className="text-center py-8">Carregando...</div>
      ) : (
        <>
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Pago</CardTitle>
                <span className="text-2xl">✓</span>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">R$ {calculateTotalPaid().toFixed(2)}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pendente</CardTitle>
                <span className="text-2xl">⏳</span>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">R$ {calculateTotalPending().toFixed(2)}</div>
              </CardContent>
            </Card>
          </div>

          {budgets.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Orçamentos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {budgets.map((budget) => (
                    <div key={budget.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="text-sm text-gray-600">Valor</p>
                          <p className="text-lg font-semibold text-gray-900">R$ {budget.total_amount.toFixed(2)}</p>
                        </div>
                        <div>
                          <span
                            className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                              budget.status === "approved"
                                ? "bg-green-100 text-green-800"
                                : budget.status === "pending"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {budget.status === "approved"
                              ? "Aprovado"
                              : budget.status === "pending"
                                ? "Pendente"
                                : budget.status}
                          </span>
                        </div>
                      </div>
                      <p className="text-xs text-gray-600">
                        Válido até: {new Date(budget.expires_at).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Histórico de Pagamentos</CardTitle>
            </CardHeader>
            <CardContent>
              {payments.length === 0 ? (
                <p className="text-center text-gray-600 py-8">Nenhum pagamento registrado</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="border-b border-gray-200">
                      <tr>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Valor</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Método</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Data</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payments.map((payment) => (
                        <tr key={payment.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-4 font-semibold">R$ {payment.amount.toFixed(2)}</td>
                          <td className="py-3 px-4">{getPaymentMethodLabel(payment.payment_method)}</td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadge(payment.status)}`}
                            >
                              {getStatusText(payment.status)}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            {payment.payment_date ? new Date(payment.payment_date).toLocaleDateString("pt-BR") : "-"}
                          </td>
                          <td className="py-3 px-4">
                            <button className="text-blue-600 hover:underline text-sm">Recibo</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
