const { Op } = require('sequelize');
const { fetchServiceDetails, calculateSurcharge, calculateAmountWithTax } = require('../../../utils/checkAndFetchServiceDetails');
const { createWalletTransaction, updateWalletTransaction, refundWalletTransaction } = require('../../../utils/walletTransaction');
const { createPGTransaction } = require('../../../utils/pamentGatewayTransaction');
const carReportOrder = require('../../../models/entities/carReportOrder');
const order = require('../../../models/entities/order');
const wallet = require('../../../models/entities/wallet');
const { customLog } = require('../../../utils/loggerHelper');
const { materialiseHistoryReport, attachHistoryReportPdf } = require('../carReportHistory');
const { dispatchInspection } = require('../carReportInspection');
const { dispatchPaasReport, materialisePaasReport, fetchValuationBands } = require('../carReportPaas');

jest.mock('../../../utils/checkAndFetchServiceDetails', () => ({
  fetchServiceDetails: jest.fn(),
  calculateSurcharge: jest.fn(),
  calculateAmountWithTax: jest.fn(),
}));
jest.mock('../../../utils/walletTransaction', () => ({
  createWalletTransaction: jest.fn(),
  updateWalletTransaction: jest.fn(),
  refundWalletTransaction: jest.fn(),
}));
jest.mock('../../../utils/pamentGatewayTransaction', () => ({
  createPGTransaction: jest.fn(),
}));
// Entities are mocked directly (the convention in models/use-cases/__tests__) rather
// than leaning on the DB mock in tests/setup.js — requiring a real entity pulls in
// configs/database, which pulls in the Logtail logger and needs a source token.
jest.mock('../../../models/entities/carReportOrder', () => ({
  create: jest.fn(),
  findOne: jest.fn(),
  findAndCountAll: jest.fn(),
}));
jest.mock('../../../models/entities/order', () => ({ findOne: jest.fn(), findAll: jest.fn() }));
jest.mock('../../../models/entities/wallet', () => ({ findOne: jest.fn() }));
jest.mock('../pluralGateway', () => ({ refundGatewayTransaction: jest.fn() }));
// Pulls in the Droom service and the order entity; the read-time materialisation has its
// own suite (carReportHistory.test.js).
jest.mock('../carReportHistory', () => ({
  materialiseHistoryReport: jest.fn(),
  attachHistoryReportPdf: jest.fn(),
}));
// DB-backed pricing (carReportPlans) delegates to the static maps in these tests, so
// every amount assertion stays against the seeded launch prices.
jest.mock('../../../utils/carReportPlans', () => {
  const { resolveReportPrice } = jest.requireActual('../../../utils/carReport');
  return {
    resolvePlanPrice: jest.fn(async (reportType, body) => resolveReportPrice(reportType, body)),
    getActivePlans: jest.fn(async () => []),
    invalidatePlansCache: jest.fn(),
  };
});
jest.mock('../carReportInspection', () => ({ dispatchInspection: jest.fn() }));
jest.mock('../carReportPaas', () => ({
  dispatchPaasReport: jest.fn(),
  materialisePaasReport: jest.fn(),
  fetchValuationBands: jest.fn(),
}));
jest.mock('../../../utils/loggerHelper', () => ({ customLog: jest.fn() }));
jest.mock('../../../utils/emailer', () => ({ email: jest.fn(), emailWithMultipleAttachment: jest.fn() }));
jest.mock('../../../utils/computeJournalData', () => ({ computeJournalData: jest.fn().mockResolvedValue({ journalData: {} }) }));
jest.mock('../../../utils/bull/queue/accountingEventsQueue', () => ({ publishJournalEvent: jest.fn() }));
jest.mock('../../../services/invoiceAndReceipt', () => ({ generateOrderInvoiceAttachments: jest.fn().mockResolvedValue([]) }));
jest.mock('../../../models/use-cases/order', () => ({ findOneOrder: jest.fn() }));
jest.mock('../../../utils/emailTemplates/billpayments', () => ({
  generateMobilePaymentSuccessEmailBill: jest.fn(() => '<html/>'),
  commonFailedTemplateforBillPayments: jest.fn(() => '<html/>'),
}));
jest.mock('../../../models/use-cases/systemUser', () => ({ fetchPartnerDetails: jest.fn() }));
jest.mock('../../../utils/partnerLogos', () => ({ partnerLogos: jest.fn() }));
jest.mock('../../../models/use-cases/notification', () => ({ createNotification: jest.fn() }));

const { payment, fetchCarReportOrders, fetchCarReportOrderDetail } = require('../carReport');

const REPORT_URL = 'https://img1.orangebookvalue.com/photos/premium_reports/x.pdf';

const validBody = {
  reportType: 'valuation',
  reportName: 'Valuation Report',
  reg_num: 'JK01AV0507',
  vehicle: { make: 'Kia', model: 'Seltos', variant: 'HTX', bodyType: 'SEDAN' },
  make: 'Kia',
  model: 'Seltos',
  manufacturingYear: '2021',
  variant: 'HTX',
  kilometresDriven: '48000',
  city: 'Srinagar',
  vehicleCategory: 'car',
};

const user = {
  id: 42,
  corporateId: 7,
  packageId: 1,
  name: 'Peko Corp',
  email: 'ops@peko.one',
  username: 'ops@peko.one',
};

const run = async ({ body = {}, query = {}, params = {} } = {}) => {
  const req = { user, body, query, params, LogTraceId: 'trace-1' };
  const res = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };
  const next = jest.fn();
  return { req, res, next };
};

const callPayment = async (body) => {
  const ctx = await run({ body });
  await payment(ctx.req, ctx.res, ctx.next);
  return ctx;
};

describe('carReport.payment', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    fetchServiceDetails.mockResolvedValue({
      id: 9,
      surcharge: 0,
      surchargeType: 'FLAT',
      cashback: 0,
      cashbackType: 'FLAT',
      commissionType: 'FLAT',
      providerCommission: 0,
      serviceProvider: 'Droom',
      vendor: {},
    });
    calculateSurcharge.mockReturnValue(0);
    calculateAmountWithTax.mockImplementation(async (amount) => amount);
    createWalletTransaction.mockResolvedValue({
      corporateFinalBalance: 4801,
      paymentMode: 'WALLET',
      orderId: 555,
    });
    createPGTransaction.mockResolvedValue({ corporateFinalBalance: 5000, paymentMode: 'PAYMENT GATEWAY' });
    carReportOrder.create.mockResolvedValue({ id: 55 });
    updateWalletTransaction.mockResolvedValue({});
    refundWalletTransaction.mockResolvedValue({});
    dispatchPaasReport.mockResolvedValue({});
    wallet.findOne.mockResolvedValue({ balance: 5000 });
  });

  it('debits the wallet and records the order on a valuation purchase', async () => {
    const { res, next } = await callPayment(validBody);

    expect(next).not.toHaveBeenCalled();
    expect(createWalletTransaction).toHaveBeenCalledWith(expect.objectContaining({ amount: 199 }));
    expect(res.status).toHaveBeenCalledWith(200);

    const payload = res.json.mock.calls[0][0];
    expect(payload).toEqual(
      expect.objectContaining({ status: true, responseCode: '000', message: 'Payment Successful' })
    );
    // corporateFinalBalance must survive the spread — the FE refreshes the wallet from it.
    expect(payload.data.corporateFinalBalance).toBe(4801);
    expect(payload.data.orderId).toBe(String(payload.data.corporateTxnId));
  });

  // The PDF is generated asynchronously by Droom, so the order genuinely is building.
  it('records a BUILDING order with the purchase-time spec snapshot', async () => {
    await callPayment(validBody);

    expect(carReportOrder.create).toHaveBeenCalledWith(
      expect.objectContaining({
        reportType: 'valuation',
        vehicleModel: 'Kia Seltos HTX',
        bodyType: 'SEDAN',
        reportStatus: 'BUILDING',
        valuationSpec: expect.objectContaining({ kilometres: '48,000 km', city: 'Srinagar' }),
      })
    );
  });

  // The sooner Droom starts generating, the sooner the webhook can flip the order READY.
  it('orders the PDF from Droom during the payment request', async () => {
    await callPayment(validBody);

    expect(dispatchPaasReport).toHaveBeenCalledWith(
      expect.objectContaining({ id: 55, corporateTxnId: expect.any(String) }),
      expect.anything()
    );
  });

  // The money is taken and the order exists; the read path re-orders the report.
  it('still returns success when the vendor create cannot be completed', async () => {
    dispatchPaasReport.mockResolvedValueOnce({ reportStatus: 'BUILDING' });

    const { res, next } = await callPayment(validBody);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('refuses a valuation with no vehicle category, without touching the wallet', async () => {
    const { next } = await callPayment({ ...validBody, vehicleCategory: '' });

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ status_code: 400, message: expect.stringContaining('vehicleCategory') })
    );
    expect(createWalletTransaction).not.toHaveBeenCalled();
  });

  // The success page reads this back to deep-link straight to the order.
  it('writes the order id onto the transaction so the success page can find it', async () => {
    await callPayment(validBody);

    const settle = updateWalletTransaction.mock.calls[0][0];
    expect(settle.status).toBe('SUCCESS');
    expect(JSON.parse(settle.orderResponse)).toEqual(
      expect.objectContaining({ orderId: String(settle.corporateTxnId), reportType: 'valuation' })
    );
  });

  it('prices server-side, ignoring any amount the client sends', async () => {
    await callPayment({ ...validBody, reportPrice: 1, totalAmount: 1, amount: 1 });

    expect(createWalletTransaction).toHaveBeenCalledWith(expect.objectContaining({ amount: 199 }));
  });

  it('adds the configured surcharge to the report price', async () => {
    calculateSurcharge.mockReturnValueOnce(10);
    calculateAmountWithTax.mockResolvedValueOnce('11.80');

    await callPayment(validBody);

    expect(calculateSurcharge).toHaveBeenCalledWith(0, 'FLAT', 199, 42);
    expect(createWalletTransaction).toHaveBeenCalledWith(
      expect.objectContaining({ amount: 210.8, surcharge: 11.8 })
    );
  });

  // calculateSurcharge returns 0 for an unrecognised type, so without the default a
  // serviceOperator row with a null surchargeType would silently waive the fee. The
  // payment service's calculateSurchargeWithTax wrapper applied this internally.
  it('defaults a missing surchargeType to FLAT rather than waiving the fee', async () => {
    fetchServiceDetails.mockResolvedValueOnce({
      id: 9,
      surcharge: 10,
      surchargeType: null,
      cashback: 0,
      cashbackType: 'FLAT',
      commissionType: 'FLAT',
      providerCommission: 0,
      serviceProvider: 'Droom',
      vendor: {},
    });
    calculateSurcharge.mockReturnValueOnce(10);

    await callPayment(validBody);

    expect(calculateSurcharge).toHaveBeenCalledWith(10, 'FLAT', 199, 42);
    expect(createWalletTransaction).toHaveBeenCalledWith(
      expect.objectContaining({ amount: 209, surcharge: 10 })
    );
  });

  // All three real products are on sale now, so the gate is only proved by a type that
  // does not exist.
  it('refuses a report type that cannot be fulfilled, without touching the wallet', async () => {
    const { next } = await callPayment({ ...validBody, reportType: 'teleport' });

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ status_code: 400 }));
    expect(createWalletTransaction).not.toHaveBeenCalled();
    expect(carReportOrder.create).not.toHaveBeenCalled();
  });

  it('refuses an incomplete vehicle spec, without touching the wallet', async () => {
    const { next } = await callPayment({ ...validBody, city: '', variant: '' });

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ status_code: 400, message: expect.stringContaining('variant, city') })
    );
    expect(createWalletTransaction).not.toHaveBeenCalled();
  });

  it('surfaces an insufficient balance without recording an order', async () => {
    createWalletTransaction.mockResolvedValueOnce({ error: 'INSUFFICIENT WALLET BALANCE' });

    const { next } = await callPayment(validBody);

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'INSUFFICIENT WALLET BALANCE' })
    );
    expect(carReportOrder.create).not.toHaveBeenCalled();
  });

  it('refunds the collected amount when the order cannot be recorded', async () => {
    carReportOrder.create.mockRejectedValueOnce(new Error('deadlock'));

    const { res } = await callPayment(validBody);

    expect(refundWalletTransaction).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'FAILURE' })
    );
    expect(updateWalletTransaction).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json.mock.calls[0][0]).toEqual(
      expect.objectContaining({ status: false, responseCode: '001' })
    );
  });

  it('takes the gateway route when a paymentGatewayResponse is present', async () => {
    await callPayment({ ...validBody, paymentGatewayResponse: { ok: true }, pgAmount: 199 });

    expect(createPGTransaction).toHaveBeenCalled();
    expect(createWalletTransaction).not.toHaveBeenCalled();
  });
});

// A history purchase shares the money path with valuation but almost none of its payload:
// one plate, no vehicle spec, no bands, and the report itself does not exist yet.
describe('carReport.payment — history', () => {
  const historyBody = {
    reportType: 'history',
    reportName: 'Vehicle History Report',
    reg_num: 'HR26DD9739',
    vehicle: { bodyType: 'SUV' },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    fetchServiceDetails.mockResolvedValue({
      id: 9,
      surcharge: 0,
      surchargeType: 'FLAT',
      cashback: 0,
      cashbackType: 'FLAT',
      commissionType: 'FLAT',
      providerCommission: 0,
      serviceProvider: 'Droom',
      vendor: {},
    });
    calculateSurcharge.mockReturnValue(0);
    calculateAmountWithTax.mockImplementation(async (amount) => amount);
    createWalletTransaction.mockResolvedValue({ corporateFinalBalance: 4871, paymentMode: 'WALLET' });
    carReportOrder.create.mockResolvedValue({ id: 88 });
    updateWalletTransaction.mockResolvedValue({});
    materialiseHistoryReport.mockResolvedValue({});
    wallet.findOne.mockResolvedValue({ balance: 5000 });
  });

  // History is synchronous at the vendor — building it here means the report-ready
  // email lands seconds after payment instead of on first open.
  it('builds the report during the payment request', async () => {
    await callPayment(historyBody);

    expect(materialiseHistoryReport).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 88,
        credentialId: 42,
        vehicleNumber: 'HR26DD9739',
        reportStatus: 'BUILDING',
      }),
      expect.anything()
    );
  });

  it('charges the history catalogue price and records a BUILDING order', async () => {
    const { res, next } = await callPayment(historyBody);

    expect(next).not.toHaveBeenCalled();
    expect(createWalletTransaction).toHaveBeenCalledWith(expect.objectContaining({ amount: 129 }));
    expect(carReportOrder.create).toHaveBeenCalledWith(
      expect.objectContaining({
        reportType: 'history',
        vehicleNumber: 'HR26DD9739',
        reportStatus: 'BUILDING',
      })
    );
    expect(res.status).toHaveBeenCalledWith(200);
  });

  // The valuation columns must stay empty, or the detail page renders another product's
  // card next to the history one — and the PDF belongs to valuation orders alone.
  it('writes no valuation columns and orders no PDF', async () => {
    await callPayment(historyBody);

    expect(carReportOrder.create).toHaveBeenCalledWith(
      expect.objectContaining({ valuationSpec: null })
    );
    expect(dispatchPaasReport).not.toHaveBeenCalled();
    expect(customLog).not.toHaveBeenCalled();
  });

  // A manually entered vehicle has no fleet reg_num — the plate arrives from the form.
  it('accepts the plate under registrationNumber when there is no fleet vehicle', async () => {
    const { next } = await callPayment({
      reportType: 'history',
      reportName: 'Vehicle History Report',
      registrationNumber: 'KA01AB1234',
      vehicle: { isManual: true },
    });

    expect(next).not.toHaveBeenCalled();
    expect(carReportOrder.create).toHaveBeenCalledWith(
      // No make/model on a history payload, so the plate stands in until the RC lookup
      // backfills the real model.
      expect.objectContaining({ vehicleNumber: 'KA01AB1234', vehicleModel: 'KA01AB1234' })
    );
  });

  it('refuses a history purchase with no plate at all, without touching the wallet', async () => {
    const { next } = await callPayment({
      reportType: 'history',
      reportName: 'Vehicle History Report',
      vehicle: {},
    });

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ status_code: 400, message: expect.stringContaining('reg_num') })
    );
    expect(createWalletTransaction).not.toHaveBeenCalled();
    expect(carReportOrder.create).not.toHaveBeenCalled();
  });

  // The valuation spec must not become a de facto requirement for a product that has no
  // use for it.
  it('does not demand the valuation vehicle spec', async () => {
    const { next } = await callPayment(historyBody);

    expect(next).not.toHaveBeenCalled();
  });
});

// An inspection is a booking, not a report: priced per package, and the technician is
// dispatched to Droom during this request rather than on first read.
describe('carReport.payment — inspection', () => {
  const inspectionBody = {
    reportType: 'inspection',
    reportName: 'Self Inspection',
    packageId: 'basic',
    reg_num: 'KA01AB1234',
    vehicle: { make: 'Kia', model: 'Seltos', variant: 'HTX', bodyType: 'SUV' },
    make: 'Kia',
    model: 'Seltos',
    manufacturingYear: '2021',
    variant: 'HTX',
    bodyType: 'SUV',
    contactName: 'Asha Menon',
    mobileNumber: '9876543210',
    fullAddress: '221B Residency Road',
    pincode: '560001',
    city: 'Bengaluru',
    state: 'Karnataka',
    slot1Date: '2026-08-05',
    slot1Time: '02:00 PM',
    slot2Date: '',
    slot2Time: '',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    fetchServiceDetails.mockResolvedValue({
      id: 9,
      surcharge: 0,
      surchargeType: 'FLAT',
      cashback: 0,
      cashbackType: 'FLAT',
      commissionType: 'FLAT',
      providerCommission: 0,
      serviceProvider: 'Droom',
      vendor: {},
    });
    calculateSurcharge.mockReturnValue(0);
    calculateAmountWithTax.mockImplementation(async (amount) => amount);
    createWalletTransaction.mockResolvedValue({ corporateFinalBalance: 4401, paymentMode: 'WALLET' });
    carReportOrder.create.mockResolvedValue({ id: 77 });
    updateWalletTransaction.mockResolvedValue({});
    dispatchInspection.mockResolvedValue({});
    wallet.findOne.mockResolvedValue({ balance: 5000 });
  });

  it('charges the package price and records a BOOKED order', async () => {
    const { res, next } = await callPayment(inspectionBody);

    expect(next).not.toHaveBeenCalled();
    expect(createWalletTransaction).toHaveBeenCalledWith(expect.objectContaining({ amount: 599 }));
    expect(carReportOrder.create).toHaveBeenCalledWith(
      expect.objectContaining({ reportType: 'inspection', reportStatus: 'BOOKED' })
    );
    expect(res.status).toHaveBeenCalledWith(200);
  });

  // Droom only offers Self Inspection — a package the vendor discontinued (or never
  // provided) must be unbuyable even when posted directly.
  it('refuses a package that is not on sale', async () => {
    const { next } = await callPayment({ ...inspectionBody, packageId: 'premium', reportName: 'Premium Inspection' });

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ status_code: 400 }));
    expect(createWalletTransaction).not.toHaveBeenCalled();
  });

  // A renamed package must not change the price, so the name is never the pricing key.
  it('refuses a package id that is really a display name', async () => {
    const { next } = await callPayment({ ...inspectionBody, packageId: 'Self Inspection' });

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ status_code: 400 }));
    expect(createWalletTransaction).not.toHaveBeenCalled();
  });

  // The ₹0 teaser card must stay unbuyable even when its id is posted directly.
  it('refuses the teaser package', async () => {
    const { next } = await callPayment({ ...inspectionBody, packageId: 'health-report' });

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ status_code: 400 }));
    expect(createWalletTransaction).not.toHaveBeenCalled();
  });

  it('stores the booking and leaves the valuation columns empty', async () => {
    await callPayment(inspectionBody);

    expect(carReportOrder.create).toHaveBeenCalledWith(
      expect.objectContaining({
        valuationSpec: null,
        inspectionBooking: {
          slot1: '2026-08-05 14:00:00',
          address: '221B Residency Road, Bengaluru, Karnataka — 560001',
        },
      })
    );
    expect(dispatchPaasReport).not.toHaveBeenCalled();
  });

  // The technician has to be sent whether or not the customer ever reopens the order.
  it('dispatches to Droom during the payment request', async () => {
    await callPayment(inspectionBody);

    expect(dispatchInspection).toHaveBeenCalledWith(
      expect.objectContaining({ id: 77, corporateTxnId: expect.any(String) }),
      expect.anything()
    );
  });

  // The money is taken and the order exists; the read path retries the dispatch.
  it('still returns success when the dispatch cannot be completed', async () => {
    dispatchInspection.mockResolvedValueOnce({ reportStatus: 'BOOKED' });

    const { res, next } = await callPayment(inspectionBody);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('refuses a booking with no appointment slot, without touching the wallet', async () => {
    const { next } = await callPayment({ ...inspectionBody, slot1Date: '', slot1Time: '' });

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ status_code: 400, message: expect.stringContaining('slot1Date') })
    );
    expect(createWalletTransaction).not.toHaveBeenCalled();
    expect(carReportOrder.create).not.toHaveBeenCalled();
  });
});

describe('carReport.fetchCarReportOrders', () => {
  const row = {
    corporateTxnId: '1754000000000',
    reportType: 'valuation',
    reportName: 'Valuation Report',
    vehicleNumber: 'JK01AV0507',
    vehicleModel: 'Kia Seltos HTX',
    orderDate: '2026-07-20 14:03:11',
    amount: '199.0000',
    reportStatus: 'READY',
    paymentMode: 'WALLET',
    bodyType: 'SEDAN',
    reportUrl: REPORT_URL,
    valuationSpec: { modelName: 'Kia Seltos HTX', year: '2021', kilometres: '48,000 km', city: 'Srinagar' },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    carReportOrder.findAndCountAll.mockResolvedValue({ rows: [row], count: 1 });
    order.findAll.mockResolvedValue([
      { corporateTxnId: '1754000000000', status: 'SUCCESS', paymentMode: 'WALLET' },
    ]);
  });

  it('scopes to the caller and returns a total for pagination', async () => {
    const { req, res } = await run({ query: { page: '2', itemsPerPage: '5' } });
    await fetchCarReportOrders(req, res);

    expect(carReportOrder.findAndCountAll).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ credentialId: 42 }),
        limit: 5,
        offset: 5,
      })
    );
    const payload = res.json.mock.calls[0][0];
    expect(payload.data.count).toBe(1);
    expect(payload.data.orders[0]).toEqual(
      expect.objectContaining({
        orderId: '1754000000000',
        orderDate: '2026-07-20',
        amount: 199,
        status: 'Ready',
        paymentMode: 'Wallet',
      })
    );
  });

  it('widens a date range to whole local days so an evening order stays in its own day', async () => {
    const { req, res } = await run({ query: { from: '2026-07-20', to: '2026-07-20' } });
    await fetchCarReportOrders(req, res);

    const { where } = carReportOrder.findAndCountAll.mock.calls[0][0];
    expect(where.orderDate[Op.between]).toEqual(['2026-07-20 00:00:00', '2026-07-20 23:59:59']);
  });

  it('searches across the id, report name and vehicle', async () => {
    const { req, res } = await run({ query: { searchText: 'Seltos' } });
    await fetchCarReportOrders(req, res);

    const { where } = carReportOrder.findAndCountAll.mock.calls[0][0];
    expect(where[Op.or]).toHaveLength(4);
    expect(where[Op.or][3].vehicleModel[Op.like]).toBe('%Seltos%');
  });

  // Otherwise a search for "50%" becomes a wildcard that matches every row.
  it('escapes LIKE metacharacters in the search term', async () => {
    const { req, res } = await run({ query: { searchText: '50%_x' } });
    await fetchCarReportOrders(req, res);

    const { where } = carReportOrder.findAndCountAll.mock.calls[0][0];
    expect(where[Op.or][0].corporateTxnId[Op.like]).toBe('%50\\%\\_x%');
  });

  // An auto-refunded (CANCELLED) report reads 'Cancelled', not the payment row's
  // scarier 'Failed' (bug 30152).
  it('shows a cancelled report as Cancelled even when the payment row says FAILURE', async () => {
    carReportOrder.findAndCountAll.mockResolvedValueOnce({
      rows: [{ ...row, reportStatus: 'CANCELLED' }],
      count: 1,
    });
    order.findAll.mockResolvedValueOnce([
      { corporateTxnId: '1754000000000', status: 'FAILURE', paymentMode: 'WALLET' },
    ]);

    const { req, res } = await run();
    await fetchCarReportOrders(req, res);

    expect(res.json.mock.calls[0][0].data.orders[0].status).toBe('Cancelled');
  });

  // A refunded order is not a live report, whatever the report pipeline says.
  it('lets a refunded payment override the report status', async () => {
    order.findAll.mockResolvedValueOnce([
      { corporateTxnId: '1754000000000', status: 'REFUND', paymentMode: 'WALLET' },
    ]);

    const { req, res } = await run();
    await fetchCarReportOrders(req, res);

    expect(res.json.mock.calls[0][0].data.orders[0].status).toBe('Cancelled');
  });

  it('skips the payment lookup entirely when there are no orders', async () => {
    carReportOrder.findAndCountAll.mockResolvedValueOnce({ rows: [], count: 0 });

    const { req, res } = await run();
    await fetchCarReportOrders(req, res);

    expect(order.findAll).not.toHaveBeenCalled();
    expect(res.json.mock.calls[0][0].data).toEqual({ orders: [], count: 0 });
  });
});

describe('carReport.fetchCarReportOrderDetail', () => {
  const row = {
    corporateTxnId: '1754000000000',
    reportType: 'valuation',
    reportName: 'Valuation Report',
    vehicleNumber: 'JK01AV0507',
    vehicleModel: 'Kia Seltos HTX',
    orderDate: '2026-07-20 14:03:11',
    amount: '199.0000',
    reportStatus: 'READY',
    paymentMode: 'WALLET',
    reportUrl: REPORT_URL,
    valuationSpec: { modelName: 'Kia Seltos HTX', year: '2021', kilometres: '48,000 km', city: 'Srinagar' },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    carReportOrder.findOne.mockResolvedValue(row);
    order.findOne.mockResolvedValue({ status: 'SUCCESS', paymentMode: 'WALLET' });
    // Pass-through by default — the vendor answered "pending", nothing changed.
    materialisePaasReport.mockImplementation(async (r) => r);
    fetchValuationBands.mockImplementation(async (r) => r);
    attachHistoryReportPdf.mockImplementation(async (r) => r);
  });

  it('emits the stored vendor PDF at the top level for the header button', async () => {
    const { req, res, next } = await run({ params: { orderId: '1754000000000' } });
    await fetchCarReportOrderDetail(req, res, next);

    expect(res.json.mock.calls[0][0].data.reportUrl).toBe(REPORT_URL);
  });

  it('returns the valuation card data and a progress tracker', async () => {
    const { req, res, next } = await run({ params: { orderId: '1754000000000' } });
    await fetchCarReportOrderDetail(req, res, next);

    const detail = res.json.mock.calls[0][0].data;
    expect(detail.valuation).toEqual({
      modelName: 'Kia Seltos HTX',
      year: '2021',
      kilometres: '48,000 km',
      city: 'Srinagar',
      reportUrl: REPORT_URL,
    });
    expect(detail.steps).toHaveLength(3);
    expect(detail.steps.every((s) => s.state === 'done')).toBe(true);
  });

  // credentialId belongs in the lookup, not in a check afterwards, so another
  // corporate's order is simply not found rather than fetched-then-rejected.
  it('scopes the lookup by credentialId', async () => {
    const { req, res, next } = await run({ params: { orderId: '1754000000000' } });
    await fetchCarReportOrderDetail(req, res, next);

    expect(carReportOrder.findOne).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { corporateTxnId: '1754000000000', credentialId: 42 },
        raw: true,
      })
    );
  });

  it('404s an order that is not the caller\'s', async () => {
    carReportOrder.findOne.mockResolvedValueOnce(null);

    const { req, res, next } = await run({ params: { orderId: '999' } });
    await fetchCarReportOrderDetail(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ status_code: 404 }));
    expect(res.json).not.toHaveBeenCalled();
  });

  // The page renders the card on `{!!order.valuation && ...}`, so an empty object here
  // would render a download card with nothing behind it.
  it('omits the valuation key while the vendor PDF has not arrived', async () => {
    carReportOrder.findOne.mockResolvedValueOnce({
      ...row,
      reportStatus: 'BUILDING',
      reportUrl: null,
    });

    const { req, res, next } = await run({ params: { orderId: '1754000000000' } });
    await fetchCarReportOrderDetail(req, res, next);

    expect(res.json.mock.calls[0][0].data).not.toHaveProperty('valuation');
  });

  // A BUILDING valuation is re-checked against Droom by this very request — see
  // carReportPaas.js. The handler must use what comes back, not the row it read.
  it('materialises a building valuation order and renders its PDF link', async () => {
    carReportOrder.findOne.mockResolvedValueOnce({
      ...row,
      reportStatus: 'BUILDING',
      reportUrl: null,
      vendorReference: '203952333',
    });
    materialisePaasReport.mockResolvedValueOnce({
      ...row,
      reportStatus: 'READY',
      reportUrl: REPORT_URL,
      vendorReference: '203952333',
    });

    const { req, res, next } = await run({ params: { orderId: '1754000000000' } });
    await fetchCarReportOrderDetail(req, res, next);

    expect(materialisePaasReport).toHaveBeenCalled();
    const detail = res.json.mock.calls[0][0].data;
    expect(detail.status).toBe('Ready');
    expect(detail.valuation.reportUrl).toBe(REPORT_URL);
  });

  it('does not poll a valuation that is already ready', async () => {
    const { req, res, next } = await run({ params: { orderId: '1754000000000' } });
    await fetchCarReportOrderDetail(req, res, next);

    expect(materialisePaasReport).not.toHaveBeenCalled();
    expect(res.json.mock.calls[0][0].data.valuation).toBeDefined();
  });

  const BANDS = [
    { grade: 'Excellent', min: 486000, max: 515000 },
    { grade: 'Very good', min: 452000, max: 486000 },
  ];

  // The Fair Market Value band chips are filled on first open of a READY order, and
  // the handler must render what the fetch returns, not the bare row.
  it('fetches the price bands on first open and renders them', async () => {
    fetchValuationBands.mockResolvedValueOnce({ ...row, valuationBands: BANDS });

    const { req, res, next } = await run({ params: { orderId: '1754000000000' } });
    await fetchCarReportOrderDetail(req, res, next);

    expect(fetchValuationBands).toHaveBeenCalled();
    expect(res.json.mock.calls[0][0].data.valuation.bands).toEqual(BANDS);
  });

  it('does not re-fetch bands that are already stored', async () => {
    carReportOrder.findOne.mockResolvedValueOnce({ ...row, valuationBands: BANDS });

    const { req, res, next } = await run({ params: { orderId: '1754000000000' } });
    await fetchCarReportOrderDetail(req, res, next);

    expect(fetchValuationBands).not.toHaveBeenCalled();
    expect(res.json.mock.calls[0][0].data.valuation.bands).toEqual(BANDS);
  });

  // [] is the stored "vendor could not price this spec" answer — no retry, no chips.
  it('omits the bands key for a spec the vendor could not price', async () => {
    carReportOrder.findOne.mockResolvedValueOnce({ ...row, valuationBands: [] });

    const { req, res, next } = await run({ params: { orderId: '1754000000000' } });
    await fetchCarReportOrderDetail(req, res, next);

    expect(fetchValuationBands).not.toHaveBeenCalled();
    expect(res.json.mock.calls[0][0].data.valuation).not.toHaveProperty('bands');
  });

  // A BUILDING history order is materialised by this very request — see
  // carReportHistory.js. The handler must use what comes back, not the row it read.
  it('materialises a building history order and renders its result', async () => {
    carReportOrder.findOne.mockResolvedValueOnce({
      ...row,
      reportType: 'history',
      reportStatus: 'BUILDING',
      valuationSpec: null,
      historyResult: null,
    });
    materialiseHistoryReport.mockResolvedValueOnce({
      ...row,
      reportType: 'history',
      reportStatus: 'READY',
      valuationSpec: null,
      historyResult: { registrationNumber: 'HR26DD9739', ownership: 'KHUSHBU KUMARI (Owner 1)' },
    });

    const { req, res, next } = await run({ params: { orderId: '1754000000000' } });
    await fetchCarReportOrderDetail(req, res, next);

    expect(materialiseHistoryReport).toHaveBeenCalled();
    const detail = res.json.mock.calls[0][0].data;
    expect(detail.status).toBe('Ready');
    expect(detail.history).toEqual(
      expect.objectContaining({ registrationNumber: 'HR26DD9739' })
    );
    expect(detail).not.toHaveProperty('valuation');
  });

  it('does not re-fetch a history report that is already built', async () => {
    carReportOrder.findOne.mockResolvedValueOnce({
      ...row,
      reportType: 'history',
      reportStatus: 'READY',
      historyResult: { registrationNumber: 'HR26DD9739' },
    });

    const { req, res, next } = await run({ params: { orderId: '1754000000000' } });
    await fetchCarReportOrderDetail(req, res, next);

    expect(materialiseHistoryReport).not.toHaveBeenCalled();
    expect(res.json.mock.calls[0][0].data.history).toBeDefined();
  });

  // Presence-based, like `valuation` — a history order whose lookup has not produced
  // anything yet must render the progress tracker, not a blank Vehicle History card.
  it('omits the history key while the report is still building', async () => {
    carReportOrder.findOne.mockResolvedValueOnce({
      ...row,
      reportType: 'history',
      reportStatus: 'BUILDING',
      historyResult: null,
    });
    materialiseHistoryReport.mockImplementationOnce(async (r) => r);

    const { req, res, next } = await run({ params: { orderId: '1754000000000' } });
    await fetchCarReportOrderDetail(req, res, next);

    expect(res.json.mock.calls[0][0].data).not.toHaveProperty('history');
  });

  it('parses a JSON column that came back as a string', async () => {
    carReportOrder.findOne.mockResolvedValueOnce({
      ...row,
      valuationSpec: JSON.stringify(row.valuationSpec),
    });

    const { req, res, next } = await run({ params: { orderId: '1754000000000' } });
    await fetchCarReportOrderDetail(req, res, next);

    expect(res.json.mock.calls[0][0].data.valuation.kilometres).toBe('48,000 km');
  });
});
