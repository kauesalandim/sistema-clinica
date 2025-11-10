"use client"

import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useEffect, useState } from "react"

interface FAQItem {
  id: string
  category: string
  question: string
  answer: string
}

export default function PatientFAQPage() {
  const [faqs, setFaqs] = useState<FAQItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    loadFAQs()
  }, [])

  const loadFAQs = async () => {
    try {
      const { data } = await supabase
        .from("faq")
        .select("*")
        .eq("is_active", true)
        .order("order_index", { ascending: true })

      if (data) {
        setFaqs(data as FAQItem[])
      }
    } catch (error) {
      console.error("Erro ao carregar FAQs:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const groupedFAQs = faqs.reduce(
    (acc, faq) => {
      if (!acc[faq.category]) {
        acc[faq.category] = []
      }
      acc[faq.category].push(faq)
      return acc
    },
    {} as Record<string, FAQItem[]>,
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dúvidas Frequentes</h1>
        <p className="text-gray-600 mt-2">Encontre respostas para suas perguntas</p>
      </div>

      {isLoading ? (
        <div className="text-center py-8">Carregando perguntas...</div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedFAQs).map(([category, items]) => (
            <div key={category}>
              <h2 className="text-xl font-bold text-gray-900 mb-3">{category}</h2>
              <div className="space-y-2">
                {items.map((faq) => (
                  <Card key={faq.id} className="cursor-pointer hover:shadow-md transition">
                    <CardContent className="pt-6">
                      <button
                        onClick={() => setExpandedId(expandedId === faq.id ? null : faq.id)}
                        className="w-full text-left flex items-center justify-between"
                      >
                        <span className="font-semibold text-gray-900">{faq.question}</span>
                        <span className="text-2xl">{expandedId === faq.id ? "−" : "+"}</span>
                      </button>
                      {expandedId === faq.id && (
                        <div className="mt-4 pt-4 border-t border-gray-200 text-gray-700">{faq.answer}</div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-900">Não encontrou o que procura?</CardTitle>
        </CardHeader>
        <CardContent className="text-blue-800">
          <p className="mb-3">Fale com nossa equipe através do WhatsApp:</p>
          <p className="font-semibold">📱 (XX) XXXXX-XXXX</p>
        </CardContent>
      </Card>
    </div>
  )
}
