# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Personal portfolio site for Pujan Parikh, deployed via GitHub Pages from the repo root. Vanilla HTML/CSS/JS — zero dependencies, no build step.

## Local development

`js/main.js` uses `fetch()` to load `data/portfolio.json`, so opening `index.html` via `file://` will fail. Serve over HTTP:

```bash
python3 -m http.server 8080
# or: npx serve .
```

## Deployment

GitHub Pages serves `/` on `main`. `.nojekyll` disables Jekyll processing. `CNAME` is the custom domain. Pushing to `main` is the deploy — there is no CI/build pipeline.

## Architecture

Content is decoupled from markup: [index.html](index.html) is a static shell with empty container divs, and [js/main.js](js/main.js) fetches [data/portfolio.json](data/portfolio.json) at runtime and renders into those containers. **To update site content, edit `portfolio.json` — not the HTML.**

Render flow in [main.js](js/main.js):

1. `loadPortfolio()` fetches JSON, then calls `renderPersonal`, `renderStickers`, `renderExperience`, `renderEducation`, `renderSkills`, `renderPhotos` — each writes `innerHTML` into a container by ID.
2. Interaction wiring (`initExperienceInteractions`, `initEducationInteractions`, `initSkillsInteractions`, `initCursorBuddy`) runs **after** rendering because it queries DOM nodes that don't exist until then. Don't move these out of `loadPortfolio()` or the listeners will bind to nothing.
3. Ambient animations (paper airplane, crane flock, boat, pencil, eraser, shooting star, particles) are IIFEs at module scope — they only depend on static elements in `index.html`, so they run independently of data load.

### Container ID contract

Renderers find their targets by hard-coded IDs in `index.html`. Changing an ID requires updating both files:

| Renderer | Target IDs |
|---|---|
| `renderPersonal` | `hero-subtitle`, `hero-name`, `contact-info`, `hero-summary`, `hero-portrait`, `.resume-link` |
| `renderStickers` | `sticker-row` |
| `renderExperience` | `experience-cards` |
| `renderEducation` | `education-cards` |
| `renderSkills` | `skills-container` |
| `renderPhotos` | `photo-grid` |

### Experience JSON shape

Each `experience[]` entry supports either flat `bullets: []` or grouped `sections: [{heading, bullets}]` — `renderExperience` checks `job.sections` first, then falls back to `job.bullets`. `job.open: true` makes that card start expanded. The accordion toggle is wired via inline `onclick="toggleCard(this)"` in the rendered HTML, so `toggleCard` must remain a global.

### Characters and bubbles

Five mascots — Mascot, Whiskers, Carl, Prof, Gizmo — each have a fixed element ID and a paired `*-bubble` element. The shared `showBubble(id, text, duration)` helper toggles a `.hidden` class and auto-clears. The mascot eye-tracking handler is global on `mousemove` — fine because it's a single rAF-free transform.

### Theme

Dark mode is the default (set on `<html data-theme="dark">` before JS runs) and persisted to `localStorage` under `pp-theme`. The shooting star animation gates itself on `data-theme === 'dark'`.

## Conventions

- All styling lives in [css/styles.css](css/styles.css) — no inline `<style>` blocks, no CSS-in-JS. Theming is done via CSS custom properties switched on `[data-theme]`.
- Renderers build HTML via template literals and `innerHTML`. Content comes from a trusted local JSON file, so this is intentional — but **don't pipe user input through these renderers** without escaping.
- New interactive sections should follow the pattern: empty container in `index.html` → renderer function in `main.js` → `init*Interactions()` called from `loadPortfolio()` after render.
