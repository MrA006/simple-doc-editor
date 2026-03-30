# Doc Editor

A collaborative document editor built with Next.js, Tiptap, and SQLite. Supports rich text editing, file import, document sharing, and version history.

## Prerequisites

- Node.js v20.18.0 (exact version used during development)
- npm (comes with Node.js)
- No other global installs required

## Local Setup

```bash
git clone <repo>
cd doc_editor
npm install
cp .env.example .env
npx prisma migrate dev --name init
npx prisma db seed
npm run dev
```

App runs at `http://localhost:3000`

## Test Accounts

```
alice@test.com  — Alice (use to test ownership and sharing)
bob@test.com    — Bob   (use to receive shared documents)
carol@test.com  — Carol (third user for multi-share testing)
```

Login at http://localhost:3000/login — click the user's button to switch.

## Supported File Types

- `.txt` — plain text, each double newline becomes a paragraph
- `.md` — markdown, headings/bold/lists/italic are converted to rich text
- Max file size: 2MB
- `.docx`, `.pdf`, and other formats are not supported

## Running Tests

```bash
npm test
```

## What's Not Included

- **No real authentication** — mock sessions with cookies; would add NextAuth or similar with more time
- **No real-time collaboration** — requires WebSockets + CRDT, out of scope for this timebox
- **No .docx import** — mammoth.js is viable but edge case handling would be brittle without proper QA time
- **No role-based permissions** beyond owner/collaborator — clear next step
- **No PDF export** — would use a headless browser or a library like @react-pdf/renderer
