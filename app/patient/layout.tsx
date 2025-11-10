"use client"

import type React from "react"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

interface UserProfile {
  id: string
  first_name: string
  last_name: string
  email: string
}

export default function PatientLayout({
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

        if (profile && profile.role === "patient") {
          setUser(profile as UserProfile)
        } else if (profile) {
          router.push("/dashboard")
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
      <aside className="w-64 bg-gradient-to-b from-blue-600 to-blue-700 shadow-lg">
        <div className="p-6 text-white">
          <h1 className="text-2xl font-bold">Unicidental</h1>
          <p className="text-blue-100 text-sm">Seu Atendimento</p>
        </div>

        <nav className="space-y-2 px-4 mt-8">
          <Link
            href="/patient"
            className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-blue-500 text-white transition"
          >
            <span>🏠</span> Início
          </Link>
          <Link
            href="/patient/agendamentos"
            className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-blue-500 text-white transition"
          >
            <span>📅</span> Minhas Consultas
          </Link>
          <Link
            href="/patient/historico"
            className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-blue-500 text-white transition"
          >
            <span>📋</span> Histórico
          </Link>
          <Link
            href="/patient/pagamentos"
            className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-blue-500 text-white transition"
          >
            <span>💰</span> Pagamentos
          </Link>
          <Link
            href="/patient/documentos"
            className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-blue-500 text-white transition"
          >
            <span>📄</span> Documentos
          </Link>
          <Link
            href="/patient/faq"
            className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-blue-500 text-white transition"
          >
            <span>❓</span> Dúvidas
          </Link>
        </nav>

        <div className="absolute bottom-6 left-4 right-4">
          <Button
            onClick={handleLogout}
            variant="outline"
            className="w-full text-white border-white hover:bg-blue-500 bg-transparent"
          >
            Sair
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 shadow-sm">
          <div className="flex items-center justify-between px-6 py-4">
            <h2 className="text-lg font-semibold text-gray-800">Olá, {user.first_name}!</h2>
            <div className="text-sm text-gray-600">{user.email}</div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  )
}
