export { updateSession as proxy } from "./lib/supabase/proxy"
export { updateSession as middleware } from "./lib/supabase/proxy"

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
}
