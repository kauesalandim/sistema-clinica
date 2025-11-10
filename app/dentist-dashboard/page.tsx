import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { DentistAppointmentsList } from "@/components/dentist-appointments-list"

export default async function DentistDashboard() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase.from("user_profiles").select("*").eq("id", user.id).single()

  if (!profile || profile.user_type !== "dentist") {
    redirect("/")
  }

  const handleLogout = async () => {
    "use server"
    const supabase = await createClient()
    await supabase.auth.signOut()
    redirect("/")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-blue-600">Unicidental</h1>
            <p className="text-gray-600 text-sm">Painel de Dentista</p>
          </div>
          <div className="flex items-center gap-4">
            <div>
              <p className="text-sm text-gray-600">Bem-vindo,</p>
              <p className="font-semibold">Dr. {profile.full_name}</p>
            </div>
            <form action={handleLogout}>
              <button type="submit" className="text-red-600 hover:text-red-700 font-semibold text-sm">
                Sair
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1">
          <DentistAppointmentsList dentistId={user.id} />
        </div>
      </main>
    </div>
  )
}
