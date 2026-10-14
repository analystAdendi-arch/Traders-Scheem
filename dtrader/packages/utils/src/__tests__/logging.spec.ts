import { logError } from '../logging';

describe('logError', () => {
    it('should log message and data to console.error', () => {
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
        logError('test error', { foo: 'bar' });
        expect(consoleSpy).toHaveBeenCalledWith('test error', { foo: 'bar' });
        consoleSpy.mockRestore();
    });

    it('should handle empty data object', () => {
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
        logError('test error without data');
        expect(consoleSpy).toHaveBeenCalledWith('test error without data', {});
        consoleSpy.mockRestore();
    });
});
