/**
 * One-off palette swap: rewrites the old accent colours hard-coded across src/ to the
 * TraderScheme palette (light blue, gold, red, purple on white / logo navy).
 *
 *   node scripts/apply-palette.js          rewrite files
 *   node scripts/apply-palette.js --dry    report only
 *
 * Hex is swapped for hex (never for var()), so Sass colour functions such as
 * darken() or rgba($c, .5) keep working. rgb()/rgba() literals of a mapped colour
 * keep their alpha. Greens are left alone on purpose: they mean profit / buy.
 */
const fs = require('fs');
const path = require('path');

const MAP = {
    // blue -> light blue (sky)
    '#eff6ff': '#f0f9ff',
    '#dbeafe': '#e0f2fe',
    '#bfdbfe': '#bae6fd',
    '#93c5fd': '#7dd3fc',
    '#60a5fa': '#38bdf8',
    '#3b82f6': '#0ea5e9',
    '#2563eb': '#0284c7',
    '#1d4ed8': '#0369a1',
    '#1e40af': '#075985',
    '#1e3a8a': '#0c4a6e',
    '#2196f3': '#0ea5e9',
    '#229ed9': '#0ea5e9',
    '#2b59c3': '#0284c7',
    '#377cfc': '#0ea5e9',
    // cyan / teal accents -> light blue
    '#ecfeff': '#f0f9ff',
    '#cffafe': '#e0f2fe',
    '#a5f3fc': '#bae6fd',
    '#67e8f9': '#7dd3fc',
    '#22d3ee': '#38bdf8',
    '#06b6d4': '#0ea5e9',
    '#0891b2': '#0284c7',
    '#0e7490': '#0369a1',
    '#5eead4': '#7dd3fc',
    '#2dd4bf': '#38bdf8',
    '#14b8a6': '#0ea5e9',
    '#0d9488': '#0284c7',
    '#4bb4b3': '#38bdf8',
    '#10d9a0': '#38bdf8',
    '#ff4d6a': '#e11d48',
    // indigo -> purple
    '#e0e7ff': '#ede9fe',
    '#c7d2fe': '#ddd6fe',
    '#a5b4fc': '#c4b5fd',
    '#818cf8': '#a78bfa',
    '#6366f1': '#7c3aed',
    '#4f46e5': '#6d28d9',
    '#4338ca': '#5b21b6',
    // amber / orange / yellow -> gold
    '#fef3c7': '#fdf6dc',
    '#fde68a': '#f9e7a6',
    '#fcd34d': '#f5d46b',
    '#fbbf24': '#f0c040',
    '#facc15': '#f0c040',
    '#ffc107': '#f0c040',
    '#f59e0b': '#d4a017',
    '#eab308': '#d4a017',
    '#d97706': '#b8860b',
    '#b45309': '#8a6508',
    '#fb923c': '#f0c040',
    '#f97316': '#d4a017',
    '#ea580c': '#b8860b',
    '#ff6a3d': '#f0c040',
    // reds -> brand red
    '#fef2f2': '#fff1f2',
    '#fee2e2': '#ffe4e6',
    '#fca5a5': '#fda4af',
    '#f87171': '#fb7185',
    '#ef4444': '#e11d48',
    '#ff444f': '#e11d48',
    '#ec3f3f': '#e11d48',
    '#ff6444': '#e11d48',
    '#dc2626': '#be123c',
    '#b91c1c': '#9f1239',
    '#991b1b': '#881337',
};

const SKIP = /node_modules|__tests__|[\\/]wallets[\\/]wallet\.scss$/;
const EXT = /\.(scss|css|tsx|ts|jsx|js)$/;

const toRgb = hex => [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16));

const hexRe = new RegExp(`(${Object.keys(MAP).join('|')})(?![0-9a-f])`, 'gi');
const rgbRules = Object.entries(MAP).map(([from, to]) => {
    const [r, g, b] = toRgb(from);
    return {
        re: new RegExp(`(rgba?\\(\\s*)${r}(\\s*,\\s*|\\s+)${g}(\\s*,\\s*|\\s+)${b}(?=\\s*[,)/])`, 'g'),
        to: toRgb(to),
    };
});

const dry = process.argv.includes('--dry');
const root = path.join(__dirname, '..', 'src');
let total = 0;

const walk = dir => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const file = path.join(dir, entry.name);
        if (SKIP.test(file)) continue;
        if (entry.isDirectory()) walk(file);
        else if (EXT.test(entry.name)) rewrite(file);
    }
};

const rewrite = file => {
    const before = fs.readFileSync(file, 'utf8');
    let count = 0;
    let after = before.replace(hexRe, match => {
        count++;
        return MAP[match.toLowerCase()];
    });
    for (const { re, to } of rgbRules) {
        after = after.replace(re, (_m, open, s1, s2) => {
            count++;
            return `${open}${to[0]}${s1}${to[1]}${s2}${to[2]}`;
        });
    }
    if (!count) return;
    total += count;
    console.log(`${String(count).padStart(4)}  ${path.relative(root, file)}`);
    if (!dry) fs.writeFileSync(file, after, 'utf8');
};

walk(root);
console.log(`${dry ? 'would change' : 'changed'} ${total} colour values`);
