/* ─────────────────────────────────────────
   THEME
───────────────────────────────────────── */
(function () {
    const html   = document.documentElement;
    const stored = localStorage.getItem('pp-theme');
    html.setAttribute('data-theme', stored || 'dark');

    const btn = document.getElementById('theme-toggle');
    if (!btn) return;
    btn.addEventListener('click', () => {
        const next = html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        html.setAttribute('data-theme', next);
        localStorage.setItem('pp-theme', next);
    });
})();

/* ─────────────────────────────────────────
   MOBILE NAV
───────────────────────────────────────── */
(function () {
    const hamburger = document.getElementById('hamburger');
    const navLinks  = document.getElementById('nav-links');
    if (!hamburger || !navLinks) return;

    hamburger.addEventListener('click', () => navLinks.classList.toggle('open'));
    navLinks.querySelectorAll('a').forEach(a => {
        a.addEventListener('click', () => navLinks.classList.remove('open'));
    });
})();

/* ─────────────────────────────────────────
   SCROLL PROGRESS BAR
───────────────────────────────────────── */
(function () {
    const bar = document.getElementById('progress-bar');
    if (!bar) return;
    function update() {
        const scrolled = window.scrollY;
        const total    = document.documentElement.scrollHeight - window.innerHeight;
        bar.style.width = total > 0 ? (scrolled / total * 100) + '%' : '0%';
    }
    window.addEventListener('scroll', update, { passive: true });
})();

/* ─────────────────────────────────────────
   CUSTOM CURSOR
───────────────────────────────────────── */
function initCursor() {
    if (window.matchMedia('(pointer: coarse)').matches) return;

    const cursor = document.getElementById('cursor');
    if (!cursor) return;

    let mx = -200, my = -200;
    let cx = -200, cy = -200;

    document.addEventListener('mousemove', e => {
        mx = e.clientX;
        my = e.clientY;
        cursor.classList.add('visible');
    });

    document.addEventListener('mousedown', () => cursor.classList.add('clicking'));
    document.addEventListener('mouseup',   () => cursor.classList.remove('clicking'));
    document.addEventListener('mouseleave', () => cursor.classList.remove('visible'));
    document.addEventListener('mouseenter', () => cursor.classList.add('visible'));

    function loop() {
        cx += (mx - cx) * .13;
        cy += (my - cy) * .13;
        cursor.style.transform = `translate(${cx}px, ${cy}px) translate(-50%, -50%)`;
        requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);

    function bindHoverables() {
        document.querySelectorAll(
            'a, button, .timeline-stop, .edu-card, .skill-tag, .photo-item, .badge, .bento-card'
        ).forEach(el => {
            el.addEventListener('mouseenter', () => cursor.classList.add('hovering'));
            el.addEventListener('mouseleave', () => cursor.classList.remove('hovering'));
        });
    }
    bindHoverables();
    return bindHoverables;
}

/* ─────────────────────────────────────────
   MAGNETIC BUTTONS
───────────────────────────────────────── */
function initMagneticButtons() {
    if (window.matchMedia('(pointer: coarse)').matches) return;

    document.querySelectorAll('.btn').forEach(btn => {
        const FAST = 'transform .08s linear, opacity .2s ease, box-shadow .2s ease';
        const SLOW = 'transform .55s cubic-bezier(.25,1,.5,1), opacity .2s ease, box-shadow .2s ease';

        btn.addEventListener('mouseenter', () => {
            btn.style.transition = FAST;
        });
        btn.addEventListener('mousemove', e => {
            const rect = btn.getBoundingClientRect();
            const x    = (e.clientX - (rect.left + rect.width  * .5)) * .22;
            const y    = (e.clientY - (rect.top  + rect.height * .5)) * .22;
            btn.style.transform = `translate(${x}px, ${y}px)`;
        });
        btn.addEventListener('mouseleave', () => {
            btn.style.transition = SLOW;
            btn.style.transform  = '';
            setTimeout(() => { btn.style.transition = ''; }, 560);
        });
    });
}

/* ─────────────────────────────────────────
   3D CARD TILT
───────────────────────────────────────── */
function init3DTilt() {
    if (window.matchMedia('(pointer: coarse)').matches) return;

    const FAST = 'border-color .2s ease, box-shadow .3s ease, background .2s ease, transform .06s linear';
    const SLOW = 'border-color .2s ease, box-shadow .3s ease, background .2s ease, transform .6s cubic-bezier(.25,1,.5,1)';

    document.querySelectorAll('.edu-card').forEach(card => {
        let raf;

        card.addEventListener('mouseenter', () => {
            card.style.transition = FAST;
        });

        card.addEventListener('mousemove', e => {
            cancelAnimationFrame(raf);
            raf = requestAnimationFrame(() => {
                const rect   = card.getBoundingClientRect();
                const xRatio = (e.clientX - rect.left)  / rect.width  - .5;
                const yRatio = (e.clientY - rect.top)   / rect.height - .5;
                const tiltX  = -yRatio * 5;
                const tiltY  =  xRatio * 5;
                card.style.transform = `perspective(900px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) scale(1.012)`;
            });
        });

        card.addEventListener('mouseleave', () => {
            cancelAnimationFrame(raf);
            card.style.transition = SLOW;
            card.style.transform  = '';
            setTimeout(() => { card.style.transition = ''; }, 620);
        });
    });
}

/* ─────────────────────────────────────────
   PHOTO TILT (lighter version)
───────────────────────────────────────── */
function initPhotoTilt() {
    if (window.matchMedia('(pointer: coarse)').matches) return;

    document.querySelectorAll('.photo-item').forEach(item => {
        let raf;

        item.addEventListener('mousemove', e => {
            cancelAnimationFrame(raf);
            raf = requestAnimationFrame(() => {
                const rect   = item.getBoundingClientRect();
                const xRatio = (e.clientX - rect.left)  / rect.width  - .5;
                const yRatio = (e.clientY - rect.top)   / rect.height - .5;
                item.style.transform = `perspective(700px) rotateX(${-yRatio * 4}deg) rotateY(${xRatio * 4}deg) translateY(-4px) scale(1.02)`;
                item.style.transition = 'box-shadow .3s ease, transform .08s linear';
            });
        });

        item.addEventListener('mouseleave', () => {
            cancelAnimationFrame(raf);
            item.style.transition = 'box-shadow .35s ease, transform .55s cubic-bezier(.25,1,.5,1)';
            item.style.transform  = '';
            setTimeout(() => { item.style.transition = ''; }, 560);
        });
    });
}

/* ─────────────────────────────────────────
   ACTIVE NAV HIGHLIGHT
───────────────────────────────────────── */
function initActiveNav() {
    const sections = document.querySelectorAll('main section[id]');
    const links    = document.querySelectorAll('.nav-links a');
    if (!sections.length || !links.length) return;

    const io = new IntersectionObserver(entries => {
        entries.forEach(e => {
            if (!e.isIntersecting) return;
            links.forEach(a => a.classList.remove('active'));
            const active = document.querySelector(`.nav-links a[href="#${e.target.id}"]`);
            if (active) active.classList.add('active');
        });
    }, { threshold: 0, rootMargin: '-40% 0px -55% 0px' });

    sections.forEach(s => io.observe(s));
}

/* ─────────────────────────────────────────
   SCROLL REVEAL
───────────────────────────────────────── */
function initScrollReveal() {
    const headIO = new IntersectionObserver(entries => {
        entries.forEach(e => {
            if (e.isIntersecting) {
                e.target.classList.add('revealed');
                headIO.unobserve(e.target);
            }
        });
    }, { threshold: .2 });

    document.querySelectorAll('.section-head').forEach(el => headIO.observe(el));

    const fadeIO = new IntersectionObserver(entries => {
        entries.forEach(e => {
            if (e.isIntersecting) {
                e.target.classList.add('visible');
                fadeIO.unobserve(e.target);
            }
        });
    }, { threshold: .08, rootMargin: '0px 0px -24px 0px' });

    document.querySelectorAll('.fade-up, .skill-pop').forEach(el => {
        const siblings = Array.from(el.parentElement.querySelectorAll('.fade-up, .skill-pop'));
        const idx      = siblings.indexOf(el);
        const isSkill  = el.classList.contains('skill-pop');
        el.style.transitionDelay = `${Math.min(idx * (isSkill ? 32 : 55), isSkill ? 360 : 280)}ms`;
        fadeIO.observe(el);
    });
}

/* ─────────────────────────────────────────
   DATA + RENDER
───────────────────────────────────────── */
async function loadPortfolio() {
    try {
        const res  = await fetch('./data/portfolio.json');
        const data = await res.json();
        renderPersonal(data.personal);
        renderBadges(data.stickers);
        renderExperience(data.experience);
        renderEducation(data.education);
        renderSkills(data.skills);
        renderPhotos(data.photos);

        initScrollReveal();
        initActiveNav();
        init3DTilt();
        initPhotoTilt();

        if (window.__rebindCursor) window.__rebindCursor();

    } catch (err) {
        console.error('Portfolio load error:', err);
    }
}

function renderPersonal(p) {
    const sub = document.getElementById('hero-subtitle');
    if (sub) sub.textContent = p.subtitle.replace(/✦/g, '·').trim();

    const name = document.getElementById('hero-name');
    if (name) name.textContent = p.name;

    const bio = document.getElementById('hero-bio');
    if (bio) bio.textContent = p.summary;

    const contact = document.getElementById('contact-info');
    if (contact) {
        contact.innerHTML = `
            <span>${p.location}</span>
            <a href="mailto:${p.email}">${p.email}</a>
            <a href="${p.linkedinUrl}" target="_blank" rel="noopener">${p.linkedin}</a>
        `;
    }

    const img = document.getElementById('hero-portrait');
    if (img) { img.src = p.heroImage; img.alt = p.name; }

    document.querySelectorAll('.resume-link').forEach(el => { el.href = p.resume; });
}

function renderBadges(stickers) {
    const el = document.getElementById('sticker-row');
    if (!el) return;
    el.innerHTML = stickers.map(s => `<span class="badge">${s.text}</span>`).join('');
}

/* ─────────────────────────────────────────
   HORIZONTAL TIMELINE
───────────────────────────────────────── */
function renderExperience(jobs) {
    const trackEl  = document.getElementById('experience-cards');
    const detailEl = document.getElementById('timeline-detail');
    if (!trackEl || !detailEl) return;

    trackEl.innerHTML = jobs.map((job, i) => `
        <div class="timeline-stop fade-up${i === 0 ? ' active' : ''}" data-idx="${i}" role="button" tabindex="0">
            <div class="timeline-dot"></div>
            <div class="ts-dates">${job.dates}</div>
            <div class="ts-title">${job.title}</div>
            <div class="ts-company">${job.company}</div>
            <div class="ts-location">${job.location}</div>
        </div>
    `).join('');

    const stops = trackEl.querySelectorAll('.timeline-stop');

    function updateProgress(idx) {
        const stop = stops[idx];
        if (!stop) return;
        const px = stop.offsetLeft + stop.offsetWidth / 2;
        trackEl.style.setProperty('--tl-progress', px + 'px');
    }

    function buildDetail(job) {
        let body = '';
        if (job.sections) {
            body = job.sections.map(sec => `
                <div class="td-section">
                    <p class="td-section-heading">${sec.heading}</p>
                    <ul>${sec.bullets.map(b => `<li>${b}</li>`).join('')}</ul>
                </div>
            `).join('');
        } else if (job.bullets) {
            body = `<ul>${job.bullets.map(b => `<li>${b}</li>`).join('')}</ul>`;
        }
        return `<div class="td-inner">
            <div class="td-header">
                <span class="td-title">${job.title}</span>
                <span class="td-badge">${job.dates}</span>
            </div>
            <div class="td-company">${job.company} &mdash; ${job.location}</div>
            <div class="td-body">${body}</div>
        </div>`;
    }

    function selectStop(idx) {
        stops.forEach(s => s.classList.remove('active'));
        stops[idx].classList.add('active');
        updateProgress(idx);
        detailEl.classList.remove('td-visible');
        setTimeout(() => {
            detailEl.innerHTML = buildDetail(jobs[idx]);
            void detailEl.offsetHeight;
            detailEl.classList.add('td-visible');
        }, 200);
    }

    stops.forEach((stop, i) => {
        stop.addEventListener('click', () => selectStop(i));
        stop.addEventListener('keydown', e => {
            if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); selectStop(i); }
        });
    });

    detailEl.innerHTML = buildDetail(jobs[0]);
    requestAnimationFrame(() => {
        updateProgress(0);
        detailEl.classList.add('td-visible');
    });

    /* Drag-to-scroll */
    let isDragging = false, dragStartX, dragScrollLeft;
    trackEl.addEventListener('mousedown', e => {
        isDragging     = true;
        dragStartX     = e.pageX - trackEl.offsetLeft;
        dragScrollLeft = trackEl.scrollLeft;
        trackEl.classList.add('grabbing');
    });
    document.addEventListener('mouseup', () => {
        isDragging = false;
        trackEl.classList.remove('grabbing');
    });
    trackEl.addEventListener('mousemove', e => {
        if (!isDragging) return;
        e.preventDefault();
        const x = e.pageX - trackEl.offsetLeft;
        trackEl.scrollLeft = dragScrollLeft - (x - dragStartX);
    });
    trackEl.addEventListener('mouseleave', () => {
        isDragging = false;
        trackEl.classList.remove('grabbing');
    });
}

function renderEducation(edu) {
    const el = document.getElementById('education-cards');
    if (!el) return;
    el.innerHTML = edu.map(e => `
        <div class="edu-card fade-up">
            <div class="edu-degree">${e.degree}</div>
            <div class="edu-school">${e.school}</div>
            <span class="edu-year">${e.years}</span>
        </div>
    `).join('');
}

function renderSkills(skills) {
    const el = document.getElementById('skills-container');
    if (!el) return;
    el.innerHTML = skills.map(s => `<span class="skill-tag skill-pop">${s}</span>`).join('');
}

function renderPhotos(photos) {
    const el = document.getElementById('photo-grid');
    if (!el) return;
    el.innerHTML = photos.map(p => `
        <div class="photo-item fade-up">
            <img src="${p.src}" alt="${p.alt}" loading="lazy"/>
        </div>
    `).join('');
}

/* ─────────────────────────────────────────
   INIT
───────────────────────────────────────── */
const rebind = initCursor();
window.__rebindCursor = rebind;
initMagneticButtons();
loadPortfolio();
