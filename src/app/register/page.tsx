"use client"

import { useState } from "react"
import { FcGoogle } from "react-icons/fc"
import { FaXTwitter, FaDiscord } from "react-icons/fa6"
import { FaMicrosoft } from "react-icons/fa"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"

export default function RegisterPage() {
    const router = useRouter()
    const [showPassword, setShowPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setError("")
        setLoading(true)

        const formData = new FormData(e.currentTarget)
        const firstName = formData.get("firstName") as string
        const lastName = formData.get("lastName") as string
        const email = formData.get("email") as string
        const password = formData.get("password") as string
        const res = await fetch("/api/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ firstName, lastName, email, password }),
        })

        setLoading(false)

        if (!res.ok) {
            const data = await res.json()
            setError(data.error || "Registration failed")
            return
        }

        sessionStorage.setItem("registeredEmail", email)
        router.push("/credentials")
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
            <div className="bg-white dark:bg-gray-800 shadow-lg rounded-2xl p-8 w-full max-w-md">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">
                    Let’s create an account
                </h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* First & Last Name */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                First Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                name="firstName"
                                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
                                placeholder="John"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Last Name
                            </label>
                            <input
                                type="text"
                                name="lastName" 
                                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
                                placeholder="Doe"
                            />
                        </div>
                    </div>

                    {/* Email */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Email <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="email"
                            name="email"
                            className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
                            placeholder="you@example.com"
                            required
                        />
                    </div>

                    {/* Password */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Password <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                name="password"
                                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-pink-500"
                                placeholder="••••••••"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 cursor-pointer"
                            >
                                {showPassword ? "🙈" : "👁️"}
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-pink-600 text-white py-3 rounded-lg font-semibold hover:bg-pink-700 transition-all duration-200 cursor-pointer disabled:opacity-70"
                    >
                        {loading ? "Creating..." : "CREATE ACCOUNT"}
                    </button>
                </form>

                {/* Divider */}
                <div className="flex items-center my-6">
                    <div className="flex-grow border-t border-gray-300 dark:border-gray-700" />
                    <span className="mx-3 text-sm text-gray-500 dark:text-gray-400">or continue with</span>
                    <div className="flex-grow border-t border-gray-300 dark:border-gray-700" />
                </div>

                {/* Social Buttons */}
                <div className="grid grid-cols-4 gap-3">
                    <SocialButton icon={<FcGoogle size={22} />} />
                    <SocialButton icon={<FaXTwitter size={18} />} />
                    <SocialButton icon={<FaMicrosoft size={18} color="#0078D4" />} />
                    <SocialButton icon={<FaDiscord size={20} color="#5865F2" />} />
                </div>

                {/* Login Link */}
                <p className="text-center text-sm text-gray-600 dark:text-gray-400 mt-6">
                    Already have an account?{" "}
                    <a href="/login" className="text-pink-600 font-semibold hover:underline">
                        LOGIN
                    </a>
                </p>
            </div>
        </div>
    )
}

function SocialButton({ icon }: { icon: React.ReactNode }) {
    return (
        <button
            className="flex justify-center items-center bg-gray-100 dark:bg-gray-700 rounded-lg p-3 hover:bg-gray-200 dark:hover:bg-gray-600 
                 transition-all duration-200 cursor-pointer"
        >
            {icon}
        </button>
    )
}
