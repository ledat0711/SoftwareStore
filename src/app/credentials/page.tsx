"use client"

import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import { MdEmail, MdLock } from "react-icons/md"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"

export default function CredentialsLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const passwordRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
  const storedEmail = sessionStorage?.getItem("registeredEmail")

    if (storedEmail) {
      setEmail(storedEmail)
      sessionStorage?.removeItem("registeredEmail") 
    }
  }, [])

  useEffect(() => {
    const storedEmail = sessionStorage?.getItem("registeredEmail")

    if (storedEmail && passwordRef.current) {
      passwordRef.current.focus()
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)
    const res = await signIn("credentials", {
      redirect: false,
      email,
      password,
    })

    setLoading(false)

    if (res?.error) {
      setError("Invalid email or password")
      return
    }

    router.push("/") 
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors duration-300">
      <div className="max-w-6xl w-full flex flex-col md:flex-row bg-white dark:bg-gray-800 shadow-2xl rounded-3xl overflow-hidden border border-gray-100 dark:border-gray-700 transition-colors duration-300">
        
        {/* Left section - Illustration */}
        <div className="hidden md:block md:w-1/2 relative bg-gray-100 dark:bg-gray-700 transition-colors duration-300">
          <Image
            src="/login-illustration.png"
            alt="Login Illustration"
            fill
            sizes="50vw"
            className="object-cover object-center opacity-95 transition-transform duration-500 hover:scale-105"
            priority
          />
        </div>

        {/* Right section - Form */}
        <div className="w-full md:w-1/2 p-10 flex flex-col justify-center transition-colors duration-300">
          <div className="mb-8 text-center md:text-left">
            <h1 className="text-3xl font-extrabold text-gray-800 dark:text-white mb-2">
              Welcome back 👋
            </h1>
            <h2 className="text-2xl font-semibold text-pink-600 dark:text-pink-400">
              Sign in with your account
            </h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Username
              </label>
              <div className="relative">
                <MdEmail className="absolute left-3 top-3 text-gray-400" size={20} />
                <input
                  type="username"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border rounded-lg text-gray-800 dark:text-white bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-pink-500 focus:border-pink-500 outline-none transition"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Password
              </label>
              <div className="relative">
                <MdLock className="absolute left-3 top-3 text-gray-400" size={20} />
                <input
                  ref={passwordRef}
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border rounded-lg text-gray-800 dark:text-white bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-pink-500 focus:border-pink-500 outline-none transition"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {error && <p className="text-red-500 text-sm text-center">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-2.5 font-medium rounded-lg text-white transition ${
                loading
                  ? "bg-pink-400 cursor-not-allowed"
                  : "bg-pink-600 hover:bg-pink-700"
              }`}
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-8">
            Don’t have an account?{" "}
            <a href="/register" className="text-pink-600 dark:text-pink-400 font-medium hover:underline">
              Create one
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
