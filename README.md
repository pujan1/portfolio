# Pujan Parikh — Portfolio

Personal portfolio site hosted on **GitHub Pages**.  
Live URL: `https://<your-github-username>.github.io/<repo-name>/`

---

## Project Structure

```
portfolio/
├── index.html              # Main HTML — markup only, no inline CSS/JS
├── css/
│   └── styles.css          # All styles (tokens, layout, components, dark mode)
├── js/
│   └── main.js             # All interactivity + data-driven rendering
├── data/
│   └── portfolio.json      # All content data (edit this to update the page)
├── assets/
│   ├── hero_img.png        # Portrait photo displayed in hero section
│   ├── photos_1–7.jpeg     # Photography gallery images
│   └── Resume_Pujan.pdf    # Downloadable resume
├── .nojekyll               # Prevents GitHub Pages from running Jekyll
└── README.md
```

---

## How to Update Content

All text content lives in **`data/portfolio.json`** — no need to touch HTML or JS.

| Section | JSON key | Notes |
|---|---|---|
| Name, contact, summary | `personal` | Edit `highlights` array for bullet points |
| Work experience | `experience` | Supports `bullets` or `sections` (sub-headings) |
| Education | `education` | Array of degree/school/years |
| Skills | `skills` | Flat string array |
| Photography | `photos` | Array of `{ src, alt }` paths |
| Stickers (hero badges) | `stickers` | Array of `{ text, rot, color }` |

---

## Features

- **Dark mode by default** — persisted to `localStorage`; toggle in nav
- **Hero portrait** — large portrait photo in hero section with paper-tape aesthetic
- **Photography gallery** — masonry-style grid with papercraft styling and tape accents
- **Resume download** — PDF linked in both nav and hero section
- **Animated characters** — Mascot (eye tracking), Whiskers (cat), Carl (inspector), Prof (graduate), Gizmo (robot)
- **Ambient animations** — paper airplane, origami cranes, paper boat, rolling pencil, bouncing eraser, shooting stars
- **Accordion experience cards** — click to expand job details with sub-sections
- **Scroll reveal** — paper sheets drop in as they enter the viewport
- **CSS particles** — subtle falling shapes in the background
- **Cursor buddy** — star sparkle that follows your mouse

---

## Local Development

Since `main.js` uses `fetch()` to load `portfolio.json`, you need a local HTTP server (not `file://`).

```bash
# Option 1 — Python
python3 -m http.server 8080

# Option 2 — Node
npx serve .

# Option 3 — VS Code Live Server extension
# Right-click index.html → Open with Live Server
```

Then open `http://localhost:8080`.

---

## GitHub Pages Deployment

1. Push this repo to GitHub.
2. Go to **Settings → Pages**.
3. Set Source to **Deploy from a branch → main → / (root)**.
4. The `.nojekyll` file ensures static files are served without Jekyll processing.

---

## Tech Stack

- Vanilla HTML5, CSS3, JavaScript (ES2020+) — zero dependencies, zero build step
- Google Fonts: *Patrick Hand* (headings) + *Quicksand* (body)
- CSS custom properties for theming; `IntersectionObserver` for scroll effects
