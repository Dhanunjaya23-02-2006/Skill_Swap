import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Clock, Coins } from "lucide-react"
import Link from "next/link"

type Skill = {
  id: string
  title: string
  description: string
  category: string
  skill_level: string
  credits_per_hour: number
  duration_minutes: number
  user_id: string
  profiles: {
    display_name: string
    college: string | null
  }
}

export function SkillCard({ skill, currentUserId }: { skill: Skill; currentUserId?: string }) {
  const isOwnSkill = currentUserId === skill.user_id

  return (
    <Card className="flex flex-col h-full hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between mb-2">
          <Badge variant="secondary">{skill.category}</Badge>
          <Badge variant="outline">{skill.skill_level}</Badge>
        </div>
        <CardTitle className="text-xl">{skill.title}</CardTitle>
        <CardDescription className="line-clamp-2">{skill.description}</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col justify-between">
        <div className="space-y-3 mb-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Clock className="h-4 w-4" />
            <span>{skill.duration_minutes} minutes</span>
          </div>
          <div className="flex items-center gap-2 text-sm font-medium text-blue-600">
            <Coins className="h-4 w-4" />
            <span>{skill.credits_per_hour} credits</span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-3 border-t">
          <Link href={`/profile/${skill.user_id}`} className="flex items-center gap-2 hover:opacity-80">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="text-xs bg-blue-500 text-white">
                {skill.profiles.display_name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="text-sm">
              <p className="font-medium">{skill.profiles.display_name}</p>
              {skill.profiles.college && <p className="text-xs text-gray-500">{skill.profiles.college}</p>}
            </div>
          </Link>

          {!isOwnSkill ? (
            <Button size="sm" asChild>
              <Link href={`/skills/${skill.id}/book`}>Book</Link>
            </Button>
          ) : (
            <Button size="sm" variant="outline" asChild>
              <Link href={`/skills/${skill.id}/edit`}>Edit</Link>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
