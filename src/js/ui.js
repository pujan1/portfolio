// DOM interactions outside the 3D scene:
//   • Scroll tracking — `getScrollProgress()` is the source of truth
//     for the animate loop's curve parameter.
//   • Active section — highlights the closest section to viewport
//     center, and reports a lateral bias so the chase cam frames the
//     opposite side of the screen from the text panel.
//   • Work entry expand/collapse.
//   • Photo lightbox.

const sectionEls = Array.from(document.querySelectorAll('.poi-section'));

let scrollProgress = 0;
let activeSectionIndex = 0;

function recompute() {
    const doc = document.documentElement;
    const max = doc.scrollHeight - window.innerHeight;
    scrollProgress = max > 0 ? Math.max(0, Math.min(1, window.scrollY / max)) : 0;
    updateActiveSection();
}

function updateActiveSection() {
    const viewportMid = window.scrollY + window.innerHeight / 2;
    let bestIdx = 0;
    let bestDist = Infinity;
    for (let i = 0; i < sectionEls.length; i++) {
        const el  = sectionEls[i];
        const mid = el.offsetTop + el.offsetHeight / 2;
        const d   = Math.abs(mid - viewportMid);
        if (d < bestDist) { bestDist = d; bestIdx = i; }
    }
    activeSectionIndex = bestIdx;
    for (let i = 0; i < sectionEls.length; i++) {
        sectionEls[i].classList.toggle('active', i === bestIdx);
    }
}

window.addEventListener('scroll', recompute, { passive: true });
window.addEventListener('resize', recompute);
recompute();

export const getScrollProgress = () => scrollProgress;

// On wide screens, sections alternate left/right; the camera offsets to
// the opposite side so text and landmark don't overlap. On mobile, the
// text panel covers the whole width, so no bias.
export function getPanelCompositionBias() {
    if (window.innerWidth <= 640 || !sectionEls.length) return 0;
    const panelOnRight = sectionEls[activeSectionIndex]?.matches(':nth-child(even)');
    return panelOnRight ? 2.35 : -2.35;
}

/* ── Work entry accordion ── */
document.querySelectorAll('.entry-toggle').forEach((btn) => {
    btn.addEventListener('click', () => {
        const entry = btn.closest('.entry');
        if (!entry) return;
        const expanded = entry.classList.toggle('expanded');
        btn.setAttribute('aria-expanded', String(expanded));
    });
});

/* ── Photo lightbox ── */
const lightbox    = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightbox-img');

function openLightbox(src, alt) {
    if (!lightbox || !lightboxImg) return;
    lightboxImg.src = src;
    lightboxImg.alt = alt || '';
    lightbox.hidden = false;
}
function closeLightbox() {
    if (!lightbox) return;
    lightbox.hidden = true;
    lightboxImg.src = '';
}

document.querySelectorAll('.photo-grid img').forEach((img) => {
    img.addEventListener('click', () => openLightbox(img.src, img.alt));
});
lightbox?.addEventListener('click', closeLightbox);
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && lightbox && !lightbox.hidden) closeLightbox();
});
