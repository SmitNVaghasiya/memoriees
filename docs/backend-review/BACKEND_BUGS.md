# Backend — Bugs, Optimizations & Things Forgotten

Project: **Memories** backend (Node.js + Express 5 + MongoDB/Mongoose + Google Drive + Passport).
Reviewed files: `server.js`, `config/*`, `middleware/auth.js`, `models/*`, `routes/*`, `services/googleDriveService.js`, `utils/errorHandler.js`.

Severity legend: 🔴 Critical (fix before anyone uses it) · 🟠 High · 🟡 Medium · 🟢 Low / polish.

---

## 🔴 Critical bugs

### B1. Shared global Google OAuth client = cross-user data leak (concurrency bug)
**Where:** `config/googleDrive.js` (singleton `oauth2Client` + `drive`) used by `services/googleDriveService.js`'s `setCredentials()`.

The whole app shares **one** `oauth2Client` instance. Every request calls `setCredentials(user.accessToken, ...)` which **mutates that global object**. If User A and User B make Drive calls at the same time, B's `setCredentials` can overwrite A's credentials mid-request, so A's upload/list/delete runs against **B's Google Drive**. This is a real data-integrity and privacy bug, not theoretical.

**Fix:** Build a fresh OAuth2 client (and `google.drive({auth})`) **per request** from the user's tokens, and pass it into the service functions. Never store credentials on a module-level singleton.

```js
// services/googleDriveService.js
function driveForUser(accessToken, refreshToken) {
  const auth = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
  auth.setCredentials({ access_token: accessToken, refresh_token: refreshToken });
  return google.drive({ version: 'v3', auth });
}
// then: createFolder(drive, title), uploadFile(drive, ...), etc.
```

### B2. Collaboration uploads are fake — they never reach Google Drive
**Where:** `routes/collaboration.js` lines ~87–124.

The handler **admits in its own comments** that it can't access the owner's Drive, so it just creates placeholder records:
```js
fileId: `temp_${Date.now()}_${Math.random()...}`,
```
and pushes them into `album.images` without uploading anything. Result: the gallery will show broken images (no `webViewLink`/`thumbnailLink`), the DB fills with junk, and the advertised "collaboration" feature does nothing. The local temp file is deleted, so the photo is **lost**.

**Fix:** Look up the album owner, load *their* stored tokens, build a per-user Drive client (see B1), and actually upload to the owner's folder. Validate the collaborator before accepting files. If you can't do this securely yet, **disable the endpoint** rather than silently dropping photos.

---

## 🟠 High-severity issues

### B3. `.env` is committed to git
`backend/.env` is tracked (`git ls-files` confirms it). Right now it still holds *placeholder* values, so nothing real has leaked **yet** — but the moment you fill in your real MongoDB URI, JWT secret, Google client secret and session secret locally, the next `git add`/commit will publish them. Once secrets hit git history they're effectively burned.

**Fix:** `git rm --cached backend/.env`, add `.env` to `backend/.gitignore`, keep only `.env.example`. (`.gitignore` currently does **not** list `.env`.)

### B4. Two competing auth systems that don't line up (JWT vs session)
- `middleware/auth.js` `protect` expects a **JWT** in `Authorization: Bearer`.
- `routes/auth.js` `/me` and `config/passport.js` rely on **session** `req.user` (passport `serialize`/`deserialize`, `express-session`, `connect-mongo`).

So `GET /api/auth/me` only works with a session cookie, while every other protected route only works with a JWT. The SPA gets a JWT in the redirect URL but has no session cookie for `/me`. Pick **one** model. For a token-based SPA, drop sessions and make `/me` use `protect` + JWT. (Sessions are only really needed for the OAuth handshake itself.)

### B5. JWT delivered in the URL query string
`routes/auth.js`: `res.redirect(\`${CLIENT_URL}/dashboard?token=${token}\`)`. Tokens in URLs end up in browser history, server access logs, and `Referer` headers sent to third parties. **Fix:** set an httpOnly, Secure, SameSite cookie, or do a short one-time-code exchange where the SPA POSTs a code and gets the JWT in the response body.

### B6. Google tokens stored in plaintext and never refreshed/persisted
`googleAccessToken`/`googleRefreshToken` are saved as plain strings on `User`. Access tokens expire (~1h). There's no code that catches a refresh and **writes the new access token back** to the DB. Combined with B1's shared client, refreshes race. **Fix:** encrypt tokens at rest (or at minimum restrict DB access), and listen for the googleapis `tokens` event to persist refreshed access tokens per user.

---

## 🟡 Medium-severity issues

### B7. `uploads/` directory is never created
Both `routes/images.js` and `routes/collaboration.js` use `multer.diskStorage({ destination: 'uploads/' })`. Nothing guarantees `uploads/` exists → first upload throws `ENOENT`. Also, on ephemeral/serverless hosts the local disk is wiped between requests. **Fix:** `fs.mkdirSync('uploads', { recursive: true })` at startup, or use `multer.memoryStorage()` and stream the buffer straight to Drive (better — no temp files, no cleanup, no disk dependency).

### B8. `Album.pre('save')` stores a function, not a date
`models/Album.js`:
```js
this.updatedAt = Date.now;   // ❌ assigns the function reference
```
Should be `Date.now()`. As written, `updatedAt` is never a real timestamp. **Better:** delete the manual `createdAt`/`updatedAt` and the hook entirely, and use `new mongoose.Schema({...}, { timestamps: true })`.

### B9. `protect` middleware control flow is fragile
`middleware/auth.js` doesn't `return next()`. If a header exists but doesn't start with `Bearer`, `token` stays `undefined` and falls through to the `if (!token)` 401 — okay by luck, but the success path runs `next()` and then keeps executing. Tidy it:
```js
const protect = async (req, res, next) => {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) return res.status(401).json({ message: 'No token' });
  try {
    const decoded = jwt.verify(header.split(' ')[1], process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id);
    if (!req.user) return res.status(401).json({ message: 'User not found' });
    return next();
  } catch {
    return res.status(401).json({ message: 'Token failed' });
  }
};
```
(Note: `.select('-password')` is pointless — the `User` model has no `password` field; auth is Google-only.)

### B10. No real input validation despite the README claiming it
- `POST /albums/:id/collections` and the `PUT` variant call `imageIds.includes(...)`. If `imageIds` is missing/not an array → `TypeError` → 500.
- Share endpoint accepts `emails` but never validates they are real email strings before sending to Google.
- No length caps on `title`/`description`.

**Fix:** add a validation layer (`zod` or `express-validator`) per route. Reject early with 400.

### B11. Reading images hits Google Drive live on every request
`GET /api/images/album/:albumId` calls `listFiles()` against Drive each time, even though the same data already lives in `album.images`. This is slow, burns Google API quota, and gives you **two sources of truth** that can drift. **Fix:** serve from `album.images` (DB) and only reconcile with Drive on demand / via a background sync.

### B12. Public sharing depends on Drive permissions that may not be set
`shares.js` returns stored `webViewLink`/`thumbnailLink`, but those links only load for an anonymous viewer if the Drive file/folder is actually shared with "anyone". `makePublic` is only called when `isPublic` is true at create/update time; per-file uploads afterward aren't made public, and "shared with specific users" links won't render for someone who isn't logged into that Google account. Decide on a single, consistent serving strategy (see Plan doc — proxying through your backend is the robust option).

### B13. Error handling is duplicated and the good one is unused
`utils/errorHandler.js` exports a nice `errorHandler` (CastError/duplicate-key/validation handling) that is **never wired up**. `server.js` has its own inline handler instead. Wire up the shared one and delete the inline duplicate.

---

## 🟢 Low / polish

- **B14. CORS / port mismatch.** `server.js` defaults `origin` to `http://localhost:3000`; the Vite dev server actually runs on **8080** (`vite.config.ts`). Dev requests will be blocked by CORS. Align them (and the README, which also says 3000).
- **B15. Deprecated Mongoose options.** `useNewUrlParser` / `useUnifiedTopology` are no-ops in Mongoose 8 — remove them.
- **B16. Passport can crash on missing profile fields.** `profile.emails[0].value` / `profile.photos[0].value` throw if Google omits them. Guard with optional chaining + fallbacks.
- **B17. Rate limiting is one blunt global rule.** 100 req / 15 min for *everything*. Auth and upload endpoints deserve their own (stricter / separate) limiters; reads can be looser.
- **B18. Delete is not atomic.** `DELETE /albums/:id` removes the Drive folder *then* the DB doc; if the DB delete fails the folder is already gone. Acceptable for personal use, but worth a comment / ordering review.
- **B19. `express.json({ limit: '10mb' })` vs 50MB upload limit.** Collaboration multer allows 50MB files while the JSON body cap is 10MB — fine since uploads are multipart, but be aware the two limits exist and differ between routes (10MB in `images.js`, 50MB in `collaboration.js`). Pick a consistent policy.
- **B20. No `helmet` CSP / no HTTPS enforcement / no `trust proxy`** for running behind a reverse proxy (needed for Secure cookies + correct rate-limit IPs).
- **B21. No tests, no lint, no CI.** `npm test` is the default `exit 1`. No ESLint/Prettier on the backend.
- **B22. `services/googleDriveService.js` `require('../models/Album')`** is imported but unused. Dead import. Also `require('fs')`/`require('../services/...')` done inline inside handlers — hoist to top of file.

---

## Quick fix priority order
1. B1 (per-request Drive client) — correctness/privacy.
2. B3 (untrack `.env`) — 2 minutes, do it now.
3. B4 + B5 (settle on JWT, stop putting token in URL).
4. B2 (make collaboration real or disable it).
5. B7, B8, B9, B10 (cheap correctness wins).
6. Everything else as you harden for real use.
