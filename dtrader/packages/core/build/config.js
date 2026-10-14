const path = require('path');
const stylelintFormatter = require('stylelint-formatter-pretty');
const { transformContentUrlBase } = require('./helpers');
const { GitRevisionPlugin } = require('git-revision-webpack-plugin');
// [AI]
const brandConfig = require('../../../brand.config.json');
// [/AI]

const gitRevisionPlugin = new GitRevisionPlugin();

// [VolaTrades] This app is built inside the VolaTrades repo, and hosts often
// build without a .git folder at all. The version tag is informational, so a
// missing git history must not fail the build.
const buildVersion = () => {
    try {
        return gitRevisionPlugin.version();
    } catch (error) {
        return process.env.RAILWAY_GIT_COMMIT_SHA || process.env.SOURCE_VERSION || 'unknown';
    }
};

const copyConfig = base => {
    const patterns = [
        {
            from: path.resolve(__dirname, '../../../node_modules/@deriv-com/smartcharts-champion/dist'),
            to: 'js/smartcharts/',
            globOptions: {
                ignore: ['**/NOTICES'],
            },
        },
        {
            from: path.resolve(__dirname, '../../../node_modules/@deriv-com/smartcharts-champion/dist/assets'),
            to: 'assets',
            globOptions: {
                ignore: ['**/NOTICES'],
            },
        },
        {
            from: path.resolve(__dirname, '../../../node_modules/@deriv/trader/dist/trader'),
            to: 'trader',
        },
        {
            from: path.resolve(__dirname, '../../../node_modules/@deriv/reports/dist/reports/js/'),
            to: 'reports/js',
        },
        {
            from: path.resolve(__dirname, '../../../node_modules/@deriv/reports/dist/reports/css/'),
            to: 'reports/css',
        },
        { from: path.resolve(__dirname, '../scripts/CNAME'), to: 'CNAME', toType: 'file', noErrorOnMissing: true },
        {
            from: path.resolve(__dirname, '../src/public/.well-known/apple-app-site-association'),
            to: '.well-known/apple-app-site-association',
            toType: 'file',
        },
        {
            from: path.resolve(__dirname, '../src/public/.well-known/assetslinks.json'),
            to: '.well-known/assetlinks.json',
            toType: 'file',
        },
        {
            from: path.resolve(__dirname, '../src/public/.well-known/apple-app-site-association'),
            to: 'apple-app-site-association',
            toType: 'file',
        },
        {
            from: path.resolve(__dirname, '../src/public/.well-known/assetslinks.json'),
            to: 'assetlinks.json',
            toType: 'file',
        },
        { from: path.resolve(__dirname, '../src/root_files/custom404.html'), to: 'custom404.html', toType: 'file' },
        {
            from: path.resolve(__dirname, '../src/root_files/front-channel.html'),
            to: 'front-channel.html',
            toType: 'file',
        },
        { from: path.resolve(__dirname, '../src/root_files/robots.txt'), to: 'robots.txt', toType: 'file' },
        { from: path.resolve(__dirname, '../src/root_files/sitemap.xml'), to: 'sitemap.xml', toType: 'file' },
        {
            from: path.resolve(__dirname, '../src/public/images/favicons/favicon.ico'),
            to: 'favicon.ico',
            toType: 'file',
        },
        { from: path.resolve(__dirname, '../src/public/images/favicons/'), to: 'public/images/favicons/' },
        {
            from: path.resolve(__dirname, '../src/public/images/common/static_images/'),
            to: 'public/images/common',
        },
        {
            from: path.resolve(__dirname, '../src/public/videos/'),
            to: 'public/videos',
            globOptions: {
                ignore: ['**/*.mp4', '**/*.webm'],
            },
        },
        {
            from: path.resolve(__dirname, '../src/public/images/common/callback_loader.gif'),
            to: 'public/images/common/callback_loader.gif',
        },
        {
            from: path.resolve(__dirname, '../src/public/images/common/logos/platform_logos/'),
            to: 'public/images/common/logos/platform_logos/',
        },
        {
            from: path.resolve(__dirname, '../src/templates/app/manifest.json'),
            to: 'manifest.json',
            toType: 'file',
            transform(content, transform_path) {
                // [AI]
                const manifest = JSON.parse(transformContentUrlBase(content, transform_path, base).toString());
                manifest.name = brandConfig.brand_name;
                manifest.short_name = brandConfig.brand_name;
                manifest.description = brandConfig.platform.description || '';
                if (brandConfig.colors?.primary) {
                    manifest.theme_color = brandConfig.colors.primary;
                    manifest.background_color = brandConfig.colors.primary;
                }
                return JSON.stringify(manifest, null, 4);
                // [/AI]
            },
        },
        // [AI]
        {
            from: path.resolve(__dirname, '../../../assets/brand'),
            to: 'brand',
            noErrorOnMissing: false,
        },
        // [/AI]
    ];

    return {
        patterns,
        options: {
            concurrency: 100,
        },
    };
};

const generateSWConfig = () => ({
    cleanupOutdatedCaches: true,
    exclude: [/\**/],
    runtimeCaching: [
        // Google Fonts stylesheets - long cache
        {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
                cacheName: 'google-fonts-stylesheets',
                expiration: {
                    maxEntries: 20,
                    maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
                },
            },
        },
        // Google Fonts webfonts - long cache
        {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
                cacheName: 'google-fonts-webfonts',
                cacheableResponse: {
                    statuses: [0, 200],
                },
                expiration: {
                    maxEntries: 30,
                    maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
                },
            },
        },
        // CDN resources (fonts, libraries) - try network first with timeout
        {
            urlPattern: /^https:\/\/(cdn\.jsdelivr\.net)\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: {
                cacheName: 'cdn-resources',
                expiration: {
                    maxEntries: 20,
                    maxAgeSeconds: 60 * 60 * 24, // 1 day
                },
            },
        },
        {
            urlPattern: /public\/images\/(?!.*favicons).*$/,
            handler: 'CacheFirst',
            options: {
                cacheName: 'assets',
                expiration: {
                    maxAgeSeconds: 60 * 60 * 24,
                },
            },
        },
        {
            urlPattern: ({ url }) => {
                return url.pathname.match(/^\/js\/(?!(.*((core\.[a-z_]*-json\.)|smartcharts))).*$/);
            },
            handler: 'CacheFirst',
            options: {
                cacheName: 'core-js-files',
                expiration: {
                    maxAgeSeconds: 60 * 60 * 24,
                },
            },
        },
        {
            urlPattern: ({ url }) => {
                return url.pathname.match(/^\/js\/(smartcharts)\//);
            },
            handler: 'CacheFirst',
            options: {
                cacheName: 'smartchart-files',
                expiration: {
                    maxAgeSeconds: 60 * 60 * 24,
                },
            },
        },
        {
            urlPattern: ({ url }) => {
                return url.pathname.match(/^\/css\//);
            },
            handler: 'CacheFirst',
            options: {
                cacheName: 'core-css-files',
                expiration: {
                    maxAgeSeconds: 60 * 60 * 24,
                },
            },
        },
        {
            urlPattern: /(trader|reports)\//,
            handler: 'CacheFirst',
            options: {
                cacheName: 'packages-files',
                expiration: {
                    maxAgeSeconds: 60 * 60 * 24,
                },
            },
        },
    ],
    skipWaiting: true,
    clientsClaim: true,
});

const htmlOutputConfig = is_release => ({
    template: 'index.html',
    filename: 'index.html',
    // [AI]
    templateParameters: {
        brand_name: brandConfig.brand_name,
        platform_name: brandConfig.platform.name,
        platform_description: brandConfig.platform.description || '',
        canonical_url: `https://${brandConfig.brand_hostname.production}`,
        theme_color: brandConfig.colors?.primary || '#000000',
        api_core_url: `https://${brandConfig.api_core.production}`,
        api_url: `https://${brandConfig.api.production}`,
        auth_url: brandConfig.auth.production,
    },
    // [/AI]
    meta: is_release
        ? {
              versionMetaTAG: {
                  name: 'version',
                  content: buildVersion(),
              },
          }
        : {},
    minify: !is_release
        ? false
        : {
              collapseWhitespace: true,
              removeComments: true,
              removeRedundantAttributes: true,
              useShortDoctype: true,
          },
});

const htmlInjectConfig = () => ({
    links: [
        {
            path: 'manifest.json',
            attributes: {
                rel: 'manifest',
                crossorigin: 'use-credentials',
            },
        },
        {
            path: 'favicon.ico',
            attributes: {
                rel: 'icon',
            },
        },
        ...[
            { name: 'favicon', rel: 'icon', size: '16' },
            { name: 'favicon', rel: 'icon', size: '32' },
            { name: 'favicon', rel: 'icon', size: '96' },
            { name: 'favicon', rel: 'icon', size: '160' },
            { name: 'favicon', rel: 'icon', size: '192' },
            { name: 'apple-touch-icon', size: '57' },
            { name: 'apple-touch-icon', size: '60' },
            { name: 'apple-touch-icon', size: '72' },
            { name: 'apple-touch-icon', size: '76' },
            { name: 'apple-touch-icon', size: '114' },
            { name: 'apple-touch-icon', size: '120' },
            { name: 'apple-touch-icon', size: '144' },
            { name: 'apple-touch-icon', size: '152' },
            { name: 'apple-touch-icon', size: '180' },
        ].map(({ name, rel, size }) => ({
            path: `public/images/favicons/${name}-${size}.png`,
            attributes: {
                rel: rel || name,
                sizes: `${size}x${size}`,
            },
        })),
    ],
    append: false,
});

const htmlPreloadConfig = () => ({
    rel: 'preload',
    include: 'initial',
    as(entry) {
        if (/\.css$/.test(entry)) return 'style';
        if (/\.woff$/.test(entry)) return 'font';
        return 'script';
    },
    fileWhitelist: [/\.css$/],
});

const cssConfig = () => ({
    filename: 'css/core.[name].[contenthash].main.css',
    chunkFilename: 'css/core.chunk.[name].[contenthash].css',
});

const stylelintConfig = () => ({
    configFile: path.resolve(__dirname, '../.stylelintrc.js'),
    formatter: stylelintFormatter,
    files: 'sass/**/*.s?(a|c)ss',
    failOnError: false, // Even though it's false, it will fail on error, and we need this to be false to display trace
});

module.exports = {
    copyConfig,
    htmlOutputConfig,
    htmlInjectConfig,
    htmlPreloadConfig,
    cssConfig,
    stylelintConfig,
    generateSWConfig,
};
