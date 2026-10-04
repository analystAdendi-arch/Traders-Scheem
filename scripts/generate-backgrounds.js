/**
 * Generates the Traders Scheeme background artwork into public/backgrounds/.
 *
 *   node scripts/generate-backgrounds.js
 *
 * Everything is drawn procedurally from a fixed seed, so the output is stable
 * between runs: change SEED to get a fresh composition with the same style.
 *
 *   cosmos-dark.svg  deep violet night sky: nebulae, silk light-ribbons, a ringed
 *                    planet, a constellation network and a rising market line.
 *   silk-light.svg   white silk: soft colour washes, flowing line-waves and a faint
 *                    constellation, quiet enough to sit behind forms and tables.
 */
const fs = require('fs');
const path = require('path');

const SEED = 20261004;
const W = 1920;
const H = 1080;

const C = {
    sky: '#38bdf8',
    skyDeep: '#0284c7',
    gold: '#f0c040',
    goldDeep: '#b8860b',
    red: '#e11d48',
    purple: '#7c3aed',
    purpleSoft: '#a78bfa',
    white: '#ffffff',
};

// Small deterministic PRNG (mulberry32).
const rng = (seed => () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
})(SEED);
const rand = (a, b) => a + rng() * (b - a);
const pick = list => list[Math.floor(rng() * list.length)];
const f = n => Math.round(n * 10) / 10;

const svg = (defs, body) =>
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice">` +
    `<defs>${defs}</defs>${body}</svg>\n`;

const radial = (id, color, opacity) =>
    `<radialGradient id="${id}"><stop offset="0" stop-color="${color}" stop-opacity="${opacity}"/>` +
    `<stop offset="1" stop-color="${color}" stop-opacity="0"/></radialGradient>`;

/** A family of near-parallel bezier strands: reads as a sheet of silk. */
const silk = ({ y0, amp, count, spread, stroke, width, opacity, phase = 0 }) => {
    let out = '';
    for (let i = 0; i < count; i++) {
        const t = i / (count - 1);
        const y = y0 + t * spread;
        const a = amp * (1 - t * 0.45);
        const p = phase + t * 0.9;
        const d =
            `M-60 ${f(y + Math.sin(p) * a)} ` +
            `C ${f(W * 0.22)} ${f(y - a * 1.2 + Math.cos(p) * 30)}, ${f(W * 0.38)} ${f(y + a * 1.1)}, ${f(W * 0.55)} ${f(y + Math.sin(p + 1) * a * 0.4)} ` +
            `S ${f(W * 0.86)} ${f(y - a * 0.9)}, ${W + 60} ${f(y + Math.cos(p) * a * 0.6)}`;
        out += `<path d="${d}" stroke="${stroke}" stroke-width="${width}" stroke-opacity="${f(opacity * (0.35 + 0.65 * Math.sin(t * Math.PI)))}" fill="none"/>`;
    }
    return out;
};

/** Random nodes linked to near neighbours, like the network in the logo. */
const constellation = ({ n, x0, x1, y0, y1, maxDist, line, lineOpacity, dot, glowEvery }) => {
    const nodes = Array.from({ length: n }, () => [rand(x0, x1), rand(y0, y1), rand(1.2, 3.2)]);
    let lines = '';
    let dots = '';
    nodes.forEach(([x, y], i) => {
        nodes.slice(i + 1).forEach(([x2, y2]) => {
            const d = Math.hypot(x - x2, y - y2);
            if (d < maxDist) {
                lines += `<line x1="${f(x)}" y1="${f(y)}" x2="${f(x2)}" y2="${f(y2)}" stroke-opacity="${f(lineOpacity * (1 - d / maxDist))}"/>`;
            }
        });
    });
    nodes.forEach(([x, y, r], i) => {
        const glow = glowEvery && i % glowEvery === 0;
        if (glow) dots += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r * 5)}" fill="url(#node-glow)"/>`;
        dots += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r)}" fill="${glow ? C.gold : dot}"/>`;
    });
    return `<g stroke="${line}" stroke-width="1">${lines}</g>${dots}`;
};

/* ------------------------------------------------------------- dark scene */

const darkScene = () => {
    const defs = [
        `<linearGradient id="sky-base" x1="0" y1="0" x2="0.35" y2="1">` +
            `<stop offset="0" stop-color="#05030f"/><stop offset="0.45" stop-color="#0f0a2e"/><stop offset="1" stop-color="#1a0b3d"/></linearGradient>`,
        radial('neb-purple', C.purple, 0.55),
        radial('neb-sky', C.sky, 0.38),
        radial('neb-gold', C.gold, 0.22),
        radial('neb-red', C.red, 0.2),
        radial('node-glow', C.gold, 0.55),
        radial('star-glow', C.white, 0.9),
        `<linearGradient id="ribbon" x1="0" x2="1"><stop offset="0" stop-color="${C.sky}"/><stop offset="0.55" stop-color="${C.purpleSoft}"/><stop offset="1" stop-color="${C.gold}"/></linearGradient>`,
        `<linearGradient id="ribbon-2" x1="0" x2="1"><stop offset="0" stop-color="${C.purple}"/><stop offset="0.5" stop-color="${C.sky}"/><stop offset="1" stop-color="${C.purple}"/></linearGradient>`,
        `<radialGradient id="planet" cx="0.32" cy="0.28" r="0.85"><stop offset="0" stop-color="#4c1d95"/><stop offset="0.45" stop-color="#1e1250"/><stop offset="1" stop-color="#07041a"/></radialGradient>`,
        `<radialGradient id="planet-rim" cx="0.5" cy="0.5" r="0.5"><stop offset="0.86" stop-color="${C.sky}" stop-opacity="0"/><stop offset="0.97" stop-color="${C.sky}" stop-opacity="0.55"/><stop offset="1" stop-color="${C.sky}" stop-opacity="0"/></radialGradient>`,
        `<linearGradient id="ring" x1="0" x2="1"><stop offset="0" stop-color="${C.gold}" stop-opacity="0"/><stop offset="0.3" stop-color="${C.gold}" stop-opacity="0.9"/><stop offset="0.7" stop-color="${C.goldDeep}" stop-opacity="0.7"/><stop offset="1" stop-color="${C.gold}" stop-opacity="0"/></linearGradient>`,
        `<linearGradient id="market" x1="0" x2="1"><stop offset="0" stop-color="${C.sky}" stop-opacity="0"/><stop offset="0.4" stop-color="${C.sky}"/><stop offset="1" stop-color="${C.gold}"/></linearGradient>`,
        `<linearGradient id="market-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${C.sky}" stop-opacity="0.12"/><stop offset="1" stop-color="${C.sky}" stop-opacity="0"/></linearGradient>`,
    ].join('');

    let body = `<rect width="${W}" height="${H}" fill="url(#sky-base)"/>`;

    // Nebulae.
    body += `<ellipse cx="380" cy="260" rx="760" ry="420" fill="url(#neb-purple)"/>`;
    body += `<ellipse cx="1560" cy="180" rx="620" ry="360" fill="url(#neb-sky)"/>`;
    body += `<ellipse cx="1180" cy="860" rx="700" ry="380" fill="url(#neb-purple)"/>`;
    body += `<ellipse cx="900" cy="520" rx="520" ry="240" fill="url(#neb-gold)"/>`;
    body += `<ellipse cx="160" cy="940" rx="480" ry="300" fill="url(#neb-red)"/>`;

    // Star field.
    let stars = '';
    for (let i = 0; i < 260; i++) {
        const x = rand(0, W);
        const y = rand(0, H);
        const r = rng() < 0.92 ? rand(0.4, 1.3) : rand(1.6, 2.4);
        stars += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r)}" fill="${pick([C.white, C.white, '#e0f2fe', '#fdf6dc'])}" opacity="${f(rand(0.35, 0.95))}"/>`;
        if (r > 1.6) stars += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r * 4)}" fill="url(#star-glow)" opacity="0.35"/>`;
    }
    body += stars;

    // Silk light-ribbons sweeping across the middle.
    body += silk({ y0: 520, amp: 120, count: 34, spread: 120, stroke: 'url(#ribbon)', width: 1.2, opacity: 0.55 });
    body += silk({ y0: 610, amp: 90, count: 22, spread: 90, stroke: 'url(#ribbon-2)', width: 1, opacity: 0.4, phase: 2 });

    // Ringed planet, lower right (added last, so it sits in front of the market line).
    const planet =
        `<g transform="translate(1610 905)">` +
        `<ellipse rx="430" ry="88" fill="none" stroke="url(#ring)" stroke-width="3" transform="rotate(-14)" opacity="0.55"/>` +
        `<circle r="250" fill="url(#planet)"/>` +
        `<circle r="250" fill="url(#planet-rim)"/>` +
        `<path d="M-430 0 A430 88 0 0 0 430 0" fill="none" stroke="url(#ring)" stroke-width="5" transform="rotate(-14)"/>` +
        `<ellipse rx="500" ry="104" fill="none" stroke="${C.gold}" stroke-width="1" stroke-dasharray="2 14" transform="rotate(-14)" opacity="0.5"/>` +
        `</g>`;

    // Small moon.
    body += `<circle cx="1180" cy="330" r="22" fill="url(#planet)"/><circle cx="1180" cy="330" r="22" fill="url(#planet-rim)"/>`;

    // Constellation network across the top.
    body += constellation({
        n: 64,
        x0: 40,
        x1: W - 40,
        y0: 40,
        y1: 470,
        maxDist: 190,
        line: C.sky,
        lineOpacity: 0.45,
        dot: '#bae6fd',
        glowEvery: 9,
    });

    // Rising market line with a soft area fill.
    const pts = [];
    let y = 1000;
    for (let x = -20; x <= W + 40; x += 40) {
        y += rand(-30, 16);
        y = Math.max(600, Math.min(1010, y));
        pts.push([x, y]);
    }
    const line = pts.map(([x, py], i) => `${i ? 'L' : 'M'}${x} ${f(py)}`).join(' ');
    const [lx] = pts[pts.length - 1];
    body += `<path d="${line} L${lx} ${H} L-20 ${H} Z" fill="url(#market-fill)"/>`;
    body += `<path d="${line}" fill="none" stroke="url(#market)" stroke-width="2.5" stroke-linejoin="round"/>`;

    // Floating glass hexagons.
    const hex = (cx, cy, r, stroke, o) => {
        const p = Array.from({ length: 6 }, (_, i) => {
            const a = (Math.PI / 3) * i + Math.PI / 6;
            return `${f(cx + r * Math.cos(a))},${f(cy + r * Math.sin(a))}`;
        }).join(' ');
        return `<polygon points="${p}" fill="${stroke}" fill-opacity="0.04" stroke="${stroke}" stroke-opacity="${o}" stroke-width="1.2"/>`;
    };
    body += hex(260, 640, 70, C.sky, 0.35) + hex(330, 700, 34, C.gold, 0.45) + hex(1720, 420, 54, C.purpleSoft, 0.4);
    body += hex(980, 140, 40, C.gold, 0.3) + hex(620, 930, 46, C.sky, 0.3);
    body += planet;
    return svg(defs, body);
};

/* ------------------------------------------------------------ light scene */

const lightScene = () => {
    const defs = [
        `<linearGradient id="paper" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset="0.6" stop-color="#f7fbff"/><stop offset="1" stop-color="#f6f2ff"/></linearGradient>`,
        radial('wash-sky', C.sky, 0.28),
        radial('wash-purple', C.purple, 0.16),
        radial('wash-gold', C.gold, 0.26),
        radial('wash-red', C.red, 0.08),
        radial('node-glow', C.gold, 0.5),
        `<linearGradient id="silk-a" x1="0" x2="1"><stop offset="0" stop-color="${C.sky}"/><stop offset="0.6" stop-color="${C.purple}"/><stop offset="1" stop-color="${C.gold}"/></linearGradient>`,
        `<linearGradient id="silk-b" x1="0" x2="1"><stop offset="0" stop-color="${C.gold}"/><stop offset="1" stop-color="${C.sky}"/></linearGradient>`,
        `<pattern id="dots" width="28" height="28" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1.1" fill="${C.purple}" fill-opacity="0.09"/></pattern>`,
    ].join('');

    let body = `<rect width="${W}" height="${H}" fill="url(#paper)"/>`;
    body += `<rect width="${W}" height="${H}" fill="url(#dots)"/>`;
    body += `<ellipse cx="1650" cy="120" rx="620" ry="380" fill="url(#wash-sky)"/>`;
    body += `<ellipse cx="180" cy="980" rx="680" ry="360" fill="url(#wash-purple)"/>`;
    body += `<ellipse cx="1100" cy="1020" rx="560" ry="260" fill="url(#wash-gold)"/>`;
    body += `<ellipse cx="140" cy="80" rx="420" ry="240" fill="url(#wash-gold)"/>`;
    body += `<ellipse cx="900" cy="480" rx="520" ry="300" fill="url(#wash-red)"/>`;

    body += silk({ y0: 760, amp: 110, count: 30, spread: 140, stroke: 'url(#silk-a)', width: 1.1, opacity: 0.32 });
    body += silk({ y0: 180, amp: 70, count: 16, spread: 60, stroke: 'url(#silk-b)', width: 1, opacity: 0.22, phase: 1.4 });

    body += constellation({
        n: 26,
        x0: 1240,
        x1: W - 30,
        y0: 260,
        y1: 640,
        maxDist: 170,
        line: C.purple,
        lineOpacity: 0.22,
        dot: C.skyDeep,
        glowEvery: 6,
    });
    return svg(defs, body);
};

const out = path.join(__dirname, '..', 'public', 'backgrounds');
fs.mkdirSync(out, { recursive: true });
for (const [name, make] of [
    ['cosmos-dark.svg', darkScene],
    ['silk-light.svg', lightScene],
]) {
    const content = make();
    fs.writeFileSync(path.join(out, name), content);
    console.log(`${name}  ${(content.length / 1024).toFixed(0)} KB`);
}
