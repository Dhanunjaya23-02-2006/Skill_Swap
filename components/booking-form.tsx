"use client"

import type React from "react"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { AlertCircle } from "lucide-react"

type Skill = {
  id: string
  title: string
  user_id: string
  credits_per_hour: number
  duration_minutes: number
}

export function BookingForm({ skill, userBalance, userId }: { skill: Skill; userBalance: number; userId: string }) {
  const [scheduledDate, setScheduledDate] = useState("")
  const [scheduledTime, setScheduledTime] = useState("")
  const [notes, setNotes] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const hasEnoughCredits = userBalance >= skill.credits_per_hour

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    if (!hasEnoughCredits) {
      setError("Insufficient credits. Please earn more credits by teaching skills.")
      setIsLoading(false)
      return
    }

    try {
      // Combine date and time
      const scheduledAt = new Date(`${scheduledDate}T${scheduledTime}`)

      if (scheduledAt < new Date()) {
        throw new Error("Cannot book sessions in the past")
      }

      // Create session
      const { data: session, error: sessionError } = await supabase
        .from("sessions")
        .insert({
          skill_id: skill.id,
          teacher_id: skill.user_id,
          learner_id: userId,
          scheduled_at: scheduledAt.toISOString(),
          duration_minutes: skill.duration_minutes,
          status: "Pending",
          notes,
        })
        .select()
        .single()

      if (sessionError) throw sessionError

      // Deduct credits from learner
      const { error: deductError } = await supabase.rpc("deduct_credits", {
        p_user_id: userId,
        p_amount: skill.credits_per_hour,
      })

      if (deductError) {
        // If credit deduction fails, delete the session
        await supabase.from("sessions").delete().eq("id", session.id)
        throw new Error("Failed to process credits. Please try again.")
      }

      // Record transaction
      await supabase.from("transactions").insert({
        user_id: userId,
        session_id: session.id,
        amount: -skill.credits_per_hour,
        type: "Spent",
        description: `Booked session: ${skill.title}`,
      })

      router.push("/dashboard?tab=sessions")
      router.refresh()
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  // Get minimum date (today)
  const today = new Date().toISOString().split("T")[0]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Schedule Your Session</CardTitle>
        <CardDescription>Choose a date and time for your learning session</CardDescription>
      </CardHeader>
      <CardContent>
        {!hasEnoughCredits && (
          <div className="mb-4 flex gap-2 rounded-md bg-red-50 p-3 text-sm text-red-600">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <div>
              <p className="font-medium">Insufficient Credits</p>
              <p className="text-xs mt-1">
                You need {skill.credits_per_hour} credits but only have {userBalance}. List your own skills to earn more
                credits!
              </p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="flex flex-col gap-4">
            <div className="grid gap-2">
              <Label htmlFor="date">Date *</Label>
              <Input
                id="date"
                type="date"
                min={today}
                required
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="time">Time *</Label>
              <Input
                id="time"
                type="time"
                required
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Any specific topics or questions you'd like to focus on..."
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            {error && (
              <div className="rounded-md bg-red-50 p-3">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <Button type="submit" disabled={isLoading || !hasEnoughCredits} className="w-full">
              {isLoading ? "Booking..." : `Book Session (${skill.credits_per_hour} credits)`}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
