/**
 * Contract-related utility functions
 */

/**
 * Extracts the underlying symbol from a contract shortcode.
 * The shortcode format is typically: "CONTRACT_UNDERLYING_..." where the underlying
 * symbol is the second part after splitting by underscore.
 *
 * @param shortcode - The contract shortcode (format: "CONTRACT_UNDERLYING_...")
 * @returns The underlying symbol extracted from shortcode or null if not found
 *
 * @example
 * // Extract from shortcode
 * getUnderlyingFromShortcode('CALL_1HZ100V_123456') // returns '1HZ100V'
 *
 * // Invalid or missing shortcode
 * getUnderlyingFromShortcode(null) // returns null
 * getUnderlyingFromShortcode('INVALID') // returns null
 */
export const getUnderlyingFromShortcode = (shortcode?: string | null): string | null => {
    if (shortcode) {
        const parts = shortcode.split('_');
        if (parts.length >= 2) {
            return parts[1];
        }
    }
    return null;
};

/**
 * @deprecated Use `underlying || getUnderlyingFromShortcode(shortcode)` pattern instead.
 * This function is kept for backward compatibility but will be removed in future versions.
 *
 * Extracts the effective underlying symbol from contract info.
 * First tries to use the underlying property, then falls back to extracting from shortcode.
 *
 * @param underlying - The underlying symbol from contract info
 * @param shortcode - The contract shortcode (format: "CONTRACT_UNDERLYING_...")
 * @returns The underlying symbol or null if not found
 */
export const getEffectiveUnderlying = (underlying?: string | null, shortcode?: string | null): string | null => {
    // Return underlying if it exists
    if (underlying) {
        return underlying;
    }

    // Fallback: Extract underlying from shortcode if missing
    return getUnderlyingFromShortcode(shortcode);
};
