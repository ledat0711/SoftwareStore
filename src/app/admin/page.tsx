import { auth } from "@/auth"
import { Session } from "next-auth";
import { redirect } from "next/navigation"

export default async function AdminPage() {
  const session: Session | null = await auth()
  if (!session?.user || session.user.role !== "ADMIN") redirect("/login")
  return <div>Admin content</div>
}