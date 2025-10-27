"use client"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSession, signIn, signOut } from "next-auth/react"

export default function UserGate() {
  const { data: session, status } = useSession()
  const router = useRouter()

  if (status === "loading") return <p>Loading...</p>

  if (!session) {
    return <button onClick={() => signIn(undefined, { callbackUrl: "/dashboard" })}>Sign in</button>
  }

  const role = session.user?.role

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