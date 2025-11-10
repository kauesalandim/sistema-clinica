"use client"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useEffect, useState } from "react"

interface Dentist {
  id: string
  user_profiles?: {
    first_name: string
    last_name: string
    email: string
    phone: string
  }
  registration_number: string
  specialties: string
  availability_status: string
}

export default function DentistasPage() {
  const [dentists, setDentists] = useState<Dentist[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    loadDentists()
  }, [])

  const loadDentists = async () => {
    try {
      const { data } = await supabase
        .from("dentists")
        .select(`
          *,
          user_profiles(first_name, last_name, email, phone)
        `)
        .order("user_profiles(first_name)", { ascending: true })

      if (data) {
        setDentists(data as Dentist[])
      }
    } catch (error) {
      console.error("Erro ao carregar dentistas:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const getAvailabilityColor = (status: string) => {
    switch (status) {
      case "available":
        return "bg-green-100 text-green-800"
      case "busy":
        return "bg-yellow-100 text-yellow-800"
      case "on_leave":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getAvailabilityLabel = (status: string) => {
    const labels: Record<string, string> = {
      available: "Disponível",
      busy: "Ocupado",
      on_leave: "Afastado",
    }
    return labels[status] || status
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dentistas</h1>
          <p className="text-gray-600 mt-2">Gerencie os profissionais da clínica</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700">+ Novo Dentista</Button>
      </div>

      {isLoading ? (
        <div className="text-center py-8">Carregando dentistas...</div>
      ) : dentists.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <p className="text-gray-600">Nenhum dentista cadastrado</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {dentists.map((dentist) => (
            <Card key={dentist.id} className="hover:shadow-md transition">
              <CardContent className="pt-6">
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600">Nome</p>
                    <p className="font-semibold text-gray-900">
                      {dentist.user_profiles?.first_name} {dentist.user_profiles?.last_name}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">CRO</p>
                    <p className="text-sm text-gray-800">{dentist.registration_number}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Especialidades</p>
                    <p className="text-sm text-gray-800">{dentist.specialties || "-"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="text-sm text-gray-800">{dentist.user_profiles?.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Telefone</p>
                    <p className="text-sm text-gray-800">{dentist.user_profiles?.phone || "-"}</p>
                  </div>
                  <div className="pt-2 border-t border-gray-200">
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getAvailabilityColor(dentist.availability_status)}`}
                    >
                      {getAvailabilityLabel(dentist.availability_status)}
                    </span>
                  </div>
                  <Button variant="outline" className="w-full bg-transparent">
                    Editar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
