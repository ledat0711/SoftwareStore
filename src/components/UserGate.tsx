"use client"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSession, signIn, signOut } from "next-auth/react"
import { Session } from "next-auth"
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime"

export default function UserGate() {
  const { data: session, status }: { data: Session | null; status: "loading" | "authenticated" | "unauthenticated" } = useSession()
  const router: AppRouterInstance = useRouter()

  if (status === "loading") return <p>Loading...</p>

  if (!session) {
    return <button onClick={() => signIn(undefined, { callbackUrl: "/dashboard" })}>Sign in</button>
  }

  const role: "USER" | "ADMIN" | undefined = session.user?.role

  return (
    <div>
      <p>Signed in as {session.user?.email} (role: {role})</p>
      {role === "ADMIN" ? (
        <button onClick={() => router.push("/admin")}>Go to Admin</button>
      ) : (
        <p>Không có quyền vào trang Admin</p>
      )}
      <button onClick={() => signOut({ callbackUrl: "/" })}>Sign out</button>
    </div>
  )
}