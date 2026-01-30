import { createClient } from "@/lib/supabase/server"
import { redirect, notFound } from "next/navigation"
import { SkillForm } from "@/components/skill-form"

export default async function EditSkillPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: skill, error } = await supabase.from("skills").select("*").eq("id", id).single()

  if (error || !skill) {
    notFound()
  }

  if (skill.user_id !== user.id) {
    redirect("/dashboard")
  }

  

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50">
      <div className="container mx-auto py-8 px-4 max-w-2xl">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Edit Skill</h1>
        <p className="text-gray-600 mb-6">Update your skill details</p>
        <SkillForm userId={user.id} skill={skill} />
      </div>
    </div>
  )
}
