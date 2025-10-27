import { NextResponse } from "next/server"
import { auth } from "./src/auth"

export default auth((req) => {
  const { pathname, origin } = req.nextUrl
  if (pathname.startsWith("/admin")) {
    const role = req.auth?.user?.role
    if (role !== "ADMIN") {
      return NextResponse.redirect(new URL("/login", origin))
    }
  }
  return NextResponse.next()
})

export const config = {
  matcher: ["/admin/:path*"],
}