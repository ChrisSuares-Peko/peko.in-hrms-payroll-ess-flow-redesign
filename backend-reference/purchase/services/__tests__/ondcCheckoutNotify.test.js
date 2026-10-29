jest.mock('../../models/entities/ondc_order', () => ({
  findAll: jest.fn(),
}));
jest.mock('../../models/entities/corporateUser', () => ({
  findOne: jest.fn(),
}));
jest.mock('../../models/use-cases/corporateUser', () => ({
  findOne: jest.fn(),
}));
jest.mock('../../models/use-cases/order', () => ({
  findOneOrder: jest.fn(),
  updateOneOrder: jest.fn(),
}));
jest.mock('../../models/use-cases/cart', () => ({
  removeOndcProductsFromCart: jest.fn(),
}));
jest.mock('../../utils/emailer', () => ({
  email: jest.fn((to, subject, body, cb) => {
    if (cb) cb();
  }),
}));
jest.mock('../../utils/emailTemplate/ecommerce', () => ({
  ondcOrderFailedTemplate: jest.fn(() => '<html>failed</html>'),
}));
// The confirmation mail is now the spec template (#1) in its own module.
jest.mock('../../utils/emailTemplate/officeSuppliesNotifications', () => ({
  osOrderConfirmedTemplate: jest.fn(() => '<html>confirmed</html>'),
  subjects: { orderConfirmed: (ids) => `Order Confirmed — #${[].concat(ids).join(', ')}` },
}));
// The item table needs the catalog snapshot for thumbnails; not under test here.
jest.mock('../../models/entities/ondc_product_with_transactionId', () => ({
  findAll: jest.fn().mockResolvedValue([]),
}));
jest.mock('../../utils/partnerLogos', () => ({
  partnerLogos: jest.fn().mockResolvedValue({}),
}));
jest.mock('../../utils/loggerHelper', () => ({ customLog: jest.fn() }));
jest.mock('../../models/use-cases/ondc_checkout_confirm', () => ({
  findCheckoutConfirmSummary: jest.fn(),
}));

const ondcOrders = require('../../models/entities/ondc_order');
const { findOne: findCorporateUser } = require('../../models/use-cases/corporateUser');
const { findOneOrder, updateOneOrder } = require('../../models/use-cases/order');
const { removeOndcProductsFromCart } = require('../../models/use-cases/cart');
const emailer = require('../../utils/emailer');
const { customLog } = require('../../utils/loggerHelper');
const { findCheckoutConfirmSummary } = require('../../models/use-cases/ondc_checkout_confirm');
const {
  maybeNotifyOndcCheckoutAndClearCart,
} = require('../ondcCheckoutNotify');

const PAYMENT_REF = '1785921646907';

beforeEach(() => {
  jest.clearAllMocks();
  updateOneOrder.mockResolvedValue({});
  removeOndcProductsFromCart.mockResolvedValue(undefined);
  // Checkouts from before confirm-after-payment have no checkout row.
  findCheckoutConfirmSummary.mockResolvedValue(null);
});

describe('maybeNotifyOndcCheckoutAndClearCart', () => {
  it('skips when email was already sent for this paymentRef', async () => {
    findOneOrder.mockResolvedValue({
      orderResponse: JSON.stringify({ ondcEmailSentAt: '2026-01-01T00:00:00.000Z' }),
    });

    await maybeNotifyOndcCheckoutAndClearCart({
      paymentRef: PAYMENT_REF,
      ctx: { ondcGroupCount: 1, paymentData: { userId: 7 } },
      logTraceId: 't1',
    });

    expect(emailer.email).not.toHaveBeenCalled();
    expect(customLog).toHaveBeenCalledWith(
      't1',
      'info',
      expect.objectContaining({ step: 'email-skip' }),
      'VENDOR'
    );
  });

  it('sends confirmation email once and clears cart when all sellers confirmed', async () => {
    findOneOrder.mockResolvedValue({
      orderResponse: JSON.stringify({ ondc: true }),
    });
    ondcOrders.findAll.mockResolvedValue([
      {
        orderId: 'O-1',
        transactionId: 'txn-1',
        providerId: 'P1',
        bppUri: 'https://bpp.example.com',
        billing: { name: 'Buyer', address: { area_code: '560001' } },
        items: [{ ondcProductId: 'item-1' }],
      },
    ]);
    findCorporateUser.mockResolvedValue({
      email: 'buyer@peko.one',
      contactPersonName: 'Buyer',
      companyName: 'Acme Co',
      gstNumber: '29AAAAA0000A1Z5',
    });

    await maybeNotifyOndcCheckoutAndClearCart({
      paymentRef: PAYMENT_REF,
      ctx: {
        ondcGroupCount: 1,
        corporateUserId: 42,
        subCorporateId: null,
        paymentData: { userId: 7, corporateId: 42 },
      },
      logTraceId: 't2',
    });

    expect(emailer.email).toHaveBeenCalledWith(
      'buyer@peko.one',
      // Spec subject: "Order Confirmed — #O-1 is on its way to being packed"
      expect.stringContaining('Order Confirmed'),
      '<html>confirmed</html>',
      expect.any(Function)
    );
    expect(updateOneOrder).toHaveBeenCalledWith(
      PAYMENT_REF,
      expect.objectContaining({
        orderResponse: expect.stringContaining('ondcEmailSentAt'),
      })
    );
    expect(removeOndcProductsFromCart).toHaveBeenCalled();
    expect(customLog).toHaveBeenCalledWith(
      't2',
      'info',
      expect.objectContaining({ step: 'email-send' }),
      'VENDOR'
    );
  });

  it('waits when expected seller count is not yet met', async () => {
    findOneOrder.mockResolvedValue({ orderResponse: '{}' });
    ondcOrders.findAll.mockResolvedValue([
      { orderId: 'O-1', transactionId: 'txn-1', items: [] },
    ]);

    await maybeNotifyOndcCheckoutAndClearCart({
      paymentRef: PAYMENT_REF,
      ctx: { ondcGroupCount: 2, paymentData: { userId: 7 } },
      logTraceId: 't3',
    });

    expect(emailer.email).not.toHaveBeenCalled();
  });

  // Confirm-after-payment checkouts: a failed seller never gets a row, so the gate
  // waits for the checkout to COMPLETE instead of counting rows against its groups.
  describe('confirm-after-payment checkouts', () => {
    const confirmedRow = {
      orderId: 'O-1',
      transactionId: 'txn-1',
      providerId: 'P1',
      bppUri: 'https://bpp.example.com',
      billing: { name: 'Buyer', address: { area_code: '560001' } },
      items: [{ ondcProductId: 'item-1' }],
    };
    const ctx = {
      ondcGroupCount: 2,
      corporateUserId: 42,
      subCorporateId: null,
      paymentData: { userId: 7, corporateId: 42 },
    };

    beforeEach(() => {
      findOneOrder.mockResolvedValue({ orderResponse: '{}' });
      ondcOrders.findAll.mockResolvedValue([confirmedRow]);
      findCorporateUser.mockResolvedValue({ email: 'buyer@peko.one', contactPersonName: 'Buyer' });
    });

    it('mails and clears the cart once the checkout completed, even though a seller failed', async () => {
      findCheckoutConfirmSummary.mockResolvedValue({
        checkout: { status: 'COMPLETED' },
        attempts: [{ status: 'CONFIRMED' }, { status: 'FAILED' }],
      });

      await maybeNotifyOndcCheckoutAndClearCart({ paymentRef: PAYMENT_REF, ctx, logTraceId: 't4' });

      expect(emailer.email).toHaveBeenCalledTimes(1);
      expect(removeOndcProductsFromCart).toHaveBeenCalledWith(
        [{ ondcProductId: 'item-1', bppUri: 'https://bpp.example.com', ondcVendorId: 'P1' }],
        expect.objectContaining({ corporateId: 42 })
      );
    });

    it('waits while a seller is still answering', async () => {
      findCheckoutConfirmSummary.mockResolvedValue({
        checkout: { status: 'IN_PROGRESS' },
        attempts: [{ status: 'CONFIRMED' }, { status: 'DISPATCHED' }],
      });

      await maybeNotifyOndcCheckoutAndClearCart({ paymentRef: PAYMENT_REF, ctx, logTraceId: 't5' });

      expect(emailer.email).not.toHaveBeenCalled();
      expect(customLog).toHaveBeenCalledWith(
        't5',
        'info',
        expect.objectContaining({ step: 'email-skip', checkoutStatus: 'IN_PROGRESS' }),
        'VENDOR'
      );
    });

    it('waits for the confirmed rows to be written', async () => {
      findCheckoutConfirmSummary.mockResolvedValue({
        checkout: { status: 'COMPLETED' },
        attempts: [{ status: 'CONFIRMED' }, { status: 'CONFIRMED' }],
      });

      await maybeNotifyOndcCheckoutAndClearCart({ paymentRef: PAYMENT_REF, ctx, logTraceId: 't6' });

      expect(emailer.email).not.toHaveBeenCalled();
    });
  });
});
