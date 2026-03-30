# Project Context & Changes

Tracking abstract context for each step and change made during development.

---

## Project Architecture

**Stack:** Next.js 14 (App Router) + TypeScript + Tiptap v2 + SQLite (Prisma ORM) + Tailwind CSS + npm

**Folder Structure:**
- `/app` — Next.js App Router (API routes + pages)
- `/components` — UI components (editor, sidebar, ui)
- `/lib` — Utilities (db.ts, auth.ts, utils.ts)
- `/prisma` — Schema + seed

**Database Models:**
- `User` — id, email, name, documents (owned), sharedWith
- `Document` — id, title, content (JSON), timestamps, owner
- `SharedDoc` — documentId, userId (unique compound constraint)

**Mock Auth Pattern:**
- Cookie-based `userId` storage
- `/api/auth/login` POST sets cookie
- `/api/auth/me` GET returns current user
- `useCurrentUser()` client hook
- Simple login page with 3 user buttons (Alice, Bob, Carol)

---

## Step 1: Document Creation and Editing

**Goal:** Implement core CRUD for documents with a Tiptap editor, auto-save, inline renaming, and a sidebar navigation.

**Key Decisions:**
- 1500ms debounce on auto-save via `editor.on('update')`
- Sidebar persists across dashboard and editor pages
- Title is inline-editable with PATCH on blur/Enter
- Toolbar: Bold, Italic, Underline, H1, H2, Bullet List, Numbered List
- Error handling: 403/404 pages, persistent save failure banner after 3 consecutive failures
- Integration test: POST /api/documents with correct ownerId

---
