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
const { updateOrderInvoiceDetails } = require('../../models/use-cases/order');
const { getGstDetails } = require('../../models/use-cases/setting');
const emailer = require('../../utils/emailer');
const { generateOrderInvoiceAttachments } = require('../invoiceAndReceipt');

const vendor = { vendorName: 'Acme', vendorEmail: ['vendor@acme.test'], state: 'Kerala', gstNo: '32BBBBB0000B1Z5' };

const planDetails = [{ name: 'Gold plan', amount: 500, quantity: 2 }];

const order = (extra) =>
  generateOrderInvoiceAttachments({
    amount: 1000,
    surcharge: 23.6,
    corporateTxnId: 'TXN-1',
    orderId: 7,
    paymentType: 'Hike',
    credentialId: 5,
    ...extra,
  });

const namesOf = (attachments) => attachments.map((file) => file.filename.replace(/-\d+\.pdf$/, ''));

const stored = () => updateOrderInvoiceDetails.mock.calls[0][0].data.pekoInvoiceDetails;

beforeEach(() => {
  jest.clearAllMocks();
  getGstDetails.mockResolvedValue({ details: { gst: 18 } });
  findCorporateUser.mockResolvedValue({ name: 'Corp', mobileNo: '9999999999', state: 'Kerala', city: 'Kochi', country: 'India' });
});

describe('the vendor commission invoice of a purchase', () => {
  it('is emailed to the vendor for a margin order, and no plan invoice is made', async () => {
    const attachments = await order({ vendor, commissionIncludingGST: 118, commissionMode: 'MARGIN', planDetails });

    expect(namesOf(attachments)).toEqual(['Receipt', 'Invoice-on-Platform-Fee']);
    expect(emailer.emailWithMultipleAttachment).toHaveBeenCalledTimes(1);
    const [to, subject, , files] = emailer.emailWithMultipleAttachment.mock.calls[0];
    expect(to).toBe('vendor@acme.test');
    expect(subject).toBe('Tax Invoice on Commission - Peko');
    expect(namesOf(files)).toEqual(['Invoice-on-Commission']);
    expect(stored().vendor.invoiceData.total).toBe(118);
    expect(stored().corporate.planInvoiceData).toEqual({});
    expect(stored().vendor.planInvoiceData).toEqual({});
  });

  it('is sent when no commission mode is given, as it was before', async () => {
    await order({ vendor, commissionIncludingGST: 118 });

    expect(emailer.emailWithMultipleAttachment).toHaveBeenCalledTimes(1);
  });

  it('is made for the margin commission passed in, whatever the order mode is', async () => {
    await order({ vendor, commissionIncludingGST: 118, commissionMode: 'PRINCIPAL_MARKUP', planDetails });

    expect(emailer.emailWithMultipleAttachment).toHaveBeenCalledTimes(1);
    expect(stored().vendor.invoiceData.total).toBe(118);
  });

  it('is not made for an order with only principal markup items, which pass no commission', async () => {
    await order({ vendor, commissionIncludingGST: 0, commissionMode: 'PRINCIPAL_MARKUP', planDetails });

    expect(emailer.emailWithMultipleAttachment).not.toHaveBeenCalled();
    expect(stored().vendor.invoiceData).toEqual({});
  });

  it('is not made when there is no commission', async () => {
    await order({ vendor, commissionIncludingGST: 0, commissionMode: 'MARGIN' });

    expect(emailer.emailWithMultipleAttachment).not.toHaveBeenCalled();
  });
});

describe('the plan invoice of a purchase', () => {
  it('is made for a principal markup order and handed back with the receipt and invoice', async () => {
    const attachments = await order({ vendor, commissionIncludingGST: 0, commissionMode: 'PRINCIPAL_MARKUP', planDetails });

    expect(namesOf(attachments)).toEqual(['Receipt', 'Invoice-on-Platform-Fee', 'Invoice']);
    const plan = stored().corporate.planInvoiceData;
    expect(plan.items).toHaveLength(1);
    expect(plan.items[0]).toMatchObject({ description: 'Gold plan', quantity: 2, lineTotal: 1000 });
    expect(plan.total).toBe(1000);
    expect(stored().vendor.planInvoiceData).toEqual({});
  });

  it('rides along in the vendor email for an agent markup order', async () => {
    const attachments = await order({ vendor, commissionIncludingGST: 118, commissionMode: 'AGENT_MARKUP', planDetails });

    expect(namesOf(attachments)).toEqual(['Receipt', 'Invoice-on-Platform-Fee', 'Invoice']);
    const files = emailer.emailWithMultipleAttachment.mock.calls[0][3];
    expect(namesOf(files)).toEqual(['Invoice-on-Commission', 'Invoice']);
    expect(stored().vendor.planInvoiceData.total).toBe(1000);
    expect(stored().vendor.planInvoiceData).toEqual(stored().corporate.planInvoiceData);
  });

  it('is not made for a margin order with no plan lines', async () => {
    const attachments = await order({ vendor, commissionIncludingGST: 0, commissionMode: 'MARGIN', planDetails: [] });

    expect(namesOf(attachments)).toEqual(['Receipt', 'Invoice-on-Platform-Fee']);
    expect(stored().corporate.planInvoiceData).toEqual({});
  });

  it('is one row for the amount paid when a markup service has no plan lines', async () => {
    const attachments = await order({ vendor, commissionIncludingGST: 0, commissionMode: 'AGENT_MARKUP', planDetails: [] });

    expect(namesOf(attachments)).toEqual(['Receipt', 'Invoice-on-Platform-Fee', 'Invoice']);
    const plan = stored().corporate.planInvoiceData;
    expect(plan.items).toHaveLength(1);
    expect(plan.items[0]).toMatchObject({ description: 'Hike', quantity: 1, lineTotal: 1000 });
  });

  it('lists each item by its own mode, and gives the vendor a copy of the agent markup ones only', async () => {
    const items = [
      { name: 'Agent plan', amount: 500, quantity: 1, commissionMode: 'AGENT_MARKUP' },
      { name: 'Own plan', amount: 300, quantity: 1, commissionMode: 'PRINCIPAL_MARKUP' },
      { name: 'Margin plan', amount: 200, quantity: 1, commissionMode: 'MARGIN' },
    ];
    await order({ vendor, commissionIncludingGST: 118, commissionMode: 'MIXED', planDetails: items });

    const customerCopy = stored().corporate.planInvoiceData;
    expect(customerCopy.items.map((row) => row.description)).toEqual(['Agent plan', 'Own plan']);
    expect(customerCopy.total).toBe(800);
    const vendorCopy = stored().vendor.planInvoiceData;
    expect(vendorCopy.items.map((row) => row.description)).toEqual(['Agent plan']);
    expect(vendorCopy.total).toBe(500);
    expect(vendorCopy.invoiceNumber).not.toBe(customerCopy.invoiceNumber);
    expect(namesOf(emailer.emailWithMultipleAttachment.mock.calls[0][3])).toEqual(['Invoice-on-Commission', 'Invoice']);
  });

  it('is the same invoice in the vendor copy when every item is agent markup', async () => {
    await order({ vendor, commissionIncludingGST: 118, commissionMode: 'AGENT_MARKUP', planDetails });

    expect(stored().vendor.planInvoiceData).toEqual(stored().corporate.planInvoiceData);
  });

  it('gives the vendor no copy when every item is principal markup', async () => {
    await order({ vendor, commissionIncludingGST: 118, commissionMode: 'PRINCIPAL_MARKUP', planDetails });

    expect(stored().corporate.planInvoiceData.total).toBe(1000);
    expect(stored().vendor.planInvoiceData).toEqual({});
    expect(namesOf(emailer.emailWithMultipleAttachment.mock.calls[0][3])).toEqual(['Invoice-on-Commission']);
  });
});
