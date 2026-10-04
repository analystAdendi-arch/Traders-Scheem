/**
 * Thin helpers over the site's own Deriv socket (api_base). That socket is opened
 * with the site's OAuth app id and the signed-in account's session, so every quote
 * and every purchase made through here is made under this site's app id.
 *
 * The socket can be replaced on reconnect or account switch; `apiVersion()` lets
 * callers notice and re-open their streams.
 */
import { api_base } from '@/external/bot-skeleton';

type TMessage = Record<string, any>;

export const getApi = (): any => api_base?.api ?? null;

/** Changes whenever api_base swaps in a new socket. */
export const apiVersion = (): unknown => getApi()?.connection ?? null;

export const isReady = () => getApi()?.connection?.readyState === 1;

/** One request, one response; Deriv errors become thrown Errors with the API message. */
export const send = async (request: Record<string, unknown>): Promise<TMessage> => {
    const api = getApi();
    if (!api) throw new Error('Not connected to Deriv yet. Please try again in a moment.');
    try {
        const response: TMessage = await api.send(request);
        if (response?.error) throw response;
        return response;
    } catch (error: any) {
        const message = error?.error?.message || error?.message || 'Request failed';
        const failure = new Error(message) as Error & { code?: string };
        failure.code = error?.error?.code;
        throw failure;
    }
};

/** Every parsed message on the current socket. Returns an unsubscribe function. */
export const onMessage = (handler: (data: TMessage) => void): (() => void) => {
    const api = getApi();
    if (!api) return () => undefined;

    // Prefer deriv-api's message stream; fall back to the raw socket.
    if (typeof api.onMessage === 'function') {
        const subscription = api.onMessage().subscribe(({ data }: { data: TMessage }) => {
            try {
                handler(data);
            } catch {
                /* one bad frame must not stop the stream */
            }
        });
        return () => subscription.unsubscribe();
    }

    const connection: WebSocket | undefined = api.connection;
    const listener = (event: MessageEvent) => {
        try {
            handler(JSON.parse(event.data as string));
        } catch {
            /* ignore */
        }
    };
    connection?.addEventListener('message', listener);
    return () => connection?.removeEventListener('message', listener);
};

export const forget = (id?: string | null) => {
    if (!id) return;
    try {
        getApi()
            ?.send({ forget: id })
            ?.catch?.(() => undefined);
    } catch {
        /* the stream ends with the socket anyway */
    }
};

/**
 * Open a subscription and receive every update for it (the first response included).
 * Updates are matched on msg_type + subscription id, which Deriv repeats on each frame.
 */
export const subscribe = async (
    request: Record<string, unknown>,
    msg_type: string,
    handler: (data: TMessage) => void
): Promise<() => void> => {
    let sub_id: string | null = null;
    let closed = false;
    const early: TMessage[] = [];

    const stop_listening = onMessage(data => {
        if (data?.msg_type !== msg_type || !data?.subscription?.id) return;
        if (!sub_id) {
            early.push(data);
            return;
        }
        if (data.subscription.id === sub_id && !closed) handler(data);
    });

    try {
        const first = await send({ ...request, subscribe: 1 });
        sub_id = first?.subscription?.id ?? null;
        // The first frame may also have reached the message stream already; use those
        // copies if so (they include it), otherwise the response itself.
        const seen = early.filter(d => d.subscription.id === sub_id);
        (seen.length ? seen : [first]).forEach(d => !closed && handler(d));
    } catch (error) {
        stop_listening();
        throw error;
    }

    return () => {
        closed = true;
        stop_listening();
        forget(sub_id);
    };
};
