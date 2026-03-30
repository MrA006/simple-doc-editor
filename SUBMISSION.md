# Submission

## Included
- `/` — Full Next.js application source
- `README.md` — Setup and run instructions
- `ARCHITECTURE.md` — Technical decisions and tradeoffs
- `AI_WORKFLOW.md` — AI tool usage note
- `SUBMISSION.md` — This file
- `VIDEO_URL.txt` — Walkthrough video link

## Test accounts
alice@test.com, bob@test.com, carol@test.com
Login at /login — no passwords needed.

## What is working
- Document creation, editing, rename, auto-save, reopen
- File import (.txt and .md)
- Sharing (owner can share/unshare, shared users see documents)
- Document version history (snapshot every 5th save, up to 10 versions, restorable)
- Delete (owner only)

## What is incomplete
- No real authentication
- No .docx support

## What I would build next (2–4 hours)
- Real auth via NextAuth
- Postgres migration
- WebSocket presence indicators
- Viewer vs editor roles
