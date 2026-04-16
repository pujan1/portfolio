/* ══════════════════════════════════════════════════════
   PORTFOLIO — main.js
   Loads data/portfolio.json, renders all sections,
   and wires up all interactivity.
══════════════════════════════════════════════════════ */

/* ── THEME (default: dark) ── */
(function () {
    const html   = document.documentElement;
    const stored = localStorage.getItem('pp-theme');
    // If no preference stored, default to dark
    html.setAttribute('data-theme', stored || 'dark');

    const btn = document.getElementById('theme-toggle');
    btn.addEventListener('click', () => {
        const isDark = html.getAttribute('data-theme') === 'dark';
        const next   = isDark ? 'light' : 'dark';
        html.setAttribute('data-theme', next);
        localStorage.setItem('pp-theme', next);
        const w = document.getElementById('whiskers');
        w.classList.add('peeked');
        showBubble('whiskers-bubble', isDark ? '☀️ Good morning!' : '🌙 Night shift!', 2200);
        setTimeout(() => w.classList.remove('peeked'), 3000);
    });
})();

/* ══════════════════════════════════════
   SHARED BUBBLE HELPER
══════════════════════════════════════ */
const _bubbleTimers = {};
function showBubble(id, text, duration = 2500) {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = text;
    el.classList.remove('hidden');
    clearTimeout(_bubbleTimers[id]);
    _bubbleTimers[id] = setTimeout(() => el.classList.add('hidden'), duration);
}

/* ══════════════════════════════════════
   DATA LOADING + RENDERING
══════════════════════════════════════ */
async function loadPortfolio() {
    try {
        const res  = await fetch('./data/portfolio.json');
        const data = await res.json();
        renderPersonal(data.personal);
        renderStickers(data.stickers);
        renderExperience(data.experience);
        renderEducation(data.education);
        renderSkills(data.skills);
        renderPhotos(data.photos);
        // Wire up interactions that depend on rendered DOM
        initExperienceInteractions();
        initEducationInteractions();
        initSkillsInteractions();
        initCursorBuddy();
    } catch (err) {
        console.error('Failed to load portfolio data:', err);
    }
}

function renderPersonal(p) {
    // Subtitle
    document.getElementById('hero-subtitle').textContent = p.subtitle;

    // Name
    document.getElementById('hero-name').textContent = p.name;

    // Contact pills
    document.getElementById('contact-info').innerHTML = `
        <span>📍 ${p.location}</span>
        <a href="mailto:${p.email}">✉️ ${p.email}</a>
        <span>📱 ${p.phone}</span>
        <a href="${p.linkedinUrl}" target="_blank" rel="noopener">🔗 ${p.linkedin}</a>
    `;

    // Summary + highlights
    const summaryEl = document.getElementById('hero-summary');
    const bullets   = p.highlights.map(h => `<li>${h}</li>`).join('');
    summaryEl.innerHTML = `
        <strong class="summary-lead">${p.summary}</strong>
        <ul class="summary-bullets">${bullets}</ul>
    `;

    // Hero portrait
    const img = document.getElementById('hero-portrait');
    if (img) {
        img.src = p.heroImage;
        img.alt = p.name;
    }

    // Resume links (nav + hero button)
    document.querySelectorAll('.resume-link').forEach(el => {
        el.href = p.resume;
    });
}

function renderStickers(stickers) {
    const container = document.getElementById('sticker-row');
    if (!container) return;
    container.innerHTML = stickers.map(s => `
        <div class="sticker" style="transform:rotate(${s.rot}deg);box-shadow:2px 3px 0 var(--${s.color});">${s.text}</div>
    `).join('');
}

function renderExperience(jobs) {
    const container = document.getElementById('experience-cards');
    if (!container) return;
    container.innerHTML = jobs.map(job => {
        const openClass    = job.open ? 'open' : '';
        const ariaExpanded = job.open ? 'true' : 'false';

        let detailsHtml = '';
        if (job.sections) {
            detailsHtml = job.sections.map(sec => `
                <h4 class="job-section-heading">${sec.heading}</h4>
                <ul>${sec.bullets.map(b => `<li>${b}</li>`).join('')}</ul>
            `).join('');
        } else if (job.bullets) {
            detailsHtml = `<ul>${job.bullets.map(b => `<li>${b}</li>`).join('')}</ul>`;
        }

        const tenureBadge = job.tenure ? ` <span style="font-size:.8rem;color:var(--muted);">(${job.tenure})</span>` : '';

        return `
        <div class="experience-card ${openClass}">
            <div class="job-header" onclick="toggleCard(this)" aria-expanded="${ariaExpanded}">
                <div class="job-title-group">
                    <h3 class="job-title">${job.title}</h3>
                    <span class="job-company">${job.company} — ${job.location}${tenureBadge}</span>
                </div>
                <div class="job-date">${job.dates}</div>
                <span class="toggle-icon" aria-hidden="true">▼</span>
            </div>
            <div class="job-details">${detailsHtml}</div>
        </div>`;
    }).join('');
}

function renderEducation(education) {
    const container = document.getElementById('education-cards');
    if (!container) return;
    container.innerHTML = education.map(edu => `
        <div class="edu-card">
            <div class="edu-details">
                <h3>${edu.degree}</h3>
                <span>${edu.school}</span>
            </div>
            <div class="edu-year">${edu.years}</div>
        </div>
    `).join('');
}

function renderSkills(skills) {
    const container = document.getElementById('skills-container');
    if (!container) return;
    container.innerHTML = skills.map(s => `<div class="skill-tag">${s}</div>`).join('');
}

function renderPhotos(photos) {
    const container = document.getElementById('photo-grid');
    if (!container) return;
    container.innerHTML = photos.map(photo => `
        <div class="photo-item">
            <img src="${photo.src}" alt="${photo.alt}" loading="lazy"/>
        </div>
    `).join('');
}

/* ══════════════════════════════════════
   ACCORDION
══════════════════════════════════════ */
function toggleCard(el) {
    const card = el.closest('.experience-card');
    const open = card.classList.contains('open');
    card.classList.toggle('open');
    el.setAttribute('aria-expanded', String(!open));
}

/* ══════════════════════════════════════
   CSS PARTICLES — generated once, animated by CSS
══════════════════════════════════════ */
(function () {
    const wrap   = document.getElementById('particles-wrap');
    const COLORS = ['#d96c6c', '#6c9bd9', '#e6c86e', '#7ab585', '#aaaaaa'];
    const shapes = ['scrap', 'dot', 'tape', 'star', 'cross'];
    const count  = Math.min(22, Math.floor(window.innerWidth * window.innerHeight / 20000));
    for (let i = 0; i < count; i++) {
        const el    = document.createElement('div');
        const shape = shapes[i % shapes.length];
        const col   = COLORS[Math.floor(Math.random() * COLORS.length)];
        const size  = 9 + Math.random() * 17;
        const dur   = 14 + Math.random() * 18;
        el.className  = `p ${shape}`;
        el.style.cssText = `
            --h:${size}px;left:${Math.random() * 96}vw;
            width:${shape === 'tape' ? size * 1.9 : size}px;height:${size}px;
            background:${col};opacity:${0.16 + Math.random() * 0.28};
            animation-duration:${dur}s;animation-delay:${-(Math.random() * dur)}s;`;
        wrap.appendChild(el);
    }
})();

/* ══════════════════════════════════════
   SCROLL REVEAL + SHEET ANIMATE-IN
══════════════════════════════════════ */
(function () {
    const sheets = document.querySelectorAll('.paper-sheet');
    const io = new IntersectionObserver(entries => {
        entries.forEach(e => {
            if (e.isIntersecting) { e.target.classList.add('animate-in'); io.unobserve(e.target); }
        });
    }, { threshold: .07 });
    sheets.forEach((s, i) => { s.style.animationDelay = (i * .16) + 's'; io.observe(s); });

    const rio = new IntersectionObserver(entries => {
        entries.forEach(e => {
            if (e.isIntersecting) { e.target.classList.add('in-view'); rio.unobserve(e.target); }
        });
    }, { threshold: .07 });
    document.querySelectorAll('.reveal').forEach(el => rio.observe(el));
})();

/* ══════════════════════════════════════
   MASCOT — eye tracking + interactions
══════════════════════════════════════ */
(function () {
    const mascot    = document.getElementById('mascot');
    const heroName  = document.getElementById('hero-name');
    const mascotCol = document.getElementById('mascot-col');
    const eyeL      = document.getElementById('eyeball-l');
    const eyeR      = document.getElementById('eyeball-r');
    const MSGS = [
        'Hey there! 👋', "Let's build something!", 'Coffee === code ☕',
        'git push origin main', 'I ❤️ TypeScript', 'Ship it! 🚀',
        'Stay curious 🔍', 'npm install happiness'
    ];
    let msgIdx = 1;

    document.addEventListener('mousemove', e => {
        if (!mascot || !eyeL || !eyeR) return;
        const rect = mascot.getBoundingClientRect();
        if (!rect.width) return;
        const cx = rect.left + rect.width  * 0.5;
        const cy = rect.top  + rect.height * 0.36;
        const a  = Math.atan2(e.clientY - cy, e.clientX - cx);
        const d  = 2.5;
        eyeL.style.transform = `translate(${Math.cos(a) * d}px,${Math.sin(a) * d}px)`;
        eyeR.style.transform = `translate(${Math.cos(a) * d}px,${Math.sin(a) * d}px)`;
    });

    if (heroName) {
        heroName.addEventListener('mouseenter', () => {
            mascotCol.classList.add('hero-waving');
            showBubble('mascot-bubble', MSGS[0]);
        });
        heroName.addEventListener('mouseleave', () => mascotCol.classList.remove('hero-waving'));
    }

    if (mascot) {
        mascot.addEventListener('click', () => {
            mascotCol.classList.add('hero-waving');
            showBubble('mascot-bubble', MSGS[msgIdx % MSGS.length]);
            msgIdx++;
            setTimeout(() => mascotCol.classList.remove('hero-waving'), 1800);
        });
    }

    // Sticker hover — re-runs whenever stickers are re-rendered
    function bindStickers() {
        document.querySelectorAll('.sticker').forEach(s => {
            s.addEventListener('mouseenter', () =>
                showBubble('mascot-bubble', `${s.textContent.trim()} 🎯`));
        });
    }
    // Call once now, and again after data load
    bindStickers();
    document.addEventListener('portfolio-rendered', bindStickers);
})();

/* ══════════════════════════════════════
   WHISKERS THE CAT
══════════════════════════════════════ */
(function () {
    const w = document.getElementById('whiskers');
    if (!w) return;
    const CAT_MSGS = [
        'Meow~ 😺', 'Pet me!', 'I see you coding...', '...',
        'Still here 👀', '*purrs*', 'Night owl? 🌙', 'Feed me bugs pls'
    ];
    let catIdx = 0;
    let peekTimer;

    w.addEventListener('click', () => {
        w.classList.add('peeked');
        showBubble('whiskers-bubble', CAT_MSGS[catIdx % CAT_MSGS.length]);
        catIdx++;
        clearTimeout(peekTimer);
        peekTimer = setTimeout(() => w.classList.remove('peeked'), 3500);
    });
    w.addEventListener('mouseenter', () => {
        w.classList.add('peeked');
        showBubble('whiskers-bubble', CAT_MSGS[catIdx % CAT_MSGS.length]);
    });
    w.addEventListener('mouseleave', () => {
        clearTimeout(peekTimer);
        peekTimer = setTimeout(() => w.classList.remove('peeked'), 1200);
    });

    function randomPeek() {
        w.classList.add('peeked');
        showBubble('whiskers-bubble', CAT_MSGS[catIdx % CAT_MSGS.length]);
        catIdx++;
        setTimeout(() => w.classList.remove('peeked'), 2800);
        setTimeout(randomPeek, 18000 + Math.random() * 22000);
    }
    setTimeout(randomPeek, 9000 + Math.random() * 8000);
})();

/* ══════════════════════════════════════
   CARL THE INSPECTOR — wired after render
══════════════════════════════════════ */
function initExperienceInteractions() {
    const carl      = document.getElementById('carl');
    const CARL_MSGS = [
        'Checking records...', 'Excellent! ✅', 'Hmm, noted 📝',
        'Impressive! 🏆', '*scribbles*', 'Outstanding!', 'On it! 📋', 'Approved! ✔️'
    ];
    let carlIdx = 0;

    document.querySelectorAll('.job-header').forEach(h => {
        h.addEventListener('click', () => {
            const card = h.closest('.experience-card');
            if (!card.classList.contains('open')) {
                carl.classList.add('carl-excited');
                showBubble('carl-bubble', CARL_MSGS[carlIdx % CARL_MSGS.length]);
                carlIdx++;
                setTimeout(() => carl.classList.remove('carl-excited'), 1800);
            }
            setTimeout(() => {
                const anyOpen = document.querySelector('.experience-card.open');
                carl.classList.toggle('carl-sleeping', !anyOpen);
                if (!anyOpen) showBubble('carl-bubble', '😴 zZz...');
            }, 500);
        });
    });

    if (carl) {
        carl.addEventListener('click', () => {
            carl.classList.remove('carl-sleeping');
            carl.classList.add('carl-excited');
            showBubble('carl-bubble', CARL_MSGS[carlIdx % CARL_MSGS.length]);
            carlIdx++;
            setTimeout(() => carl.classList.remove('carl-excited'), 1800);
        });
    }
}

/* ══════════════════════════════════════
   PROF THE GRADUATE — wired after render
══════════════════════════════════════ */
function initEducationInteractions() {
    const prof      = document.getElementById('prof');
    const confZone  = document.getElementById('confetti-zone');
    const PROF_MSGS = [
        'Knowledge is power! 📚', 'Study hard! 🎓',
        'Graduated with honors ✨', 'The pursuit of wisdom...',
        'Never stop learning!', 'Magna cum laude 🏅'
    ];
    let profIdx  = 0;
    let profShown = false;

    function launchConfetti() {
        const colors = ['#d96c6c', '#6c9bd9', '#e6c86e', '#7ab585', '#b794f4', '#fbb6ce'];
        for (let i = 0; i < 30; i++) {
            const c    = document.createElement('div');
            const size = 5 + Math.random() * 7;
            c.style.cssText = `
                position:absolute;width:${size}px;height:${size}px;
                background:${colors[Math.floor(Math.random() * colors.length)]};
                left:${10 + Math.random() * 80}%;top:0;
                border-radius:${Math.random() > 0.5 ? '50%' : '2px'};
                pointer-events:none;z-index:50;
                animation:confetti-fall ${0.9 + Math.random() * .9}s ${Math.random() * .6}s ease-in forwards;
                transform:rotate(${Math.random() * 360}deg);`;
            confZone.appendChild(c);
            c.addEventListener('animationend', () => c.remove());
        }
    }

    const profOb = new IntersectionObserver(entries => {
        entries.forEach(e => {
            if (e.isIntersecting && !profShown) {
                profShown = true;
                setTimeout(() => {
                    prof.classList.add('prof-visible');
                    showBubble('prof-bubble', PROF_MSGS[0]);
                    launchConfetti();
                }, 400);
                profOb.unobserve(e.target);
            }
        });
    }, { threshold: .4 });

    const eduSection = document.getElementById('education');
    if (eduSection && prof) profOb.observe(eduSection);

    if (prof) {
        prof.addEventListener('click', () => {
            prof.classList.remove('prof-jump');
            void prof.offsetWidth;
            prof.classList.add('prof-jump');
            launchConfetti();
            profIdx++;
            showBubble('prof-bubble', PROF_MSGS[profIdx % PROF_MSGS.length]);
            setTimeout(() => prof.classList.remove('prof-jump'), 600);
        });
    }

    document.querySelectorAll('.edu-card').forEach(card => {
        card.addEventListener('mouseenter', () => showBubble('prof-bubble', '🎓 Great choice!'));
    });
}

/* ══════════════════════════════════════
   GIZMO THE ROBOT — wired after render
══════════════════════════════════════ */
function initSkillsInteractions() {
    const gizmo      = document.getElementById('gizmo');
    const GIZMO_MSGS = [
        'Processing...⚙️', 'Skill detected! 🤖', 'Calculating... 💡',
        'BEEP BOOP', 'Loading dependencies...', 'Error 404: free time',
        'npm install skills', "git commit -m 'epic'"
    ];
    let gizmoIdx   = 0;
    let gizmoTimer;

    document.querySelectorAll('.skill-tag').forEach(tag => {
        tag.addEventListener('mouseenter', () => {
            if (gizmo) gizmo.classList.add('gizmo-active');
            showBubble('gizmo-bubble', `📡 ${tag.textContent} detected!`);
            clearTimeout(gizmoTimer);
        });
        tag.addEventListener('mouseleave', () => {
            gizmoTimer = setTimeout(() => {
                if (gizmo) gizmo.classList.remove('gizmo-active');
            }, 600);
        });
    });

    if (gizmo) {
        gizmo.addEventListener('click', () => {
            gizmo.classList.add('gizmo-active');
            showBubble('gizmo-bubble', GIZMO_MSGS[gizmoIdx % GIZMO_MSGS.length]);
            gizmoIdx++;
            clearTimeout(gizmoTimer);
            gizmoTimer = setTimeout(() => gizmo.classList.remove('gizmo-active'), 2500);
        });

        const skillsOb = new IntersectionObserver(entries => {
            entries.forEach(e => {
                if (e.isIntersecting) {
                    gizmo.classList.add('gizmo-active');
                    showBubble('gizmo-bubble', 'Skills database loaded! 🤖');
                    setTimeout(() => gizmo.classList.remove('gizmo-active'), 2000);
                    skillsOb.unobserve(e.target);
                }
            });
        }, { threshold: .3 });
        const skillsEl = document.getElementById('skills');
        if (skillsEl) skillsOb.observe(skillsEl);
    }
}

/* ══════════════════════════════════════
   CURSOR BUDDY — wired after render
══════════════════════════════════════ */
function initCursorBuddy() {
    const buddy = document.getElementById('cursor-buddy');
    if (!buddy || window.matchMedia('(max-width:600px)').matches) return;
    let mx = 0, my = 0, bx = 0, by = 0;
    document.addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; });
    (function loop() {
        bx += (mx - bx) * .11;
        by += (my - by) * .11;
        buddy.style.left = bx + 'px';
        buddy.style.top  = by + 'px';
        requestAnimationFrame(loop);
    })();
    const interactives = document.querySelectorAll(
        'button,a,.skill-tag,.job-header,.edu-card,#mascot,#whiskers,#prof,#carl,#gizmo,.tape,.photo-item'
    );
    interactives.forEach(el => {
        el.addEventListener('mouseenter', () => buddy.classList.add('on-interactive'));
        el.addEventListener('mouseleave', () => buddy.classList.remove('on-interactive'));
    });
}

/* ══════════════════════════════════════
   PAPER AIRPLANE
══════════════════════════════════════ */
(function () {
    const plane = document.getElementById('plane-wrap');
    if (!plane) return;
    function launch() {
        plane.style.top = (12 + Math.random() * 40) + '%';
        plane.classList.add('flying');
        setTimeout(() => {
            plane.classList.remove('flying');
            setTimeout(launch, 22000 + Math.random() * 20000);
        }, 12200);
    }
    setTimeout(launch, 4000);
})();

/* ══════════════════════════════════════
   ORIGAMI CRANE FLOCK
══════════════════════════════════════ */
(function () {
    const flock = document.getElementById('bird-flock');
    if (!flock) return;
    function flockFly() {
        flock.style.top = (4 + Math.random() * 18) + '%';
        flock.classList.add('flying');
        setTimeout(() => {
            flock.classList.remove('flying');
            setTimeout(flockFly, 28000 + Math.random() * 24000);
        }, 14200);
    }
    setTimeout(flockFly, 12000 + Math.random() * 8000);
})();

/* ══════════════════════════════════════
   PAPER BOAT
══════════════════════════════════════ */
(function () {
    const boat = document.getElementById('boat-wrap');
    if (!boat) return;
    function sail() {
        boat.classList.add('sailing');
        setTimeout(() => {
            boat.classList.remove('sailing');
            setTimeout(sail, 30000 + Math.random() * 25000);
        }, 17500);
    }
    setTimeout(sail, 8000 + Math.random() * 6000);
})();

/* ══════════════════════════════════════
   ROLLING PENCIL
══════════════════════════════════════ */
(function () {
    const pencil = document.getElementById('pencil-fly');
    if (!pencil) return;
    function roll() {
        pencil.classList.add('rolling');
        setTimeout(() => {
            pencil.classList.remove('rolling');
            setTimeout(roll, 20000 + Math.random() * 18000);
        }, 10200);
    }
    setTimeout(roll, 6000 + Math.random() * 4000);
})();

/* ══════════════════════════════════════
   BOUNCING ERASER
══════════════════════════════════════ */
(function () {
    const eraser = document.getElementById('eraser-fly');
    if (!eraser) return;
    function bounce() {
        eraser.classList.add('bouncing');
        setTimeout(() => {
            eraser.classList.remove('bouncing');
            setTimeout(bounce, 24000 + Math.random() * 20000);
        }, 8700);
    }
    setTimeout(bounce, 16000 + Math.random() * 8000);
})();

/* ══════════════════════════════════════
   SHOOTING STAR (dark mode only)
══════════════════════════════════════ */
(function () {
    const star = document.getElementById('star-shoot');
    if (!star) return;
    function shoot() {
        if (document.documentElement.getAttribute('data-theme') === 'dark') {
            star.style.top = (Math.random() * 25) + '%';
            star.classList.add('shooting');
            setTimeout(() => star.classList.remove('shooting'), 4200);
        }
        setTimeout(shoot, 12000 + Math.random() * 14000);
    }
    setTimeout(shoot, 5000);
})();

/* ══════════════════════════════════════
   INIT
══════════════════════════════════════ */
loadPortfolio();
