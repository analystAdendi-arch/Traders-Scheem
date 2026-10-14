// eslint-disable-next-line import/no-relative-packages
import config_data from '../../../../../brand.config.json';
import { appendLangParam } from '../url/helpers';

export const getBrandDomain = (): string => {
    return (config_data as Record<string, unknown> & typeof config_data).brand_domain as string;
};

export const getBrandName = () => {
    return config_data.brand_name;
};

export const getBrandLogo = () => {
    return config_data.brand_logo;
};

/**
 * Runtime production check based on window.location.hostname.
 * Matches against the configured brand_hostname.production value.
 */
export const isProduction = (): boolean => {
    // [VolaTrades] An explicit environment wins: VolaTrades' build writes it
    // from NEXT_PUBLIC_DERIV_ENV, so this app talks to the same Deriv servers
    // as the rest of the site whatever domain it is deployed on.
    const environment = (config_data as Record<string, unknown>).environment as string | undefined;
    if (environment === 'production') return true;
    if (environment === 'staging' || environment === 'preview') return false;

    if (typeof window === 'undefined') return false;
    const hostname = window.location.hostname;
    const production_hosts = ((config_data as Record<string, unknown>).production_hosts as string[] | undefined) ?? [];
    return hostname === config_data.brand_hostname.production || production_hosts.includes(hostname);
};

export const getBrandHostname = () => {
    const hostname = isProduction() ? config_data.brand_hostname.production : config_data.brand_hostname.staging;
    return substituteDerivDomain(hostname);
};

export const getBrandUrl = () => {
    const hostname = isProduction() ? config_data.brand_hostname.production : config_data.brand_hostname.staging;
    return `https://${substituteDerivDomain(hostname)}`;
};

export const getBrandHomeUrl = (language?: string) => {
    const baseUrl = `${getBrandUrl()}/home`;
    return appendLangParam(baseUrl, language);
};

export const getBrandLoginUrl = (language?: string) => {
    const baseUrl = `${getBrandUrl()}/login`;
    return appendLangParam(baseUrl, language);
};

export const getBrandSignupUrl = (language?: string) => {
    const baseUrl = `${getBrandUrl()}/signup`;
    return appendLangParam(baseUrl, language);
};

export const getPlatformName = () => {
    return config_data.platform.name;
};

export const getPlatformLogo = () => {
    return config_data.platform.logo;
};

// [AI]
export const getBrandLogoDark = (): string => {
    return (
        ((config_data as Record<string, unknown> & typeof config_data).brand_logo_dark as string) ??
        config_data.brand_logo
    );
};

export const getPlatformDescription = (): string => {
    return ((config_data.platform as Record<string, unknown>).description as string) ?? '';
};

export const getAppId = (): number => {
    const app_id = (config_data as Record<string, unknown> & typeof config_data).app_id as
        | { staging: number; production: number }
        | undefined;
    if (!app_id) return 0;
    return isProduction() ? app_id.production : app_id.staging;
};
// [/AI]

export const getDomainName = () => {
    if (typeof window === 'undefined') return '';
    const hostname = window.location.hostname;
    if (!hostname) return '';
    // Split the hostname into parts
    const domainParts = hostname.split('.');

    // Ensure we have at least two parts (SLD and TLD)
    if (domainParts.length >= 2) {
        // Combine the SLD and TLD
        const domain = `${domainParts[domainParts.length - 2]}.${domainParts[domainParts.length - 1]}`;
        return domain;
    }

    return '';
};

/**
 * Replaces "deriv.com" in a URL with the current domain (e.g. deriv.be, deriv.me).
 * Returns the URL unchanged when running on localhost or an unrecognised hostname.
 */
const substituteDerivDomain = (url: string): string => {
    const domain = getDomainName();
    if (!domain || domain !== getBrandDomain()) return url;
    try {
        // Parse the URL so we only rewrite the hostname — not query params or path segments
        const parsed = new URL(url);
        parsed.hostname = parsed.hostname.replace(/deriv\.com$/, domain);
        return parsed.toString();
    } catch {
        // Fallback for non-absolute strings (e.g. "api-core.deriv.com", "home.deriv.com/dashboard")
        return url.replace(/deriv\.com/, domain);
    }
};

/**
 * Returns the current TLD (e.g. "deriv.be") only when it is a known brand domain.
 * Falls back to "deriv.com" on unrecognised hostnames to keep cookies on a trusted domain.
 */
export const getTrustedDomainName = (): string => {
    const domain = getDomainName();
    return domain === getBrandDomain() ? domain : 'deriv.com';
};

/**
 * Returns window.location.hostname for use as an OAuth redirect parameter,
 * but only if the current hostname belongs to a known brand domain or a
 * recognised Cloudflare Pages preview deployment.
 * Returns empty string on unrecognised hostnames to prevent open-redirect
 * attacks where an attacker-controlled copy of the app injects a redirect
 * back to their domain after authentication.
 */
const CLOUDFLARE_PAGES_PATTERN = /^[a-zA-Z0-9-]+\.derivatives-trader\.pages\.dev$/;
export const getRedirectHostname = (): string => {
    if (typeof window === 'undefined') return '';
    const hostname = window.location.hostname;
    const domain = getDomainName();
    if (domain === getBrandDomain()) return hostname;
    if (CLOUDFLARE_PAGES_PATTERN.test(hostname)) return hostname;
    return '';
};

/**
 * Gets the v4 REST API base URL (e.g. "https://api.derivws.com")
 */
export const getApiV4BaseUrl = (): string => {
    const cfg = config_data as Record<string, unknown> & typeof config_data;
    const derivws = cfg.derivws as { staging: string; production: string } | undefined;
    if (!derivws) return 'https://api.derivws.com';
    return isProduction() ? derivws.production : derivws.staging;
};

/**
 * Gets the auth base URL (e.g., "https://auth.deriv.com")
 */
export const getAuthBaseUrl = (): string => {
    return isProduction() ? config_data.auth.production : config_data.auth.staging;
};

export const getOAuthClientId = (): string => {
    // [VolaTrades] The client id VolaTrades logs in with, written into
    // brand.config.json at build time. The access token this app uses was
    // issued to that client, so a refresh has to name the same one.
    const configured = ((config_data.auth as Record<string, unknown>).oauth_client_id as string) || '';
    const client_id = configured || process.env.OAUTH_CLIENT_ID;
    if (!client_id)
        throw new Error(
            'OAUTH_CLIENT_ID is not set. Add it to your .env file for local dev or GitHub Environment secrets for CI.'
        );
    return client_id;
};

/**
 * Gets the OAuth2 redirect URI for the current environment
 */
export const getOAuthAppId = (): string => {
    return ((config_data.auth as Record<string, unknown>).oauth_app_id as string) ?? '';
};

export const getOAuthRedirectUri = (): string => {
    const auth = config_data.auth as Record<string, unknown>;
    return isProduction()
        ? ((auth.oauth_redirect_uri_production as string) ?? '')
        : ((auth.oauth_redirect_uri_staging as string) ?? '');
};

/**
 * Gets the WebSocket server URL with base path
 * @returns WebSocket server URL with base path (e.g., "staging-api-core.deriv.com/options/v1/ws")
 */
export const getWebSocketURL = (): string => {
    const base = isProduction() ? config_data.api_core.production : config_data.api_core.staging;
    return `${substituteDerivDomain(base)}/options/v1/ws`;
};

/**
 * Gets the whoami endpoint URL
 * @returns Whoami endpoint URL (e.g., "https://auth.deriv.com/sessions/whoami")
 */
export const getWhoAmIURL = (): string => {
    const base = isProduction() ? config_data.auth.production : config_data.auth.staging;
    return substituteDerivDomain(`${base}/sessions/whoami`);
};

/**
 * Gets the logout endpoint URL
 * @returns Logout endpoint URL (e.g., "https://auth.deriv.com/self-service/logout/browser")
 */
export const getLogoutURL = (): string => {
    const base = isProduction() ? config_data.auth.production : config_data.auth.staging;
    return substituteDerivDomain(`${base}/self-service/logout/browser`);
};

/**
 * Gets the API Core URL based on environment
 * @returns API Core base URL (without protocol)
 */
export const getApiCoreUrl = (): string => {
    const url = isProduction() ? config_data.api_core.production : config_data.api_core.staging;
    return substituteDerivDomain(url);
};

/**
 * Gets the full API Core URL with protocol
 * @returns Full API Core URL with https://
 */
export const getApiCoreBaseUrl = (): string => {
    return `https://${getApiCoreUrl()}`;
};

/**
 * Gets the API URL for account_list based on environment
 * @returns API base URL (without protocol), e.g. "api.deriv.be"
 */
export const getApiUrl = (): string => {
    const url = isProduction() ? config_data.api.production : config_data.api.staging;
    return substituteDerivDomain(url);
};

/**
 * Gets the full API URL for account_list with protocol
 * @returns Full API URL with https://, e.g. "https://api.deriv.be"
 */
export const getApiBaseUrl = (): string => {
    return `https://${getApiUrl()}`;
};

/**
 * Gets the Help Centre URL
 * @returns Help Centre URL (e.g., "https://trade.deriv.com/help-centre")
 */
export const getHomeUrl = (): string => {
    return substituteDerivDomain(((config_data.platform as Record<string, unknown>).home_url as string) ?? '');
};

export const getHelpCentreUrl = (): string => {
    return substituteDerivDomain(config_data.platform.help_centre_url);
};

export const getDepositUrl = (): string => {
    const deposit = (config_data as Record<string, unknown>).deposit_url as
        | { staging: string; production: string }
        | undefined;
    if (!deposit) return '';
    return substituteDerivDomain(isProduction() ? deposit.production : deposit.staging);
};

export const getSignupUrl = (): string => {
    const signup = (config_data as Record<string, unknown>).signup_url as
        | { staging: string; production: string }
        | undefined;
    if (!signup) return '';
    return substituteDerivDomain(isProduction() ? signup.production : signup.staging);
};

export const isFeatureEnabled = (feature: 'dark_mode' | 'language_switcher'): boolean => {
    const features = (config_data as Record<string, unknown>).features as Record<string, boolean> | undefined;
    return features?.[feature] ?? false;
};
