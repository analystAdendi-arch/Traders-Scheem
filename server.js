/**
 * Static file server for the built site (dist/), with SPA fallback.
 *
 * The app is a single-page build, so any path that is not a real file must be
 * answered with index.html - otherwise Deriv's OAuth return at /callback 404s
 * and login breaks. No dependencies: hosts run `npm start` and this serves it.
 */
const http = require('http');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const ROOT = path.join(__dirname, 'dist');
const PORT = Number(process.env.PORT) || 3000;

const TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.mjs': 'text/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.map': 'application/json; charset=utf-8',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.ico': 'image/x-icon',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf',
    '.otf': 'font/otf',
    '.eot': 'application/vnd.ms-fontobject',
    '.mp4': 'video/mp4',
    '.webm': 'video/webm',
    '.wasm': 'application/wasm',
    '.xml': 'application/xml; charset=utf-8',
    '.txt': 'text/plain; charset=utf-8',
    '.symbols': 'text/plain; charset=utf-8',
};

const COMPRESSIBLE = /^(text\/|application\/(json|xml|javascript|wasm))/;

const send = (res, status, body, headers = {}) => {
    res.writeHead(status, { 'X-Content-Type-Options': 'nosniff', ...headers });
    res.end(body);
};

/** Resolve a URL path to a file inside dist/, refusing anything that escapes it. */
const resolveFile = urlPath => {
    const decoded = decodeURIComponent(urlPath.split('?')[0].split('#')[0]);
    const candidate = path.join(ROOT, decoded);
    const resolved = path.resolve(candidate);
    if (resolved !== ROOT && !resolved.startsWith(ROOT + path.sep)) return null;
    try {
        const stat = fs.statSync(resolved);
        if (stat.isDirectory()) {
            const index = path.join(resolved, 'index.html');
            return fs.existsSync(index) ? index : null;
        }
        return resolved;
    } catch {
        return null;
    }
};

/**
 * Gzipped bodies, kept after the first request.
 *
 * Compressing on every request meant this host re-gzipped the same few
 * megabytes for every visitor and every reload - the entry bundle and its
 * stylesheet are megabytes each, six of them are fetched for the first paint,
 * and they all competed for one CPU. That, not the download, was what left the
 * page sitting on its loading screen.
 *
 * Built assets carry a content hash, so a cached body can never go stale: a
 * changed file arrives under a new name. HTML is left out of the cache, since
 * its name does not change between deploys.
 */
const gzip_cache = new Map();
let gzip_cache_bytes = 0;
const GZIP_CACHE_BUDGET = 192 * 1024 * 1024;
const GZIP_CACHE_MAX_FILE = 32 * 1024 * 1024;

const gzipOnce = (file, immutable, done) => {
    const hit = gzip_cache.get(file);
    if (hit) return done(null, hit);

    fs.readFile(file, (read_error, raw) => {
        if (read_error) return done(read_error);

        // Level 5 rather than the default 6: within a percent or two of the
        // same size on these bundles, and quicker to produce for the first
        // visitor who pays for it.
        zlib.gzip(raw, { level: 5 }, (zip_error, body) => {
            if (zip_error) return done(zip_error);

            const cacheable =
                immutable && body.length <= GZIP_CACHE_MAX_FILE && gzip_cache_bytes + body.length <= GZIP_CACHE_BUDGET;
            if (cacheable) {
                gzip_cache.set(file, body);
                gzip_cache_bytes += body.length;
            }
            done(null, body);
        });
    });
};

const serve = (req, res, file, status = 200) => {
    const ext = path.extname(file).toLowerCase();
    const type = TYPES[ext] || 'application/octet-stream';
    // Hashed assets live under /static and never change; HTML must stay fresh
    // so a new deploy is picked up straight away.
    const immutable = /[.-][0-9a-f]{8,}\./.test(path.basename(file));
    const cache = ext === '.html' ? 'no-cache' : immutable ? 'public, max-age=31536000, immutable' : 'public, max-age=3600';

    const accepts_gzip = /\bgzip\b/.test(req.headers['accept-encoding'] || '');
    const headers = {
        'Content-Type': type,
        'Cache-Control': cache,
        // Standard hardening; none of these limit the app (it is never framed and
        // loads its fonts and Deriv sockets by https/wss).
        'X-Content-Type-Options': 'nosniff',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    };
    const compressing = accepts_gzip && COMPRESSIBLE.test(type);

    // A HEAD carries no body, so do no body work for it. This used to read and
    // compress the whole file before answering.
    if (req.method === 'HEAD') {
        const head = compressing ? { ...headers, 'Content-Encoding': 'gzip', Vary: 'Accept-Encoding' } : headers;
        res.writeHead(status, head);
        return res.end();
    }

    if (compressing) {
        return gzipOnce(file, immutable, (error, body) => {
            if (error) {
                res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
                return res.end('Read error');
            }
            res.writeHead(status, {
                ...headers,
                'Content-Encoding': 'gzip',
                Vary: 'Accept-Encoding',
                'Content-Length': body.length,
            });
            res.end(body);
        });
    }

    res.writeHead(status, { ...headers, 'Content-Length': fs.statSync(file).size });
    fs.createReadStream(file).pipe(res);
};

const server = http.createServer((req, res) => {
    if (req.method !== 'GET' && req.method !== 'HEAD') {
        return send(res, 405, 'Method not allowed', { Allow: 'GET, HEAD' });
    }

    const file = resolveFile(req.url || '/');
    if (file) return serve(req, res, file);

    // Unknown path: hand the SPA its entry point so the router can take over.
    const index = path.join(ROOT, 'index.html');
    if (fs.existsSync(index)) return serve(req, res, index, 200);

    return send(res, 404, 'Not found', { 'Content-Type': 'text/plain; charset=utf-8' });
});

if (!fs.existsSync(ROOT)) {
    console.error(`No build found at ${ROOT}. Run "npm run build" first.`);
    process.exit(1);
}

/**
 * Compress the entry bundles before anyone asks for them.
 *
 * Without this the first visitor after a deploy still waits for the entry
 * bundle and its stylesheet to be gzipped, several megabytes of it. The
 * container is idle at boot, so that is the moment to pay for it. One file at a
 * time, so it never competes with a real request for the CPU.
 */
const warmCache = () => {
    const roots = [path.join(ROOT, 'static', 'js'), path.join(ROOT, 'static', 'css')];
    const files = [];

    for (const dir of roots) {
        let entries = [];
        try {
            entries = fs.readdirSync(dir, { withFileTypes: true });
        } catch {
            continue; // a build without that folder is fine
        }
        for (const entry of entries) {
            if (!entry.isFile()) continue;
            const file = path.join(dir, entry.name);
            const ext = path.extname(entry.name).toLowerCase();
            if (!COMPRESSIBLE.test(TYPES[ext] || '')) continue;
            // Only the ones big enough to be worth pre-compressing, and only
            // hashed names, which is all the cache keeps anyway.
            if (!/[.-][0-9a-f]{8,}\./.test(entry.name)) continue;
            if (fs.statSync(file).size < 128 * 1024) continue;
            files.push(file);
        }
    }

    // Biggest first: those are the ones a visitor would otherwise wait on.
    files.sort((a, b) => fs.statSync(b).size - fs.statSync(a).size);

    const next = index => {
        if (index >= files.length) {
            console.log(`Pre-compressed ${files.length} assets (${(gzip_cache_bytes / 1048576).toFixed(1)} MB held)`);
            return;
        }
        gzipOnce(files[index], true, () => next(index + 1));
    };
    next(0);
};

server.listen(PORT, '0.0.0.0', () => {
    console.log(`Serving dist/ on http://0.0.0.0:${PORT}`);
    warmCache();
});
