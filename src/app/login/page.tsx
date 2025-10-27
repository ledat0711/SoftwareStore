"use client"

import Image from "next/image"
import { FcGoogle } from "react-icons/fc"
import { FaXTwitter, FaDiscord, FaGithub } from "react-icons/fa6"
import { MdEmail } from "react-icons/md"
import { SigninButton } from "@/components/auth/signin-button"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"

export default function LoginPage() {
  const router = useRouter()

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
              Sign in to Trading Software
            </h2>
          </div>

          <div className="space-y-4">
            <SigninButton icon={<FcGoogle size={22} />} text="Sign in with Google" onClick={() => signIn("google")} />
            <SigninButton icon={<FaGithub size={20} />} text="Sign in with Github" onClick={() => signIn("github")} />
            <SigninButton icon={<FaDiscord size={20} className="text-indigo-500" />} text="Sign in with Discord" onClick={() => signIn("discord")} />
            <SigninButton
              icon={<MdEmail size={22} className="text-gray-500" />}
              text="Sign in by your account"
              onClick={() => router.push("/credentials")}
            />          
          </div>

          <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-8">
            New to Trading Software?{" "}
            <a href="/register" className="text-pink-600 dark:text-pink-400 font-medium hover:underline">
              Create an account
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
