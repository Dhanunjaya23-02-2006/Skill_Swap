import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BookOpen, Coins, Calendar, Plus, Clock } from "lucide-react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const params = await searchParams
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Get user profile
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  // Get user's credit balance
  const { data: credits } = await supabase.from("credits").select("*").eq("user_id", user.id).single()

  // Get user's skills
  const { data: mySkills } = await supabase.from("skills").select("*").eq("user_id", user.id)

  // Get upcoming sessions as teacher
  const { data: teachingSessions } = await supabase
    .from("sessions")
    .select("*, skill:skills(title), learner:profiles!sessions_learner_id_fkey(display_name)")
    .eq("teacher_id", user.id)
    .in("status", ["Pending", "Confirmed"])
    .order("scheduled_at", { ascending: true })

  // Get upcoming sessions as learner
  const { data: learningSessions } = await supabase
    .from("sessions")
    .select("*, skill:skills(title), teacher:profiles!sessions_teacher_id_fkey(display_name)")
    .eq("learner_id", user.id)
    .in("status", ["Pending", "Confirmed"])
    .order("scheduled_at", { ascending: true })

  const allUpcomingSessions = [...(teachingSessions || []), ...(learningSessions || [])].sort(
    (a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime(),
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50">
      <div className="container mx-auto py-8 px-4 max-w-7xl">
        {/* Welcome Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Welcome back, {profile?.display_name}!</h1>
          <p className="text-gray-600 mt-1">Manage your skills and sessions</p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription className="flex items-center gap-2">
                <Coins className="h-4 w-4" />
                Credits
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{credits?.balance || 0}</div>
              <Button variant="link" className="px-0 h-auto text-xs" asChild>
                <Link href="/credits">View Details</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                My Skills
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mySkills?.length || 0}</div>
              <Button variant="link" className="px-0 h-auto text-xs" asChild>
                <Link href="/skills/create">Add New</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Teaching
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{teachingSessions?.length || 0}</div>
              <p className="text-xs text-gray-500">Upcoming sessions</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Learning
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{learningSessions?.length || 0}</div>
              <p className="text-xs text-gray-500">Upcoming sessions</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue={params.tab || "overview"}>
          <TabsList className="mb-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="sessions">All Sessions</TabsTrigger>
            <TabsTrigger value="skills">My Skills</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-3">
                  <Button asChild>
                    <Link href="/skills">
                      <BookOpen className="h-4 w-4 mr-2" />
                      Browse Skills
                    </Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link href="/skills/create">
                      <Plus className="h-4 w-4 mr-2" />
                      List a Skill
                    </Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link href={`/profile/${user.id}`}>View My Profile</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Upcoming Sessions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Upcoming Sessions
                </CardTitle>
                <CardDescription>Your scheduled teaching and learning sessions</CardDescription>
              </CardHeader>
              <CardContent>
                {!allUpcomingSessions || allUpcomingSessions.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p className="mb-4">No upcoming sessions</p>
                    <Button asChild>
                      <Link href="/skills">Book a Session</Link>
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {allUpcomingSessions.slice(0, 5).map((session) => {
                      const isTeaching = session.teacher_id === user.id
                      return (
                        <Link
                          key={session.id}
                          href={`/sessions/${session.id}`}
                          className="block p-4 rounded-lg border hover:border-blue-300 hover:bg-blue-50/50 transition-colors"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-medium">{session.skill.title}</h3>
                                <Badge variant={isTeaching ? "default" : "secondary"}>
                                  {isTeaching ? "Teaching" : "Learning"}
                                </Badge>
                                <Badge variant="outline">{session.status}</Badge>
                              </div>
                              <p className="text-sm text-gray-600">
                                with {isTeaching ? session.learner.display_name : session.teacher.display_name}
                              </p>
                            </div>
                            <div className="text-right text-sm">
                              <div className="flex items-center gap-1 text-gray-600">
                                <Clock className="h-3 w-3" />
                                <span>{new Date(session.scheduled_at).toLocaleDateString()}</span>
                              </div>
                              <p className="text-gray-500">
                                {new Date(session.scheduled_at).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </p>
                            </div>
                          </div>
                        </Link>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Sessions Tab */}
          <TabsContent value="sessions" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Teaching Sessions */}
              <Card>
                <CardHeader>
                  <CardTitle>Teaching Sessions</CardTitle>
                  <CardDescription>Sessions where you're the teacher</CardDescription>
                </CardHeader>
                <CardContent>
                  {!teachingSessions || teachingSessions.length === 0 ? (
                    <p className="text-center py-8 text-gray-500">No teaching sessions</p>
                  ) : (
                    <div className="space-y-2">
                      {teachingSessions.map((session) => (
                        <Link
                          key={session.id}
                          href={`/sessions/${session.id}`}
                          className="block p-3 rounded border hover:border-blue-300 hover:bg-blue-50/50 transition-colors"
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="font-medium text-sm">{session.skill.title}</p>
                              <p className="text-xs text-gray-600">{session.learner.display_name}</p>
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {session.status}
                            </Badge>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(session.scheduled_at).toLocaleString()}
                          </p>
                        </Link>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Learning Sessions */}
              <Card>
                <CardHeader>
                  <CardTitle>Learning Sessions</CardTitle>
                  <CardDescription>Sessions where you're the learner</CardDescription>
                </CardHeader>
                <CardContent>
                  {!learningSessions || learningSessions.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <p className="mb-4">No learning sessions</p>
                      <Button size="sm" asChild>
                        <Link href="/skills">Browse Skills</Link>
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {learningSessions.map((session) => (
                        <Link
                          key={session.id}
                          href={`/sessions/${session.id}`}
                          className="block p-3 rounded border hover:border-blue-300 hover:bg-blue-50/50 transition-colors"
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="font-medium text-sm">{session.skill.title}</p>
                              <p className="text-xs text-gray-600">{session.teacher.display_name}</p>
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {session.status}
                            </Badge>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(session.scheduled_at).toLocaleString()}
                          </p>
                        </Link>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* My Skills Tab */}
          <TabsContent value="skills">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>My Skills</CardTitle>
                    <CardDescription>Skills you're teaching on the platform</CardDescription>
                  </div>
                  <Button asChild>
                    <Link href="/skills/create">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Skill
                    </Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {!mySkills || mySkills.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p className="mb-4">You haven&apos;t listed any skills yet</p>
                    <Button asChild>
                      <Link href="/skills/create">List Your First Skill</Link>
                    </Button>
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2">
                    {mySkills.map((skill) => (
                      <Card key={skill.id}>
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div>
                              <CardTitle className="text-lg">{skill.title}</CardTitle>
                              <CardDescription className="mt-1">{skill.category}</CardDescription>
                            </div>
                            <Badge variant={skill.is_active ? "default" : "secondary"}>
                              {skill.is_active ? "Active" : "Inactive"}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-gray-600 mb-3 line-clamp-2">{skill.description}</p>
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">
                              {skill.credits_per_hour} credits • {skill.duration_minutes} min
                            </span>
                            <Button size="sm" variant="outline" asChild>
                              <Link href={`/skills/${skill.id}/edit`}>Edit</Link>
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
