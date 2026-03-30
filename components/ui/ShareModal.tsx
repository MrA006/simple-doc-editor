"use client";

import { useState, useEffect, useRef } from "react";

interface User {
  id: string;
  name: string;
  email: string;
}

interface ShareModalProps {
  documentId: string;
  isOwner: boolean;
  ownerId: string;
  ownerName?: string;
  sharedWith: User[];
  onClose: () => void;
}

export default function ShareModal({
  documentId,
  isOwner,
  ownerId,
  ownerName,
  sharedWith: initialSharedWith,
  onClose,
}: ShareModalProps) {
  const [sharedWith, setSharedWith] = useState<User[]>(initialSharedWith);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function fetchUsers() {
      const res = await fetch("/api/users");
      if (res.ok) {
        const data = await res.json();
        setAllUsers(data.users || []);
      }
    }
    if (isOwner) {
      fetchUsers();
    }
  }, [isOwner]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  async function handleShare() {
    if (!selectedUserId) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/documents/${documentId}/shares`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: selectedUserId }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error);
      } else {
        setSharedWith(data.sharedWith);
        setSelectedUserId("");
      }
    } catch {
      setError("Failed to share");
    } finally {
      setLoading(false);
    }
  }

  async function handleRemove(userId: string) {
    setError(null);
    try {
      const res = await fetch(
        `/api/documents/${documentId}/shares/${userId}`,
        { method: "DELETE" }
      );
      const data = await res.json();
      if (!res.ok) {
        setError(data.error);
      } else {
        setSharedWith(data.sharedWith);
      }
    } catch {
      setError("Failed to remove");
    }
  }

  const availableUsers = allUsers.filter(
    (u) =>
      u.id !== ownerId && !sharedWith.find((s) => s.id === u.id)
  );

  return (
    <div className="fixed inset-0 z-50" onClick={onClose}>
      <div
        ref={panelRef}
        className="absolute right-6 top-12 w-80 bg-white border border-gray-200 rounded-lg shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        {isOwner ? (
          <>
            <div className="p-4 border-b border-gray-100">
              <p className="text-sm font-medium text-gray-700 mb-2">
                Share with
              </p>
              <div className="flex gap-2">
                <select
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className="flex-1 text-sm border border-gray-300 rounded px-2 py-1.5"
                >
                  <option value="">Select a user</option>
                  {availableUsers.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.email})
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleShare}
                  disabled={!selectedUserId || loading}
                  className="bg-blue-600 text-white px-3 py-1.5 rounded text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                >
                  Share
                </button>
              </div>
              {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
            </div>

            <div className="p-4 border-b border-gray-100">
              <p className="text-sm font-medium text-gray-700 mb-2">
                Shared with
              </p>
              {sharedWith.length === 0 ? (
                <p className="text-sm text-gray-400">
                  Not shared with anyone yet
                </p>
              ) : (
                <ul className="space-y-2">
                  {sharedWith.map((user) => (
                    <li
                      key={user.id}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium text-gray-600">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700">
                            {user.name}
                          </p>
                          <p className="text-xs text-gray-400">{user.email}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemove(user.id)}
                        className="text-gray-400 hover:text-red-500 text-lg leading-none"
                        title="Remove"
                      >
                        &times;
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="p-3">
              <p className="text-xs text-gray-400">Owned by You</p>
            </div>
          </>
        ) : (
          <div className="p-4">
            <p className="text-sm text-gray-700">
              Owned by <span className="font-medium">{ownerName}</span>
            </p>
            <p className="text-xs text-gray-400 mt-1">You have edit access</p>
          </div>
        )}
      </div>
    </div>
  );
}
