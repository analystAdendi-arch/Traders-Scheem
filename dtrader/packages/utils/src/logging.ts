export type TLogData = Record<string, unknown>;

export const logError = (message: string, data: TLogData = {}): void => {
    // eslint-disable-next-line no-console
    console.error(message, data);
};
