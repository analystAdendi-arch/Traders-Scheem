/**
 * Hand our session to the framed trader.
 *
 * public/trader is our own build of Deriv's trader, served from /trader on this
 * domain. Being first-party it shares this origin's localStorage, so it can
 * pick the session up from storage rather than showing its own login screen -
 * but it looks for the key names Deriv's app writes (client.accounts,
 * config.tokens, config.account1, active_loginid) while we keep ours under
 * accountsList and clientAccounts. This mirrors what we already hold into the
 * names it reads.
 *
 * Nothing leaves this origin, and no token goes anywhere near a URL: both sides
 * are localStorage on the same domain.
 */

type StoredAccount = { currency?: string; is_virtual?: number | boolean; balance?: number };

const readJSON = <T>(key: string): T | null => {
    try {
        return JSON.parse(localStorage.getItem(key) ?? 'null') as T | null;
    } catch {
        return null;
    }
};

/**
 * @returns true when a session was found and mirrored, false when there is
 * nothing to hand over (logged out) - in which case the frame shows its own
 * login, which is the correct outcome.
 */
export const syncTraderSession = (active_loginid: string) => {
    const tokens = readJSON<Record<string, string>>('accountsList') ?? {};
    const details = readJSON<Record<string, StoredAccount>>('clientAccounts') ?? {};

    // The trader boots on acct1, so the account selected here has to come first.
    const ordered = [active_loginid, ...Object.keys(tokens).filter(id => id !== active_loginid)].filter(
        id => id && tokens[id]
    );
    if (!ordered.length) return false;

    const accounts: Record<string, unknown> = {};
    const config_tokens: Record<string, string> = {};

    ordered.forEach((loginid, index) => {
        const detail = details[loginid] ?? {};
        const currency = detail.currency ?? '';

        accounts[loginid] = {
            loginid,
            token: tokens[loginid],
            currency,
            is_virtual: detail.is_virtual ? 1 : 0,
            balance: detail.balance ?? 0,
        };

        const n = index + 1;
        config_tokens[`acct${n}`] = loginid;
        config_tokens[`token${n}`] = tokens[loginid];
        config_tokens[`cur${n}`] = currency;
    });

    localStorage.setItem('client.accounts', JSON.stringify(accounts));
    localStorage.setItem('config.tokens', JSON.stringify(config_tokens));
    localStorage.setItem('config.account1', config_tokens.token1);
    localStorage.setItem('active_loginid', ordered[0]);

    // The same login id under the name the shared storage-keys module uses
    // (client.active_loginid, alongside client.account_list and config.app_id
    // in that module), since parts of the build read it from there instead.
    localStorage.setItem('client.active_loginid', ordered[0]);
    localStorage.setItem(
        'client.account_list',
        JSON.stringify(ordered.map(loginid => ({ loginid, ...(accounts[loginid] as object) })))
    );

    // Which app the tokens belong to: the socket authorises against this, so a
    // mismatch here fails the handshake even with a valid token.
    const app_id = process.env.NEXT_PUBLIC_DERIV_APP_ID;
    if (app_id) localStorage.setItem('config.app_id', app_id);

    return true;
};

/**
 * Drop the mirrored session. Called wherever we clear our own auth storage, so
 * a logout leaves nothing behind for the framed trader to boot from.
 */
export const clearTraderSession = () => {
    localStorage.removeItem('client.accounts');
    localStorage.removeItem('client.active_loginid');
    localStorage.removeItem('client.account_list');
    localStorage.removeItem('config.tokens');
    localStorage.removeItem('config.account1');
    localStorage.removeItem('config.app_id');
};
