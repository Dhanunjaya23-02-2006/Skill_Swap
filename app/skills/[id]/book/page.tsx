import { createClient } from "@/lib/supabase/server"
import { redirect, notFound } from "next/navigation"
import { BookingForm } from "@/components/booking-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Clock, Coins } from "lucide-react"

export default async function BookSkillPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Get skill details
  const { data: skill, error: skillError } = await supabase
    .from("skills")
    .select("*, profiles!skills_user_id_fkey(display_name, college)")
    .eq("id", id)
    .single()

  if (skillError || !skill) {
    notFound()
  }

  // Can't book own skill
  if (skill.user_id === user.id) {
    redirect(`/skills/${id}`)
  }

  // Get user's credit balance
  const { data: credits } = await supabase.from("credits").select("balance").eq("user_id", user.id).single()

  const userBalance = credits?.balance || 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50">
      <div className="container mx-auto py-8 px-4 max-w-4xl">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Book a Session</h1>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Skill Details */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between mb-2">
                <Badge variant="secondary">{skill.category}</Badge>
                <Badge variant="outline">{skill.skill_level}</Badge>
              </div>
              <CardTitle>{skill.title}</CardTitle>
              <CardDescription>{skill.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-blue-500 text-white">
                      {skill.profiles.display_name
                        .split(" ")
                        .map((n: string) => n[0])
                        .join("")
                        .toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{skill.profiles.display_name}</p>
                    {skill.profiles.college && <p className="text-sm text-gray-500">{skill.profiles.college}</p>}
                  </div>
                </div>

                <div className="space-y-2 pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Clock className="h-4 w-4" />
                      <span>Duration</span>
                    </div>
                    <span className="font-medium">{skill.duration_minutes} minutes</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Coins className="h-4 w-4" />
                      <span>Cost</span>
                    </div>
                    <span className="font-medium text-blue-600">{skill.credits_per_hour} credits</span>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Your Balance</span>
                    <span
                      className={`font-semibold ${userBalance >= skill.credits_per_hour ? "text-green-600" : "text-red-600"}`}
                    >
                      {userBalance} credits
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Booking Form */}
          <BookingForm skill={skill} userBalance={userBalance} userId={user.id} />
        </div>
      </div>
    </div>
  )
}
