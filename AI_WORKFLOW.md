# AI Workflow

## Tools Used

- **OpenCode** — architecture planning, step-by-step implementation planning, code generation, debugging
- **Tiptap documentation** — extension configuration reference

## Where AI Materially Sped Up the Work

- **Tiptap JSON schema** — asked for the exact JSON structure `editor.getJSON()` produces so the file parser could target it correctly without trial and error
- **Prisma schema design** — AI suggested the `_count` include pattern for `sharedCount` which saved looking through Prisma docs
- **marked + generateJSON pipeline** — AI identified this two-step approach for markdown conversion; verified by testing with a sample `.md` file
- **ShareModal component** — AI scaffolded the panel structure with owner vs collaborator states

## What AI Generated That I Changed or Rejected

- **AI initially suggested using multer for file uploads.** Rejected — Next.js App Router has native `formData()` parsing; adding multer would be unnecessary complexity
- **AI suggested storing document content as a serialized HTML string.** Rejected — Tiptap JSON is the correct format because it round-trips perfectly without re-parsing
- **AI suggested a more complex version diffing system for history.** Simplified to full snapshots — diff complexity wasn't worth it for a 10-version cap
- **AI generated dark mode CSS that conflicted with editor visibility.** Removed dark mode media query and forced black text on white background for the editor

## How I Verified Correctness

- Manually tested every user flow after implementation: create, edit, save, refresh, import, share, version restore
- Verified Tiptap JSON structure by inspecting `editor.getJSON()` output on a formatted document before writing the parser
- Ran lint after each step, not just at the end
- Checked sharing logic by logging in as different users and confirming visibility rules
