"use client"
import { useState } from "react"
import { useSession, signIn, signOut } from "next-auth/react"

export default function RoleCheck() {
  const { data: session, status } = useSession()
  const [api, setApi] = useState("")

  const hitAdmin = async () => {
    setApi("...")
    const res = await fetch("/api/admin", { cache: "no-store" })
    setApi(`${res.status} ${res.statusText}`)
  }

  if (status === "loading") return <p>Loading...</p>
  if (!session) return <button onClick={() => signIn()}>Sign in</button>

  return (
    <div style={{ display: "grid", gap: 8 }}>
      <div>Email: {session.user?.email}</div>
      <div>Role: {session.user?.role}</div>
      <div style={{ display: "flex", gap: 8 }}>
        <button style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "8px 12px",
            border: "1px solid #d1d5db",
            borderRadius: 6,
            background: "#fff",
            cursor: "pointer",
          }}
          onClick={hitAdmin} >Gọi /api/admin</button>
      </div>
      {api && <div>Kết quả: {api}</div>}
    </div>
  )
}