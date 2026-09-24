/**
 * Bot execution speed, shared by the Run bar toggle and the trade engine.
 *
 *  - normal: Deriv's default - before each purchase the bot waits for a fresh
 *            tick, even when new prices have already arrived.
 *  - fast:   the bot buys as soon as fresh proposals are ready, skipping that
 *            extra tick. It still never re-uses a stale proposal.
 */
export type TExecutionSpeed = 'normal' | 'fast';

const STORAGE_KEY = 'execution-speed';
const listeners = new Set<(speed: TExecutionSpeed) => void>();

const read = (): TExecutionSpeed => {
    try {
        return localStorage.getItem(STORAGE_KEY) === 'fast' ? 'fast' : 'normal';
    } catch {
        return 'normal';
    }
};

let current: TExecutionSpeed = read();

export const getExecutionSpeed = (): TExecutionSpeed => current;

export const setExecutionSpeed = (speed: TExecutionSpeed) => {
    current = speed;
    try {
        localStorage.setItem(STORAGE_KEY, speed);
    } catch {
        /* keeps working for this session */
    }
    listeners.forEach(listener => listener(speed));
};

/** Returns an unsubscribe function, safe to use straight as a React cleanup. */
export const subscribeExecutionSpeed = (listener: (speed: TExecutionSpeed) => void): (() => void) => {
    listeners.add(listener);
    return () => {
        listeners.delete(listener);
    };
};
