// eslint-disable-next-line import/no-relative-packages
import config_data from '../../../brand.config.json';

// Pattern for preview deployment domains (e.g., branch-name.derivatives-bot.pages.dev, branch-name.derivatives-smarttrader.pages.dev)
export const PREVIEW_DOMAIN_PATTERN = /^[a-zA-Z0-9-]+\.(derivatives-bot|derivatives-smarttrader)\.pages\.dev$/;

/**
 * Validates if a URL belongs to an allowed domain for secure redirects
 * @param url - The URL to validate
 * @returns true if the URL is from an allowed domain, false otherwise
 */
export const isAllowedRedirectDomain = (url: string): boolean => {
    try {
        const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);

        // Block URLs with user credentials (phishing protection)
        if (urlObj.username || urlObj.password) {
            return false;
        }

        const hostname = urlObj.hostname;

        // Check against main domain whitelist from brand config
        const brandDomain = (config_data as Record<string, unknown> & typeof config_data).brand_domain as string;
        const isMainDomain = hostname === brandDomain || hostname.endsWith(`.${brandDomain}`);

        // Check against preview deployment pattern
        const isPreviewDomain = PREVIEW_DOMAIN_PATTERN.test(hostname);

        return isMainDomain || isPreviewDomain;
    } catch {
        return false;
    }
};

/**
 * Checks if the url passed via prop is the route to external URL resource by checking if it starts with http, https or mailto
 * @param link string
 * @returns boolean
 */
export const isExternalLink = (link: string) => /^(http|https|mailto):/i.test(link);
