"use client";

import Image from "next/image";
import { FcGoogle } from "react-icons/fc";
import { FaXTwitter, FaDiscord, FaGithub } from "react-icons/fa6";
import { MdEmail } from "react-icons/md";
import { SigninButton } from "@/components/auth/signin-button";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";

export default function LoginPage() {
  const router: AppRouterInstance = useRouter();
  const {
    status,
  }: { status: "loading" | "authenticated" | "unauthenticated" } = useSession();

  // Nếu đã đăng nhập, tự động về Hompage "localhost:3000/"
  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/");
    }
  }, [status, router]);

  console.log(router);
  return (
    <div className="min-h-[calc(100vh-120px)] flex items-start justify-center pt-16 bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors duration-300">
      <div className="max-w-lg w-full flex flex-col bg-white dark:bg-gray-800 shadow-2xl rounded-3xl overflow-hidden border border-gray-100 dark:border-gray-700 transition-colors duration-300">
        {/* Right section - Form */}
        <div className="w-full p-10 flex flex-col justify-center transition-colors duration-300">
          <div className="mb-8 text-center">
            <h2 className="text-2xl font-semibold text-pink-600 dark:text-pink-400">
              Sign in to Software Store
            </h2>
          </div>

          <div className="space-y-4">
            <SigninButton
              icon={<FcGoogle size={22} />}
              text="Sign in with Google"
              onClick={() => signIn("google", { callbackUrl: "/" })}
            />
            <SigninButton
              icon={<FaGithub size={20} />}
              text="Sign in with Github"
              onClick={() => signIn("github", { callbackUrl: "/" })}
            />
            <SigninButton
              icon={<FaDiscord size={20} className="text-indigo-500" />}
              text="Sign in with Discord"
              onClick={() => signIn("discord", { callbackUrl: "/" })}
            />
            <SigninButton
              icon={<MdEmail size={22} className="text-gray-500" />}
              text="Sign in by your account"
              onClick={() => router.push("/credentials")}
            />
          </div>

          <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-8">
            New to Trading Software?{" "}
            <a
              href="/register"
              className="text-pink-600 dark:text-pink-400 font-medium hover:underline"
            >
              Create an account
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
