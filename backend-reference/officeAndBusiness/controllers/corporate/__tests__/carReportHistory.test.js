const {
  getVehicleRcDetails,
  getVehicleChallanDetails,
  getVehicleRcChallanReport,
} = require('../../../services/droomHistory');
const { refundWalletTransaction } = require('../../../utils/walletTransaction');
const carReportOrder = require('../../../models/entities/carReportOrder');

jest.mock('../../../services/droomHistory', () => ({
  getVehicleRcDetails: jest.fn(),
  getVehicleChallanDetails: jest.fn(),
  getVehicleRcChallanReport: jest.fn(),
}));
jest.mock('../../../utils/walletTransaction', () => ({ refundWalletTransaction: jest.fn() }));
jest.mock('../../../utils/carReportRefundJournal', () => ({ publishStoredRefundJournal: jest.fn() }));
jest.mock('../../../utils/carReportEmail', () => ({ sendReportReadyEmail: jest.fn() }));
// Entities are mocked directly rather than leaning on tests/setup.js — requiring a real
// entity pulls in configs/database, which pulls in the Logtail logger.
jest.mock('../../../models/entities/carReportOrder', () => ({ update: jest.fn() }));
jest.mock('../../../utils/loggerHelper', () => ({ customLog: jest.fn() }));

const { materialiseHistoryReport, attachHistoryReportPdf } = require('../carReportHistory');

const PDF_URL =
  'https://cdn1.acedms.com/vehicle_history/platinum/HR26DD9739_platinum_history_report.pdf';

// The captured 200 from DROOM_MYBIZ_API_REFERENCE.md §4.
const RC_DATA = {
  blacklisted: false,
  blacklisted_reason: 'NA',
  body_type: 'S.U.V.',
  fuel_type: 'PETROL',
  hypothecation_type: 'Yes',
  insurance_company: 'HDFC ERGO GENERAL INSURANCE COMPANY LTD',
  insurance_upto: '27-March-2027',
  owner_serial_number: '1',
  owners_name: 'KHUSHBU KUMARI',
  pucc_upto: '6-June-2026',
  registration_date: '21-April-2017',
  registration_number: 'HR26DD9739',
  rto: 'SDM GURUGRAM, HARYANA',
  vehicleManufacturerName: 'HYUNDAI MOTOR INDIA LTD',
  vehicle_model: 'CRETA VTVT 1.6 SX PLUS AUTO',
};

const okResponse = { code: 'success', data: RC_DATA, message: 'History data retrieved successfully' };

// The order as the purchase controller wrote it: plate standing in for the model,
// nothing fetched yet.
const buildingRow = () => ({
  id: 12,
  corporateTxnId: '1754000000000',
  credentialId: 42,
  reportType: 'history',
  reportStatus: 'BUILDING',
  vehicleNumber: 'HR26DD9739',
  vehicleModel: 'HR26DD9739',
  bodyType: null,
  historyResult: null,
});

const req = { LogTraceId: 'trace-1', user: { id: 42, registeredBy: 7 } };

describe('materialiseHistoryReport — success', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getVehicleRcDetails.mockResolvedValue(okResponse);
    getVehicleRcChallanReport.mockResolvedValue({
      code: 'success',
      data: { report_path: PDF_URL },
    });
    carReportOrder.update.mockResolvedValue([1]);
  });

  it('stores the vendor PDF link for the download button', async () => {
    const result = await materialiseHistoryReport(buildingRow(), req);

    expect(getVehicleRcChallanReport).toHaveBeenCalledWith('HR26DD9739', 'trace-1');
    expect(result.reportUrl).toBe(PDF_URL);
    expect(carReportOrder.update.mock.calls[0][0].reportUrl).toBe(PDF_URL);
  });

  // '' = vendor definitively has no PDF (stops re-billing); null/unset = retry on open.
  it('stores an empty marker when the vendor has no PDF for the plate', async () => {
    getVehicleRcChallanReport.mockResolvedValueOnce({
      code: 'failed',
      data: [],
      message: 'Data not found',
    });

    const result = await materialiseHistoryReport(buildingRow(), req);

    expect(result.reportUrl).toBe('');
    expect(result.reportStatus).toBe('READY');
  });

  it('leaves the PDF unset for the read path to retry when the fetch fails', async () => {
    getVehicleRcChallanReport.mockRejectedValueOnce(new Error('timeout'));

    const result = await materialiseHistoryReport(buildingRow(), req);

    expect(result.reportStatus).toBe('READY');
    expect(carReportOrder.update.mock.calls[0][0]).not.toHaveProperty('reportUrl');
  });

  // Droom answers auth problems as 200/"failed" — transient, never "no PDF".
  it('treats an authorisation failure as retryable, not as no-PDF', async () => {
    getVehicleRcChallanReport.mockResolvedValueOnce({
      code: 'failed',
      data: [],
      message: 'Authorisation header doesnt match',
    });

    const result = await materialiseHistoryReport(buildingRow(), req);

    expect(carReportOrder.update.mock.calls[0][0]).not.toHaveProperty('reportUrl');
    expect(result.reportStatus).toBe('READY');
  });

  it('persists the normalised result and flips the order to READY', async () => {
    const result = await materialiseHistoryReport(buildingRow(), req);

    expect(getVehicleRcDetails).toHaveBeenCalledWith('HR26DD9739', 'trace-1');
    const [updates, where] = carReportOrder.update.mock.calls[0];
    // Conditional on BUILDING so concurrent completers cannot double-email.
    expect(where).toEqual({ where: { id: 12, reportStatus: 'BUILDING' } });
    expect(updates.reportStatus).toBe('READY');
    expect(updates.historyResult).toEqual(
      expect.objectContaining({ registrationNumber: 'HR26DD9739', puc: 'Valid to 06 Jun 2026' })
    );
    expect(result.reportStatus).toBe('READY');
    expect(result.historyResult).toBeDefined();
  });

  // The purchase had no make/model to record — this is the first point at which the real
  // vehicle is known.
  it('backfills the vehicle model and body type from the RC response', async () => {
    await materialiseHistoryReport(buildingRow(), req);

    const [updates] = carReportOrder.update.mock.calls[0];
    expect(updates.vehicleModel).toBe('HYUNDAI MOTOR INDIA LTD CRETA VTVT 1.6 SX PLUS AUTO');
    expect(updates.bodyType).toBe('S.U.V.');
  });

  it('does not overwrite a body type the order already had', async () => {
    await materialiseHistoryReport({ ...buildingRow(), bodyType: 'SEDAN' }, req);

    expect(carReportOrder.update.mock.calls[0][0]).not.toHaveProperty('bodyType');
  });

  // Droom returns more than the reference doc names (chassis/engine, RC expiry, owner
  // address). Keeping the raw body means a richer card later needs no re-purchase.
  it('keeps the raw vendor body and records the vendor reference', async () => {
    await materialiseHistoryReport(buildingRow(), req);

    const [updates] = carReportOrder.update.mock.calls[0];
    expect(JSON.parse(updates.vendorResponse)).toEqual(okResponse);
    expect(updates.vendorReference).toBe('HR26DD9739');
  });

  // Challans come from a separate endpoint — merged into the stored result so the
  // card's Challans row can finally render.
  it('merges the challan summary into the stored result', async () => {
    getVehicleChallanDetails.mockResolvedValueOnce({
      code: 'success',
      data: [{ challan_status: 'Pending' }, { challan_status: 'Disposed' }],
    });

    await materialiseHistoryReport(buildingRow(), req);

    expect(getVehicleChallanDetails).toHaveBeenCalledWith('HR26DD9739', 'trace-1');
    const [updates] = carReportOrder.update.mock.calls[0];
    expect(updates.historyResult.challans).toBe('2 challan records (1 pending)');
  });

  // A challan outage costs that one row, never the report itself.
  it('still completes the report when the challan lookup fails', async () => {
    getVehicleChallanDetails.mockRejectedValueOnce(new Error('timeout'));

    const result = await materialiseHistoryReport(buildingRow(), req);

    expect(result.reportStatus).toBe('READY');
    expect(result.historyResult).not.toHaveProperty('challans');
  });

  it('never refunds a report it successfully built', async () => {
    await materialiseHistoryReport(buildingRow(), req);

    expect(refundWalletTransaction).not.toHaveBeenCalled();
  });

  it('sends the report-ready email when it flips the order', async () => {
    const { sendReportReadyEmail } = require('../../../utils/carReportEmail');
    await materialiseHistoryReport(buildingRow(), req);

    expect(sendReportReadyEmail).toHaveBeenCalledWith(
      expect.objectContaining({ corporateTxnId: '1754000000000', reportStatus: 'READY' }),
      'trace-1'
    );
  });

  // A concurrent completer already flipped the row — no second email.
  it('does not email when another call already completed the order', async () => {
    const { sendReportReadyEmail } = require('../../../utils/carReportEmail');
    carReportOrder.update.mockResolvedValueOnce([0]);

    await materialiseHistoryReport(buildingRow(), req);

    expect(sendReportReadyEmail).not.toHaveBeenCalled();
  });
});

describe('materialiseHistoryReport — unresolvable plate', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    carReportOrder.update.mockResolvedValue([1]);
    refundWalletTransaction.mockResolvedValue({});
  });

  // Refund fires only on a definitive no-vehicle answer: a 2xx envelope that carries no
  // vehicle, or the vendor's explicit "Data not found".
  it.each([
    ['an empty data object', { code: 'success', data: {} }],
    ['the explicit no-data verdict', { code: 'failed', data: [], message: 'Data not found' }],
    ['no data at all', { code: 'success' }],
  ])('cancels and refunds on %s', async (_label, vendorResponse) => {
    getVehicleRcDetails.mockResolvedValueOnce(vendorResponse);

    const result = await materialiseHistoryReport(buildingRow(), req);

    expect(carReportOrder.update).toHaveBeenCalledWith(
      { reportStatus: 'CANCELLED' },
      { where: { id: 12, reportStatus: 'BUILDING' } }
    );
    expect(refundWalletTransaction).toHaveBeenCalledWith(
      expect.objectContaining({ corporateTxnId: '1754000000000', status: 'FAILURE' })
    );
    expect(result.reportStatus).toBe('CANCELLED');
  });

  it('never writes a history result for a plate it could not resolve', async () => {
    getVehicleRcDetails.mockResolvedValueOnce({ code: 'success', data: {} });

    await materialiseHistoryReport(buildingRow(), req);

    expect(carReportOrder.update).toHaveBeenCalledTimes(1);
    expect(carReportOrder.update.mock.calls[0][0]).not.toHaveProperty('historyResult');
  });

  // Droom answers auth problems as 200/"failed" too — refunding those would cancel a
  // report for a perfectly resolvable plate (bug 30152's near-miss).
  it.each([
    ['an authorisation failure', { code: 'failed', data: [], message: 'Authorisation header doesnt match' }],
    ['an unknown failure message', { code: 'failed', data: [], message: 'server busy' }],
  ])('leaves the order BUILDING on %s instead of refunding', async (_label, vendorResponse) => {
    getVehicleRcDetails.mockResolvedValueOnce(vendorResponse);

    const result = await materialiseHistoryReport(buildingRow(), req);

    expect(result.reportStatus).toBe('BUILDING');
    expect(refundWalletTransaction).not.toHaveBeenCalled();
    expect(carReportOrder.update).not.toHaveBeenCalled();
  });

  // Two concurrent opens both reach this branch. The conditional UPDATE is what decides
  // which one owns the refund — without it the customer is paid back twice.
  it('refunds only once when a concurrent open already cancelled the order', async () => {
    getVehicleRcDetails.mockResolvedValueOnce({ code: 'success', data: {} });
    carReportOrder.update.mockResolvedValueOnce([0]);

    const result = await materialiseHistoryReport(buildingRow(), req);

    expect(refundWalletTransaction).not.toHaveBeenCalled();
    expect(result.reportStatus).toBe('CANCELLED');
  });
});

describe('materialiseHistoryReport — transient vendor failure', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    carReportOrder.update.mockResolvedValue([1]);
  });

  // A vendor blip is recoverable. Cancelling would refund a report the customer may well
  // still get, and there is no way back from CANCELLED.
  it('leaves the order BUILDING and refunds nothing', async () => {
    getVehicleRcDetails.mockRejectedValueOnce(new Error('socket hang up'));

    const result = await materialiseHistoryReport(buildingRow(), req);

    expect(result.reportStatus).toBe('BUILDING');
    expect(result.historyResult).toBeNull();
    expect(carReportOrder.update).not.toHaveBeenCalled();
    expect(refundWalletTransaction).not.toHaveBeenCalled();
  });

  // It runs inside a GET that still has to render the order.
  it('never throws, whatever the vendor did', async () => {
    getVehicleRcDetails.mockRejectedValueOnce({ response: { status: 500, data: 'boom' } });

    await expect(materialiseHistoryReport(buildingRow(), req)).resolves.toEqual(
      expect.objectContaining({ reportStatus: 'BUILDING' })
    );
  });
});

describe('attachHistoryReportPdf', () => {
  const readyRow = () => ({ ...buildingRow(), reportStatus: 'READY', reportUrl: null });

  beforeEach(() => {
    jest.clearAllMocks();
    carReportOrder.update.mockResolvedValue([1]);
  });

  it('stores the PDF link on a retry', async () => {
    getVehicleRcChallanReport.mockResolvedValueOnce({
      code: 'success',
      data: { report_path: PDF_URL },
    });

    const row = await attachHistoryReportPdf(readyRow(), req);

    expect(row.reportUrl).toBe(PDF_URL);
    expect(carReportOrder.update).toHaveBeenCalledWith(
      { reportUrl: PDF_URL },
      { where: { id: 12 } }
    );
  });

  it('leaves the row untouched when the fetch fails again', async () => {
    getVehicleRcChallanReport.mockRejectedValueOnce(new Error('down'));

    const row = await attachHistoryReportPdf(readyRow(), req);

    expect(row.reportUrl).toBeNull();
    expect(carReportOrder.update).not.toHaveBeenCalled();
  });
});
