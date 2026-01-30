import { createClient } from "@/lib/supabase/server"
import { SkillsFilter } from "@/components/skills-filter"
import { SkillCard } from "@/components/skill-card"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"

export default async function SkillsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; search?: string }>
}) {
  const params = await searchParams
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Build query
  let query = supabase
    .from("skills")
    .select("*, profiles!skills_user_id_fkey(display_name, college)")
    .eq("is_active", true)

  // Apply filters
  if (params.category) {
    query = query.eq("category", params.category)
  }

  if (params.search) {
    query = query.or(`title.ilike.%${params.search}%,description.ilike.%${params.search}%`)
  }

  const { data: skills } = await query.order("created_at", { ascending: false })

  // Get unique categories for filter
  const { data: allSkills } = await supabase.from("skills").select("category").eq("is_active", true)

  const categories = [...new Set(allSkills?.map((s) => s.category) || [])]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50">
      <div className="container mx-auto py-8 px-4 max-w-7xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Discover Skills</h1>
            <p className="text-gray-600 mt-1">Find skills to learn from your peers</p>
          </div>
          {user && (
            <Button asChild>
              <Link href="/skills/create">
                <Plus className="h-4 w-4 mr-2" />
                List a Skill
              </Link>
            </Button>
          )}
        </div>

        <SkillsFilter categories={categories} />

        {!skills || skills.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">No skills found matching your criteria.</p>
            {user && (
              <Button asChild>
                <Link href="/skills/create">Be the first to list a skill</Link>
              </Button>
            )}
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {skills.map((skill) => (
              <SkillCard key={skill.id} skill={skill} currentUserId={user?.id} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
