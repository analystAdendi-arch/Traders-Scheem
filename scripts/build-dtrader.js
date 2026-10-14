/**
 * Builds the DTrader app in ./dtrader so VolaTrades can serve it at /dtrader/.
 *
 * DTrader is Deriv's own trader: a separate webpack monorepo with its own
 * dependencies. This script installs those, builds its packages in the order
 * DTrader's own build:all uses, with every package told it lives under
 * /dtrader/, and copies the result to dtrader-dist/dtrader/. rsbuild serves
 * dtrader-dist/ as a public folder (see rsbuild.config.ts), so the trader ends
 * up at dist/dtrader/ in a build and at /dtrader/ on the dev server.
 *
 * It runs from `prebuild`, so `npm run build` does everything. Run it alone
 * with `npm run build:dtrader` (needed once before `npm run dev`).
 *
 * Environment:
 *   SKIP_DTRADER_BUILD=1   keep whatever is already in dtrader-dist/
 *   DTRADER_REINSTALL=1    reinstall DTrader's dependencies even if present
 *
 * DTrader reads the same Deriv settings as the rest of the site - the OAuth
 * client id and the environment - and both are written into its
 * brand.config.json here, from the environment or .env.production.
 */
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DTRADER = path.join(ROOT, 'dtrader');
const OUT_ROOT = path.join(ROOT, 'dtrader-dist');
const BASE = 'dtrader'; // must match DTRADER_URL in src/pages/manual-trader
const OUT = path.join(OUT_ROOT, BASE);

const log = message => console.log(`[dtrader] ${message}`);

const fail = message => {
    console.error(`[dtrader] ${message}`);
    process.exit(1);
};

/** KEY=value lines, as rsbuild's loadEnv reads them. Real env vars win. */
const readEnvFile = file => {
    const values = {};
    if (!fs.existsSync(file)) return values;
    const text = fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, '');
    for (const line of text.split(/\r?\n/)) {
        const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
        if (!match) continue;
        values[match[1]] = match[2].replace(/^(['"])(.*)\1$/, '$2');
    }
    return values;
};

const run = (command, args, cwd, extra_env = {}) => {
    log(`${path.relative(ROOT, cwd) || '.'} $ ${command} ${args.join(' ')}`);
    const result = spawnSync(command, args, {
        cwd,
        stdio: 'inherit',
        env: { ...process.env, ...extra_env },
        shell: process.platform === 'win32',
    });
    if (result.status !== 0) fail(`"${command} ${args.join(' ')}" failed (exit ${result.status}).`);
};

const copyDir = (from, to) => {
    fs.rmSync(to, { recursive: true, force: true });
    fs.mkdirSync(path.dirname(to), { recursive: true });
    fs.cpSync(from, to, { recursive: true });
};

const main = () => {
    if (!fs.existsSync(path.join(DTRADER, 'package.json'))) fail('No ./dtrader folder found.');

    if (process.env.SKIP_DTRADER_BUILD === '1') {
        if (fs.existsSync(path.join(OUT, 'index.html'))) {
            log('SKIP_DTRADER_BUILD=1 - keeping the existing build in dtrader-dist/.');
            return;
        }
        fail('SKIP_DTRADER_BUILD=1 but dtrader-dist/dtrader/index.html does not exist.');
    }

    const [major, minor] = process.versions.node.split('.').map(Number);
    if (major < 22 || (major === 22 && minor < 14)) {
        fail(`DTrader needs Node 22.14 or newer; this is Node ${process.versions.node}.`);
    }

    // 1. Same Deriv settings as the rest of VolaTrades.
    const env = { ...readEnvFile(path.join(ROOT, '.env.production')), ...process.env };
    const config_path = path.join(DTRADER, 'brand.config.json');
    const config = JSON.parse(fs.readFileSync(config_path, 'utf8'));
    config.environment = env.NEXT_PUBLIC_DERIV_ENV || '';
    config.auth = { ...config.auth, oauth_client_id: env.NEXT_PUBLIC_DERIV_APP_ID || '' };
    if (env.NEXT_PUBLIC_DERIV_APP_NAME) {
        config.brand_name = env.NEXT_PUBLIC_DERIV_APP_NAME;
        config.platform = { ...config.platform, name: env.NEXT_PUBLIC_DERIV_APP_NAME };
    }
    fs.writeFileSync(config_path, `${JSON.stringify(config, null, 4)}\n`);
    if (!config.auth.oauth_client_id) log('Warning: NEXT_PUBLIC_DERIV_APP_ID is not set; login will not work.');
    log(`Environment: ${config.environment || '(detected from hostname)'}`);

    // 2. DTrader's own dependencies.
    const has_modules = fs.existsSync(path.join(DTRADER, 'node_modules', '.bin'));
    if (!has_modules || process.env.DTRADER_REINSTALL === '1') {
        run('npm', ['ci', '--no-audit', '--no-fund'], DTRADER);
    }

    // 3. Its packages, in build:all's order, all based at /dtrader/.
    const build_env = {
        NODE_ENV: 'production',
        // A large webpack build; the default heap is not always enough.
        NODE_OPTIONS: process.env.NODE_OPTIONS || '--max-old-space-size=6144',
    };
    const webpack = path.join(DTRADER, 'node_modules', '.bin', process.platform === 'win32' ? 'webpack.cmd' : 'webpack');
    const pkg = name => path.join(DTRADER, 'packages', name);

    run(webpack, ['--mode=production'], pkg('components'), build_env);
    for (const name of ['reports', 'trader', 'core']) {
        run(webpack, ['--config', './build/webpack.config.js', '--env', `base=${BASE}`], pkg(name), build_env);
    }

    // 4. Hand the result to VolaTrades' build.
    const dist = path.join(pkg('core'), 'dist');
    if (!fs.existsSync(path.join(dist, 'index.html'))) fail('The build finished without packages/core/dist/index.html.');
    copyDir(dist, OUT);
    log(`Done: ${path.relative(ROOT, OUT)}`);
};

main();
