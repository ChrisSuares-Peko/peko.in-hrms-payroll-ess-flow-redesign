const { derivePaymentInstrument } = require('../paymentInstrument');

const cashfreePayment = (overrides = {}) => ({
    cf_payment_id: 'cf_1',
    payment_status: 'SUCCESS',
    payment_group: 'upi',
    payment_method: { upi: { channel: 'collect' } },
    ...overrides,
});

const derive = (payload, paymentMode = 'PAYMENT GATEWAY') =>
    derivePaymentInstrument(JSON.stringify(payload), paymentMode);

describe('derivePaymentInstrument', () => {
    describe('Cashfree payments', () => {
        it.each([
            ['upi', 'UPI'],
            ['credit_card', 'Credit Card'],
            ['debit_card', 'Debit Card'],
            ['net_banking', 'Internet Banking'],
            ['wallet', 'Digital Wallet'],
            ['cardless_emi', 'Cardless EMI'],
        ])('labels payment_group %s as %s', (group, label) => {
            expect(derive(cashfreePayment({ payment_group: group }))).toBe(label);
        });

        it('prefers payment_group over the payment_method key, which only says card', () => {
            expect(
                derive(cashfreePayment({ payment_group: 'credit_card', payment_method: { card: {} } }))
            ).toBe('Credit Card');
        });

        it('falls back to the payment_method key when payment_group is missing', () => {
            expect(
                derive(cashfreePayment({ payment_group: undefined, payment_method: { netbanking: {} } }))
            ).toBe('Internet Banking');
        });

        it('shows an unknown instrument code readably instead of dropping it', () => {
            expect(derive(cashfreePayment({ payment_group: 'new_instrument' }))).toBe('New Instrument');
        });

        it('adds the wallet leg of a split payment', () => {
            expect(derive(cashfreePayment(), 'PAYMENT GATEWAY + WALLET')).toBe('UPI + Wallet');
            expect(derive(cashfreePayment({ payment_group: 'debit_card' }), 'PG + WALLET')).toBe(
                'Debit Card + Wallet'
            );
        });

        it('reads the payment webhook shape', () => {
            expect(
                derive({
                    type: 'PAYMENT_SUCCESS_WEBHOOK',
                    data: { payment: { payment_group: 'credit_card', payment_method: { card: {} } } },
                })
            ).toBe('Credit Card');
        });
    });

    describe('wrapped payloads', () => {
        it('reads the successful attempt from a list of attempts', () => {
            expect(
                derive([
                    cashfreePayment({ payment_status: 'FAILED', payment_group: 'debit_card' }),
                    cashfreePayment({ payment_group: 'upi' }),
                ])
            ).toBe('UPI');
        });

        it('unwraps nested arrays', () => {
            expect(derive([[cashfreePayment({ payment_group: 'wallet' })]])).toBe('Digital Wallet');
        });

        it('unwraps a pgResponse object', () => {
            expect(derive({ pgAmount: 110, pgResponse: cashfreePayment({ payment_group: 'debit_card' }) })).toBe(
                'Debit Card'
            );
        });

        it('unwraps a pgResponse array', () => {
            expect(derive({ pgAmount: 110, pgResponse: [cashfreePayment({ payment_group: 'credit_card' })] })).toBe(
                'Credit Card'
            );
        });

        it('reads a list that was spread into numbered keys', () => {
            expect(derive({ 0: cashfreePayment({ payment_group: 'net_banking' }), pgAmount: 812 })).toBe(
                'Internet Banking'
            );
        });

        it('accepts an already-parsed payload', () => {
            expect(derivePaymentInstrument(cashfreePayment(), 'PAYMENT GATEWAY')).toBe('UPI');
        });
    });

    describe('subscriptions', () => {
        it('reads the mandate instrument from an authorisation webhook', () => {
            expect(
                derive([
                    {
                        type: 'SUBSCRIPTION_AUTH_STATUS',
                        data: { payment_type: 'AUTH', authorization_details: { payment_method: 'upi' } },
                        pgAmount: 1,
                    },
                ])
            ).toBe('UPI');
        });

        it('normalises upper-case method codes', () => {
            expect(
                derive([{ data: { authorization_details: { payment_method: 'DEBIT_CARD' } } }])
            ).toBe('Debit Card');
        });

        it('returns null for a renewal charge, which does not carry the instrument', () => {
            expect(
                derive([
                    {
                        type: 'SUBSCRIPTION_PAYMENT_SUCCESS',
                        data: { payment_type: 'CHARGE', authorization_details: null },
                        pgAmount: 999,
                    },
                ])
            ).toBeNull();
        });
    });

    describe('CC Avenue', () => {
        it.each([
            ['OPTNBK', 'Internet Banking'],
            ['OPTCRDC', 'Credit Card'],
            ['OPTDBCRD', 'Debit Card'],
            ['OPTUPI', 'UPI'],
        ])('labels order_option_type %s as %s', (optionType, label) => {
            expect(derive({ order_status: 'Shipped', order_option_type: optionType })).toBe(label);
        });

        it('reads the status response inside pgResponse', () => {
            expect(derive({ pgAmount: 598.82, pgResponse: { order_option_type: 'OPTCRDC' } })).toBe('Credit Card');
        });

        it('falls back to the redirect payment_mode', () => {
            expect(derive({ order_status: 'Success', payment_mode: 'Unified Payments' })).toBe('UPI');
        });

        it('returns null for an option type it does not know rather than guessing', () => {
            expect(derive({ order_status: 'Shipped', order_option_type: 'OPTXYZ' })).toBeNull();
        });
    });

    describe('nothing to derive', () => {
        it.each([
            ['no payload', null],
            ['an empty string', ''],
            ['invalid JSON', '{not json'],
            ['a payload with only the gateway amount', JSON.stringify({ pgAmount: 100 })],
            ['an empty list', '[]'],
        ])('returns null for %s', (_label, payload) => {
            expect(derivePaymentInstrument(payload, 'PAYMENT GATEWAY')).toBeNull();
        });
    });

    it('never returns more than 64 characters', () => {
        const label = derive(cashfreePayment({ payment_group: 'x'.repeat(100) }), 'PAYMENT GATEWAY + WALLET');
        expect(label).toHaveLength(64);
    });
});
