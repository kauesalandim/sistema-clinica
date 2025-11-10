"use client"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useState, useEffect } from "react"

interface Patient {
  id: string
  user_profiles?: {
    first_name: string
    last_name: string
    email: string
    phone: string
    cpf: string
  }
  health_insurance_provider?: string
  is_minor?: boolean
}

export default function PatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    loadPatients()
  }, [])

  const loadPatients = async () => {
    try {
      const { data } = await supabase
        .from("patients")
        .select(`
          *,
          user_profiles(first_name, last_name, email, phone, cpf)
        `)
        .order("user_profiles(first_name)", { ascending: true })

      if (data) {
        setPatients(data as Patient[])
      }
    } catch (error) {
      console.error("Erro ao carregar pacientes:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Pacientes</h1>
          <p className="text-gray-600 mt-2">Gerencie o cadastro de pacientes</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700">+ Novo Paciente</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Pacientes</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Carregando pacientes...</div>
          ) : patients.length === 0 ? (
            <div className="text-center py-8 text-gray-600">Nenhum paciente cadastrado</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-gray-200">
                  <tr>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Nome</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Email</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Telefone</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">CPF</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Menor</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {patients.map((patient) => (
                    <tr key={patient.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        {patient.user_profiles?.first_name} {patient.user_profiles?.last_name}
                      </td>
                      <td className="py-3 px-4">{patient.user_profiles?.email}</td>
                      <td className="py-3 px-4">{patient.user_profiles?.phone || "-"}</td>
                      <td className="py-3 px-4">{patient.user_profiles?.cpf || "-"}</td>
                      <td className="py-3 px-4">
                        {patient.is_minor ? (
                          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800">
                            Sim
                          </span>
                        ) : (
                          <span className="text-gray-600">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <button className="text-blue-600 hover:underline text-sm">Detalhes</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
