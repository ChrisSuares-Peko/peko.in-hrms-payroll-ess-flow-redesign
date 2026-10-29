jest.mock('../../utils/ctrlPay/client', () => ({
    ...jest.requireActual('../../utils/ctrlPay/client'),
    createCtrlPaySession: jest.fn(),
}));
jest.mock('../../utils/cacheDataMethods', () => ({ client: {}, getValue: jest.fn(), setValue: jest.fn(), deleteValue: jest.fn() }));
jest.mock('../../models/use-cases/ctrlPayConnection', () => ({}));

const { CTRLPAY_MESSAGES } = require('../../constants/ctrlPay');
const { createCtrlPaySession } = require('../../utils/ctrlPay/client');
const wallet = require('../ctrlPayWallet');

const user = { id: 501, corporateId: 77, name: 'Milind Kumar' };

const reply = (httpStatus, payload) => ({ httpStatus, payload });

const row = (overrides) => ({
    name: 'CTRL0001',
    transaction_id: 'CTRL0001',
    transaction_status: 'TRANSACTION_SUCCESS',
    creation: '2026-10-12 11:42:07.512345',
    transaction_type: 'Redeeming Transaction',
    transaction_method: 'UPI',
    amount_in_paise: '100000',
    balance_after_transaction_in_paise: '900000',
    payee_name: 'Swiggy',
    ...overrides,
});

const page = (rows, total = rows.length) => reply(200, { status: 'SUCCESS', data: rows, total_count: total });

const sessionRouting = (routes, connection = { corporateId: 77, walletLiveAt: '2026-08-05T10:00:00.000Z' }) => {
    const call = jest.fn((method, params) => {
        const handler = routes[method];
        if (!handler) throw new Error(`unexpected ${method}`);
        return Promise.resolve(typeof handler === 'function' ? handler(params) : handler);
    });
    createCtrlPaySession.mockResolvedValue({ call, connection, config: { tokenKey: Buffer.alloc(32) } });
    return call;
};

beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers({ now: new Date('2026-10-20T06:00:00.000Z'), doNotFake: ['setTimeout', 'nextTick', 'setImmediate'] });
});

afterEach(() => {
    jest.useRealTimers();
});

describe('CTRLPay wallet overview', () => {
    it('combines balance, limits, UPI ID, loads and whitelisted accounts', async () => {
        sessionRouting({
            'spending_transaction.get_account_balance': reply(200, {
                status: 'SUCCESS',
                balance_in_paise: 8565000,
                non_registered_beneficiary_daily_amount_limit: 3865000,
                non_registered_beneficiary_daily_count_limit: 21,
                registered_beneficiary_daily_amount_limit: 10000000,
                registered_beneficiary_daily_count_limit: 50,
            }),
            'onboarding.get_vpa': reply(200, 'vanta.logistics@ctrlpay'),
            'whitelist_bank_accounts.get_whitelisted_sender_bank_accounts': reply(200, {
                status: 'SUCCESS',
                accounts: [{ account_name: 'VANTA', account_no: '123456789012', ifsc: 'UTIB0000123' }],
            }),
            'transaction.get_all_ctrl_pay_transaction': (params) => {
                expect(params).toMatchObject({
                    limit_page_length: -1,
                    transaction_type: 'Loading Transaction',
                    transaction_status: 'TRANSACTION_SUCCESS',
                });
                return page([
                    row({ name: 'L2', transaction_type: 'Loading Transaction', creation: '2026-10-19 09:00:00', amount_in_paise: '1500000', transaction_method: 'Load via UPI' }),
                    row({ name: 'L1', transaction_type: 'Loading Transaction', creation: '2026-09-30 23:59:00', amount_in_paise: '10000000' }),
                ]);
            },
        });

        expect(await wallet.getOverview({ user })).toEqual({
            balance: 85650,
            dailyLimits: {
                newPayees: { amountLeft: 38650, countLeft: 21 },
                savedPayees: { amountLeft: 100000, countLeft: 50 },
            },
            vpa: 'vanta.logistics@ctrlpay',
            liveSince: '2026-08-05T10:00:00.000Z',
            loadedThisMonth: 15000,
            loadedTotal: 115000,
            loadCount: 2,
            lastLoad: { amount: 15000, methodLabel: 'Load via UPI', createdAt: '2026-10-19T03:30:00.000Z' },
            whitelistedAccountCount: 1,
        });
    });

    it('says the wallet is not ready while the balance does not exist yet', async () => {
        sessionRouting({
            'spending_transaction.get_account_balance': reply(404, { status: 'ERROR', message: 'Wallet balance not found for a@b.c' }),
            'onboarding.get_vpa': reply(200, null),
            'whitelist_bank_accounts.get_whitelisted_sender_bank_accounts': reply(200, { status: 'ERROR', message: 'Please whitelist bank accounts.' }),
            'transaction.get_all_ctrl_pay_transaction': page([]),
        });

        await expect(wallet.getOverview({ user })).rejects.toMatchObject({
            message: CTRLPAY_MESSAGES.walletNotReady,
            status_code: 409,
        });
    });
});

describe('CTRLPay sender accounts', () => {
    const listed = (accounts) =>
        reply(200, accounts.length ? { status: 'SUCCESS', total_accounts: accounts.length, accounts } : { status: 'ERROR', message: 'Please whitelist bank accounts.' });

    it('treats the empty-list error as no accounts', async () => {
        sessionRouting({ 'whitelist_bank_accounts.get_whitelisted_sender_bank_accounts': listed([]) });

        expect(await wallet.listSenderAccounts({ user })).toEqual([]);
    });

    it('refuses duplicates and a sixth account before calling CTRLPay', async () => {
        const accounts = [1, 2, 3, 4, 5].map((n) => ({ account_name: `A${n}`, account_no: `12345678900${n}`, ifsc: 'UTIB0000123' }));
        const call = sessionRouting({ 'whitelist_bank_accounts.get_whitelisted_sender_bank_accounts': listed(accounts) });

        await expect(
            wallet.addSenderAccount({ user, accountName: 'A1', accountNumber: '123456789001', ifsc: 'UTIB0000123' })
        ).rejects.toMatchObject({ message: CTRLPAY_MESSAGES.senderDuplicate });
        await expect(
            wallet.addSenderAccount({ user, accountName: 'NEW', accountNumber: '999999999999', ifsc: 'UTIB0000123' })
        ).rejects.toMatchObject({ message: CTRLPAY_MESSAGES.senderLimit });
        expect(call).not.toHaveBeenCalledWith('whitelist_bank_accounts.update_whitelisted_sender_bank_accounts', expect.anything());
    });

    it('adds an account and returns the refreshed list', async () => {
        const added = { account_name: 'VANTA', account_no: '123456789012', ifsc: 'UTIB0000123' };
        let current = [];
        const call = sessionRouting({
            'whitelist_bank_accounts.get_whitelisted_sender_bank_accounts': () => listed(current),
            'whitelist_bank_accounts.update_whitelisted_sender_bank_accounts': () => {
                current = [added];
                return reply(200, { status: 'SUCCESS' });
            },
        });

        const result = await wallet.addSenderAccount({
            user,
            accountName: 'VANTA',
            accountNumber: '123456789012',
            ifsc: 'UTIB0000123',
        });

        expect(result).toEqual([{ accountName: 'VANTA', accountNumber: '123456789012', ifsc: 'UTIB0000123' }]);
        expect(call).toHaveBeenCalledWith('whitelist_bank_accounts.update_whitelisted_sender_bank_accounts', {
            accounts: [added],
        });
    });

    it('reports an account that is not on the list', async () => {
        sessionRouting({
            'whitelist_bank_accounts.delete_whitelisted_sender_bank_account': reply(200, { status: 'ERROR', message: 'Account not found.' }),
        });

        await expect(wallet.removeSenderAccount({ user, accountNumber: '111111111' })).rejects.toMatchObject({
            message: CTRLPAY_MESSAGES.senderNotFound,
            status_code: 404,
        });
    });
});

describe('CTRLPay transactions and statements', () => {
    it('pages through the list with the filters in CTRLPay vocabulary', async () => {
        const call = sessionRouting({ 'transaction.get_all_ctrl_pay_transaction': page([row({})], 41) });

        const result = await wallet.listTransactions({
            user,
            filters: { page: 3, pageSize: 10, kind: 'Spend', status: 'Failed', method: 'UPI', from: '2026-10-01', to: '2026-10-31' },
        });

        expect(result.total).toBe(41);
        expect(result.rows[0]).toMatchObject({ id: 'CTRL0001', kind: 'Spend', amount: 1000 });
        expect(call).toHaveBeenCalledWith(
            'transaction.get_all_ctrl_pay_transaction',
            {
                limit_start: 20,
                limit_page_length: 10,
                transaction_type: 'Redeeming Transaction',
                transaction_status: 'TRANSACTION_FAILED',
                transaction_method: 'UPI',
                start_date: '2026-10-01',
                end_date: '2026-10-31',
            },
            { idempotent: true }
        );
    });

    it('searches, then applies the other filters and paging itself', async () => {
        sessionRouting({
            'transaction.search_ctrl_pay_transaction': reply(200, [
                row({ name: 'S1', creation: '2026-10-12 10:00:00' }),
                row({ name: 'S2', creation: '2026-09-12 10:00:00' }),
                row({ name: 'S3', transaction_type: 'Loading Transaction', creation: '2026-10-13 10:00:00' }),
            ]),
        });

        const result = await wallet.listTransactions({
            user,
            filters: { page: 1, pageSize: 10, search: 'swiggy', kind: 'Spend', from: '2026-10-01' },
        });

        expect(result).toMatchObject({ total: 1, rows: [{ id: 'S1' }] });
    });

    it('refuses an export larger than one download can hold', async () => {
        sessionRouting({ 'transaction.get_all_ctrl_pay_transaction': page([row({})], 9000) });

        await expect(wallet.exportTransactions({ user, filters: {} })).rejects.toMatchObject({ status_code: 422 });
    });

    it('builds a statement from the balance before the range and the movements in it', async () => {
        sessionRouting({
            'transaction.get_all_ctrl_pay_transaction': (params) =>
                params.start_date
                    ? page([
                        row({ name: 'D2', amount_in_paise: '250050', transaction_status: 'TRANSACTION_PENDING' }),
                        row({ name: 'F1', amount_in_paise: '99900', transaction_status: 'TRANSACTION_FAILED' }),
                        row({ name: 'L1', transaction_type: 'Loading Transaction', amount_in_paise: '1000000' }),
                        row({ name: 'D1', amount_in_paise: '100000' }),
                    ])
                    : page([
                        row({ name: 'X', transaction_status: 'TRANSACTION_FAILED', balance_after_transaction_in_paise: '1' }),
                        row({ name: 'P', balance_after_transaction_in_paise: '2000000' }),
                    ]),
        });

        const statement = await wallet.getStatement({ user, from: '2026-10-01', to: '2026-10-31' });

        expect(statement).toMatchObject({
            openingBalance: 20000,
            moneyIn: 10000,
            moneyOut: 3500.5,
            closingBalance: 26499.5,
            debitCount: 2,
        });
        expect(statement.rows.map((entry) => entry.id)).toEqual(['D2', 'L1', 'D1']);
    });

    it('refuses a reversed or overlong statement range', async () => {
        await expect(wallet.getStatement({ user, from: '2026-10-31', to: '2026-10-01' })).rejects.toMatchObject({
            message: CTRLPAY_MESSAGES.statementRange,
        });
        await expect(wallet.getStatement({ user, from: '2024-01-01', to: '2026-10-01' })).rejects.toMatchObject({
            status_code: 400,
        });
        expect(createCtrlPaySession).not.toHaveBeenCalled();
    });
});
