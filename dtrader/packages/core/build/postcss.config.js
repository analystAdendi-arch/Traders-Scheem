module.exports = {
    parser: 'postcss-scss',
    plugins: [
        require('postcss-rtlcss')(),
        {
            'postcss-preset-env': {},
        },
        // Custom PostCSS plugin to remove external @import statements
        {
            postcssPlugin: 'remove-external-imports',
            Once(root) {
                root.walkAtRules('import', rule => {
                    // Extract URL from @import statement (handles both quoted and url() syntax)
                    let importValue = rule.params.replace(/^['"]/, '').replace(/['"]$/, '');
                    importValue = importValue.replace(/^url\(['"]?/, '').replace(/['"]?\)$/, '');

                    // Remove @import for external URLs (http://, https://, //)
                    if (/^https?:\/\//.test(importValue) || importValue.startsWith('//')) {
                        rule.remove();
                    }
                });
            },
        },
    ],
};
