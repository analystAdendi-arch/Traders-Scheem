import * as brandUtils from '../../brand';
import { getAccountType, getSocketURL } from '../config';

// Mock the brand utils module
jest.mock('../../brand', () => ({
    ...jest.requireActual('../../brand'),
    getWebSocketURL: jest.fn(),
}));

const mockGetWebSocketURL = brandUtils.getWebSocketURL as jest.Mock;

// Helper function to create localStorage mock
const createLocalStorageMock = () => {
    let store: Record<string, string> = {};
    return {
        getItem: (key: string) => store[key] || null,
        setItem: (key: string, value: string) => {
            store[key] = value;
        },
        removeItem: (key: string) => {
            delete store[key];
        },
        clear: () => {
            store = {};
        },
    };
};

// Helper function to mock window.location
const mockLocation = (originalLocation: Location, overrides: Partial<Location>) => {
    delete (window as any).location;
    window.location = {
        ...originalLocation,
        ...overrides,
    } as Location;
};

describe('getAccountType', () => {
    let originalLocation: Location, originalLocalStorage: Storage;

    beforeEach(() => {
        originalLocation = window.location;
        originalLocalStorage = window.localStorage;

        Object.defineProperty(window, 'localStorage', {
            value: createLocalStorageMock(),
            writable: true,
        });

        window.history.replaceState = jest.fn();
    });

    afterEach(() => {
        Object.defineProperty(window, 'location', {
            value: originalLocation,
            writable: true,
        });
        Object.defineProperty(window, 'localStorage', {
            value: originalLocalStorage,
            writable: true,
        });
        jest.clearAllMocks();
    });

    it('should return "demo" from URL parameter and store it in localStorage', () => {
        mockLocation(originalLocation, {
            search: '?account_type=demo',
            href: 'https://staging-dtrader.deriv.com?account_type=demo',
            pathname: '/',
        });

        const result = getAccountType();

        expect(result).toBe('demo');
        expect(window.localStorage.getItem('account_type')).toBe('demo');
        expect(window.history.replaceState).toHaveBeenCalledWith({}, document.title, '/');
    });

    it('should return "real" from URL parameter and store it in localStorage', () => {
        mockLocation(originalLocation, {
            search: '?account_type=real',
            href: 'https://staging-dtrader.deriv.com?account_type=real',
            pathname: '/',
        });

        const result = getAccountType();

        expect(result).toBe('real');
        expect(window.localStorage.getItem('account_type')).toBe('real');
        expect(window.history.replaceState).toHaveBeenCalledWith({}, document.title, '/');
    });

    it('should return "real" from URL parameter and override demo in localStorage', () => {
        window.localStorage.setItem('account_type', 'demo');
        mockLocation(originalLocation, {
            search: '?account_type=real',
            href: 'https://staging-dtrader.deriv.com?account_type=real',
            pathname: '/',
        });

        const result = getAccountType();

        expect(result).toBe('real');
        expect(window.localStorage.getItem('account_type')).toBe('real');
        expect(window.history.replaceState).toHaveBeenCalledWith({}, document.title, '/');
    });

    it('should return value from localStorage when URL parameter is missing', () => {
        window.localStorage.setItem('account_type', 'real');
        mockLocation(originalLocation, {
            search: '',
            href: 'https://staging-dtrader.deriv.com',
        });

        const result = getAccountType();

        expect(result).toBe('real');
    });

    it('should return "public" as default when no URL parameter or localStorage value exists', () => {
        mockLocation(originalLocation, {
            search: '',
            href: 'https://staging-dtrader.deriv.com',
        });

        const result = getAccountType();

        expect(result).toBe('public');
    });

    it('should return "public" as default when URL parameter is invalid', () => {
        mockLocation(originalLocation, {
            search: '?account_type=invalid',
            href: 'https://staging-dtrader.deriv.com?account_type=invalid',
            pathname: '/',
        });

        const result = getAccountType();

        expect(result).toBe('public');
        // replaceState should NOT be called for invalid account_type values
        expect(window.history.replaceState).not.toHaveBeenCalled();
    });
});

describe('getSocketURL', () => {
    let originalLocation: Location, originalLocalStorage: Storage;

    beforeEach(() => {
        originalLocation = window.location;
        originalLocalStorage = window.localStorage;

        Object.defineProperty(window, 'localStorage', {
            value: createLocalStorageMock(),
            writable: true,
        });

        window.history.replaceState = jest.fn();
    });

    afterEach(() => {
        Object.defineProperty(window, 'location', {
            value: originalLocation,
            writable: true,
        });
        Object.defineProperty(window, 'localStorage', {
            value: originalLocalStorage,
            writable: true,
        });
        jest.clearAllMocks();
    });

    it('should return server URL for staging environment', () => {
        mockGetWebSocketURL.mockReturnValue('staging-core.api.deriv.com/options/v1/ws');
        mockLocation(originalLocation, {
            hostname: 'staging-dtrader.deriv.com',
            search: '?account_type=demo',
            href: 'https://staging-dtrader.deriv.com?account_type=demo',
        });

        const result = getSocketURL();

        expect(result).toBe('staging-core.api.deriv.com/options/v1/ws');
        expect(mockGetWebSocketURL).toHaveBeenCalled();
    });

    it('should return server URL for staging with real account', () => {
        mockGetWebSocketURL.mockReturnValue('staging-core.api.deriv.com/options/v1/ws');
        mockLocation(originalLocation, {
            hostname: 'staging-dtrader.deriv.com',
            search: '?account_type=real',
            href: 'https://staging-dtrader.deriv.com?account_type=real',
        });

        const result = getSocketURL();

        expect(result).toBe('staging-core.api.deriv.com/options/v1/ws');
        expect(mockGetWebSocketURL).toHaveBeenCalled();
    });

    it('should return server URL for staging with missing account_type', () => {
        mockGetWebSocketURL.mockReturnValue('staging-core.api.deriv.com/options/v1/ws');
        mockLocation(originalLocation, {
            hostname: 'staging-dtrader.deriv.com',
            search: '',
            href: 'https://staging-dtrader.deriv.com',
        });

        const result = getSocketURL();

        expect(result).toBe('staging-core.api.deriv.com/options/v1/ws');
        expect(mockGetWebSocketURL).toHaveBeenCalled();
    });

    it('should return server URL for staging with invalid account_type', () => {
        mockGetWebSocketURL.mockReturnValue('staging-core.api.deriv.com/options/v1/ws');
        mockLocation(originalLocation, {
            hostname: 'staging-dtrader.deriv.com',
            search: '?account_type=invalid',
            href: 'https://staging-dtrader.deriv.com?account_type=invalid',
        });

        const result = getSocketURL();

        expect(result).toBe('staging-core.api.deriv.com/options/v1/ws');
        expect(mockGetWebSocketURL).toHaveBeenCalled();
    });

    it('should return server URL for production with demo account', () => {
        mockGetWebSocketURL.mockReturnValue('core.api.deriv.com/options/v1/ws');
        mockLocation(originalLocation, {
            hostname: 'dtrader.deriv.com',
            search: '?account_type=demo',
            href: 'https://dtrader.deriv.com?account_type=demo',
        });

        const result = getSocketURL();

        expect(result).toBe('core.api.deriv.com/options/v1/ws');
        expect(mockGetWebSocketURL).toHaveBeenCalled();
    });

    it('should return server URL for production with real account', () => {
        mockGetWebSocketURL.mockReturnValue('core.api.deriv.com/options/v1/ws');
        mockLocation(originalLocation, {
            hostname: 'dtrader.deriv.com',
            search: '?account_type=real',
            href: 'https://dtrader.deriv.com?account_type=real',
        });

        const result = getSocketURL();

        expect(result).toBe('core.api.deriv.com/options/v1/ws');
        expect(mockGetWebSocketURL).toHaveBeenCalled();
    });

    it('should return localStorage value when config.server_url is set', () => {
        window.localStorage.setItem('config.server_url', 'custom.server.com');
        mockLocation(originalLocation, {
            hostname: 'staging-dtrader.deriv.com',
            search: '?account_type=real',
            href: 'https://staging-dtrader.deriv.com?account_type=real',
        });

        const result = getSocketURL();

        expect(result).toBe('custom.server.com');
    });

    it('should ignore and remove invalid localStorage server URL', () => {
        mockGetWebSocketURL.mockReturnValue('staging-core.api.deriv.com/options/v1/ws');
        window.localStorage.setItem('config.server_url', 'https://malicious.com');
        mockLocation(originalLocation, {
            hostname: 'staging-dtrader.deriv.com',
            search: '?account_type=demo',
            href: 'https://staging-dtrader.deriv.com?account_type=demo',
        });

        const result = getSocketURL();

        expect(result).toBe('staging-core.api.deriv.com/options/v1/ws');
        expect(window.localStorage.getItem('config.server_url')).toBeNull();
        expect(mockGetWebSocketURL).toHaveBeenCalled();
    });

    it('should ignore and remove invalid localStorage server URL without TLD', () => {
        mockGetWebSocketURL.mockReturnValue('staging-core.api.deriv.com/options/v1/ws');
        window.localStorage.setItem('config.server_url', 'localhost');
        mockLocation(originalLocation, {
            hostname: 'staging-dtrader.deriv.com',
            search: '?account_type=real',
            href: 'https://staging-dtrader.deriv.com?account_type=real',
        });

        const result = getSocketURL();

        expect(result).toBe('staging-core.api.deriv.com/options/v1/ws');
        expect(window.localStorage.getItem('config.server_url')).toBeNull();
        expect(mockGetWebSocketURL).toHaveBeenCalled();
    });

    it('should return server URL on dtrader.deriv.be', () => {
        mockGetWebSocketURL.mockReturnValue('api-core.deriv.be/options/v1/ws');
        mockLocation(originalLocation, {
            hostname: 'dtrader.deriv.be',
            search: '',
            href: 'https://dtrader.deriv.be',
        });

        const result = getSocketURL();

        expect(result).toBe('api-core.deriv.be/options/v1/ws');
        expect(mockGetWebSocketURL).toHaveBeenCalled();
    });

    it('should return server URL on dtrader.deriv.me', () => {
        mockGetWebSocketURL.mockReturnValue('api-core.deriv.me/options/v1/ws');
        mockLocation(originalLocation, {
            hostname: 'dtrader.deriv.me',
            search: '',
            href: 'https://dtrader.deriv.me',
        });

        const result = getSocketURL();

        expect(result).toBe('api-core.deriv.me/options/v1/ws');
        expect(mockGetWebSocketURL).toHaveBeenCalled();
    });

    it('should return server URL on staging-dtrader.deriv.be', () => {
        mockGetWebSocketURL.mockReturnValue('staging-api-core.deriv.be/options/v1/ws');
        mockLocation(originalLocation, {
            hostname: 'staging-dtrader.deriv.be',
            search: '',
            href: 'https://staging-dtrader.deriv.be',
        });

        const result = getSocketURL();

        expect(result).toBe('staging-api-core.deriv.be/options/v1/ws');
        expect(mockGetWebSocketURL).toHaveBeenCalled();
    });
});
