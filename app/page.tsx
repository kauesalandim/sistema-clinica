import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"

export default async function Home() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    const { data: profile } = await supabase.from("user_profiles").select("user_type").eq("id", user.id).single()

    if (profile?.user_type === "dentist") {
      redirect("/dentist-dashboard")
    } else {
      redirect("/patient-dashboard")
    }
  }

  redirect("/auth/login")
}
