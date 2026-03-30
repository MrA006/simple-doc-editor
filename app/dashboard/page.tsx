"use client";

import Sidebar from "@/components/sidebar/Sidebar";
import FileUpload from "@/components/ui/FileUpload";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function DashboardPage() {
  const { user, loading } = useCurrentUser();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col bg-white">
        <div className="flex justify-end p-4">
          <button
            onClick={() => router.push("/login")}
            className="text-sm text-gray-500 hover:text-gray-700 px-3 py-1 rounded border border-gray-200 hover:bg-gray-50"
          >
            Logout
          </button>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-semibold text-gray-700 mb-2">
              Welcome, {user.name}
            </h2>
            <p className="text-gray-500">
              Select a document or create a new one
            </p>
            <p className="text-gray-400 text-sm mt-2">
              or <FileUpload variant="link" />
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
