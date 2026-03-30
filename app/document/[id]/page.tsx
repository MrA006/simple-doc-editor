"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Sidebar from "@/components/sidebar/Sidebar";
import TiptapEditor from "@/components/editor/TiptapEditor";
import HistoryPanel from "@/components/editor/HistoryPanel";
import ShareModal from "@/components/ui/ShareModal";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { timeAgo } from "@/lib/utils";

interface SharedUser {
  id: string;
  name: string;
  email: string;
}

interface Document {
  id: string;
  title: string;
  content: string;
  updatedAt: string;
  ownerId: string;
  isOwner: boolean;
  owner?: { id: string; name: string; email: string };
  sharedWith: SharedUser[];
}

export default function DocumentPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: userLoading } = useCurrentUser();
  const [document, setDocument] = useState<Document | null>(null);
  const [title, setTitle] = useState("");
  const [docLoading, setDocLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [consecutiveErrors, setConsecutiveErrors] = useState(0);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const saveCountRef = useRef(0);

  useEffect(() => {
    if (!userLoading && !user) {
      router.push("/login");
    }
  }, [user, userLoading, router]);

  const fetchDocument = useCallback(async () => {
    if (!params.id) return;
    setDocLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/documents/${params.id}`);
      if (res.status === 403) {
        setError("You don't have access to this document");
        return;
      }
      if (res.status === 404) {
        setError("Document not found");
        return;
      }
      if (!res.ok) {
        setError("Failed to load document");
        return;
      }
      const data = await res.json();
      setDocument(data);
      setTitle(data.title);
    } catch {
      setError("Failed to load document");
    } finally {
      setDocLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    if (params.id && user) {
      fetchDocument();
    }
  }, [params.id, user, fetchDocument]);

  const handleTitleSave = useCallback(async () => {
    if (!document) return;
    const newTitle = title.trim() || "Untitled Document";
    if (newTitle === document.title) {
      setIsEditingTitle(false);
      return;
    }

    try {
      const res = await fetch(`/api/documents/${document.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTitle }),
      });
      if (res.ok) {
        const updated = await res.json();
        setDocument((prev) => prev ? { ...prev, title: updated.title } : prev);
        setTitle(updated.title);

        const sidebarUpdate = (window as unknown as { __sidebarUpdateTitle?: (id: string, title: string) => void }).__sidebarUpdateTitle;
        if (sidebarUpdate) {
          sidebarUpdate(document.id, updated.title);
        }
      }
    } catch {
      setTitle(document.title);
    }
    setIsEditingTitle(false);
  }, [document, title]);

  const handleContentUpdate = useCallback(async (content: string) => {
    if (!document) return;
    setSaveStatus("saving");
    try {
      const res = await fetch(`/api/documents/${document.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: JSON.parse(content) }),
      });
      if (res.ok) {
        setSaveStatus("saved");
        setLastSaved(new Date());
        setConsecutiveErrors(0);
        saveCountRef.current += 1;

        if (saveCountRef.current % 5 === 0) {
          fetch(`/api/documents/${document.id}/versions`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ content: JSON.parse(content), title: document.title }),
          }).catch(() => {});
        }

        setTimeout(() => setSaveStatus("idle"), 2000);
      } else {
        throw new Error("Save failed");
      }
    } catch {
      setSaveStatus("error");
      setConsecutiveErrors((prev) => prev + 1);
    }
  }, [document]);

  useEffect(() => {
    if (isEditingTitle && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  }, [isEditingTitle]);

  const handleRestoreVersion = useCallback(async (content: object) => {
    if (!document) return;
    const res = await fetch(`/api/documents/${document.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });
    if (res.ok) {
      setDocument((prev) => prev ? { ...prev, content: JSON.stringify(content) } : prev);
      setShowHistory(false);
    }
  }, [document]);

  if (userLoading || docLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  if (!user) return null;

  if (error) {
    return (
      <div className="flex h-screen">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center bg-white">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-700 mb-2">{error}</h2>
            <button
              onClick={() => router.push("/dashboard")}
              className="text-blue-600 hover:underline text-sm"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!document) return null;

  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col bg-white">
        {consecutiveErrors >= 3 && (
          <div className="bg-red-50 border-b border-red-200 px-4 py-2 text-sm text-red-700">
            Changes may not be saving. Check your connection.
          </div>
        )}
        <div className="flex items-center justify-between px-6 py-3 border-b border-gray-200">
          <div className="flex items-center gap-3">
            {isEditingTitle ? (
              <input
                ref={titleInputRef}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={handleTitleSave}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleTitleSave();
                  if (e.key === "Escape") {
                    setTitle(document.title);
                    setIsEditingTitle(false);
                  }
                }}
                className="text-xl font-semibold text-gray-800 border border-blue-300 rounded px-2 py-1 outline-none focus:ring-2 focus:ring-blue-200"
              />
            ) : (
              <h2
                onClick={() => setIsEditingTitle(true)}
                className="text-xl font-semibold text-gray-800 cursor-pointer hover:bg-gray-100 px-2 py-1 rounded"
              >
                {document.title}
              </h2>
            )}
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs text-gray-400">
              {saveStatus === "saving" && "Saving..."}
              {saveStatus === "saved" && "Saved"}
              {saveStatus === "error" && <span className="text-red-500">Save failed</span>}
              {saveStatus === "idle" && lastSaved && `Saved ${timeAgo(lastSaved)}`}
            </span>
            <div className="relative">
              <button
                onClick={() => setShowShare(true)}
                className="text-sm text-gray-500 hover:text-gray-700 px-3 py-1 rounded border border-gray-200 hover:bg-gray-50"
              >
                Share
              </button>
              {showShare && document && (
                <ShareModal
                  documentId={document.id}
                  isOwner={document.isOwner}
                  ownerId={document.ownerId}
                  ownerName={document.owner?.name}
                  sharedWith={document.sharedWith || []}
                  onClose={() => setShowShare(false)}
                />
              )}
            </div>
            <button
              onClick={() => setShowHistory(!showHistory)}
              className={`text-sm px-3 py-1 rounded border transition-colors ${
                showHistory
                  ? "bg-blue-50 text-blue-700 border-blue-200"
                  : "text-gray-500 hover:text-gray-700 border-gray-200 hover:bg-gray-50"
              }`}
            >
              History
            </button>
            <button
              onClick={() => router.push("/login")}
              className="text-sm text-gray-500 hover:text-gray-700 px-3 py-1 rounded border border-gray-200 hover:bg-gray-50"
            >
              Logout
            </button>
          </div>
        </div>
        <div className="flex-1 flex overflow-hidden">
          <div className="flex-1 overflow-hidden">
            <TiptapEditor
              content={typeof document.content === "string" ? document.content : JSON.stringify(document.content)}
              onUpdate={handleContentUpdate}
            />
          </div>
          {showHistory && document && (
            <HistoryPanel
              documentId={document.id}
              isOwner={document.isOwner}
              onRestore={handleRestoreVersion}
              onClose={() => setShowHistory(false)}
            />
          )}
        </div>
      </div>
    </div>
  );
}
