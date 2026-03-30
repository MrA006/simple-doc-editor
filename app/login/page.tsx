"use client";

import { useRouter } from "next/navigation";

const users = [
  { email: "alice@test.com", name: "Alice" },
  { email: "bob@test.com", name: "Bob" },
  { email: "carol@test.com", name: "Carol" },
];

export default function LoginPage() {
  const router = useRouter();

  async function handleLogin(email: string) {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    if (res.ok) {
      router.push("/dashboard");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Doc Editor
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Choose a user to log in
          </p>
        </div>
        <div className="space-y-4">
          {users.map((user) => (
            <button
              key={user.email}
              onClick={() => handleLogin(user.email)}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Login as {user.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
