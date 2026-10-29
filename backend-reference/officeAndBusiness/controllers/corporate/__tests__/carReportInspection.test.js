const { bookInspection } = require('../../../services/droomInspection');
const { refundWalletTransaction } = require('../../../utils/walletTransaction');
const carReportOrder = require('../../../models/entities/carReportOrder');

jest.mock('../../../services/droomInspection', () => ({ bookInspection: jest.fn() }));
// DB-backed product codes delegate to the static map here — basic resolves, the rest null.
jest.mock('../../../utils/carReportPlans', () => {
  const { resolveInspectionProductCode } = jest.requireActual('../../../utils/carReport');
  return {
    resolvePlanProductCode: jest.fn(async (packageId) => resolveInspectionProductCode(packageId)),
  };
});
jest.mock('../../../utils/walletTransaction', () => ({ refundWalletTransaction: jest.fn() }));
jest.mock('../../../utils/carReportRefundJournal', () => ({ publishStoredRefundJournal: jest.fn() }));
jest.mock('../../../utils/carReportEmail', () => ({ sendReportReadyEmail: jest.fn() }));
// Entities are mocked directly rather than leaning on tests/setup.js — requiring a real
// entity pulls in configs/database, which pulls in the Logtail logger.
jest.mock('../../../models/entities/carReportOrder', () => ({
  update: jest.fn(),
  findOne: jest.fn(),
}));
jest.mock('../../../utils/loggerHelper', () => ({ customLog: jest.fn() }));
jest.mock('../../../utils/commonUploadFile', () => ({ uploadPdfBuffer: jest.fn() }));

const { dispatchInspection, completeInspectionFromWebhook } = require('../carReportInspection');

// The order as the purchase controller wrote it: booking captured, nothing sent yet.
const bookedRow = () => ({
  id: 77,
  corporateTxnId: '1785737000175',
  credentialId: 42,
  reportType: 'inspection',
  reportStatus: 'BOOKED',
  vendorReference: null,
  vehicleNumber: 'KA01AB1234',
  bodyType: 'SUV',
  formValues: {
    packageId: 'basic',
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
  },
});

const req = {
  LogTraceId: 'trace-1',
  user: { id: 42, name: 'Asha Menon', email: 'asha@peko.one', registeredBy: 7 },
};

const httpError = (status) => Object.assign(new Error(`HTTP ${status}`), { response: { status } });

describe('dispatchInspection — success', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    bookInspection.mockResolvedValue({ code: 'success' });
    carReportOrder.update.mockResolvedValue([1]);
  });

  it('sends the booking and marks the order dispatched', async () => {
    const result = await dispatchInspection(bookedRow(), req);

    const [updates, where] = carReportOrder.update.mock.calls[0];
    expect(where).toEqual({ where: { id: 77 } });
    // vendorReference doubles as the dispatch marker, so it must be set on success.
    expect(updates.vendorReference).toBe('1785737000175');
    expect(result.vendorReference).toBe('1785737000175');
    // Still BOOKED — dispatching does not advance the lifecycle.
    expect(result.reportStatus).toBe('BOOKED');
  });

  it('joins the slot halves into the vendor datetime', async () => {
    await dispatchInspection(bookedRow(), req);

    expect(bookInspection).toHaveBeenCalledWith(
      expect.objectContaining({
        slot1: '2026-08-05 14:00:00',
        // Unpicked — postDroomForm drops it rather than sending a half-string.
        slot2: '',
        proposalNumber: '1785737000175',
        registrationNumber: 'KA01AB1234',
        vehicleType: 'SUV',
        inspectionCityName: 'Bengaluru',
        productCode: 'self_inspection_tkm_insurance_ai',
      }),
      'trace-1'
    );
  });

  it('stores Droom\'s own order id as the vendor reference when it answers with one', async () => {
    bookInspection.mockResolvedValueOnce({ code: 'success', data: { order_id: 220930 } });

    const result = await dispatchInspection(bookedRow(), req);

    expect(result.vendorReference).toBe('220930');
  });

  // Droom books by product_code; a package the vendor has not named cannot be
  // dispatched — refund rather than book the wrong product.
  it('cancels and refunds a package with no vendor product code', async () => {
    const row = bookedRow();
    row.formValues.packageId = 'premium';

    const result = await dispatchInspection(row, req);

    expect(bookInspection).not.toHaveBeenCalled();
    expect(result.reportStatus).toBe('CANCELLED');
    expect(refundWalletTransaction).toHaveBeenCalled();
  });

  // The form has no email field, so the authenticated user's is the only address we have.
  it('sends the client identity and a customer email', async () => {
    await dispatchInspection(bookedRow(), req);

    expect(bookInspection).toHaveBeenCalledWith(
      expect.objectContaining({
        customerEmail: 'asha@peko.one',
        clientName: 'Asha Menon',
        clientSpocEmail: 'asha@peko.one',
      }),
      'trace-1'
    );
  });

  // Droom returns no documented body, so keeping the raw one is how we learn its shape.
  it('keeps the raw vendor body', async () => {
    await dispatchInspection(bookedRow(), req);

    expect(JSON.parse(carReportOrder.update.mock.calls[0][0].vendorResponse)).toEqual({
      code: 'success',
    });
  });

  it('reads formValues that came back from the DB as a JSON string', async () => {
    const row = bookedRow();
    await dispatchInspection({ ...row, formValues: JSON.stringify(row.formValues) }, req);

    expect(bookInspection).toHaveBeenCalledWith(
      expect.objectContaining({ slot1: '2026-08-05 14:00:00' }),
      'trace-1'
    );
  });

  it('never refunds a booking it placed', async () => {
    await dispatchInspection(bookedRow(), req);

    expect(refundWalletTransaction).not.toHaveBeenCalled();
  });
});

describe('dispatchInspection — vendor rejection (4xx)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    carReportOrder.update.mockResolvedValue([1]);
    refundWalletTransaction.mockResolvedValue({});
  });

  // Droom documents no error contract, so HTTP semantics are the only signal: a 4xx is a
  // refusal of this specific booking and will never succeed on retry.
  it.each([400, 404, 422])('cancels and refunds on a %s', async (status) => {
    bookInspection.mockRejectedValueOnce(httpError(status));

    const result = await dispatchInspection(bookedRow(), req);

    expect(carReportOrder.update).toHaveBeenCalledWith(
      { reportStatus: 'CANCELLED' },
      { where: { id: 77, reportStatus: 'BOOKED', vendorReference: null } }
    );
    expect(refundWalletTransaction).toHaveBeenCalledWith(
      expect.objectContaining({ corporateTxnId: '1785737000175', status: 'FAILURE' })
    );
    expect(result.reportStatus).toBe('CANCELLED');
  });

  it('never marks a rejected booking as dispatched', async () => {
    bookInspection.mockRejectedValueOnce(httpError(400));

    await dispatchInspection(bookedRow(), req);

    expect(carReportOrder.update).toHaveBeenCalledTimes(1);
    expect(carReportOrder.update.mock.calls[0][0]).not.toHaveProperty('vendorReference');
  });

  // The payment leg and a concurrent read can both reach this branch. The conditional
  // UPDATE decides which one owns the refund.
  it('refunds only once when another call already cancelled the order', async () => {
    bookInspection.mockRejectedValueOnce(httpError(400));
    carReportOrder.update.mockResolvedValueOnce([0]);

    const result = await dispatchInspection(bookedRow(), req);

    expect(refundWalletTransaction).not.toHaveBeenCalled();
    expect(result.reportStatus).toBe('CANCELLED');
  });
});

describe('dispatchInspection — transient failure', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    carReportOrder.update.mockResolvedValue([1]);
  });

  // Refunding here would cancel a visit the customer may well still get, and there is no
  // way back from CANCELLED.
  it.each([500, 502, 504])('leaves the order undispatched on a %s', async (status) => {
    bookInspection.mockRejectedValueOnce(httpError(status));

    const result = await dispatchInspection(bookedRow(), req);

    expect(result.reportStatus).toBe('BOOKED');
    expect(result.vendorReference).toBeNull();
    expect(carReportOrder.update).not.toHaveBeenCalled();
    expect(refundWalletTransaction).not.toHaveBeenCalled();
  });

  it('treats a network error with no response as transient', async () => {
    bookInspection.mockRejectedValueOnce(new Error('socket hang up'));

    const result = await dispatchInspection(bookedRow(), req);

    expect(result.vendorReference).toBeNull();
    expect(refundWalletTransaction).not.toHaveBeenCalled();
  });

  // It runs inside a payment request and inside a GET; neither may be broken by the vendor.
  it('never throws, whatever the vendor did', async () => {
    bookInspection.mockRejectedValueOnce({ response: { status: 503, data: 'boom' } });

    await expect(dispatchInspection(bookedRow(), req)).resolves.toEqual(
      expect.objectContaining({ reportStatus: 'BOOKED' })
    );
  });
});

describe('completeInspectionFromWebhook', () => {
  const dbRow = {
    id: 77,
    corporateTxnId: '1785737000175',
    reportType: 'inspection',
    reportStatus: 'BOOKED',
    vendorReference: '220930',
  };
  const PDF_URL = 'https://cdn1.acedms.com/inspection/220930_report.pdf';

  beforeEach(() => {
    jest.clearAllMocks();
    carReportOrder.findOne.mockResolvedValue(dbRow);
    carReportOrder.update.mockResolvedValue([1]);
  });

  it('matches by the vendor order id and completes when a report link is present', async () => {
    const { sendReportReadyEmail } = require('../../../utils/carReportEmail');
    const outcome = await completeInspectionFromWebhook({
      order_id: 220930,
      status: 'complete',
      report_url: PDF_URL,
    });

    expect(carReportOrder.findOne).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { vendorReference: '220930', reportType: 'inspection' },
      })
    );
    // Conditional on BOOKED so a redelivered completion cannot double-email.
    expect(carReportOrder.update).toHaveBeenCalledWith(
      expect.objectContaining({ reportUrl: PDF_URL, reportStatus: 'READY' }),
      { where: { id: 77, reportStatus: 'BOOKED' } }
    );
    expect(sendReportReadyEmail).toHaveBeenCalledWith(
      expect.objectContaining({ corporateTxnId: '1785737000175', reportStatus: 'READY' })
    );
    expect(outcome).toEqual({ completed: true, corporateTxnId: '1785737000175' });
  });

  // proposal_id is Droom's own numbering — order_id is the only match key.
  it('does not match by proposal_id alone', async () => {
    const outcome = await completeInspectionFromWebhook({ proposal_id: '20260824115130' });

    expect(outcome.completed).toBe(false);
    expect(carReportOrder.findOne).not.toHaveBeenCalled();
  });

  // The confirmed payload carries the PDF itself, base64-encoded, in report_url —
  // it is decoded, hosted on our storage, and kept out of the stored payload.
  it('decodes the base64 report PDF, hosts it and completes the order', async () => {
    const { uploadPdfBuffer } = require('../../../utils/commonUploadFile');
    const hostedUrl = 'https://firebasestorage.googleapis.com/v0/b/x/o/report.pdf';
    uploadPdfBuffer.mockResolvedValueOnce(hostedUrl);
    const base64Pdf = Buffer.from(`%PDF-1.4 ${'x'.repeat(600)}`).toString('base64');

    const outcome = await completeInspectionFromWebhook({
      order_id: 220930,
      proposal_id: '20260824115130',
      reason: 'Inspection completed successfully',
      comment: 'No issues found',
      report_url: base64Pdf,
    });

    expect(uploadPdfBuffer).toHaveBeenCalledWith(expect.any(Buffer), 'carReports/inspection');
    expect(carReportOrder.update).toHaveBeenCalledWith(
      expect.objectContaining({ reportUrl: hostedUrl, reportStatus: 'READY' }),
      { where: { id: 77, reportStatus: 'BOOKED' } }
    );
    // The stored payload must not carry the base64 body.
    const stored = carReportOrder.update.mock.calls[0][0].vendorResponse;
    expect(stored).toContain('[base64 pdf');
    expect(stored.length).toBeLessThan(1000);
    expect(outcome).toEqual({ completed: true, corporateTxnId: '1785737000175' });
  });

  // Garbage that is not a PDF must not complete the order or reach storage.
  it('treats a non-PDF report body as a progress-only update', async () => {
    const { uploadPdfBuffer } = require('../../../utils/commonUploadFile');
    const outcome = await completeInspectionFromWebhook({
      order_id: 220930,
      report_url: Buffer.from('not a pdf at all').toString('base64'),
    });

    expect(uploadPdfBuffer).not.toHaveBeenCalled();
    expect(carReportOrder.update).toHaveBeenCalledWith(
      { vendorResponse: expect.any(String) },
      { where: { id: 77 } }
    );
    expect(outcome.completed).toBe(false);
  });

  // A progress-only update (technician assigned, QC…) still gets stored for later
  // status mapping, but must not flip the order READY.
  it('stores a progress update without completing the order', async () => {
    const outcome = await completeInspectionFromWebhook({
      order_id: '220930',
      status: 'technician_assigned',
    });

    expect(carReportOrder.update).toHaveBeenCalledWith(
      { vendorResponse: expect.stringContaining('technician_assigned') },
      { where: { id: 77 } }
    );
    expect(outcome.completed).toBe(false);
  });

  it('reports a payload with no order reference without touching the DB', async () => {
    const outcome = await completeInspectionFromWebhook({ hello: 'world' });

    expect(outcome.completed).toBe(false);
    expect(carReportOrder.findOne).not.toHaveBeenCalled();
  });

  it('reports an unknown order', async () => {
    carReportOrder.findOne.mockResolvedValueOnce(null);

    const outcome = await completeInspectionFromWebhook({ order_id: 999 });

    expect(outcome.completed).toBe(false);
    expect(carReportOrder.update).not.toHaveBeenCalled();
  });
});
