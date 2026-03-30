"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

interface FileUploadProps {
  variant?: "button" | "link";
  className?: string;
}

export default function FileUpload({
  variant = "button",
  className,
}: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/documents/import", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Import failed");
        setTimeout(() => setError(null), 5000);
      } else {
        router.push(`/document/${data.id}`);
      }
    } catch {
      setError("Import failed");
      setTimeout(() => setError(null), 5000);
    } finally {
      setLoading(false);
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  }

  return (
    <div className="flex flex-col">
      <input
        ref={inputRef}
        type="file"
        accept=".txt,.md"
        onChange={handleFileChange}
        className="hidden"
      />
      {variant === "button" ? (
        <button
          onClick={() => inputRef.current?.click()}
          disabled={loading}
          className={`w-full border border-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-50 transition-colors text-sm font-medium disabled:opacity-50 ${className}`}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg
                className="animate-spin h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              Importing...
            </span>
          ) : (
            "Import File"
          )}
        </button>
      ) : (
        <button
          onClick={() => inputRef.current?.click()}
          disabled={loading}
          className={`text-blue-600 hover:underline text-sm disabled:opacity-50 ${className}`}
        >
          {loading ? "Importing..." : "import a .txt or .md file"}
        </button>
      )}
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
      {variant === "button" && (
        <p className="text-xs text-gray-400 mt-1 text-center">
          Supports .txt and .md files up to 2MB
        </p>
      )}
    </div>
  );
}
