"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface Procedure {
  id: string
  name: string
  description: string
  duration_minutes: number
}

interface Dentist {
  id: string
  full_name: string
  specialization: string | null
}

export function AppointmentBookingForm({ userId }: { userId: string }) {
  const [procedures, setProcedures] = useState<Procedure[]>([])
  const [dentists, setDentists] = useState<Dentist[]>([])
  const [formData, setFormData] = useState({
    procedureId: "",
    dentistId: "",
    date: "",
    time: "",
    location: "",
  })
  const [bookedTimes, setBookedTimes] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    const fetchData = async () => {
      const { data: dentistsData, error: dentistError } = await supabase
        .from("user_profiles")
        .select("id, full_name")
        .eq("user_type", "dentist")

      console.log("[v0] Dentistas query result:", { dentistsData, dentistError })

      if (dentistsData && dentistsData.length > 0) {
        // Buscar especialização de cada dentista
        const dentistsWithSpec = await Promise.all(
          dentistsData.map(async (d: any) => {
            const { data: dentSpec } = await supabase.from("dentists").select("specialization").eq("id", d.id).single()

            return {
              id: d.id,
              full_name: d.full_name,
              specialization: dentSpec?.specialization || null,
            }
          }),
        )
        console.log("[v0] Dentistas com especialização:", dentistsWithSpec)
        setDentists(dentistsWithSpec)
      }

      // Fetch procedures
      const { data: procData } = await supabase.from("procedures").select("*")
      if (procData) setProcedures(procData)
    }

    fetchData()
  }, [])

  // Fetch booked times when date changes
  useEffect(() => {
    const fetchBookedTimes = async () => {
      if (formData.date && formData.dentistId) {
        const { data } = await supabase
          .from("appointments")
          .select("appointment_time")
          .eq("dentist_id", formData.dentistId)
          .eq("appointment_date", formData.date)
          .eq("status", "pending")

        if (data) {
          const times = data.map((apt) => apt.appointment_time)
          setBookedTimes(times)
        }
      }
    }

    fetchBookedTimes()
  }, [formData.date, formData.dentistId])

  const getAvailableTimes = () => {
    const times = []
    for (let hour = 8; hour < 18; hour++) {
      times.push(`${String(hour).padStart(2, "0")}:00`)
      times.push(`${String(hour).padStart(2, "0")}:30`)
    }
    return times.filter((time) => !bookedTimes.includes(time))
  }

  const isValidDate = (dateString: string) => {
    const date = new Date(dateString)
    const day = date.getDay()
    // 0 = Sunday, 6 = Saturday
    return day !== 0 && day !== 6
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      if (!isValidDate(formData.date)) {
        throw new Error("A clínica funciona apenas de segunda a sexta")
      }

      const appointmentDate = formData.date // já vem como YYYY-MM-DD do input type="date"

      console.log("[v0] Data enviada para banco:", appointmentDate)

      const { error: insertError } = await supabase.from("appointments").insert([
        {
          patient_id: userId,
          dentist_id: formData.dentistId,
          procedure_id: formData.procedureId,
          appointment_date: appointmentDate,
          appointment_time: formData.time,
          location: formData.location,
          status: "pending",
        },
      ])

      if (insertError) throw insertError

      setSuccess(true)
      setFormData({
        procedureId: "",
        dentistId: "",
        date: "",
        time: "",
        location: "",
      })

      setTimeout(() => setSuccess(false), 5000)
    } catch (err: any) {
      setError(err.message || "Erro ao agendar consulta")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <CardTitle>Agendar Consulta</CardTitle>
        <CardDescription>Preencha os dados abaixo para agendar sua consulta</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit}>
          <div className="flex flex-col gap-4">
            <div className="grid gap-2">
              <Label htmlFor="procedure">Procedimento</Label>
              <Select
                value={formData.procedureId}
                onValueChange={(value) => setFormData({ ...formData, procedureId: value })}
              >
                <SelectTrigger id="procedure">
                  <SelectValue placeholder="Escolha um procedimento" />
                </SelectTrigger>
                <SelectContent>
                  {procedures.map((proc) => (
                    <SelectItem key={proc.id} value={proc.id}>
                      {proc.name} ({proc.duration_minutes} min)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="dentist">Dentista</Label>
              <Select
                value={formData.dentistId}
                onValueChange={(value) => setFormData({ ...formData, dentistId: value })}
              >
                <SelectTrigger id="dentist">
                  <SelectValue placeholder="Escolha um dentista" />
                </SelectTrigger>
                <SelectContent>
                  {dentists.length > 0 ? (
                    dentists.map((dentist) => (
                      <SelectItem key={dentist.id} value={dentist.id}>
                        Dr. {dentist.full_name} {dentist.specialization ? `(${dentist.specialization})` : ""}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="default">Nenhum dentista disponível</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="date">Data (Seg-Sex)</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
                min={new Date().toISOString().split("T")[0]}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="time">Horário (08:00 - 18:00)</Label>
              <Select value={formData.time} onValueChange={(value) => setFormData({ ...formData, time: value })}>
                <SelectTrigger id="time">
                  <SelectValue placeholder="Escolha um horário" />
                </SelectTrigger>
                <SelectContent>
                  {getAvailableTimes().map((time) => (
                    <SelectItem key={time} value={time}>
                      {time}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="location">Local</Label>
              <Input
                id="location"
                placeholder="Ex: Sala 1, Sala 2"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                required
              />
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}
            {success && (
              <p className="text-sm text-green-500">
                Consulta agendada com sucesso! Em breve você receberá uma confirmação.
              </p>
            )}

            <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={isLoading}>
              {isLoading ? "Agendando..." : "Agendar Consulta"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
