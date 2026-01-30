import { createClient } from "@/lib/supabase/server"
import { redirect, notFound } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, FileText } from "lucide-react"
import Link from "next/link"
import { SessionActions } from "@/components/session-actions"
import { ReviewForm } from "@/components/review-form"

export default async function SessionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Get session with related data
  const { data: session, error } = await supabase
    .from("sessions")
    .select(
      `
      *,
      skill:skills(*),
      teacher:profiles!sessions_teacher_id_fkey(display_name, college),
      learner:profiles!sessions_learner_id_fkey(display_name, college)
    `,
    )
    .eq("id", id)
    .single()

  if (error || !session) {
    notFound()
  }

  // Check if user is part of this session
  if (session.teacher_id !== user.id && session.learner_id !== user.id) {
    redirect("/dashboard")
  }

  const isTeacher = session.teacher_id === user.id
  const otherPerson = isTeacher ? session.learner : session.teacher

  // Check if already reviewed
  const { data: existingReview } = await supabase
    .from("reviews")
    .select("*")
    .eq("session_id", session.id)
    .eq("reviewer_id", user.id)
    .single()

  const canReview = session.status === "Completed" && !existingReview

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50">
      <div className="container mx-auto py-8 px-4 max-w-4xl">
        <div className="mb-6">
          <Link href="/dashboard?tab=sessions" className="text-sm text-blue-600 hover:text-blue-500">
            ← Back to Sessions
          </Link>
        </div>

        <div className="grid gap-6">
          {/* Session Header */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-2xl">{session.skill.title}</CardTitle>
                  <CardDescription className="mt-2">{session.skill.category}</CardDescription>
                </div>
                <Badge
                  variant={
                    session.status === "Completed"
                      ? "default"
                      : session.status === "Confirmed"
                        ? "secondary"
                        : session.status === "Cancelled"
                          ? "destructive"
                          : "outline"
                  }
                >
                  {session.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span>{new Date(session.scheduled_at).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <span>
                      {new Date(session.scheduled_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} •{" "}
                      {session.duration_minutes} minutes
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-blue-500 text-white">
                      {otherPerson.display_name
                        .split(" ")
                        .map((n: string) => n[0])
                        .join("")
                        .toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm text-gray-500">{isTeacher ? "Student" : "Teacher"}</p>
                    <p className="font-medium">{otherPerson.display_name}</p>
                  </div>
                </div>
              </div>

              {session.notes && (
                <div className="mt-4 pt-4 border-t">
                  <div className="flex items-start gap-2">
                    <FileText className="h-4 w-4 text-gray-500 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-700">Notes</p>
                      <p className="text-sm text-gray-600 mt-1">{session.notes}</p>
                    </div>
                  </div>
                </div>
              )}

              {session.meeting_link && (
                <div className="mt-4 pt-4 border-t">
                  <p className="text-sm font-medium text-gray-700 mb-2">Meeting Link</p>
                  <a
                    href={session.meeting_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:text-blue-500 underline"
                  >
                    {session.meeting_link}
                  </a>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Session Actions */}
          {session.status === "Pending" && (
            <SessionActions sessionId={session.id} isTeacher={isTeacher} teacherId={session.teacher_id} />
          )}

          {/* Review Form */}
          {canReview && (
            <Card>
              <CardHeader>
                <CardTitle>Leave a Review</CardTitle>
                <CardDescription>Share your experience with this session</CardDescription>
              </CardHeader>
              <CardContent>
                <ReviewForm
                  sessionId={session.id}
                  skillId={session.skill.id}
                  revieweeId={isTeacher ? session.learner_id : session.teacher_id}
                  reviewerId={user.id}
                />
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
