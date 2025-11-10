"use client"

import type React from "react"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState } from "react"

interface PatientFormProps {
  onSuccess?: () => void
}

export function PatientForm({ onSuccess }: PatientFormProps) {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    cpf: "",
    dateOfBirth: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    isMinor: false,
    guardianEmail: "",
    healthInsurance: "",
    insuranceNumber: "",
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const supabase = createClient()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    const checked = (e.target as HTMLInputElement).checked

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser()
      if (!authUser) {
        setError("Usuário não autenticado")
        return
      }

      // Atualizar user_profiles
      const { error: profileError } = await supabase
        .from("user_profiles")
        .update({
          first_name: formData.firstName,
          last_name: formData.lastName,
          phone: formData.phone,
          cpf: formData.cpf,
          date_of_birth: formData.dateOfBirth,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          zip_code: formData.zipCode,
        })
        .eq("id", authUser.id)

      if (profileError) throw profileError

      // Criar registro de paciente
      let guardianId = null
      if (formData.isMinor && formData.guardianEmail) {
        // Buscar ID do responsável
        const { data: guardianProfile } = await supabase
          .from("user_profiles")
          .select("id")
          .eq("email", formData.guardianEmail)
          .single()

        if (guardianProfile) {
          guardianId = guardianProfile.id
        }
      }

      const { error: patientError } = await supabase.from("patients").upsert({
        id: authUser.id,
        is_minor: formData.isMinor,
        legal_guardian_id: guardianId,
        health_insurance_provider: formData.healthInsurance,
        health_insurance_number: formData.insuranceNumber,
      })

      if (patientError) throw patientError

      setSuccess(true)
      onSuccess?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar dados")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Meus Dados</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="firstName">Nome *</Label>
              <Input id="firstName" name="firstName" value={formData.firstName} onChange={handleChange} required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="lastName">Sobrenome *</Label>
              <Input id="lastName" name="lastName" value={formData.lastName} onChange={handleChange} required />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                required
                disabled
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input id="phone" name="phone" value={formData.phone} onChange={handleChange} />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="cpf">CPF</Label>
              <Input id="cpf" name="cpf" value={formData.cpf} onChange={handleChange} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="dateOfBirth">Data de Nascimento</Label>
              <Input
                id="dateOfBirth"
                name="dateOfBirth"
                type="date"
                value={formData.dateOfBirth}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="address">Endereço</Label>
            <Input id="address" name="address" value={formData.address} onChange={handleChange} />
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="city">Cidade</Label>
              <Input id="city" name="city" value={formData.city} onChange={handleChange} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="state">Estado</Label>
              <Input id="state" name="state" maxLength={2} value={formData.state} onChange={handleChange} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="zipCode">CEP</Label>
              <Input id="zipCode" name="zipCode" value={formData.zipCode} onChange={handleChange} />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="healthInsurance">Plano de Saúde</Label>
              <Input
                id="healthInsurance"
                name="healthInsurance"
                value={formData.healthInsurance}
                onChange={handleChange}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="insuranceNumber">Número da Apólice</Label>
              <Input
                id="insuranceNumber"
                name="insuranceNumber"
                value={formData.insuranceNumber}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="flex items-center gap-2 border border-gray-200 rounded-lg p-3">
            <input id="isMinor" name="isMinor" type="checkbox" checked={formData.isMinor} onChange={handleChange} />
            <Label htmlFor="isMinor" className="mb-0">
              Sou menor de 18 anos
            </Label>
          </div>

          {formData.isMinor && (
            <div className="grid gap-2 bg-yellow-50 p-3 rounded-md border border-yellow-200">
              <Label htmlFor="guardianEmail">Email do Responsável Legal *</Label>
              <Input
                id="guardianEmail"
                name="guardianEmail"
                type="email"
                value={formData.guardianEmail}
                onChange={handleChange}
                required={formData.isMinor}
              />
              <p className="text-xs text-gray-600">O responsável legal deve estar cadastrado no sistema</p>
            </div>
          )}

          {error && <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>}

          {success && (
            <div className="rounded-md bg-green-50 p-3 text-sm text-green-700">Dados salvos com sucesso!</div>
          )}

          <Button type="submit" className="bg-blue-600 hover:bg-blue-700 w-full" disabled={isLoading}>
            {isLoading ? "Salvando..." : "Salvar Dados"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
