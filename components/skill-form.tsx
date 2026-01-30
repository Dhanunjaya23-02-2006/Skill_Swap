"use client"

import type React from "react"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useRouter } from "next/navigation"
import { useState } from "react"

const CATEGORIES = [
  "Programming",
  "Design",
  "Marketing",
  "Business",
  "Photography",
  "Video Editing",
  "Writing",
  "Music",
  "Languages",
  "Other",
]

const SKILL_LEVELS = ["Beginner", "Intermediate", "Advanced", "Expert"]

type SkillFormProps = {
  userId: string
  skill?: {
    id: string
    title: string
    description: string
    category: string
    skill_level: string
    credits_per_hour: number
    duration_minutes: number
    tags: string[]
  }
}

export function SkillForm({ userId, skill }: SkillFormProps) {
  const [title, setTitle] = useState(skill?.title || "")
  const [description, setDescription] = useState(skill?.description || "")
  const [category, setCategory] = useState(skill?.category || "")
  const [skillLevel, setSkillLevel] = useState(skill?.skill_level || "")
  const [creditsPerHour, setCreditsPerHour] = useState(skill?.credits_per_hour.toString() || "1")
  const [durationMinutes, setDurationMinutes] = useState(skill?.duration_minutes.toString() || "60")
  const [tags, setTags] = useState(skill?.tags?.join(", ") || "")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    try {
      const skillData = {
        title,
        description,
        category,
        skill_level: skillLevel,
        credits_per_hour: Number.parseInt(creditsPerHour),
        duration_minutes: Number.parseInt(durationMinutes),
        tags: tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        user_id: userId,
      }

      if (skill) {
        // Update existing skill
        const { error } = await supabase.from("skills").update(skillData).eq("id", skill.id)
        if (error) throw error
      } else {
        // Create new skill
        const { error } = await supabase.from("skills").insert(skillData)
        if (error) throw error
      }

      router.push(`/profile/${userId}`)
      router.refresh()
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit}>
          <div className="flex flex-col gap-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Skill Title *</Label>
              <Input
                id="title"
                type="text"
                placeholder="e.g., Python Programming for Beginners"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                placeholder="Describe what you'll teach and what students will learn..."
                rows={4}
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="category">Category *</Label>
                <Select value={category} onValueChange={setCategory} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="skillLevel">Skill Level *</Label>
                <Select value={skillLevel} onValueChange={setSkillLevel} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select level" />
                  </SelectTrigger>
                  <SelectContent>
                    {SKILL_LEVELS.map((level) => (
                      <SelectItem key={level} value={level}>
                        {level}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="duration">Duration (minutes) *</Label>
                <Input
                  id="duration"
                  type="number"
                  min="15"
                  step="15"
                  required
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(e.target.value)}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="credits">Credits Per Session *</Label>
                <Input
                  id="credits"
                  type="number"
                  min="1"
                  required
                  value={creditsPerHour}
                  onChange={(e) => setCreditsPerHour(e.target.value)}
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="tags">Tags (comma separated)</Label>
              <Input
                id="tags"
                type="text"
                placeholder="e.g., python, coding, beginners"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
              />
            </div>

            {error && (
              <div className="rounded-md bg-red-50 p-3">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <div className="flex gap-3">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Saving..." : skill ? "Update Skill" : "Create Skill"}
              </Button>
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Cancel
              </Button>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
