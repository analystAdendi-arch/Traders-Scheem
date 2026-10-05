/**
 * Generates the Traders Scheem background artwork into public/backgrounds/.
 *
 *   node scripts/generate-backgrounds.js
 *
 * Everything is drawn procedurally from a fixed seed, so the output is stable
 * between runs: change SEED to get a fresh composition with the same style.
 *
 *   cosmos-dark.svg  obsidian & gold vault: aurora curtains over a gold perspective
 *                    floor, a candlestick skyline, a glowing trend line and gold coins.
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

/* ------------------------------------------------------------ vault scene */

// Obsidian & gold: aurora curtains over a gold perspective floor, a skyline of
// candlesticks, a glowing trend line and floating gold coins.
const vaultScene = () => {
    const defs = [
        `<linearGradient id="obsidian" x1="0" y1="0" x2="0" y2="1">` +
            `<stop offset="0" stop-color="#03040a"/><stop offset="0.55" stop-color="#070b1c"/><stop offset="1" stop-color="#0d0a1f"/></linearGradient>`,
        `<linearGradient id="aurora-a" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${C.sky}" stop-opacity="0"/><stop offset="0.45" stop-color="${C.sky}" stop-opacity="0.32"/><stop offset="1" stop-color="${C.purple}" stop-opacity="0"/></linearGradient>`,
        `<linearGradient id="aurora-b" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${C.purple}" stop-opacity="0"/><stop offset="0.5" stop-color="${C.purpleSoft}" stop-opacity="0.3"/><stop offset="1" stop-color="${C.sky}" stop-opacity="0"/></linearGradient>`,
        `<linearGradient id="floor-fade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${C.gold}" stop-opacity="0"/><stop offset="1" stop-color="${C.gold}" stop-opacity="0.5"/></linearGradient>`,
        `<linearGradient id="trend" x1="0" x2="1"><stop offset="0" stop-color="${C.gold}" stop-opacity="0"/><stop offset="0.3" stop-color="${C.gold}"/><stop offset="1" stop-color="#fde68a"/></linearGradient>`,
        `<linearGradient id="trend-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${C.gold}" stop-opacity="0.16"/><stop offset="1" stop-color="${C.gold}" stop-opacity="0"/></linearGradient>`,
        `<linearGradient id="coin" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fde68a"/><stop offset="0.5" stop-color="${C.gold}"/><stop offset="1" stop-color="${C.goldDeep}"/></linearGradient>`,
        radial('glow-gold', C.gold, 0.45),
        radial('glow-sky', C.sky, 0.3),
        radial('glow-purple', C.purple, 0.4),
        radial('star-glow', C.white, 0.9),
        `<filter id="soft" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="18"/></filter>`,
        `<filter id="line-glow" x="-5%" y="-30%" width="110%" height="160%"><feGaussianBlur stdDeviation="5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>`,
    ].join('');

    let body = `<rect width="${W}" height="${H}" fill="url(#obsidian)"/>`;

    // Ambient glows.
    body += `<ellipse cx="1500" cy="160" rx="700" ry="380" fill="url(#glow-purple)"/>`;
    body += `<ellipse cx="300" cy="120" rx="620" ry="320" fill="url(#glow-sky)"/>`;
    body += `<ellipse cx="960" cy="760" rx="900" ry="300" fill="url(#glow-gold)" opacity="0.55"/>`;

    // Aurora curtains: soft vertical bands that wave across the top.
    let curtains = '';
    for (let i = 0; i < 9; i++) {
        const x = 80 + i * 220 + rand(-40, 40);
        const w = rand(90, 170);
        const h = rand(380, 560);
        const sway = rand(-80, 80);
        const d = `M${f(x)} -20 C ${f(x + sway)} ${f(h * 0.35)}, ${f(x - sway)} ${f(h * 0.7)}, ${f(x + sway * 0.5)} ${f(h)} L ${f(x + w + sway * 0.5)} ${f(h)} C ${f(x + w - sway)} ${f(h * 0.7)}, ${f(x + w + sway)} ${f(h * 0.35)}, ${f(x + w)} -20 Z`;
        curtains += `<path d="${d}" fill="url(#${i % 2 ? 'aurora-b' : 'aurora-a'})" opacity="${f(rand(0.5, 0.95))}"/>`;
    }
    body += `<g filter="url(#soft)">${curtains}</g>`;

    // Stars, sparse.
    for (let i = 0; i < 120; i++) {
        const x = rand(0, W);
        const y = rand(0, H * 0.62);
        const r = rng() < 0.9 ? rand(0.4, 1.2) : rand(1.5, 2.2);
        body += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r)}" fill="${pick([C.white, '#fdf6dc', '#e0f2fe'])}" opacity="${f(rand(0.3, 0.9))}"/>`;
        if (r > 1.5) body += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r * 4)}" fill="url(#star-glow)" opacity="0.3"/>`;
    }

    // Gold perspective floor.
    const horizon = 700;
    let floor = '';
    for (let i = 0; i < 14; i++) {
        const y = horizon + Math.pow(i / 13, 1.9) * (H - horizon + 40);
        floor += `<line x1="0" x2="${W}" y1="${f(y)}" y2="${f(y)}"/>`;
    }
    for (let i = -18; i <= 18; i++) {
        floor += `<line x1="${W / 2 + i * 26}" y1="${horizon}" x2="${W / 2 + i * 190}" y2="${H + 40}"/>`;
    }
    body += `<g stroke="url(#floor-fade)" stroke-width="1">${floor}</g>`;
    body += `<rect x="0" y="${horizon - 2}" width="${W}" height="2" fill="${C.gold}" opacity="0.35"/>`;

    // Candlestick skyline standing on the horizon.
    let candles = '';
    let level = 0;
    for (let x = 30; x < W - 20; x += 34) {
        level += rand(-26, 30);
        level = Math.max(-40, Math.min(220, level));
        const up = rng() < 0.6;
        const body_h = rand(40, 150) + level * 0.4;
        const top = horizon - 40 - level - body_h;
        const color = up ? C.gold : rng() < 0.5 ? C.sky : C.red;
        candles += `<line x1="${x + 7}" x2="${x + 7}" y1="${f(top - rand(10, 34))}" y2="${f(top + body_h + rand(8, 24))}" stroke="${color}" stroke-width="1.4"/>`;
        candles += `<rect x="${x}" y="${f(top)}" width="14" height="${f(body_h)}" rx="2" fill="${color}"/>`;
    }
    body += `<g opacity="0.2">${candles}</g>`;

    // Rising trend line across the scene, glowing.
    const pts = [];
    let y = 640;
    for (let x = -20; x <= W + 40; x += 48) {
        y += rand(-38, 22);
        y = Math.max(180, Math.min(680, y));
        pts.push([x, y]);
    }
    const line = pts.map(([x, py], i) => `${i ? 'L' : 'M'}${x} ${f(py)}`).join(' ');
    const [lx] = pts[pts.length - 1];
    body += `<path d="${line} L${lx} ${horizon} L-20 ${horizon} Z" fill="url(#trend-fill)"/>`;
    body += `<path d="${line}" fill="none" stroke="url(#trend)" stroke-width="2.6" stroke-linejoin="round" filter="url(#line-glow)"/>`;
    pts.filter((_, i) => i % 7 === 3).forEach(([px, py]) => {
        body += `<circle cx="${px}" cy="${f(py)}" r="12" fill="url(#glow-gold)"/><circle cx="${px}" cy="${f(py)}" r="3.4" fill="#fde68a"/>`;
    });

    // Floating gold coins, edge-on and face-on.
    const coin = (cx, cy, r, tilt) =>
        `<g transform="translate(${cx} ${cy}) scale(1 ${tilt})" opacity="0.8">` +
        `<circle r="${r * 1.9}" fill="url(#glow-gold)"/>` +
        `<circle r="${r}" fill="url(#coin)"/>` +
        `<circle r="${f(r * 0.72)}" fill="none" stroke="#7a5a08" stroke-opacity="0.55" stroke-width="${f(r * 0.08)}"/>` +
        `<text y="${f(r * 0.32)}" text-anchor="middle" font-family="Arial, sans-serif" font-weight="900" font-size="${f(r * 0.9)}" fill="#7a5a08" fill-opacity="0.7">$</text>` +
        `</g>`;
    body += coin(1660, 330, 34, 1) + coin(1780, 470, 20, 0.45) + coin(220, 420, 26, 0.8) + coin(1180, 140, 16, 1) + coin(640, 560, 14, 0.5);

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
    ['cosmos-dark.svg', vaultScene],
    ['silk-light.svg', lightScene],
]) {
    const content = make();
    fs.writeFileSync(path.join(out, name), content);
    console.log(`${name}  ${(content.length / 1024).toFixed(0)} KB`);
}
