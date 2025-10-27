import { auth } from "@/auth"
import { redirect } from "next/navigation"

export default async function AdminPage() {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") redirect("/login")
  return <div>Admin content</div>
}