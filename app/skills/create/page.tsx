import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { SkillForm } from "@/components/skill-form"

export default async function CreateSkillPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50">
      <div className="container mx-auto py-8 px-4 max-w-2xl">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">List a New Skill</h1>
        <p className="text-gray-600 mb-6">Share your knowledge and earn credits</p>
        <SkillForm userId={user.id} />
      </div>
    </div>
  )
}
