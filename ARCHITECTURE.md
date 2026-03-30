# Architecture

## Why Next.js App Router

Single deployment unit — frontend and API routes in one repo. Reduces operational complexity for a solo timebox project. App Router gives server components which reduce client bundle size on the dashboard.

## Why Tiptap

Most mature headless editor with a first-class extension system. StarterKit gave bold, italic, underline, headings, lists, and undo/redo in one import. Outputs clean JSON (`editor.getJSON()`) which stores cleanly in SQLite and round-trips without loss.

## Why SQLite + Prisma

Zero infrastructure — no database server to spin up for reviewers. Prisma handles migrations and type-safe queries. Tradeoff: SQLite doesn't support concurrent writes well, so this would need to move to Postgres before any real multi-user load.

## Data Model Decisions

- Document content stored as Tiptap JSON in a `String` column — preserves all formatting without parsing on read
- SharedDoc join table keeps sharing logic clean — adding roles later is a one-column migration
- DocumentVersion stores full content snapshots — not deltas — intentionally simple, 10-version cap avoids unbounded growth

## What I Prioritized

- End-to-end document loop (create → edit → save → reopen) — this is the core product
- File import that integrates into the workflow, not just an attachment
- Sharing with clear ownership semantics
- Version history as a high-signal stretch

## What I Would Build Next (2–4 More Hours)

- Move auth to NextAuth with real sessions
- Switch to Postgres for production readiness
- Add WebSocket-based presence indicators (who is viewing the document)
- Role-based sharing (viewer vs editor)
- Export to Markdown
