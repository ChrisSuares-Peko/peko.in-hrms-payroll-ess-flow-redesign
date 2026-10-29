jest.mock('../../models/use-cases/corporateUser', () => ({ findOne: jest.fn() }));
jest.mock('../../models/use-cases/order', () => ({ updateOrderInvoiceDetails: jest.fn() }));
jest.mock('../../models/use-cases/setting', () => ({ getGstDetails: jest.fn() }));
jest.mock('../../utils/emailer', () => ({ emailWithMultipleAttachment: jest.fn() }));
jest.mock('../../utils/emailTemplates', () => ({ vendorInvoiceEmail: jest.fn(() => 'vendor mail') }));
jest.mock('../../utils/generatePekoInvoiceId', () => {
  let count = 0;
  return {
    generatePekoInvoiceId: jest.fn(async () => `INV-${++count}`),
    generatePekoReceiptId: jest.fn(async () => 'RCPT-1'),
  };
});
jest.mock('../../utils/invoiceTemplate', () => ({
  taxInvoiceTemplate: jest.fn((data) => `invoice ${data.invoiceNumber}`),
  paymentReceiptTemplate: jest.fn(() => 'receipt'),
  PEKO_COMPANY_DETAILS: { gstin: '32AAAAA0000A1Z5' },
}));
jest.mock('fs', () => ({
  ...jest.requireActual('fs'),
  readFileSync: jest.fn(() => Buffer.from('pdf')),
  unlinkSync: jest.fn(),
}));
jest.mock('puppeteer', () => ({
  launch: jest.fn(async () => ({
    newPage: async () => ({
      setContent: async () => {},
      pdf: async () => {},
    }),
    close: async () => {},
  })),
}));

const { findOne: findCorporateUser } = require('../../models/use-cases/corporateUser');
const { getGstDetails } = require('../../models/use-cases/setting');
const { paymentReceiptTemplate } = require('../../utils/invoiceTemplate');
const { generateOrderInvoiceAttachments } = require('../invoiceAndReceipt');

const order = (extra) =>
  generateOrderInvoiceAttachments({
    amount: 1000,
    surcharge: 0,
    corporateTxnId: 'TXN-1',
    orderId: 7,
    paymentType: 'Hike',
    credentialId: 5,
    ...extra,
  });

const receipt = () => paymentReceiptTemplate.mock.calls[0][0];

beforeEach(() => {
  jest.clearAllMocks();
  getGstDetails.mockResolvedValue({ details: { gst: 18 } });
  findCorporateUser.mockResolvedValue({ name: 'Corp', mobileNo: '9999999999', state: 'Kerala', city: 'Kochi', country: 'India' });
});

describe('the payment mode on a purchase receipt', () => {
  it('is Wallet when no gateway money was paid', async () => {
    await order({});

    expect(receipt().paymentMode).toBe('Wallet');
  });

  it('adds Wallet when the gateway paid only part of it', async () => {
    await order({ pgAmount: 400 });

    expect(receipt().paymentMode).toBe('Payment Gateway + Wallet');
  });

  it('is Payment Gateway when the gateway paid all of it', async () => {
    await order({ pgAmount: 1000 });

    expect(receipt().paymentMode).toBe('Payment Gateway');
  });
});

describe('the item service price on a purchase receipt', () => {
  it('is the amount of the order', async () => {
    await order({});

    expect(receipt().itemServicePrice).toBe('1000.00');
  });
});

describe('the corporate user of a purchase invoice', () => {
  it('is looked up with the key this service uses', async () => {
    await order({});

    expect(findCorporateUser).toHaveBeenCalledWith({ corporateId: 5 }, expect.any(Array));
  });
});
