'use client';

import { updateUser } from "../../action";
import { deleteUser } from "../../action";
import React, { useEffect, useState, use } from "react";

export default function Page({ params }: { params: { id: string } }) {
    const [showPassword, setShowPassword] = useState(false);
    const [user, setUser] = useState<any>(null);
    useEffect(() => {
        async function getUserById() {
            const res = await fetch(`/api/users/${params.id}`);
            const data = await res.json();
            setUser(data.user);
        }
        getUserById();
    }, [params.id]);

    function toDatetimeLocal(date: Date | string | null | undefined) {
        if (!date) return "";

        const d = new Date(date);
        if (Number.isNaN(d.getTime())) return "";

        d.setMinutes(d.getMinutes() - d.getTimezoneOffset());

        return d.toISOString().slice(0, 16); // YYYY-MM-DDTHH:MM
    }

    async function handleDelete(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
    
        deleteUser(user.id);
    }

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="bg-white dark:bg-gray-800 shadow-lg rounded-2xl p-8 w-full max-w-2xl mx-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">Delete User</h2>
    
          <form onSubmit={handleDelete} className="space-y-4">
            <div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    defaultValue={user?.name || ""}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
                    placeholder="John"
                  />
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Email <span className="text-red-500">*</span>
                </label>
                <input
                    type="email"
                    name="email"
                    defaultValue={user?.email || ""}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
                    placeholder="you@example.com"
                    readOnly
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                    <input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        defaultValue={user?.password || ""}
                        className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-pink-500"
                        placeholder="••••••••"
                        readOnly
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

            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Email Verified <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                    <input
                        type="datetime-local"
                        name="emailVerified"
                        value={ toDatetimeLocal(user?.emailVerified)}
                        className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-pink-500"
                        readOnly
                    />
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Created At <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                    <input
                        type="datetime-local"
                        name="createdAt"
                        value={ toDatetimeLocal(user?.createdAt)}
                        className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-pink-500"
                        readOnly
                    />
                </div>
            </div>
                
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Updated At <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                    <input
                        type="datetime-local"
                        name="updatedAt"
                        value={ toDatetimeLocal(user?.updatedAt) }
                        className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-pink-500"
                        readOnly
                    />
                </div>
            </div>
            <button
                type="submit"
                className="w-full bg-pink-600 text-white py-3 rounded-lg font-semibold hover:bg-pink-700 transition-all duration-200 cursor-pointer disabled:opacity-70"
            >
                Delete user
            </button>
          </form>
        </div>
    </div>
  );
}