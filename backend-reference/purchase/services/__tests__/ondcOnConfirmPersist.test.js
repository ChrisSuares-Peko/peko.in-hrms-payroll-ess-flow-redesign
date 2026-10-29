jest.mock('../../models/entities/paymentGatewayOrders', () => ({
  findAll: jest.fn(),
  findOne: jest.fn(),
}));
jest.mock('../../models/entities/cart', () => ({ findOne: jest.fn() }));
jest.mock('../../models/entities/ondc_order', () => ({
  findOne: jest.fn(),
  findAll: jest.fn(),
  update: jest.fn(),
  create: jest.fn(),
}));
jest.mock('../../models/use-cases/ondc_order', () => ({
  createOndcOrder: jest.fn(),
  updateOndcOrderPaymentTotals: jest.fn(),
  findOndcOrdersByPaymentRef: jest.fn().mockResolvedValue([]),
}));
jest.mock('../../models/use-cases/order', () => ({
  findOneOrder: jest.fn(),
  updateOneOrder: jest.fn(),
}));
jest.mock('../../models/use-cases/ondc_seller', () => ({
  findOndcSeller: jest.fn().mockResolvedValue(null),
}));
jest.mock('../../utils/loggerHelper', () => ({ customLog: jest.fn() }));
jest.mock('../ondcEasySplitAfterConfirm', () => ({
  registerCheckout: jest.fn(),
  recordOnConfirmAndMaybeSplit: jest.fn(),
}));
jest.mock('../ondcCheckoutNotify', () => ({
  maybeNotifyOndcCheckoutAndClearCart: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('../../models/use-cases/ondc_checkout_confirm', () => ({
  findCheckoutConfirmSummary: jest.fn(),
}));

const paymentGatewayOrders = require('../../models/entities/paymentGatewayOrders');
const ondcOrders = require('../../models/entities/ondc_order');
const {
  createOndcOrder,
  updateOndcOrderPaymentTotals,
  findOndcOrdersByPaymentRef,
} = require('../../models/use-cases/ondc_order');
const { findOneOrder } = require('../../models/use-cases/order');
const { findCheckoutConfirmSummary } = require('../../models/use-cases/ondc_checkout_confirm');
const { findOndcSeller } = require('../../models/use-cases/ondc_seller');
const { customLog } = require('../../utils/loggerHelper');
const { recordOnConfirmAndMaybeSplit } = require('../ondcEasySplitAfterConfirm');
const { maybeNotifyOndcCheckoutAndClearCart } = require('../ondcCheckoutNotify');
const {
  findPaymentRefByOndcTransactionId,
  resolveCashfreePaymentRef,
  persistAndSettleFromOnConfirm,
} = require('../ondcOnConfirmPersist');

const CASHFREE_REF = '1785921646907';
const ONDC_TXN = 'ondc-seller-txn-abc';

const pgRow = (paymentRefId, groups, extra = {}) => ({
  paymentRefId,
  paymentData: JSON.stringify({
    isOndc: true,
    corporateId: 42,
    userId: 7,
    cartId: 99,
    ondcGroups: groups,
    ...extra,
  }),
});

beforeEach(() => {
  jest.clearAllMocks();
  ondcOrders.findOne.mockResolvedValue(null);
  ondcOrders.update.mockResolvedValue([1]);
  createOndcOrder.mockResolvedValue({});
  recordOnConfirmAndMaybeSplit.mockResolvedValue(undefined);
  findOndcSeller.mockResolvedValue(null);
  findOndcOrdersByPaymentRef.mockResolvedValue([]);
  findOneOrder.mockResolvedValue(undefined);
  findCheckoutConfirmSummary.mockResolvedValue(null);
});

describe('findPaymentRefByOndcTransactionId', () => {
  it('returns null when transactionId is missing', async () => {
    expect(await findPaymentRefByOndcTransactionId(null)).toBeNull();
    expect(paymentGatewayOrders.findAll).not.toHaveBeenCalled();
  });

  it('returns Cashfree paymentRefId when ondcGroups contains the ONDC transactionId', async () => {
    paymentGatewayOrders.findAll.mockResolvedValue([
      pgRow(CASHFREE_REF, [{ transactionId: ONDC_TXN, amount: 100 }]),
    ]);

    await expect(findPaymentRefByOndcTransactionId(ONDC_TXN)).resolves.toBe(CASHFREE_REF);
  });

  it('skips rows that only substring-match and have no matching ondcGroups entry', async () => {
    paymentGatewayOrders.findAll.mockResolvedValue([
      {
        paymentRefId: 'other',
        paymentData: JSON.stringify({
          note: `mentions ${ONDC_TXN} but no groups`,
          ondcGroups: [{ transactionId: 'different' }],
        }),
      },
    ]);

    await expect(findPaymentRefByOndcTransactionId(ONDC_TXN)).resolves.toBeNull();
  });
});

describe('resolveCashfreePaymentRef', () => {
  it('prefers PG lookup over a conflicting BPP payment.params.transaction_id echo', async () => {
    paymentGatewayOrders.findAll.mockResolvedValue([
      pgRow(CASHFREE_REF, [{ transactionId: ONDC_TXN }]),
    ]);

    const paymentRef = await resolveCashfreePaymentRef({
      transactionId: ONDC_TXN,
      order: {
        payment: { params: { transaction_id: 'bpp-junk-3937' } },
      },
      logTraceId: 'trace-1',
    });

    expect(paymentRef).toBe(CASHFREE_REF);
  });

  it('falls back to BPP echo when it maps to a real paymentGatewayOrders row', async () => {
    paymentGatewayOrders.findAll.mockResolvedValue([]);
    paymentGatewayOrders.findOne.mockResolvedValue(
      pgRow(CASHFREE_REF, [{ transactionId: ONDC_TXN }])
    );

    const paymentRef = await resolveCashfreePaymentRef({
      transactionId: ONDC_TXN,
      order: {
        payment: { params: { transaction_id: CASHFREE_REF } },
      },
    });

    expect(paymentRef).toBe(CASHFREE_REF);
  });

  it('returns null when BPP echo does not map to a PG row and PG lookup misses', async () => {
    paymentGatewayOrders.findAll.mockResolvedValue([]);
    paymentGatewayOrders.findOne.mockResolvedValue(null);

    const paymentRef = await resolveCashfreePaymentRef({
      transactionId: ONDC_TXN,
      order: {
        payment: { params: { transaction_id: 'orphan-echo' } },
      },
      logTraceId: 'trace-2',
    });

    expect(paymentRef).toBeNull();
  });
});

describe('persistAndSettleFromOnConfirm', () => {
  const baseOrder = {
    id: 'O-1',
    state: 'Created',
    provider: { id: 'P1', descriptor: { name: 'Acme' } },
    quote: { price: { value: '100', currency: 'INR' }, breakup: [] },
    payment: { params: { transaction_id: 'junk' } },
    items: [],
    fulfillments: [],
  };

  it('does not create an order when Cashfree paymentRef cannot be resolved', async () => {
    paymentGatewayOrders.findAll.mockResolvedValue([]);
    paymentGatewayOrders.findOne.mockResolvedValue(null);

    await persistAndSettleFromOnConfirm({
      transactionId: ONDC_TXN,
      order: baseOrder,
      error: null,
      context: { bpp_id: 'bpp.example.com' },
      logTraceId: 't-block',
    });

    expect(createOndcOrder).not.toHaveBeenCalled();
    expect(recordOnConfirmAndMaybeSplit).not.toHaveBeenCalled();
    expect(customLog).toHaveBeenCalledWith(
      't-block',
      'error',
      expect.objectContaining({ step: 'persist-blocked-no-payment-ref' }),
      'VENDOR'
    );
  });

  it('heals an existing row with junk paymentRef instead of skipping forever', async () => {
    paymentGatewayOrders.findAll.mockResolvedValue([
      pgRow(CASHFREE_REF, [{ transactionId: ONDC_TXN, amount: 100 }]),
    ]);
    paymentGatewayOrders.findOne.mockResolvedValue(
      pgRow(CASHFREE_REF, [{ transactionId: ONDC_TXN, amount: 100 }])
    );
    ondcOrders.findOne.mockResolvedValue({
      id: 1,
      paymentRef: 'junk-old',
      corporateUserId: null,
      subCorporateUserId: null,
    });

    await persistAndSettleFromOnConfirm({
      transactionId: ONDC_TXN,
      order: baseOrder,
      error: null,
      context: { bpp_id: 'bpp.example.com' },
      logTraceId: 't-heal',
    });

    expect(createOndcOrder).not.toHaveBeenCalled();
    expect(ondcOrders.update).toHaveBeenCalledWith(
      expect.objectContaining({
        paymentRef: CASHFREE_REF,
        corporateUserId: 42,
      }),
      expect.objectContaining({
        where: { transactionId: ONDC_TXN },
      })
    );
    expect(maybeNotifyOndcCheckoutAndClearCart).toHaveBeenCalled();
    expect(customLog).toHaveBeenCalledWith(
      't-heal',
      'info',
      expect.objectContaining({ step: 'persist-exists-healed' }),
      'VENDOR'
    );
  });

  it('creates a new order when paymentRef resolves and no row exists', async () => {
    paymentGatewayOrders.findAll.mockResolvedValue([
      pgRow(CASHFREE_REF, [{ transactionId: ONDC_TXN, amount: 100 }]),
    ]);
    paymentGatewayOrders.findOne.mockResolvedValue(
      pgRow(CASHFREE_REF, [{ transactionId: ONDC_TXN, amount: 100 }])
    );
    ondcOrders.findOne.mockResolvedValue(null);

    await persistAndSettleFromOnConfirm({
      transactionId: ONDC_TXN,
      order: baseOrder,
      error: null,
      context: { bpp_id: 'bpp.example.com' },
      logTraceId: 't-create',
    });

    expect(createOndcOrder).toHaveBeenCalledWith(
      expect.objectContaining({
        transactionId: ONDC_TXN,
        paymentRef: CASHFREE_REF,
        corporateUserId: 42,
      })
    );
    expect(maybeNotifyOndcCheckoutAndClearCart).toHaveBeenCalled();
  });

  // provider.descriptor is OPTIONAL in on_confirm — relying on it alone left the
  // Seller cell blank in Order History for every BPP that omits it.
  describe('vendorName resolution', () => {
    const withPgRow = (groups) => {
      paymentGatewayOrders.findAll.mockResolvedValue([pgRow(CASHFREE_REF, groups)]);
      paymentGatewayOrders.findOne.mockResolvedValue(pgRow(CASHFREE_REF, groups));
      ondcOrders.findOne.mockResolvedValue(null);
    };
    const run = (order, groups) => {
      withPgRow(groups);
      return persistAndSettleFromOnConfirm({
        transactionId: ONDC_TXN,
        order,
        error: null,
        context: { bpp_id: 'bpp.example.com' },
        logTraceId: 't-vendor',
      });
    };
    const noDescriptor = { ...baseOrder, provider: { id: 'P1' } };

    it('prefers the name the BPP echoed', async () => {
      await run(baseOrder, [{ transactionId: ONDC_TXN, amount: 100, vendorName: 'From Cart' }]);

      expect(createOndcOrder).toHaveBeenCalledWith(
        expect.objectContaining({ vendorName: 'Acme' })
      );
      expect(findOndcSeller).not.toHaveBeenCalled();
    });

    it('falls back to the checkout group when the BPP omits provider.descriptor', async () => {
      await run(noDescriptor, [
        { transactionId: ONDC_TXN, amount: 100, vendorName: 'Sindhi Dry Fruits' },
      ]);

      expect(createOndcOrder).toHaveBeenCalledWith(
        expect.objectContaining({ vendorName: 'Sindhi Dry Fruits' })
      );
      expect(findOndcSeller).not.toHaveBeenCalled();
    });

    it('matches the checkout group on providerId when the transactionId differs', async () => {
      await run(noDescriptor, [
        { transactionId: 'some-other-txn', providerId: 'P1', vendorName: 'By Provider' },
      ]);

      expect(createOndcOrder).toHaveBeenCalledWith(
        expect.objectContaining({ vendorName: 'By Provider' })
      );
    });

    it('falls back to the seller registry when the checkout group has no name', async () => {
      findOndcSeller.mockResolvedValue({ vendorName: 'From Registry' });

      await run(noDescriptor, [{ transactionId: ONDC_TXN, amount: 100 }]);

      expect(findOndcSeller).toHaveBeenCalledWith({
        bppId: 'bpp.example.com',
        providerId: 'P1',
      });
      expect(createOndcOrder).toHaveBeenCalledWith(
        expect.objectContaining({ vendorName: 'From Registry' })
      );
    });

    // null, not "" — the read side treats null as "unknown" and renders "-".
    it('stores null when no source has a name', async () => {
      await run(noDescriptor, [{ transactionId: ONDC_TXN, amount: 100 }]);

      expect(createOndcOrder).toHaveBeenCalledWith(
        expect.objectContaining({ vendorName: null })
      );
    });

    it('does not let a registry lookup failure block the order write', async () => {
      findOndcSeller.mockRejectedValue(new Error('db down'));

      await run(noDescriptor, [{ transactionId: ONDC_TXN, amount: 100 }]);

      expect(createOndcOrder).toHaveBeenCalledWith(
        expect.objectContaining({ vendorName: null, transactionId: ONDC_TXN })
      );
    });
  });
});

describe('platform fee allocation', () => {
  const TWO_SELLERS = [
    { transactionId: ONDC_TXN, amount: 100 },
    { transactionId: 'txn-2', amount: 50 },
  ];
  const order = {
    id: 'O-1',
    state: 'Created',
    provider: { id: 'P1', descriptor: { name: 'Acme' } },
    quote: { price: { value: '100', currency: 'INR' }, breakup: [] },
    payment: {},
    items: [],
    fulfillments: [],
  };
  const confirmFirstSeller = async () => {
    paymentGatewayOrders.findAll.mockResolvedValue([pgRow(CASHFREE_REF, TWO_SELLERS)]);
    paymentGatewayOrders.findOne.mockResolvedValue(pgRow(CASHFREE_REF, TWO_SELLERS));
    // 7.50 platform fee on 150 of quotes; only the first (100) seller has a row.
    findOneOrder.mockResolvedValue({ surcharge: '7.50' });
    findOndcOrdersByPaymentRef.mockResolvedValue([{ transactionId: ONDC_TXN, totalAmount: '100.00' }]);
    await persistAndSettleFromOnConfirm({
      transactionId: ONDC_TXN,
      order,
      error: null,
      context: { bpp_id: 'bpp.example.com' },
      logTraceId: 't-fee',
    });
  };

  // The failed seller's 2.50 of fee goes back in the checkout's refund, so it must
  // not also land on the confirmed row.
  it('spreads the fee over every seller the buyer paid for when the checkout has confirm attempts', async () => {
    findCheckoutConfirmSummary.mockResolvedValue({
      checkout: { status: 'COMPLETED' },
      attempts: [
        { transactionId: ONDC_TXN, status: 'CONFIRMED', quoteAmount: '100.00' },
        { transactionId: 'txn-2', status: 'FAILED', quoteAmount: '50.00' },
      ],
    });

    await confirmFirstSeller();

    expect(updateOndcOrderPaymentTotals).toHaveBeenLastCalledWith({
      transactionId: ONDC_TXN,
      platformFee: 5,
      amountPaid: 105,
    });
  });

  it('keeps the confirmed-rows allocation for checkouts from before confirm attempts', async () => {
    await confirmFirstSeller();

    expect(updateOndcOrderPaymentTotals).toHaveBeenLastCalledWith({
      transactionId: ONDC_TXN,
      platformFee: 7.5,
      amountPaid: 107.5,
    });
  });
});
