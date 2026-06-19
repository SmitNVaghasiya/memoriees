# Memories — UI Prototype (static HTML)

A clean, minimal (Apple-inspired) static prototype of the Memories photo app.
Pure HTML/CSS/JS — **no build step, no dependencies.** Open any page in a browser.

## Pages
| File | What it is |
|------|------------|
| `index.html` | Landing page — hero, floating photo collage, features, CTA |
| `dashboard.html` | Logged-in "Your albums" grid with a create-album tile |
| `gallery.html` | Single album view — masonry grid, All Photos / Collections tabs, built-in lightbox + slideshow |
| `share.html` | Public read-only view a friend/family member sees from a share link |
| `assets/style.css` | Shared design system (tokens, components, automatic dark mode) |
| `assets/app.js` | Shared interactions (lightbox/slideshow, scroll-reveal, copy-link, tabs) |

## How to view
```bash
# from the prototype/ folder
python3 -m http.server 8000
# then open http://localhost:8000
```
Or just double-click `index.html`. Demo photos load from picsum.photos (needs internet).

## Design notes
- **System / SF Pro font stack**, near-black `#1d1d1f` on off-white `#fbfbfd`, 8pt spacing rhythm.
- **Content-first:** the UI defers to the photos; translucent blurred nav.
- **Automatic light/dark mode** via `prefers-color-scheme`.
- **Lightbox:** click any photo · `←`/`→` to navigate · `Space` to play/pause slideshow · `Esc` to close · swipe on touch.
- Respects `prefers-reduced-motion`.

## Not wired to the backend
This is a **visual prototype** to lock in the look & feel. Demo data is hardcoded.
Wiring it to the real API is the frontend work tracked in `docs/frontend-review/FRONTEND_BUGS.md`.
You can lift this CSS/markup straight into the React app's components.
