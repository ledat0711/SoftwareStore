'use client';

import { useState } from "react";
import { createUser } from "../action";

export default function Page() {
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setError("");
        setLoading(true);

        const formData = new FormData(e.currentTarget)
        createUser(formData);
    }
  
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="bg-white dark:bg-gray-800 shadow-lg rounded-2xl p-8 w-full max-w-2xl mx-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">Create User</h2>
    
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
                    placeholder="John"
                    required
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
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
                      placeholder="you@example.com"
                      required
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

              <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Email Verified <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                      <input
                          type="datetime-local"
                          name="emailVerified"
                          className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-pink-500"
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
                        className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-pink-500"
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
                          className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-pink-500"
                      />
                  </div>
              </div>
               <button 
                    type="submit"
                    disabled={loading}
                    className="text-white bg-pink-600 box-border border border-transparent hover:bg-brand-strong focus:ring-4 focus:ring-brand-medium shadow-xs font-medium leading-5 rounded-base text-sm px-4 py-2.5 focus:outline-none"
                >
                    Create user
                </button>
          </form>
        </div>
    </div>
  );
}
