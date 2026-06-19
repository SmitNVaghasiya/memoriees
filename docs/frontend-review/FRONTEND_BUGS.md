# Frontend — Bugs, Optimizations & Things Forgotten

Project: **Memories** frontend (Vite + React 18 + TypeScript + shadcn/ui + React Router + TanStack Query). Generated with Lovable (`lovable-tagger`).
Reviewed: `src/App.tsx`, `src/pages/*`, `src/main.tsx`, `vite.config.ts`, `package.json`.

Severity legend: 🔴 Critical · 🟠 High · 🟡 Medium · 🟢 Low / polish.

---

## 🔴 The big one

### F1. The frontend is a mockup — nothing is wired to the backend
Every page is scaffold with `// TODO` and mock/empty state. Confirmed: there are **zero** real network calls in `src/` (the only `fetch` is a commented-out example in `Auth.tsx`).

- `Auth.tsx` → "Continue with Google" just calls `navigate("/dashboard")`. No OAuth, no token.
- `Dashboard.tsx` → `albums` is an empty hardcoded array.
- `Upload.tsx` → `handleUpload` just `toast.success(...)` and navigates; files are never sent.
- `Gallery.tsx` → `photos`/`collections` are empty mock arrays; download/add-photos are TODOs.

So the backend you built and the UI are **two disconnected halves**. This is the #1 thing to fix — everything else below is secondary to "make it actually talk to the API."

---

## 🟠 High-severity gaps

### F2. No API client / no auth token handling
There is no axios/fetch wrapper, no place that reads the JWT from the OAuth redirect (`/dashboard?token=...`), no storage of it, and nothing that attaches `Authorization: Bearer`. You need a small `src/lib/api.ts` (a configured fetch/axios instance) and an auth context/hook that:
1. reads `?token=` on landing, stores it (memory + storage),
2. attaches it to every request,
3. exposes `user`/`isAuthenticated`,
4. calls `GET /api/auth/me` to hydrate the user.

### F3. No environment config for the backend URL
No `VITE_API_URL` anywhere. The base URL is hardcoded nowhere and assumed nowhere. Add a `.env` with `VITE_API_BASE_URL` and read it via `import.meta.env`.

### F4. No route guards — protected pages are open
`/dashboard`, `/upload`, `/gallery/:id` are reachable by typing the URL with no auth. Add a `<ProtectedRoute>` wrapper that redirects to `/auth` when there's no valid token.

### F5. TanStack Query is set up but never used
`QueryClientProvider` wraps the app, but no `useQuery`/`useMutation` exists. Once the API client lands, all data fetching (albums, images, upload) should go through it for caching, loading and error states — otherwise you've got the dependency cost with none of the benefit.

---

## 🟡 Medium-severity issues

### F6. "Share link" copies the wrong URL
`Gallery.tsx`: `const shareUrl = window.location.href;` — this is the **internal app URL** (`/gallery/<mongoId>`), which requires login and won't work for the family/friends you send it to. The real share link must be built from the album's backend `shareKey` (e.g. `https://yourapp/share/<shareKey>`), and you need a public share-view route/page (which doesn't exist yet).

### F7. Brand name is inconsistent
The repo/product is "Memories" (`memoriees`), but the UI says **"PhotoShare"** everywhere (`Auth.tsx`, `Dashboard.tsx`). Pick one name and use it consistently.

### F8. Object URL memory leaks in Upload
`Upload.tsx` creates previews with `URL.createObjectURL(file)`. They're only revoked on individual `removeFile`. "Clear All" (`setFiles([])`) and unmount/navigation **don't** revoke them → leaked blob URLs. Add a `useEffect` cleanup that revokes all previews on unmount, and revoke in "Clear All".

### F9. Orphaned dead page
`src/pages/Index.tsx` is the default Lovable "Welcome to Your Blank App" placeholder and is **not routed** (App uses `Landing` for `/`). Delete it to avoid confusion.

### F10. Two toast systems mounted at once
`App.tsx` mounts both shadcn `<Toaster />` and Sonner `<Sonner />`. Pages use Sonner's `toast`. Keep one (you also ship `use-toast.ts` for the other). Redundant bundle weight + two notification styles.

---

## 🟢 Low / polish

- **F11. `any` types.** `Gallery.tsx` `collections: any[]`. Define real interfaces (you already have `Photo`/`Album`) and keep TS strict.
- **F12. No loading / error / empty-while-fetching states.** Empty arrays currently render the "no albums/photos" empty state even while data would be loading. Distinguish loading vs genuinely empty once the API is wired.
- **F13. No image performance work.** No `loading="lazy"` on `<img>`, no thumbnails-vs-full-res strategy, no virtualization/pagination for big albums. For a Drive-backed gallery this matters — use `thumbnailLink` in grids and full res only in slideshow/download.
- **F14. No error boundary.** A render error blanks the whole app. Add a top-level React error boundary.
- **F15. Accessibility.** Icon-only buttons (back arrow, remove `X`) lack `aria-label`s; selection checkboxes/cards could use better keyboard semantics.
- **F16. Sign-out is a TODO.** `Dashboard.handleSignOut` just navigates home; it should call `GET /api/auth/logout` and clear the stored token.
- **F17. No tests.** No component/integration tests, no Playwright/RTL. Even a couple of smoke tests would help.
- **F18. `bun.lockb` and `package-lock.json` both present.** Two lockfiles → pick one package manager (bun *or* npm) to avoid drift.
- **F19. Slideshow/Landing not reviewed in depth** but are also mock-only; they'll need the same data wiring as the rest.

---

## Suggested first slice of work (frontend)
1. `src/lib/api.ts` (fetch wrapper + `VITE_API_BASE_URL`) and an `AuthProvider` that captures `?token=`, stores it, attaches the header, and calls `/api/auth/me`.
2. `<ProtectedRoute>` + redirect logic.
3. Replace `Auth.tsx`'s fake handler with a real redirect to `${API}/api/auth/google`.
4. Wire `Dashboard` (list albums), `Upload` (create album + upload), `Gallery` (list/delete images) with TanStack Query.
5. Build a real public `/share/:shareKey` page and fix F6.
6. Cleanup: F7 (name), F8 (leaks), F9 (dead page), F10 (one toaster).
