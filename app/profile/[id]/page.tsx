import { createClient } from "@/lib/supabase/server"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { GraduationCap, Star, BookOpen, Award } from "lucide-react"
import { notFound } from "next/navigation"
import Link from "next/link"

export default async function ProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Get profile data
  const { data: profile, error: profileError } = await supabase.from("profiles").select("*").eq("id", id).single()

  if (profileError || !profile) {
    notFound()
  }

  // Get user's skills
  const { data: skills } = await supabase.from("skills").select("*").eq("user_id", id).eq("is_active", true)

  // Get user's reviews as a teacher
  const { data: reviews } = await supabase
    .from("reviews")
    .select("*, reviewer:profiles!reviews_reviewer_id_fkey(display_name)")
    .eq("reviewee_id", id)

  const averageRating =
    reviews && reviews.length > 0 ? reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length : 0

  const isOwnProfile = user?.id === id

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50">
      <div className="container mx-auto py-8 px-4 max-w-6xl">
        {/* Profile Header */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-6 items-start">
              <Avatar className="h-24 w-24">
                <AvatarFallback className="text-2xl bg-blue-500 text-white">
                  {profile.display_name
                    .split(" ")
                    .map((n: string) => n[0])
                    .join("")
                    .toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900">{profile.display_name}</h1>
                    <div className="flex items-center gap-2 mt-2 text-gray-600">
                      <GraduationCap className="h-4 w-4" />
                      <span className="text-sm">
                        {profile.degree} • {profile.college}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">Class of {profile.graduation_year}</p>
                  </div>
                  {isOwnProfile && (
                    <Button asChild>
                      <Link href="/profile/edit">Edit Profile</Link>
                    </Button>
                  )}
                </div>
                {profile.bio && <p className="mt-4 text-gray-700">{profile.bio}</p>}
                {reviews && reviews.length > 0 && (
                  <div className="flex items-center gap-2 mt-4">
                    <div className="flex items-center gap-1">
                      <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                      <span className="font-semibold">{averageRating.toFixed(1)}</span>
                    </div>
                    <span className="text-sm text-gray-600">({reviews.length} reviews)</span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Skills Offered */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Skills Offered
            </CardTitle>
            <CardDescription>
              {isOwnProfile ? "Skills you're teaching" : `Skills offered by ${profile.display_name}`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!skills || skills.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {isOwnProfile ? (
                  <div>
                    <p className="mb-4">You haven&apos;t listed any skills yet.</p>
                    <Button asChild>
                      <Link href="/skills/create">Add Your First Skill</Link>
                    </Button>
                  </div>
                ) : (
                  <p>No skills listed yet.</p>
                )}
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {skills.map((skill) => (
                  <Card key={skill.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">{skill.title}</CardTitle>
                          <CardDescription className="mt-1">{skill.category}</CardDescription>
                        </div>
                        <Badge variant="secondary">{skill.skill_level}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-600 mb-3">{skill.description}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">
                          {skill.credits_per_hour} credits / {skill.duration_minutes} min
                        </span>
                        {!isOwnProfile && (
                          <Button size="sm" asChild>
                            <Link href={`/skills/${skill.id}/book`}>Book</Link>
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Reviews */}
        {reviews && reviews.length > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                Reviews
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {reviews.map((review) => (
                  <div key={review.id} className="border-b pb-4 last:border-0">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{review.reviewer.display_name}</span>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${i < review.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
                          />
                        ))}
                      </div>
                    </div>
                    {review.comment && <p className="text-sm text-gray-600">{review.comment}</p>}
                    <p className="text-xs text-gray-400 mt-1">{new Date(review.created_at).toLocaleDateString()}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
