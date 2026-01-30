"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { BookOpen, LayoutDashboard, Search, Coins, User, LogOut, Menu, X } from "lucide-react"

export function Navigation() {
  const pathname = usePathname()
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/")
    router.refresh()
  }

  const isActive = (path: string) => pathname === path

  // Don't show nav on auth pages
  if (pathname?.startsWith("/auth")) {
    return null
  }

  return (
    <nav className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 font-bold text-xl text-gray-900">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <BookOpen className="h-5 w-5 text-white" />
            </div>
            <span>SkillSwap</span>
          </Link>

          {/* Desktop Navigation */}
          {user && (
            <div className="hidden md:flex items-center gap-6">
              <Link
                href="/dashboard"
                className={`flex items-center gap-2 text-sm font-medium transition-colors ${
                  isActive("/dashboard") ? "text-blue-600" : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <LayoutDashboard className="h-4 w-4" />
                Dashboard
              </Link>
              <Link
                href="/skills"
                className={`flex items-center gap-2 text-sm font-medium transition-colors ${
                  isActive("/skills") ? "text-blue-600" : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <Search className="h-4 w-4" />
                Browse Skills
              </Link>
              <Link
                href="/credits"
                className={`flex items-center gap-2 text-sm font-medium transition-colors ${
                  isActive("/credits") ? "text-blue-600" : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <Coins className="h-4 w-4" />
                Credits
              </Link>
              <Link
                href={`/profile/${user.id}`}
                className={`flex items-center gap-2 text-sm font-medium transition-colors ${
                  pathname?.startsWith("/profile") ? "text-blue-600" : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <User className="h-4 w-4" />
                Profile
              </Link>
              <Button variant="ghost" size="sm" onClick={handleSignOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          )}

          {!user && (
            <div className="hidden md:flex items-center gap-3">
              <Button variant="ghost" asChild>
                <Link href="/auth/login">Sign In</Link>
              </Button>
              <Button asChild>
                <Link href="/auth/sign-up">Get Started</Link>
              </Button>
            </div>
          )}

          {/* Mobile Menu Button */}
          {user && (
            <button className="md:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)}>
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          )}
        </div>

        {/* Mobile Navigation */}
        {user && isMenuOpen && (
          <div className="md:hidden py-4 border-t">
            <div className="flex flex-col gap-3">
              <Link
                href="/dashboard"
                className="flex items-center gap-2 text-sm font-medium py-2 text-gray-600 hover:text-gray-900"
                onClick={() => setIsMenuOpen(false)}
              >
                <LayoutDashboard className="h-4 w-4" />
                Dashboard
              </Link>
              <Link
                href="/skills"
                className="flex items-center gap-2 text-sm font-medium py-2 text-gray-600 hover:text-gray-900"
                onClick={() => setIsMenuOpen(false)}
              >
                <Search className="h-4 w-4" />
                Browse Skills
              </Link>
              <Link
                href="/credits"
                className="flex items-center gap-2 text-sm font-medium py-2 text-gray-600 hover:text-gray-900"
                onClick={() => setIsMenuOpen(false)}
              >
                <Coins className="h-4 w-4" />
                Credits
              </Link>
              <Link
                href={`/profile/${user.id}`}
                className="flex items-center gap-2 text-sm font-medium py-2 text-gray-600 hover:text-gray-900"
                onClick={() => setIsMenuOpen(false)}
              >
                <User className="h-4 w-4" />
                Profile
              </Link>
              <button
                className="flex items-center gap-2 text-sm font-medium py-2 text-gray-600 hover:text-gray-900 text-left"
                onClick={() => {
                  setIsMenuOpen(false)
                  handleSignOut()
                }}
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
