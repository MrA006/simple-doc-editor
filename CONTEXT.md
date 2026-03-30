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

## Step 2: File Upload

**Goal:** Import .txt and .md files as editable Tiptap documents.

**Key Decisions:**
- Upload converts to new editable document (not attachment)
- Supported types: .txt and .md only
- .txt: split on `\n\n` → paragraphs → Tiptap JSON
- .md: `marked.parse()` → HTML → `generateJSON()` → Tiptap JSON
- File size limit: 2MB server-side
- Filename strips extension → document title
- Entry points: Sidebar "Import File" button + Dashboard empty state link
- POST /api/documents/import route with multipart/form-data
- Two integration tests for import

---

## Step 3: Sharing

**Goal:** Document owners can share with seeded users. Shared users can view/edit but not delete or re-share. Dashboard shows "Shared with me" section.

**Key Decisions:**
- Owner shares via dropdown in ShareModal (panel, not real modal)
- Shared users see "Owned by [name] / You have edit access" (no share controls)
- Sidebar has two sections: "My Documents" + "Shared with me" with divider
- GET /api/documents enriched with `sharedCount` field
- GET /api/documents/[id] enriched with `isOwner` + `sharedWith` fields
- Document deletion with inline confirmation (Sure? Yes/No)
- Shared docs show "Shared" badge in sidebar

---

## Step 4: Polish, Testing & Submission

**Goal:** Add stretch feature (version history), cleanup code, write documentation.

**Stretch Feature — Document Version History:**
- `DocumentVersion` model: id, documentId, content (JSON), title, savedAt
- Every 5th save creates a version snapshot
- Max 10 versions per document (oldest deleted on insert)
- History side panel shows versions as timestamps
- Click to preview read-only, "Restore this version" button
- No extra dependencies

**Documentation Deliverables:**
- README.md — setup instructions
- ARCHITECTURE.md — technical decisions
- AI_WORKFLOW.md — AI tool usage
- SUBMISSION.md — what's included/working

---
