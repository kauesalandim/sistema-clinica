"use client"

import type React from "react"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

interface UserProfile {
  id: string
  role: string
  first_name: string
  last_name: string
  email: string
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const loadUser = async () => {
      try {
        const {
          data: { user: authUser },
        } = await supabase.auth.getUser()
        if (!authUser) {
          router.push("/auth/login")
          return
        }

        const { data: profile } = await supabase.from("user_profiles").select("*").eq("id", authUser.id).single()

        if (profile) {
          setUser(profile as UserProfile)
        }
      } catch (error) {
        console.error("Erro ao carregar usuário:", error)
        router.push("/auth/login")
      } finally {
        setIsLoading(false)
      }
    }

    loadUser()
  }, [supabase, router])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/auth/login")
  }

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Carregando...</div>
  }

  if (!user) {
    return null
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-sm border-r border-gray-200">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-blue-600">Unicidental</h1>
          <p className="text-sm text-gray-600">Gestão Clínica</p>
        </div>

        <nav className="space-y-2 px-4">
          <Link
            href="/dashboard"
            className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-gray-100 text-gray-700 transition"
          >
            <span>📊</span> Dashboard
          </Link>

          {(user.role === "admin" || user.role === "receptionist") && (
            <>
              <Link
                href="/dashboard/agendamentos"
                className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-gray-100 text-gray-700 transition"
              >
                <span>📅</span> Agendamentos
              </Link>
              <Link
                href="/dashboard/pacientes"
                className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-gray-100 text-gray-700 transition"
              >
                <span>👥</span> Pacientes
              </Link>
            </>
          )}

          {user.role === "dentist" && (
            <>
              <Link
                href="/dashboard/minhas-consultas"
                className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-gray-100 text-gray-700 transition"
              >
                <span>🦷</span> Minhas Consultas
              </Link>
              <Link
                href="/dashboard/meus-pacientes"
                className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-gray-100 text-gray-700 transition"
              >
                <span>📋</span> Meus Pacientes
              </Link>
            </>
          )}

          {user.role === "admin" && (
            <>
              <Link
                href="/dashboard/dentistas"
                className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-gray-100 text-gray-700 transition"
              >
                <span>🏥</span> Dentistas
              </Link>
              <Link
                href="/dashboard/relatorios"
                className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-gray-100 text-gray-700 transition"
              >
                <span>📈</span> Relatórios
              </Link>
              <Link
                href="/dashboard/configuracoes"
                className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-gray-100 text-gray-700 transition"
              >
                <span>⚙️</span> Configurações
              </Link>
            </>
          )}
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 shadow-sm">
          <div className="flex items-center justify-between px-6 py-4">
            <h2 className="text-lg font-semibold text-gray-800">Bem-vindo, {user.first_name}!</h2>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
                Função: <span className="font-semibold capitalize">{user.role}</span>
              </span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">Menu</Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleLogout}>Sair</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  )
}
