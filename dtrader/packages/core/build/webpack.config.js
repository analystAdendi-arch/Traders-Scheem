const path = require('path');
const { ALIASES, IS_RELEASE, MINIMIZERS, plugins, rules } = require('./constants');
const { openChromeBasedOnPlatform } = require('./helpers');

module.exports = function (env) {
    const base = env && env.base && env.base !== true ? `/${env.base}/` : '/';
    const sub_path = env && env.open && env.open !== true ? env.open : '';

    return {
        context: path.resolve(__dirname, '../src'),
        devServer: {
            static: {
                publicPath: base,
                watch: true,
            },
            open: {
                app: {
                    name: openChromeBasedOnPlatform(process.platform),
                },
                target: sub_path,
            },
            host: 'localhost',
            server: 'https',

            port: 8443,
            historyApiFallback: true,
            hot: false,
            client: {
                overlay: false,
            },
        },
        devtool: IS_RELEASE ? 'source-map' : 'eval-cheap-module-source-map',

        entry: './index.tsx',
        mode: IS_RELEASE ? 'production' : 'development',
        module: {
            rules: rules(),
        },
        resolve: {
            alias: ALIASES,
            extensions: ['.js', '.jsx', '.ts', '.tsx'],
            symlinks: true,
        },
        optimization: {
            minimize: IS_RELEASE,
            minimizer: MINIMIZERS,
            splitChunks: {
                chunks: 'all',
                minSize: 75000, // 75KB minimum chunk size for balanced granularity
                minSizeReduction: 75000, // Match minSize for consistency
                minChunks: 1,
                maxSize: 1000000, // 1MB max chunks - fewer chunks for better performance
                maxAsyncRequests: 30,
                maxInitialRequests: 30,
                automaticNameDelimiter: '~',
                enforceSizeThreshold: 1000000, // Allow enforced cache groups to be up to 1MB without splitting
                cacheGroups: {
                    // Split vendor CSS into separate file
                    // This ensures vendor CSS loads before app CSS in HTML
                    vendorStyles: {
                        test: module => {
                            // Match CSS files from node_modules
                            return (
                                module.type === 'css/mini-extract' && /[\\/]node_modules[\\/]/.test(module.identifier())
                            );
                        },
                        name: 'vendor',
                        chunks: 'all',
                        priority: 30,
                        enforce: true,
                    },
                    // React + MobX
                    framework: {
                        test: /[\\/]node_modules[\\/](react|react-dom|react-router|react-router-dom|scheduler|mobx|mobx-react-lite|mobx-utils)[\\/]/,
                        name: 'framework-vendor',
                        priority: 40,
                        enforce: true,
                        reuseExistingChunk: true,
                    },
                    // UI + shared/translations
                    deriv: {
                        test: /[\\/]node_modules[\\/](@deriv-com[\\/]ui|@deriv[\\/]components|@deriv[\\/]shared|@deriv-com[\\/]translations)[\\/]/,
                        name: 'deriv-vendor',
                        priority: 35,
                        enforce: true,
                        reuseExistingChunk: true,
                    },
                    // Split date/time libraries
                    datetime: {
                        test: /[\\/]node_modules[\\/](moment|dayjs)[\\/]/,
                        name: 'datetime-vendor',
                        priority: 28,
                        enforce: true,
                        reuseExistingChunk: true,
                    },
                    default: {
                        minChunks: 2,
                        minSize: 75000, // Match global minSize for consistency
                        priority: -20,
                        reuseExistingChunk: true,
                    },
                    defaultVendors: {
                        idHint: 'vendors',
                        test: /[\\/]node_modules[\\/]/,
                        priority: -10,
                        reuseExistingChunk: true,
                    },
                },
            },
        },
        output: {
            filename: 'js/core.[name].[contenthash].js',
            publicPath: base,
            path: path.resolve(__dirname, '../dist'),
        },
        plugins: plugins({
            base,
            is_test_env: false,
            env,
        }),
        snapshot: {
            managedPaths: [],
        },
        stats: {
            colors: true,
        },
    };
};
