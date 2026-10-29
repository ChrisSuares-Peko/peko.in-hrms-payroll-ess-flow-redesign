jest.mock('../ondcRefundCancelNotify', () => ({ resolveCorporateRecipient: jest.fn() }));
jest.mock('../../models/use-cases/ondc_order', () => ({ claimOndcOrderInvoiceEmail: jest.fn() }));
jest.mock('../../utils/emailer', () => ({
  email: jest.fn((to, subject, body, cb) => {
    if (cb) cb();
  }),
}));
jest.mock('../../utils/partnerLogos', () => ({
  partnerLogos: jest.fn().mockResolvedValue({ logo: 'https://cdn.peko/logo.png', baseUrl: 'https://in.peko.one' }),
}));
jest.mock('../../utils/loggerHelper', () => ({ customLog: jest.fn() }));

const { resolveCorporateRecipient } = require('../ondcRefundCancelNotify');
const { claimOndcOrderInvoiceEmail } = require('../../models/use-cases/ondc_order');
const emailer = require('../../utils/emailer');
const { sendOndcInvoiceEmail } = require('../ondcInvoiceNotify');

const INVOICE_URL = 'https://seller-np.com/invoices/O1.pdf';

const row = (overrides = {}) => ({
  id: 7,
  orderId: 'O1',
  transactionId: 'T2',
  corporateUserId: 42,
  vendorName: 'ABC Distributors',
  amountPaid: 1150,
  documents: [{ url: INVOICE_URL, label: 'Invoice' }],
  invoiceEmailSentAt: null,
  ...overrides,
});

/** [to, subject, body] of the most recent send. */
const lastMail = () => emailer.email.mock.calls.at(-1);

beforeEach(() => {
  jest.clearAllMocks();
  resolveCorporateRecipient.mockResolvedValue({ id: 42, email: 'buyer@acme.example', contactPersonName: 'Faris' });
  claimOndcOrderInvoiceEmail.mockResolvedValue(1);
});

describe('sendOndcInvoiceEmail', () => {
  it('mails the buyer a link to the invoice', async () => {
    await sendOndcInvoiceEmail({ row: row() });

    const [to, subject, body] = lastMail();
    expect(to).toBe('buyer@acme.example');
    expect(subject).toBe('Your invoice is ready');
    expect(body).toContain(INVOICE_URL);
    expect(body).toContain('O1');
    expect(body).toContain('ABC Distributors');
    expect(body).toContain('Faris');
  });

  it('claims the row before sending', async () => {
    await sendOndcInvoiceEmail({ row: row() });

    expect(claimOndcOrderInvoiceEmail).toHaveBeenCalledWith({ id: 7 });
    expect(claimOndcOrderInvoiceEmail.mock.invocationCallOrder[0])
      .toBeLessThan(emailer.email.mock.invocationCallOrder[0]);
  });

  // The whole point of the lock: on_status repeats every poll cycle carrying the same
  // documents, so an unguarded send would mail the buyer hourly.
  it('sends nothing when the row was already mailed', async () => {
    await sendOndcInvoiceEmail({ row: row({ invoiceEmailSentAt: '2026-08-12T09:00:00Z' }) });

    expect(claimOndcOrderInvoiceEmail).not.toHaveBeenCalled();
    expect(emailer.email).not.toHaveBeenCalled();
  });

  it('sends nothing when another callback won the claim', async () => {
    claimOndcOrderInvoiceEmail.mockResolvedValue(0);

    await sendOndcInvoiceEmail({ row: row() });

    expect(emailer.email).not.toHaveBeenCalled();
  });

  // A claim without a send would silence that invoice permanently.
  it('does NOT claim when no recipient resolves', async () => {
    resolveCorporateRecipient.mockResolvedValue({ id: 42, email: null });

    await sendOndcInvoiceEmail({ row: row() });

    expect(claimOndcOrderInvoiceEmail).not.toHaveBeenCalled();
    expect(emailer.email).not.toHaveBeenCalled();
  });

  it('does nothing for an order with no invoice document', async () => {
    await sendOndcInvoiceEmail({ row: row({ documents: [] }) });
    await sendOndcInvoiceEmail({ row: row({ documents: null }) });
    await sendOndcInvoiceEmail({ row: row({ documents: [{ label: 'Invoice' }] }) });

    expect(resolveCorporateRecipient).not.toHaveBeenCalled();
    expect(claimOndcOrderInvoiceEmail).not.toHaveBeenCalled();
    expect(emailer.email).not.toHaveBeenCalled();
  });

  it('swallows a failure instead of throwing at the webhook', async () => {
    resolveCorporateRecipient.mockRejectedValue(new Error('db down'));

    await expect(sendOndcInvoiceEmail({ row: row() })).resolves.toBeUndefined();

    emailer.email.mockImplementation(() => {
      throw new Error('smtp down');
    });
    resolveCorporateRecipient.mockResolvedValue({ id: 42, email: 'buyer@acme.example' });
    await expect(sendOndcInvoiceEmail({ row: row() })).resolves.toBeUndefined();
  });
});
