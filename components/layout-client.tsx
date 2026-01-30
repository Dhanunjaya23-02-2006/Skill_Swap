'use client'

import { Navigation } from "@/components/navigation"
import { ReactNode } from "react"

export function LayoutClient({ children }: { children: ReactNode }) {
  return (
    <>
      <Navigation />
      {children}
    </>
  )
}
