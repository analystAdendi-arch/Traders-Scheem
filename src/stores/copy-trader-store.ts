/**
 * Copy trading on the Deriv Options API.
 *
 * The legacy copy_start / copy_stop calls do not exist on the Options API, so
 * copying is done the documented way:
 *   - Every buy on the logged-in account is read from the `transaction` stream,
 *     and its parameters from `proposal_open_contract`.
 *   - Clients: the same contract is bought for every active client through
 *     POST /trading/v1/options/contracts/bulk-purchase/{real|demo}, authorised
 *     by each client's Personal Access Token (trade scope) + account id and the
 *     app's Deriv-App-ID header.
 *   - Demo -> Real: the same contract is bought on the user's own Real account
 *     over a second WebSocket opened with an OTP for that account.
 */
import { action, makeObservable, observable, runInAction } from 'mobx';

import { isProduction } from '@/components/shared';
import { api_base } from '@/external/bot-skeleton';
import { getAuthInfo } from '@/external/deriv-core';
import { DerivSocket } from '@/services/deriv-socket';
import { DerivWSAccountsService } from '@/services/derivws-accounts.service';
import { isDemoAccount } from '@/utils/account-helpers';

import brandConfig from '../../brand.config.json';
import RootStore from './root-store';

export type TAccountType = 'demo' | 'real';

export type TClientAccount = {
    account_id: string;
    account_type: TAccountType;
    currency: string;
    balance: string;
};

export type TClientTokenState = {
    token: string;
    addedAt: number;
    status: 'checking' | 'ready' | 'active' | 'error';
    accounts: TClientAccount[];
    account_id: string | null;
    errorMessage?: string;
};

export type TCopyLog = {
    id: string;
    time: number;
    target: 'clients' | 'real';
    contract: string;
    stake: number;
    currency: string;
    result: 'ok' | 'partial' | 'failed' | 'skipped';
    detail: string;
};

export type TCopyTraderError = {
    code?: string;
    message: string;
    timestamp: number;
    token?: string;
};

export type TStakeMode = 'same' | 'fixed';

type TContractParams = {
    contract_type: string;
    underlying_symbol: string;
    duration: number;
    duration_unit: 't' | 's';
    currency: string;
    barrier?: string;
    label: string;
};

const MAX_CLIENTS = 100; // Bulk Purchase accepts up to 100 accounts per request.
const MAX_LOGS = 100;
const COPYABLE = ['DIGITEVEN', 'DIGITODD', 'DIGITOVER', 'DIGITUNDER', 'DIGITMATCH', 'DIGITDIFF', 'CALL', 'PUT'];
const NEEDS_BARRIER = ['DIGITOVER', 'DIGITUNDER', 'DIGITMATCH', 'DIGITDIFF'];

export const maskToken = (token: string): string => {
    if (!token || token.length < 8) return token ?? '';
    return `${token.slice(0, 4)}****${token.slice(-4)}`;
};

const derivwsBase = () => brandConfig.platform.derivws.url[isProduction() ? 'production' : 'staging'];
const appId = () => process.env.NEXT_PUBLIC_DERIV_APP_ID ?? '';

/** Rebuilds the parameters of a bought contract from proposal_open_contract. */
const toContractParams = (poc: any): TContractParams | null => {
    const contract_type = String(poc?.contract_type ?? '');
    if (!COPYABLE.includes(contract_type)) return null;
    const underlying_symbol = String(poc.underlying_symbol ?? poc.underlying ?? '');
    const shortcode = String(poc.shortcode ?? '');

    let duration = 0;
    let duration_unit: 't' | 's' = 't';
    const tick_match = shortcode.match(/_(\d+)T(?:_|$)/i);
    if (Number(poc.tick_count) > 0) duration = Number(poc.tick_count);
    else if (tick_match) duration = Number(tick_match[1]);
    else if (poc.date_expiry && poc.date_start) {
        duration = Number(poc.date_expiry) - Number(poc.date_start);
        duration_unit = 's';
    }
    if (!underlying_symbol || !(duration > 0)) return null;

    let barrier: string | undefined;
    if (NEEDS_BARRIER.includes(contract_type)) {
        const raw = poc.barrier ?? shortcode.match(/_\d+T_(\d)(?:_|$)/i)?.[1];
        if (raw === undefined || raw === null || raw === '') return null;
        barrier = String(raw);
    }

    return {
        contract_type,
        underlying_symbol,
        duration,
        duration_unit,
        currency: String(poc.currency ?? 'USD'),
        barrier,
        label: `${contract_type}${barrier !== undefined ? ` ${barrier}` : ''} on ${underlying_symbol} (${duration}${duration_unit})`,
    };
};

export default class CopyTraderStore {
    root_store: RootStore;

    newTokenInput = '';
    clientTokens: TClientTokenState[] = [];

    isCopying = false;
    isSyncing = false;

    isDemoToRealRunning = false;
    isDemoToRealStarting = false;
    demoToRealStatus = '';
    realAccountId: string | null = null;

    stakeMode: TStakeMode = 'same';
    fixedStake = 0.5;

    logs: TCopyLog[] = [];
    errors: TCopyTraderError[] = [];

    private realSocket: DerivSocket | null = null;
    private realCurrency = 'USD';
    private streamSub: { unsubscribe: () => void } | null = null;
    private streamId: string | null = null;
    private seenContracts = new Set<string>();

    constructor(root_store: RootStore) {
        makeObservable(this, {
            newTokenInput: observable,
            clientTokens: observable,
            isCopying: observable,
            isSyncing: observable,
            isDemoToRealRunning: observable,
            isDemoToRealStarting: observable,
            demoToRealStatus: observable,
            realAccountId: observable,
            stakeMode: observable,
            fixedStake: observable,
            logs: observable,
            errors: observable,
            setNewTokenInput: action,
            addClientToken: action,
            setClientAccount: action,
            removeClientToken: action,
            clearClientTokens: action,
            setStakeMode: action,
            setFixedStake: action,
            pushError: action,
            clearLogs: action,
        });
        this.root_store = root_store;
    }

    get activeClientCount() {
        return this.clientTokens.filter(c => c.status === 'active').length;
    }

    /* ------------------------------------------------------------ settings */

    setNewTokenInput(value: string) {
        this.newTokenInput = value ?? '';
    }

    setStakeMode(mode: TStakeMode) {
        this.stakeMode = mode;
    }

    setFixedStake(value: number) {
        this.fixedStake = Number.isFinite(value) ? Math.max(0.35, value) : 0.5;
    }

    pushError(message: string, code?: string, token?: string) {
        this.errors.unshift({ code, message, timestamp: Date.now(), token });
        if (this.errors.length > 25) this.errors.length = 25;
    }

    clearLogs() {
        this.logs = [];
    }

    private addLog(entry: Omit<TCopyLog, 'id' | 'time'>) {
        runInAction(() => {
            this.logs.unshift({ ...entry, id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, time: Date.now() });
            if (this.logs.length > MAX_LOGS) this.logs.length = MAX_LOGS;
        });
    }

    private masterIsDemo() {
        const loginid = localStorage.getItem('active_loginid') ?? '';
        return isDemoAccount(loginid);
    }

    /* ------------------------------------------------------------- clients */

    /** Looks up the accounts a client's PAT can trade on (validates the token too). */
    private async fetchClientAccounts(token: string): Promise<TClientAccount[]> {
        const response = await fetch(`${derivwsBase()}options/accounts`, {
            method: 'GET',
            headers: { Authorization: `Bearer ${token}`, 'Deriv-App-ID': appId() },
        });
        if (response.status === 401 || response.status === 403) {
            throw new Error('Token rejected - it must be a valid Personal Access Token with the trade scope.');
        }
        if (!response.ok) throw new Error(`Could not verify token (${response.status}).`);
        const body = await response.json();
        const list: any[] = body?.data ?? [];
        return list.map(account => ({
            account_id: String(account.account_id),
            account_type:
                account.account_type === 'demo' || isDemoAccount(String(account.account_id)) ? 'demo' : 'real',
            currency: String(account.currency ?? ''),
            balance: String(account.balance ?? ''),
        }));
    }

    private async verifyClient(token: string) {
        try {
            const accounts = await this.fetchClientAccounts(token);
            runInAction(() => {
                const client = this.clientTokens.find(c => c.token === token);
                if (!client) return;
                const preferred = this.masterIsDemo() ? 'demo' : 'real';
                const pick = accounts.find(a => a.account_type === preferred) ?? accounts[0] ?? null;
                client.accounts = accounts;
                client.account_id = client.account_id && accounts.some(a => a.account_id === client.account_id)
                    ? client.account_id
                    : pick?.account_id ?? null;
                client.status = accounts.length ? (this.isCopying ? 'active' : 'ready') : 'error';
                client.errorMessage = accounts.length ? undefined : 'No trading accounts found for this token.';
            });
        } catch (error) {
            runInAction(() => {
                const client = this.clientTokens.find(c => c.token === token);
                if (!client) return;
                client.status = 'error';
                client.errorMessage = error instanceof Error ? error.message : 'Token check failed.';
            });
        }
    }

    addClientToken(token?: string): { ok: boolean; message?: string } {
        const raw = (token ?? this.newTokenInput ?? '').trim();
        if (!raw) return { ok: false, message: 'Token cannot be empty.' };
        if (!/^[A-Za-z0-9._~+/=-]{8,512}$/.test(raw)) return { ok: false, message: 'That does not look like an API token.' };
        if (this.clientTokens.some(c => c.token === raw)) return { ok: false, message: 'This client token is already added.' };
        if (this.clientTokens.length >= MAX_CLIENTS) {
            return { ok: false, message: `You can add up to ${MAX_CLIENTS} clients.` };
        }
        this.clientTokens.push({ token: raw, addedAt: Date.now(), status: 'checking', accounts: [], account_id: null });
        this.newTokenInput = '';
        void this.verifyClient(raw);
        return { ok: true };
    }

    setClientAccount(token: string, account_id: string) {
        const client = this.clientTokens.find(c => c.token === token);
        if (client) client.account_id = account_id;
    }

    removeClientToken(token: string) {
        this.clientTokens = this.clientTokens.filter(c => c.token !== token);
        if (this.isCopying && !this.clientTokens.some(c => c.status === 'active')) void this.stopAllCopying();
    }

    clearClientTokens() {
        this.clientTokens = [];
        if (this.isCopying) void this.stopAllCopying();
    }

    async syncClientStates() {
        runInAction(() => {
            this.isSyncing = true;
        });
        await Promise.all(this.clientTokens.map(c => this.verifyClient(c.token)));
        runInAction(() => {
            this.isSyncing = false;
        });
    }

    startAllCopying = async () => {
        if (!api_base.api || !(api_base as any).is_authorized) {
            this.pushError('Log in first - copying mirrors the trades placed on your logged-in account.', 'NotLoggedIn');
            return false;
        }
        const ready = this.clientTokens.filter(c => c.status === 'ready' && c.account_id);
        if (!ready.length) {
            this.pushError('Add at least one verified client token before starting.', 'NoClients');
            return false;
        }
        runInAction(() => {
            ready.forEach(c => {
                c.status = 'active';
            });
            this.isCopying = true;
        });
        await this.ensureMasterStream();
        this.addLog({
            target: 'clients',
            contract: '-',
            stake: 0,
            currency: '',
            result: 'ok',
            detail: `Copying started for ${ready.length} client(s). Waiting for your next trade...`,
        });
        return true;
    };

    stopAllCopying = async () => {
        runInAction(() => {
            this.clientTokens.forEach(c => {
                if (c.status === 'active') c.status = 'ready';
            });
            this.isCopying = false;
        });
        this.maybeStopMasterStream();
        return true;
    };

    /* ----------------------------------------------------------- demo->real */

    startDemoToReal = async () => {
        if (this.isDemoToRealRunning || this.isDemoToRealStarting) return;
        const set = (status: string) => runInAction(() => (this.demoToRealStatus = status));

        if (!this.masterIsDemo()) {
            set('Switch to your Demo account first - its trades are copied to Real.');
            return;
        }
        const access_token = getAuthInfo()?.access_token;
        if (!access_token) {
            set('Log in first.');
            return;
        }

        runInAction(() => (this.isDemoToRealStarting = true));
        try {
            set('Finding your Real account...');
            const accounts =
                DerivWSAccountsService.getStoredAccounts() ?? (await DerivWSAccountsService.fetchAccountsList(access_token));
            const real = accounts?.find(a => a.account_type === 'real' || !isDemoAccount(a.account_id));
            if (!real) throw new Error('No Real account found on this login.');

            set(`Connecting to Real account ${real.account_id}...`);
            const url = await DerivWSAccountsService.fetchOTPWebSocketURL(access_token, real.account_id);
            this.realSocket = await DerivSocket.open(url);
            this.realCurrency = real.currency || 'USD';

            await this.ensureMasterStream();
            runInAction(() => {
                this.realAccountId = real.account_id;
                this.isDemoToRealRunning = true;
            });
            set(`Copying Demo trades to Real account ${real.account_id}.`);
        } catch (error) {
            this.realSocket?.close();
            this.realSocket = null;
            set(`Could not start: ${error instanceof Error ? error.message : 'unknown error'}`);
        } finally {
            runInAction(() => (this.isDemoToRealStarting = false));
        }
    };

    stopDemoToReal = () => {
        this.realSocket?.close();
        this.realSocket = null;
        runInAction(() => {
            this.isDemoToRealRunning = false;
            this.realAccountId = null;
            this.demoToRealStatus = 'Demo to Real copying stopped.';
        });
        this.maybeStopMasterStream();
    };

    /* ------------------------------------------------------ master stream */

    private async ensureMasterStream() {
        if (this.streamSub) return;
        const api: any = api_base.api;
        if (!api) return;
        this.streamSub = api.onMessage().subscribe(({ data }: any) => {
            if (data?.msg_type !== 'transaction') return;
            if (data.subscription?.id) this.streamId = data.subscription.id;
            const tx = data.transaction;
            if (tx?.action !== 'buy' || !tx.contract_id) return;
            const key = String(tx.contract_id);
            if (this.seenContracts.has(key)) return;
            this.seenContracts.add(key);
            void this.onMasterBuy(Number(tx.contract_id));
        });
        try {
            const response = await api.send({ transaction: 1, subscribe: 1 });
            if (response?.subscription?.id) this.streamId = response.subscription.id;
        } catch (error: any) {
            this.pushError(error?.error?.message ?? 'Could not subscribe to your trades.', 'StreamFailed');
        }
    }

    private maybeStopMasterStream() {
        if (this.isCopying || this.isDemoToRealRunning) return;
        this.streamSub?.unsubscribe();
        this.streamSub = null;
        if (this.streamId) (api_base.api as any)?.forget(this.streamId).catch?.(() => undefined);
        this.streamId = null;
    }

    private async onMasterBuy(contract_id: number) {
        let poc: any;
        try {
            const response = await (api_base.api as any).send({ proposal_open_contract: 1, contract_id });
            poc = response?.proposal_open_contract;
        } catch (error: any) {
            this.pushError(error?.error?.message ?? 'Could not read the trade to copy.', 'ReadFailed');
            return;
        }
        const params = toContractParams(poc);
        if (!params) {
            this.addLog({
                target: 'clients',
                contract: String(poc?.contract_type ?? 'unknown'),
                stake: 0,
                currency: '',
                result: 'skipped',
                detail: 'This contract type cannot be copied (digits and rise/fall only).',
            });
            return;
        }
        const stake = this.stakeMode === 'same' ? Number(poc.buy_price ?? this.fixedStake) : this.fixedStake;

        await Promise.all([
            this.isDemoToRealRunning ? this.copyToReal(params, stake) : Promise.resolve(),
            this.isCopying ? this.copyToClients(params, stake) : Promise.resolve(),
        ]);
    }

    private async copyToReal(params: TContractParams, stake: number) {
        const socket = this.realSocket;
        if (!socket?.isOpen) {
            this.addLog({ target: 'real', contract: params.label, stake, currency: this.realCurrency, result: 'failed', detail: 'Real account connection is closed.' });
            return;
        }
        try {
            const proposal = await socket.send({
                proposal: 1,
                amount: stake,
                basis: 'stake',
                contract_type: params.contract_type,
                currency: this.realCurrency,
                duration: params.duration,
                duration_unit: params.duration_unit,
                underlying_symbol: params.underlying_symbol,
                ...(params.barrier !== undefined ? { barrier: params.barrier } : {}),
            });
            const bought = await socket.send({
                buy: proposal.proposal.id,
                price: Number(proposal.proposal.ask_price ?? stake),
            });
            this.addLog({
                target: 'real',
                contract: params.label,
                stake,
                currency: this.realCurrency,
                result: 'ok',
                detail: `Bought on Real (contract ${bought?.buy?.contract_id ?? '?'}).`,
            });
        } catch (error) {
            this.addLog({
                target: 'real',
                contract: params.label,
                stake,
                currency: this.realCurrency,
                result: 'failed',
                detail: error instanceof Error ? error.message : 'Real purchase failed.',
            });
        }
    }

    private async copyToClients(params: TContractParams, stake: number) {
        const active = this.clientTokens.filter(c => c.status === 'active' && c.account_id);
        const groups: Record<TAccountType, { token: string; account_id: string }[]> = { demo: [], real: [] };
        active.forEach(client => {
            const account = client.accounts.find(a => a.account_id === client.account_id);
            const type: TAccountType = account?.account_type ?? (isDemoAccount(client.account_id ?? '') ? 'demo' : 'real');
            groups[type].push({ token: client.token, account_id: client.account_id as string });
        });

        const contract_parameters = {
            contract_type: params.contract_type,
            underlying_symbol: params.underlying_symbol,
            amount: stake,
            basis: 'stake',
            currency: params.currency,
            duration: params.duration,
            duration_unit: params.duration_unit,
            ...(params.barrier !== undefined ? { barrier: params.barrier } : {}),
        };

        for (const type of ['real', 'demo'] as TAccountType[]) {
            const accounts = groups[type];
            if (!accounts.length) continue;
            try {
                const response = await fetch(`${derivwsBase()}options/contracts/bulk-purchase/${type}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Deriv-App-ID': appId() },
                    body: JSON.stringify({ contract_parameters, accounts }),
                });
                const body = await response.json().catch(() => null);
                if (!response.ok) {
                    throw new Error(body?.errors?.[0]?.message ?? body?.message ?? `Bulk purchase failed (${response.status}).`);
                }
                const results: any[] = body?.data?.results ?? body?.data ?? body?.results ?? [];
                const failed = Array.isArray(results) ? results.filter(r => r?.error || r?.status === 'error').length : 0;
                const ok = Array.isArray(results) && results.length ? results.length - failed : accounts.length;
                this.addLog({
                    target: 'clients',
                    contract: params.label,
                    stake,
                    currency: params.currency,
                    result: failed === 0 ? 'ok' : ok > 0 ? 'partial' : 'failed',
                    detail: `${type === 'real' ? 'Real' : 'Demo'} clients: ${ok} bought, ${failed} failed.`,
                });
            } catch (error) {
                this.addLog({
                    target: 'clients',
                    contract: params.label,
                    stake,
                    currency: params.currency,
                    result: 'failed',
                    detail: `${type === 'real' ? 'Real' : 'Demo'} clients: ${error instanceof Error ? error.message : 'request failed'}`,
                });
            }
        }
    }

    reset() {
        void this.stopAllCopying();
        this.stopDemoToReal();
        this.clientTokens = [];
        this.logs = [];
        this.errors = [];
    }

    dispose() {
        this.reset();
    }
}
