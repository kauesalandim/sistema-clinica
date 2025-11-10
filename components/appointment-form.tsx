"use client"

import type React from "react"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState, useEffect } from "react"

interface AppointmentFormProps {
  patientId?: string
  onSuccess?: () => void
}

interface Dentist {
  id: string
  user_profiles: { first_name: string; last_name: string }
}

interface Procedure {
  id: string
  name: string
  estimated_duration_minutes: number
}

export function AppointmentForm({ patientId, onSuccess }: AppointmentFormProps) {
  const [dentists, setDentists] = useState<Dentist[]>([])
  const [procedures, setProcedures] = useState<Procedure[]>([])
  const [selectedDentist, setSelectedDentist] = useState("")
  const [selectedProcedure, setSelectedProcedure] = useState("")
  const [appointmentDate, setAppointmentDate] = useState("")
  const [appointmentTime, setAppointmentTime] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    loadDentists()
    loadProcedures()
  }, [])

  const loadDentists = async () => {
    try {
      const { data } = await supabase
        .from("dentists")
        .select("id, user_profiles(first_name, last_name)")
        .eq("availability_status", "available")
      if (data) {
        setDentists(data as any)
      }
    } catch (error) {
      console.error("Erro ao carregar dentistas:", error)
    }
  }

  const loadProcedures = async () => {
    try {
      const { data } = await supabase.from("procedures").select("*").eq("is_active", true)
      if (data) {
        setProcedures(data as Procedure[])
      }
    } catch (error) {
      console.error("Erro ao carregar procedimentos:", error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setSuccess(false)

    try {
      if (!selectedDentist || !selectedProcedure || !appointmentDate || !appointmentTime) {
        setError("Todos os campos são obrigatórios")
        return
      }

      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        setError("Usuário não autenticado")
        return
      }

      const response = await fetch("/api/appointments/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId: patientId || user.id,
          dentistId: selectedDentist,
          procedureId: selectedProcedure,
          appointmentDate,
          appointmentTime,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Erro ao criar agendamento")
      }

      setSuccess(true)
      setSelectedDentist("")
      setSelectedProcedure("")
      setAppointmentDate("")
      setAppointmentTime("")
      onSuccess?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao criar agendamento")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Novo Agendamento</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="dentist">Dentista *</Label>
            <select
              id="dentist"
              value={selectedDentist}
              onChange={(e) => setSelectedDentist(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2"
              required
            >
              <option value="">Selecione um dentista</option>
              {dentists.map((dentist) => (
                <option key={dentist.id} value={dentist.id}>
                  {dentist.user_profiles.first_name} {dentist.user_profiles.last_name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="procedure">Procedimento *</Label>
            <select
              id="procedure"
              value={selectedProcedure}
              onChange={(e) => setSelectedProcedure(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2"
              required
            >
              <option value="">Selecione um procedimento</option>
              {procedures.map((procedure) => (
                <option key={procedure.id} value={procedure.id}>
                  {procedure.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="date">Data *</Label>
              <Input
                id="date"
                type="date"
                value={appointmentDate}
                onChange={(e) => setAppointmentDate(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="time">Hora *</Label>
              <Input
                id="time"
                type="time"
                value={appointmentTime}
                onChange={(e) => setAppointmentTime(e.target.value)}
                required
              />
            </div>
          </div>

          {error && <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>}

          {success && (
            <div className="rounded-md bg-green-50 p-3 text-sm text-green-700">Agendamento criado com sucesso!</div>
          )}

          <div className="flex gap-2">
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={isLoading}>
              {isLoading ? "Criando..." : "Agendar"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
