"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { timeAgo } from "@/lib/utils";
import FileUpload from "@/components/ui/FileUpload";

interface Document {
  id: string;
  title: string;
  updatedAt: string;
  isOwner: boolean;
  sharedCount?: number;
  owner?: { id: string; name: string; email: string };
}

interface SidebarProps {
  onTitleUpdate?: (id: string, title: string) => void;
}

export default function Sidebar({ onTitleUpdate }: SidebarProps) {
  const [myDocs, setMyDocs] = useState<Document[]>([]);
  const [sharedDocs, setSharedDocs] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  const activeDocId = pathname?.startsWith("/document/")
    ? pathname.split("/document/")[1]
    : null;

  useEffect(() => {
    fetchDocuments();
  }, []);

  useEffect(() => {
    if (onTitleUpdate) {
      (
        window as unknown as {
          __sidebarUpdateTitle?: (id: string, title: string) => void;
        }
      ).__sidebarUpdateTitle = (id: string, title: string) => {
        setMyDocs((prev) =>
          prev.map((doc) => (doc.id === id ? { ...doc, title } : doc))
        );
        setSharedDocs((prev) =>
          prev.map((doc) => (doc.id === id ? { ...doc, title } : doc))
        );
      };
    }
  }, [onTitleUpdate]);

  async function fetchDocuments() {
    try {
      const [myRes, sharedRes] = await Promise.all([
        fetch("/api/documents"),
        fetch("/api/documents/shared"),
      ]);
      if (myRes.ok) {
        const data = await myRes.json();
        setMyDocs(data.documents || []);
      }
      if (sharedRes.ok) {
        const data = await sharedRes.json();
        setSharedDocs(data.documents || []);
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleNewDocument() {
    const res = await fetch("/api/documents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    if (res.ok) {
      const doc = await res.json();
      router.push(`/document/${doc.id}`);
      fetchDocuments();
    }
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/documents/${id}`, { method: "DELETE" });
    if (res.ok) {
      setMyDocs((prev) => prev.filter((d) => d.id !== id));
      if (activeDocId === id) {
        router.push("/dashboard");
      }
    }
    setDeletingId(null);
  }

  return (
    <div className="w-60 bg-gray-50 border-r border-gray-200 h-screen flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <h1 className="text-lg font-semibold text-gray-800">Doc Editor</h1>
      </div>
      <div className="p-3 space-y-2">
        <button
          onClick={handleNewDocument}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          New Document
        </button>
        <FileUpload variant="button" />
      </div>
      <div className="flex-1 overflow-y-auto px-3">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2 px-1">
          My Documents
        </p>
        {loading ? (
          <p className="text-sm text-gray-400 px-1">Loading...</p>
        ) : myDocs.length === 0 ? (
          <p className="text-sm text-gray-400 px-1">No documents yet</p>
        ) : (
          <ul className="space-y-1">
            {myDocs.map((doc) => (
              <li key={doc.id} className="group relative">
                <button
                  onClick={() => router.push(`/document/${doc.id}`)}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                    activeDocId === doc.id
                      ? "bg-blue-100 text-blue-700"
                      : "hover:bg-gray-100 text-gray-700"
                  }`}
                >
                  <div className="font-medium truncate flex items-center gap-1">
                    {doc.title}
                    {doc.sharedCount && doc.sharedCount > 0 ? (
                      <span className="text-xs text-gray-400 font-normal">
                        Shared
                      </span>
                    ) : null}
                  </div>
                  <div className="text-xs text-gray-400">
                    {timeAgo(new Date(doc.updatedAt))}
                  </div>
                </button>
                {deletingId === doc.id ? (
                  <div className="absolute right-1 top-1 flex items-center gap-1 bg-white border border-gray-200 rounded px-1 py-0.5 text-xs shadow-sm">
                    <span className="text-gray-500">Sure?</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(doc.id);
                      }}
                      className="text-red-600 hover:text-red-700 font-medium"
                    >
                      Yes
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeletingId(null);
                      }}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      No
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeletingId(doc.id);
                    }}
                    className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-gray-600 text-lg leading-none"
                    title="Delete"
                  >
                    &hellip;
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}

        <div className="border-t border-gray-200 my-3" />

        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2 px-1">
          Shared with me
        </p>
        {loading ? (
          <p className="text-sm text-gray-400 px-1">Loading...</p>
        ) : sharedDocs.length === 0 ? (
          <p className="text-sm text-gray-400 px-1">
            No documents shared with you yet
          </p>
        ) : (
          <ul className="space-y-1">
            {sharedDocs.map((doc) => (
              <li key={doc.id}>
                <button
                  onClick={() => router.push(`/document/${doc.id}`)}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                    activeDocId === doc.id
                      ? "bg-blue-100 text-blue-700"
                      : "hover:bg-gray-100 text-gray-700"
                  }`}
                >
                  <div className="font-medium truncate">{doc.title}</div>
                  <div className="text-xs text-gray-400">
                    {doc.owner?.name}
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
