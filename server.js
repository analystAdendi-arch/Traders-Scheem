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

const serve = (req, res, file, status = 200) => {
    const ext = path.extname(file).toLowerCase();
    const type = TYPES[ext] || 'application/octet-stream';
    // Hashed assets live under /static and never change; HTML must stay fresh
    // so a new deploy is picked up straight away.
    const immutable = /[.-][0-9a-f]{8,}\./.test(path.basename(file));
    const cache = ext === '.html' ? 'no-cache' : immutable ? 'public, max-age=31536000, immutable' : 'public, max-age=3600';

    const accepts_gzip = /\bgzip\b/.test(req.headers['accept-encoding'] || '');
    const headers = { 'Content-Type': type, 'Cache-Control': cache };

    if (accepts_gzip && COMPRESSIBLE.test(type)) {
        res.writeHead(status, { ...headers, 'Content-Encoding': 'gzip', Vary: 'Accept-Encoding' });
        fs.createReadStream(file).pipe(zlib.createGzip()).pipe(res);
        return;
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

server.listen(PORT, '0.0.0.0', () => console.log(`Serving dist/ on http://0.0.0.0:${PORT}`));
