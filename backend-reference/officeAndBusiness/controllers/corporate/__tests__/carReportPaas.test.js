const { createPaasReport, getPaasReportStatus } = require('../../../services/droomPaasReport');
const { getUsedPriceRange } = require('../../../services/droomValuation');
const { refundWalletTransaction } = require('../../../utils/walletTransaction');
const carReportOrder = require('../../../models/entities/carReportOrder');
const { customLog } = require('../../../utils/loggerHelper');

jest.mock('../../../services/droomPaasReport', () => ({
  createPaasReport: jest.fn(),
  getPaasReportStatus: jest.fn(),
}));
jest.mock('../../../services/droomValuation', () => ({
  getUsedPriceRange: jest.fn(),
}));
jest.mock('../../../utils/walletTransaction', () => ({ refundWalletTransaction: jest.fn() }));
jest.mock('../../../utils/carReportRefundJournal', () => ({ publishStoredRefundJournal: jest.fn() }));
jest.mock('../../../utils/carReportEmail', () => ({ sendReportReadyEmail: jest.fn() }));
jest.mock('../../../models/entities/carReportOrder', () => ({
  update: jest.fn(),
  findOne: jest.fn(),
}));
jest.mock('../../../utils/loggerHelper', () => ({ customLog: jest.fn() }));

const {
  dispatchPaasReport,
  materialisePaasReport,
  fetchValuationBands,
  completePaasReportFromWebhook,
} = require('../carReportPaas');

const REPORT_URL = 'https://img1.orangebookvalue.com/photos/premium_reports/x.pdf';

const req = {
  user: { name: 'Asha Menon', registeredBy: 3 },
  LogTraceId: 'trace-1',
};

const baseRow = {
  id: 55,
  corporateTxnId: '1785737000175',
  reportType: 'valuation',
  reportStatus: 'BUILDING',
  vendorReference: null,
  formValues: {
    make: 'Kia',
    model: 'Seltos',
    manufacturingYear: '2021',
    variant: 'HTX',
    kilometresDriven: '48000',
    city: 'Srinagar',
    vehicleCategory: 'car',
  },
};

beforeEach(() => {
  jest.clearAllMocks();
  carReportOrder.update.mockResolvedValue([1]);
  refundWalletTransaction.mockResolvedValue({});
});

describe('dispatchPaasReport', () => {
  beforeEach(() => {
    createPaasReport.mockResolvedValue({
      code: 'success',
      data: { order_id: 203952333, report_path: null, status: 'pending' },
    });
  });

  it('orders the report from the form spec and stores the vendor order id', async () => {
    const row = await dispatchPaasReport(baseRow, req);

    expect(createPaasReport).toHaveBeenCalledWith(
      expect.objectContaining({
        make: 'Kia',
        model: 'Seltos',
        year: '2021',
        trim: 'HTX',
        city: 'srinagar',
        owners: 'Asha Menon',
        kmsDriven: '48000',
        category: 'car',
      }),
      'trace-1'
    );
    expect(carReportOrder.update).toHaveBeenCalledWith(
      expect.objectContaining({ vendorReference: '203952333' }),
      { where: { id: 55 } }
    );
    expect(row.vendorReference).toBe('203952333');
    expect(row.reportStatus).toBe('BUILDING');
  });

  // formValues comes back as a string when the row was read with raw:true.
  it('parses stringified formValues', async () => {
    await dispatchPaasReport({ ...baseRow, formValues: JSON.stringify(baseRow.formValues) }, req);

    expect(createPaasReport).toHaveBeenCalledWith(
      expect.objectContaining({ make: 'Kia' }),
      'trace-1'
    );
  });

  // A 4xx is the vendor refusing this specific spec — it will never succeed on retry, so
  // the customer gets their money back.
  it('cancels and refunds when the vendor rejects the spec outright', async () => {
    createPaasReport.mockRejectedValueOnce({ response: { status: 422 } });

    const row = await dispatchPaasReport(baseRow, req);

    expect(row.reportStatus).toBe('CANCELLED');
    expect(carReportOrder.update).toHaveBeenCalledWith(
      { reportStatus: 'CANCELLED' },
      { where: { id: 55, reportStatus: 'BUILDING' } }
    );
    expect(refundWalletTransaction).toHaveBeenCalledWith(
      expect.objectContaining({ corporateTxnId: '1785737000175', status: 'FAILURE' })
    );
  });

  // Only the caller that actually flips the row refunds — a concurrent read that lost
  // the conditional UPDATE must not double-refund.
  it('does not refund when another call already flipped the row', async () => {
    createPaasReport.mockRejectedValueOnce({ response: { status: 400 } });
    carReportOrder.update.mockResolvedValueOnce([0]);

    await dispatchPaasReport(baseRow, req);

    expect(refundWalletTransaction).not.toHaveBeenCalled();
  });

  // Vendor down or network blip — recoverable, so the order must survive for the read
  // path to re-order.
  it('leaves the order untouched on a transient failure', async () => {
    createPaasReport.mockRejectedValueOnce({ response: { status: 503 } });

    const row = await dispatchPaasReport(baseRow, req);

    expect(row).toEqual(baseRow);
    expect(carReportOrder.update).not.toHaveBeenCalled();
    expect(refundWalletTransaction).not.toHaveBeenCalled();
  });

  // A 2xx with no order id gives us nothing to poll — but refunding on an ambiguous
  // body would be worse. Log loudly, leave it for the read path.
  it('leaves the order untouched when the create body carries no order id', async () => {
    createPaasReport.mockResolvedValueOnce({ code: 'success', data: {} });

    const row = await dispatchPaasReport(baseRow, req);

    expect(row).toEqual(baseRow);
    expect(carReportOrder.update).not.toHaveBeenCalled();
    expect(customLog).toHaveBeenCalledWith(
      'trace-1',
      'error',
      expect.objectContaining({ message: expect.stringContaining('no order id') }),
      'CAR_REPORT'
    );
  });
});

describe('materialisePaasReport', () => {
  const orderedRow = { ...baseRow, vendorReference: '203952333' };

  it('re-orders a report the payment leg never managed to submit', async () => {
    createPaasReport.mockResolvedValueOnce({
      code: 'success',
      data: { order_id: 203952333, status: 'pending' },
    });

    const row = await materialisePaasReport(baseRow, req);

    expect(createPaasReport).toHaveBeenCalled();
    expect(getPaasReportStatus).not.toHaveBeenCalled();
    expect(row.vendorReference).toBe('203952333');
  });

  it('sends the report-ready email when the poll completes the order', async () => {
    const { sendReportReadyEmail } = require('../../../utils/carReportEmail');
    getPaasReportStatus.mockResolvedValueOnce({
      code: 'success',
      data: { order_id: '203952333', report_url: REPORT_URL, status: 'completed' },
    });

    await materialisePaasReport({ ...baseRow, vendorReference: '203952333' }, req);

    expect(sendReportReadyEmail).toHaveBeenCalledWith(
      expect.objectContaining({ corporateTxnId: '1785737000175', reportStatus: 'READY' })
    );
  });

  // The conditional update lost — someone else completed and emailed already.
  it('does not email when another completer already flipped the order', async () => {
    const { sendReportReadyEmail } = require('../../../utils/carReportEmail');
    carReportOrder.update.mockResolvedValueOnce([0]);
    getPaasReportStatus.mockResolvedValueOnce({
      code: 'success',
      data: { order_id: '203952333', report_url: REPORT_URL, status: 'completed' },
    });

    await materialisePaasReport({ ...baseRow, vendorReference: '203952333' }, req);

    expect(sendReportReadyEmail).not.toHaveBeenCalled();
  });

  it('completes the order when the vendor says the PDF is ready', async () => {
    getPaasReportStatus.mockResolvedValueOnce({
      code: 'success',
      data: {
        order_id: '203952333',
        report_path: '/photos/premium_reports/x.pdf',
        report_url: REPORT_URL,
        status: 'completed',
      },
    });

    const row = await materialisePaasReport(orderedRow, req);

    expect(getPaasReportStatus).toHaveBeenCalledWith('203952333', 'trace-1');
    expect(row.reportStatus).toBe('READY');
    expect(row.reportUrl).toBe(REPORT_URL);
    // Conditional on BUILDING so the webhook and this poll cannot both complete it.
    expect(carReportOrder.update).toHaveBeenCalledWith(
      expect.objectContaining({ reportStatus: 'READY', reportUrl: REPORT_URL }),
      { where: { id: 55, reportStatus: 'BUILDING' } }
    );
  });

  it('leaves a still-pending order building', async () => {
    getPaasReportStatus.mockResolvedValueOnce({
      code: 'success',
      data: { order_id: '203952333', status: 'pending' },
    });

    const row = await materialisePaasReport(orderedRow, req);

    expect(row).toEqual(orderedRow);
    expect(carReportOrder.update).not.toHaveBeenCalled();
  });

  it('cancels and refunds when the vendor definitively failed the report', async () => {
    getPaasReportStatus.mockResolvedValueOnce({
      code: 'success',
      data: { order_id: '203952333', status: 'failed' },
    });

    const row = await materialisePaasReport(orderedRow, req);

    expect(row.reportStatus).toBe('CANCELLED');
    expect(refundWalletTransaction).toHaveBeenCalled();
  });

  it('leaves the order building when the poll itself fails', async () => {
    getPaasReportStatus.mockRejectedValueOnce(new Error('timeout'));

    const row = await materialisePaasReport(orderedRow, req);

    expect(row).toEqual(orderedRow);
    expect(carReportOrder.update).not.toHaveBeenCalled();
  });
});

describe('fetchValuationBands', () => {
  const readyRow = {
    ...baseRow,
    reportStatus: 'READY',
    vendorReference: '203952333',
  };
  const obvBody = {
    code: 'success',
    data: {
      Excellent: { range_from: 486000, range_to: 515000 },
      'Very Good': { range_from: 452000, range_to: 486000 },
      Good: { range_from: 413000, range_to: 452000 },
      Fair: { range_from: 365000, range_to: 413000 },
    },
  };

  it('fetches the OBV range from the form spec and persists the bands', async () => {
    getUsedPriceRange.mockResolvedValueOnce(obvBody);

    const row = await fetchValuationBands(readyRow, req);

    expect(getUsedPriceRange).toHaveBeenCalledWith(
      expect.objectContaining({
        make: 'Kia',
        model: 'Seltos',
        year: '2021',
        trim: 'HTX',
        kmsDriven: '48000',
        city: 'srinagar',
        noOfOwners: '1',
      }),
      'trace-1'
    );
    expect(row.valuationBands).toHaveLength(4);
    expect(row.valuationBands[0]).toEqual({ grade: 'Excellent', min: 486000, max: 515000 });
    expect(carReportOrder.update).toHaveBeenCalledWith(
      { valuationBands: row.valuationBands },
      { where: { id: 55 } }
    );
  });

  // A definitive "cannot price" is persisted as [] so the order stops re-buying the
  // lookup on every open — unlike an outage, which stays retryable (null column).
  it('stores an empty band set when the vendor cannot price the spec', async () => {
    getUsedPriceRange.mockResolvedValueOnce({ code: 'failed', data: [] });

    const row = await fetchValuationBands(readyRow, req);

    expect(row.valuationBands).toEqual([]);
    expect(carReportOrder.update).toHaveBeenCalledWith(
      { valuationBands: [] },
      { where: { id: 55 } }
    );
  });

  it('leaves the row untouched when the lookup itself fails', async () => {
    getUsedPriceRange.mockRejectedValueOnce(new Error('down'));

    const row = await fetchValuationBands(readyRow, req);

    expect(row).toEqual(readyRow);
    expect(carReportOrder.update).not.toHaveBeenCalled();
  });
});

describe('completePaasReportFromWebhook', () => {
  const dbRow = {
    ...baseRow,
    vendorReference: '203952333',
  };

  beforeEach(() => {
    carReportOrder.findOne.mockResolvedValue(dbRow);
  });

  it('completes the order from a status-shaped payload', async () => {
    const outcome = await completePaasReportFromWebhook({
      code: 'success',
      data: { order_id: '203952333', report_url: REPORT_URL, status: 'completed' },
    });

    expect(carReportOrder.findOne).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { vendorReference: '203952333', reportType: 'valuation' },
      })
    );
    expect(carReportOrder.update).toHaveBeenCalledWith(
      expect.objectContaining({ reportStatus: 'READY', reportUrl: REPORT_URL }),
      { where: { id: 55, reportStatus: 'BUILDING' } }
    );
    expect(outcome).toEqual({ completed: true, corporateTxnId: '1785737000175' });
  });

  // The payload shape is unconfirmed — the fields may arrive flat on the body.
  it('accepts the order id flat on the body', async () => {
    const outcome = await completePaasReportFromWebhook({
      order_id: 203952333,
      report_url: REPORT_URL,
      status: 'completed',
    });

    expect(outcome.completed).toBe(true);
  });

  // A webhook that names no URL is treated as a "check now" signal.
  it('falls back to the status endpoint when the payload has no report url', async () => {
    getPaasReportStatus.mockResolvedValueOnce({
      code: 'success',
      data: { order_id: '203952333', report_url: REPORT_URL, status: 'completed' },
    });

    const outcome = await completePaasReportFromWebhook({ order_id: '203952333' });

    expect(getPaasReportStatus).toHaveBeenCalledWith('203952333', null);
    expect(outcome.completed).toBe(true);
  });

  it('reports an unreadable payload without touching the DB', async () => {
    const outcome = await completePaasReportFromWebhook({ hello: 'world' });

    expect(outcome.completed).toBe(false);
    expect(carReportOrder.findOne).not.toHaveBeenCalled();
  });

  it('reports an unknown vendor order id', async () => {
    carReportOrder.findOne.mockResolvedValueOnce(null);

    const outcome = await completePaasReportFromWebhook({ order_id: '999' });

    expect(outcome.completed).toBe(false);
    expect(carReportOrder.update).not.toHaveBeenCalled();
  });

  // Redelivery of a webhook for a settled order must be a no-op.
  it('ignores an order that has already settled', async () => {
    carReportOrder.findOne.mockResolvedValueOnce({ ...dbRow, reportStatus: 'READY' });

    const outcome = await completePaasReportFromWebhook({
      order_id: '203952333',
      report_url: REPORT_URL,
    });

    expect(outcome).toEqual(expect.objectContaining({ completed: false, reason: 'already settled' }));
    expect(carReportOrder.update).not.toHaveBeenCalled();
  });
});
