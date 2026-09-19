/**
 * Minimal extra Deriv Options WebSocket, used when the app needs a second
 * authenticated connection alongside api_base (e.g. the user's Real account
 * while the main socket is on Demo). Authenticated by the OTP URL returned
 * from POST /trading/v1/options/accounts/{accountId}/otp.
 */
const REQUEST_TIMEOUT_MS = 15000;

export class DerivSocket {
    private ws: WebSocket;
    private reqId = 0;
    private pending = new Map<number, { resolve: (value: any) => void; reject: (error: Error) => void }>();
    private listeners = new Set<(message: any) => void>();

    private constructor(ws: WebSocket) {
        this.ws = ws;
        ws.addEventListener('message', event => {
            let message: any;
            try {
                message = JSON.parse(String(event.data));
            } catch {
                return;
            }
            const waiter = typeof message.req_id === 'number' ? this.pending.get(message.req_id) : undefined;
            if (waiter) {
                this.pending.delete(message.req_id);
                if (message.error) waiter.reject(new Error(message.error.message ?? 'Deriv rejected the request.'));
                else waiter.resolve(message);
            }
            this.listeners.forEach(listener => listener(message));
        });
        ws.addEventListener('close', () => {
            this.pending.forEach(waiter => waiter.reject(new Error('Connection closed.')));
            this.pending.clear();
        });
    }

    static open(url: string): Promise<DerivSocket> {
        return new Promise((resolve, reject) => {
            const ws = new WebSocket(url);
            const timer = setTimeout(() => {
                ws.close();
                reject(new Error('Could not connect to Deriv in time.'));
            }, REQUEST_TIMEOUT_MS);
            ws.addEventListener('open', () => {
                clearTimeout(timer);
                resolve(new DerivSocket(ws));
            });
            ws.addEventListener('error', () => {
                clearTimeout(timer);
                reject(new Error('Could not connect to Deriv.'));
            });
        });
    }

    get isOpen() {
        return this.ws.readyState === WebSocket.OPEN;
    }

    send(request: Record<string, unknown>): Promise<any> {
        if (!this.isOpen) return Promise.reject(new Error('Connection is closed.'));
        const req_id = ++this.reqId;
        return new Promise((resolve, reject) => {
            const timer = setTimeout(() => {
                this.pending.delete(req_id);
                reject(new Error('Deriv did not respond in time.'));
            }, REQUEST_TIMEOUT_MS);
            this.pending.set(req_id, {
                resolve: value => {
                    clearTimeout(timer);
                    resolve(value);
                },
                reject: error => {
                    clearTimeout(timer);
                    reject(error);
                },
            });
            this.ws.send(JSON.stringify({ ...request, req_id }));
        });
    }

    onMessage(listener: (message: any) => void): () => void {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }

    close() {
        try {
            this.ws.close();
        } catch {
            /* already closed */
        }
    }
}
