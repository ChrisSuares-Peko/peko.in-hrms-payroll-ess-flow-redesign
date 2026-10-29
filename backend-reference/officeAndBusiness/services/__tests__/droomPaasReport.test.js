const { postDroomJson, getDroomJson } = require('../droomClient');

jest.mock('../droomClient', () => ({
  postDroomJson: jest.fn(),
  getDroomJson: jest.fn(),
}));

const { createPaasReport, getPaasReportStatus } = require('../droomPaasReport');

describe('droomPaasReport.createPaasReport', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    postDroomJson.mockResolvedValue({ code: 'success', data: { order_id: 203952333 } });
  });

  const spec = {
    make: 'maruti suzuki',
    model: '800',
    year: '2013',
    trim: 'AC',
    city: 'delhi',
    owners: 'Asha Menon',
    kmsDriven: '20000',
    category: 'car',
  };

  it('posts JSON to the v2 paas-report endpoint with the vendor field names', async () => {
    await createPaasReport(spec, 'trace-1');

    expect(postDroomJson).toHaveBeenCalledWith(
      '/dss/v2/paas-report',
      {
        make: 'maruti suzuki',
        model: '800',
        year: 2013,
        trim: 'AC',
        city: 'delhi',
        owners: 'Asha Menon',
        kms_driven: 20000,
        category: 'car',
      },
      'trace-1'
    );
  });

  // The vendor sample sends year and kms_driven as numbers; the form supplies strings.
  it('sends year and kms_driven as numbers', async () => {
    await createPaasReport(spec);

    const [, body] = postDroomJson.mock.calls[0];
    expect(typeof body.year).toBe('number');
    expect(typeof body.kms_driven).toBe('number');
  });

  it('returns the vendor body untouched for the controller to interpret', async () => {
    const body = { code: 'success', data: { order_id: 1, status: 'pending' } };
    postDroomJson.mockResolvedValueOnce(body);

    await expect(createPaasReport(spec)).resolves.toBe(body);
  });
});

describe('droomPaasReport.getPaasReportStatus', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getDroomJson.mockResolvedValue({ code: 'success', data: { status: 'pending' } });
  });

  // company_id is Peko's fixed partner id on Droom's side — 1109 unless overridden.
  it('polls the status endpoint with the company id and order id', async () => {
    await getPaasReportStatus('203952333', 'trace-1');

    expect(getDroomJson).toHaveBeenCalledWith(
      '/dss/v2/paas-report-status',
      { company_id: '1109', order_id: '203952333' },
      'trace-1'
    );
  });
});
