"use client"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useRouter } from "next/navigation"
import { useState } from "react"

export function SessionActions({
  sessionId,
  isTeacher,
  teacherId,
}: {
  sessionId: string
  isTeacher: boolean
  teacherId: string
}) {
  const [meetingLink, setMeetingLink] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleConfirm = async () => {
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    try {
      const { error } = await supabase
        .from("sessions")
        .update({
          status: "Confirmed",
          meeting_link: meetingLink || null,
        })
        .eq("id", sessionId)

      if (error) throw error

      router.refresh()
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = async () => {
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    try {
      // Update session status
      const { error: sessionError } = await supabase
        .from("sessions")
        .update({ status: "Cancelled" })
        .eq("id", sessionId)

      if (sessionError) throw sessionError

      // If learner cancels, refund credits
      if (!isTeacher) {
        // Get session details for refund
        const { data: session } = await supabase
          .from("sessions")
          .select("learner_id, skill:skills(credits_per_hour)")
          .eq("id", sessionId)
          .single()

        if (session) {
          // Add credits back
          await supabase.rpc("add_credits", {
            p_user_id: session.learner_id,
            p_amount: session.skill.credits_per_hour,
          })

          // Record refund transaction
          await supabase.from("transactions").insert({
            user_id: session.learner_id,
            session_id: sessionId,
            amount: session.skill.credits_per_hour,
            type: "Refund",
            description: "Session cancelled - credits refunded",
          })
        }
      }

      router.refresh()
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const handleComplete = async () => {
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    try {
      // Update session to completed
      const { error: sessionError } = await supabase
        .from("sessions")
        .update({ status: "Completed" })
        .eq("id", sessionId)

      if (sessionError) throw sessionError

      // Get session details
      const { data: session } = await supabase
        .from("sessions")
        .select("teacher_id, skill:skills(credits_per_hour, title)")
        .eq("id", sessionId)
        .single()

      if (session) {
        // Award credits to teacher
        await supabase.rpc("add_credits", {
          p_user_id: session.teacher_id,
          p_amount: session.skill.credits_per_hour,
        })

        // Record transaction
        await supabase.from("transactions").insert({
          user_id: session.teacher_id,
          session_id: sessionId,
          amount: session.skill.credits_per_hour,
          type: "Earned",
          description: `Completed session: ${session.skill.title}`,
        })
      }

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
        <div className="space-y-4">
          {isTeacher ? (
            <>
              <div>
                <Label htmlFor="meetingLink">Meeting Link (Optional)</Label>
                <Input
                  id="meetingLink"
                  type="url"
                  placeholder="https://meet.google.com/..."
                  value={meetingLink}
                  onChange={(e) => setMeetingLink(e.target.value)}
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">Add a video call link for the session</p>
              </div>
              <div className="flex gap-3">
                <Button onClick={handleConfirm} disabled={isLoading}>
                  {isLoading ? "Confirming..." : "Confirm Session"}
                </Button>
                <Button variant="outline" onClick={handleCancel} disabled={isLoading}>
                  Decline
                </Button>
              </div>
            </>
          ) : (
            <div className="flex gap-3">
              <Button variant="outline" onClick={handleCancel} disabled={isLoading}>
                {isLoading ? "Cancelling..." : "Cancel Booking"}
              </Button>
            </div>
          )}

          {isTeacher && (
            <Button onClick={handleComplete} disabled={isLoading} variant="secondary" className="w-full">
              Mark as Completed
            </Button>
          )}

          {error && (
            <div className="rounded-md bg-red-50 p-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
