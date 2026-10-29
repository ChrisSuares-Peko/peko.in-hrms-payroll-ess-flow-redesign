jest.mock('../../../utils/cacheDataMethods', () => ({ client: {}, getValue: jest.fn(), setValue: jest.fn(), deleteValue: jest.fn() }));
jest.mock('../../../services/ctrlPayOnboarding', () => ({ getStatus: jest.fn() }));
jest.mock('../../../services/ctrlPayWallet', () => ({ getOverview: jest.fn() }));

const { CTRLPAY_MESSAGES } = require('../../../constants/ctrlPay');
const onboarding = require('../../../services/ctrlPayOnboarding');
const wallet = require('../../../services/ctrlPayWallet');
const { CtrlPayError } = require('../../../utils/ctrlPay/client');
const { CtrlPayConfigError } = require('../../../utils/ctrlPay/config');
const controller = require('../ctrlPay');
const router = require('../../../routes/API/v1/corporate/ctrlPay');

const invoke = async (handler, req = {}) => {
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();
    await handler({ user: { id: 501, corporateId: 77 }, LogTraceId: 'trace', ...req }, res, next);
    return { res, error: next.mock.calls[0]?.[0] };
};

beforeEach(() => {
    jest.clearAllMocks();
});

describe('CTRLPay controller', () => {
    it('wraps service data in the standard success shape', async () => {
        onboarding.getStatus.mockResolvedValue({ connected: false });

        const { res } = await invoke(controller.getStatus);

        expect(onboarding.getStatus).toHaveBeenCalledWith({ user: { id: 501, corporateId: 77 }, logTraceId: 'trace' });
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            status: true,
            message: 'Success',
            data: { connected: false },
            responseCode: '000',
        });
    });

    it.each([
        ['NOT_CONNECTED', CTRLPAY_MESSAGES.notConnected, 401],
        ['RECONNECT_REQUIRED', CTRLPAY_MESSAGES.reconnectRequired, 401],
        ['UNAVAILABLE', CTRLPAY_MESSAGES.unavailable, 503],
        ['BAD_RESPONSE', CTRLPAY_MESSAGES.generic, 502],
    ])('turns %s into a Peko message', async (kind, message, statusCode) => {
        wallet.getOverview.mockRejectedValue(new CtrlPayError(kind, { method: 'spending_transaction.get_account_balance' }));

        const { error } = await invoke(controller.getWalletOverview);

        expect(error).toMatchObject({ message, status_code: statusCode });
    });

    it('hides configuration and unexpected errors behind the generic message', async () => {
        wallet.getOverview.mockRejectedValue(new CtrlPayConfigError('CTRLPay vendor is missing optional1 (clientId)'));
        expect((await invoke(controller.getWalletOverview)).error).toMatchObject({
            message: CTRLPAY_MESSAGES.generic,
            status_code: 500,
        });

        wallet.getOverview.mockRejectedValue(new TypeError("Cannot read properties of undefined (reading 'x')"));
        expect((await invoke(controller.getWalletOverview)).error.message).toBe(CTRLPAY_MESSAGES.generic);
    });

    it('puts every route behind the owner gate and the service gate', () => {
        const routes = router.stack
            .filter((layer) => layer.route)
            .map((layer) => `${Object.keys(layer.route.methods)[0].toUpperCase()} ${layer.route.path}`);
        const gates = router.stack.filter((layer) => !layer.route).map((layer) => layer.name);

        expect(gates).toHaveLength(2);
        expect(routes).toEqual(
            expect.arrayContaining([
                'POST /auth/start',
                'POST /auth/callback',
                'GET /status',
                'POST /onboarding/pan-search',
                'POST /onboarding/documents',
                'DELETE /onboarding/documents/:fileName',
                'POST /onboarding/submit',
                'GET /wallet/overview',
                'GET /wallet/transactions/export',
                'GET /wallet/statement',
            ])
        );
        expect(routes).toHaveLength(26);
    });
});
