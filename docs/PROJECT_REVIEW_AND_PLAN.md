# Memories — Project Review, Plan & Honest Opinion

_Reviewed: 2026-06-19. Scope: full repo (backend Express/Mongo/Drive + frontend Vite/React)._

This is the "what do I actually think, and what should you do" document. The detailed bug
lists live in:
- `docs/backend-review/BACKEND_BUGS.md`
- `docs/frontend-review/FRONTEND_BUGS.md`

---

## 1. What this project is (and is it good?)

**Memories** is a personal photo-sharing app: log in with Google, create albums, store the
photos in *your own* Google Drive, and share albums with family/friends via a link, with
optional collections and collaboration.

**My honest opinion:** the *idea* is genuinely good — and notably smart for a personal/family
project. Using each user's own Google Drive as the storage layer means **you don't pay for
storage or bandwidth**, you don't become the custodian of other people's private family
photos, and it scales for free. For "me, my family, and friends," that's a better call than
spinning up S3 and a billing risk. So: good concept, sensible tech choices (Express, Mongo,
React, shadcn/ui), clean-ish file structure.

**But** — and this is the honest part — **right now it is not a working product, it's two
halves that don't touch.** The backend is a reasonable first draft with several real bugs; the
frontend is an attractive Lovable mockup with *zero* API calls. Nothing end-to-end works yet:
you can't actually log in, upload, or share. The README describes features ("input validation",
"collaboration", "collections") that are partly aspirational — collaboration uploads are
literally faked in code.

So: **promising foundation, ~25–30% of the way to a real app.** Very normal for this stage.
Don't be discouraged — the gap is mostly "wire it together + fix a handful of correctness bugs,"
not "rearchitect everything."

**Should you share it?** Not yet. Two blockers before you send a link to anyone:
1. Fix the cross-user Google Drive credential bug (backend B1) — otherwise concurrent users can
   hit each other's Drives.
2. Get one real end-to-end flow working (login → upload → view → share).
Until then, share it only as a "look what I'm building" demo, not as something people store real
photos in.

---

## 2. Answers to your direct questions (skills & the "21st dev" MCP)

You asked whether I have an "implacable skill", a "test skill", and the "magic 21st dev MCP".
Here's the straight answer:

- **"Implement / apply" skill** — I don't have a single skill literally named that, but I have
  everything needed to *implement* changes directly (edit files, run commands, commit, push).
  Relevant skills I _do_ have: `code-review` (find bugs in a diff), `review` (review a PR),
  `security-review`, `simplify` (clean up code), `verify` and `run` (actually run the app to
  confirm a change works), plus `init` and `session-start-hook`.
- **"Test" skill** — there's no dedicated unit-test-generator skill, but `verify` runs the app
  and observes behavior, and I can write real tests (Jest/Vitest/Playwright) for you on request.
  Your backend currently has **no tests at all** (`npm test` = `exit 1`).
- **"Magic / 21st.dev MCP"** — ❌ **not connected to this session.** The MCP servers available
  here are **Canva, Google Drive, Notion, and GitHub** only. There is no 21st.dev "Magic" MCP
  (the AI UI-component generator) attached. If you want it, you'd add it to your Claude Code MCP
  config (`claude mcp add` with the 21st.dev server) — but honestly, for this project you don't
  need it: you already have a complete shadcn/ui component library installed. The frontend's
  problem isn't "needs more pretty components," it's "needs to be connected to the API."

> ⚠️ Note: I can see **Google Drive** MCP tools are available. Those act on *your* Google Drive
> from this session — that's separate from the app's OAuth-based Drive integration. I won't touch
> your Drive unless you ask.

---

## 3. PR-Review-style checklist

How I'd comment if this landed as a PR. (`[ ]` = should address.)

### 🔴 Blocking
- [ ] **Per-request Google Drive client** — shared global `oauth2Client` leaks credentials across
      concurrent users. (BACKEND B1)
- [ ] **Untrack `backend/.env`** and add it to `.gitignore` before any real secret is committed.
      (BACKEND B3)
- [ ] **Collaboration upload is fake** — it drops the real file and stores `temp_` placeholders.
      Make it real or disable the route. (BACKEND B2)
- [ ] **Frontend is not connected to the backend** — wire up at least login → upload → view.
      (FRONTEND F1–F5)

### 🟠 Should fix before "release to family"
- [ ] Settle on **one auth model** (recommend JWT); make `/api/auth/me` consistent with it.
      (BACKEND B4)
- [ ] **Stop passing the JWT in the URL** query string. (BACKEND B5)
- [ ] **Persist/refresh Google tokens** and don't store them in plaintext. (BACKEND B6)
- [ ] **Add route guards** + an API client + `VITE_API_URL` on the frontend. (FRONTEND F2–F4)
- [ ] **Fix the share link** to use the backend `shareKey`, and build a public share page.
      (FRONTEND F6)

### 🟡 Quality / correctness
- [ ] `Album.pre('save')`: `Date.now` → `Date.now()` (or use `{ timestamps: true }`). (BACKEND B8)
- [ ] Create `uploads/` at startup or switch multer to memory storage. (BACKEND B7)
- [ ] Add input validation (zod/express-validator); `imageIds.includes` will 500 on bad input.
      (BACKEND B10)
- [ ] Serve album images from the DB, not a live Drive call per request. (BACKEND B11)
- [ ] Wire up the unused `utils/errorHandler.js`; remove the duplicate inline handler. (BACKEND B13)
- [ ] Fix CORS origin / port mismatch (3000 vs 8080). (BACKEND B14)
- [ ] Clean `protect` middleware control flow + drop pointless `.select('-password')`. (BACKEND B9)
- [ ] Object-URL memory leaks in Upload; revoke on unmount/clear. (FRONTEND F8)
- [ ] Delete orphaned `Index.tsx`; pick one toaster; fix "PhotoShare" vs "Memories" naming.
      (FRONTEND F9, F10, F7)

### 🟢 Nice-to-have
- [ ] Tests + lint + CI on both halves.
- [ ] Lazy-load thumbnails; pagination/virtualization for large albums. (FRONTEND F13)
- [ ] Per-route rate limits; helmet CSP; `trust proxy`. (BACKEND B17, B20)
- [ ] One lockfile / one package manager on the frontend. (FRONTEND F18)

---

## 4. Architecture — what to do, and what NOT to do

### Keep (good decisions, don't change)
- **User-owned Google Drive as storage.** This is the project's best idea — keep it.
- **React + Vite + shadcn/ui** on the front, **Express + Mongoose** on the back. Right-sized.
- **Mongo for metadata** (albums, collections, share keys). Good fit.

### Fix the architecture here
1. **Per-user credentials, always.** No shared mutable Google client. This is the single most
   important architectural change. Pass a per-request `drive` instance through the service layer.
2. **Pick one auth model — JWT.** It's an SPA + API; go stateless JWT. Use sessions *only* for the
   OAuth handshake, or drop `express-session`/`connect-mongo` entirely after the callback. Don't
   run both half-implemented.
3. **One source of truth for image metadata = MongoDB.** Treat Drive as the blob store. Write
   metadata on upload; read from Mongo. Reconcile with Drive lazily/in a background job, not on
   every GET.
4. **Decide how shared images are served — and be consistent.** Two clean options:
   - **(Recommended) Proxy through your backend:** a `GET /api/shares/.../image/:fileId` endpoint
     that streams the file using the *owner's* tokens. Pros: works for private albums, viewers
     don't need Google accounts, you control access via `shareKey`. Cons: bandwidth flows through
     your server.
   - **Make the Drive folder truly public** and serve Drive links directly. Pros: zero bandwidth on
     you. Cons: "public to anyone with the link" only; per-user Drive sharing won't render for
     logged-out viewers. Right now the code half-does both — pick one.
5. **Stream uploads (memory storage) instead of writing temp files to disk.** Removes the `uploads/`
   directory dependency and works on ephemeral/serverless hosts.

### Do NOT do (avoid over-engineering for a family app)
- ❌ Don't add microservices, Kubernetes, message queues, or GraphQL. Overkill for this scale.
- ❌ Don't build your own image CDN / thumbnail pipeline — Drive already gives you `thumbnailLink`.
- ❌ Don't add a second database (Redis, etc.) yet. Mongo + sessions-in-Mongo is plenty.
- ❌ Don't add the 21st.dev Magic MCP or more UI kits — you already have shadcn/ui fully installed.
- ❌ Don't add face-recognition / ML "collections" auto-tagging now. Tempting, but it's a rabbit
   hole; ship manual collections first.
- ❌ Don't write your own auth/crypto — keep using Passport + Google OAuth + `jsonwebtoken`.

### Things we _could_ do later (genuinely worth it, but not now)
- 🔵 Album cover thumbnails + lazy loading + pagination.
- 🔵 Download-selected-as-ZIP (you have a "Download (n)" button with a TODO behind it).
- 🔵 Real, working collaboration uploads (owner-token upload, per-collaborator audit trail).
- 🔵 PWA / installable + offline album viewing.
- 🔵 Soft-delete / trash + undo, so a misclick doesn't nuke a Drive folder.
- 🔵 Basic tests + GitHub Actions CI once the flows are stable.

---

## 5. Suggested roadmap (in order)

**Phase 0 — hygiene (½ day)**
Untrack `.env` (B3); fix CORS/port (B14); fix `Date.now()` (B8); delete `Index.tsx`; pick a name.

**Phase 1 — make the backend correct (1–2 days)**
Per-request Drive client (B1); settle on JWT (B4) + stop URL token (B5); create/stream uploads
(B7); validation (B10); serve images from DB (B11); wire the real error handler (B13).

**Phase 2 — connect the frontend (2–4 days)**
API client + `VITE_API_URL` (F3); AuthProvider capturing `?token=` (F2); route guards (F4); real
Google login (F1); wire Dashboard/Upload/Gallery via TanStack Query (F5); fix memory leaks (F8).

**Phase 3 — sharing actually works (1–2 days)**
Backend share-image proxy or public-Drive decision (architecture §4.4); public `/share/:shareKey`
page; fix the copy-link URL (F6).

**Phase 4 — make collaboration real, or cut it (1 day)**
Implement owner-token uploads (B2) or remove the half-built endpoint and UI.

**Phase 5 — polish & share with family**
Thumbnails/lazy-load (F13), ZIP download, a few tests, then send the link.

---

## 6. TL;DR

Good idea, sensible stack, the Drive-as-storage choice is genuinely clever for a family app. But
it's a foundation, not a finished product: the frontend is a mockup with no API calls, and the
backend has one serious concurrency bug (shared Google client), a faked collaboration feature, and
a tracked `.env`. Fix those, connect the two halves for one real flow, then it's absolutely
shareable with family and friends. Resist the urge to add fancy infra or ML — the win here is
"finish the basics well," not "add more."
