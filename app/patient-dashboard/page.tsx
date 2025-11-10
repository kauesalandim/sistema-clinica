import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { AppointmentBookingForm } from "@/components/appointment-booking-form"
import { MyAppointments } from "@/components/my-appointments"

export default async function PatientDashboard() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase.from("user_profiles").select("*").eq("id", user.id).single()

  if (!profile || profile.user_type !== "patient") {
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
            <p className="text-gray-600 text-sm">Clínica Odontológica</p>
          </div>
          <div className="flex items-center gap-4">
            <div>
              <p className="text-sm text-gray-600">Bem-vindo,</p>
              <p className="font-semibold">{profile.full_name}</p>
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Booking Form */}
          <div className="lg:col-span-1">
            <AppointmentBookingForm userId={user.id} />
          </div>

          {/* My Appointments */}
          <div className="lg:col-span-2">
            <MyAppointments userId={user.id} />
          </div>
        </div>
      </main>
    </div>
  )
}
