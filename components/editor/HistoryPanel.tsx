"use client";

import { useState, useEffect, useCallback } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";

interface Version {
  id: string;
  title: string;
  savedAt: string;
}

interface HistoryPanelProps {
  documentId: string;
  isOwner: boolean;
  onRestore: (content: object) => void;
  onClose: () => void;
}

function formatTimestamp(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();

  const time = date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  if (isToday) return `Today ${time}`;

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) {
    return `Yesterday ${time}`;
  }

  return `${date.toLocaleDateString("en-US", { month: "short", day: "numeric" })} ${time}`;
}

function VersionPreview({ content }: { content: object }) {
  const editor = useEditor({
    extensions: [StarterKit, Underline],
    content,
    editable: false,
    immediatelyRender: false,
  });

  return (
    <div className="border border-gray-200 rounded p-3 bg-gray-50 max-h-64 overflow-y-auto">
      <EditorContent editor={editor} />
    </div>
  );
}

export default function HistoryPanel({
  documentId,
  isOwner,
  onRestore,
  onClose,
}: HistoryPanelProps) {
  const [versions, setVersions] = useState<Version[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVersion, setSelectedVersion] = useState<string | null>(null);
  const [versionContent, setVersionContent] = useState<object | null>(null);
  const [loadingContent, setLoadingContent] = useState(false);

  useEffect(() => {
    fetchVersions();
  }, [documentId]);

  async function fetchVersions() {
    try {
      const res = await fetch(`/api/documents/${documentId}/versions`);
      if (res.ok) {
        const data = await res.json();
        setVersions(data.versions || []);
      }
    } finally {
      setLoading(false);
    }
  }

  const handleSelectVersion = useCallback(async (versionId: string) => {
    setSelectedVersion(versionId);
    setLoadingContent(true);
    setVersionContent(null);

    try {
      const res = await fetch(
        `/api/documents/${documentId}/versions/${versionId}`
      );
      if (res.ok) {
        const data = await res.json();
        setVersionContent(data.content);
      }
    } finally {
      setLoadingContent(false);
    }
  }, [documentId]);

  function handleRestore() {
    if (versionContent) {
      onRestore(versionContent);
    }
  }

  return (
    <div className="w-80 border-l border-gray-200 bg-gray-50 flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h3 className="text-sm font-semibold text-gray-700">Version History</h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 text-lg leading-none"
        >
          &times;
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <p className="p-4 text-sm text-gray-400">Loading...</p>
        ) : versions.length === 0 ? (
          <p className="p-4 text-sm text-gray-400">
            No versions yet. Versions are saved every 5 edits.
          </p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {versions.map((v) => (
              <li key={v.id}>
                <button
                  onClick={() => handleSelectVersion(v.id)}
                  className={`w-full text-left px-4 py-3 text-sm hover:bg-gray-100 transition-colors ${
                    selectedVersion === v.id
                      ? "bg-blue-50 text-blue-700"
                      : "text-gray-700"
                  }`}
                >
                  {formatTimestamp(v.savedAt)}
                </button>
              </li>
            ))}
          </ul>
        )}

        {selectedVersion && (
          <div className="p-4 border-t border-gray-200">
            {loadingContent ? (
              <p className="text-sm text-gray-400">Loading preview...</p>
            ) : versionContent ? (
              <>
                <p className="text-xs font-medium text-gray-500 mb-2">
                  Preview
                </p>
                <VersionPreview content={versionContent} />
                {isOwner && (
                  <button
                    onClick={handleRestore}
                    className="mt-3 w-full bg-blue-600 text-white py-2 px-4 rounded text-sm font-medium hover:bg-blue-700"
                  >
                    Restore this version
                  </button>
                )}
              </>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
