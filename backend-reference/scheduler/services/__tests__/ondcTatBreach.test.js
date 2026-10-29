jest.mock('../../models/entities/ondc_order', () => ({ findAll: jest.fn(), update: jest.fn() }));
jest.mock('../../models/entities/ondc_seller', () => ({ findOne: jest.fn() }));
jest.mock('../../models/entities/corporateUser', () => ({ findOne: jest.fn() }));
jest.mock('../../models/entities/setting', () => ({ findOne: jest.fn() }));
jest.mock('../../models/use-cases/serviceOperator', () => ({ findOne: jest.fn() }));
jest.mock('../../utils/emailer', () => ({ email: jest.fn((to, subject, body, cb) => cb && cb()) }));
jest.mock('../../utils/loggerHelper', () => ({ customLog: jest.fn() }));

const ondcOrders = require('../../models/entities/ondc_order');
const ondcSellers = require('../../models/entities/ondc_seller');
const corporateUser = require('../../models/entities/corporateUser');
const setting = require('../../models/entities/setting');
const serviceOperator = require('../../models/use-cases/serviceOperator');
const emailer = require('../../utils/emailer');
const {
  triggerOndcTatBreachSweep,
  resolveDueBy,
  daysBetween,
  summariseItems,
} = require('../ondcTatBreach');

const NOW = new Date('2026-08-11T09:00:00Z');

const breachedRow = (overrides = {}) => ({
  id: 1,
  orderId: 'ONDC-123',
  transactionId: 'txn-1',
  bppId: 'bpp.example.com',
  providerId: 'P1',
  vendorName: 'Sindhi Dry Fruits',
  corporateUserId: 42,
  amountPaid: 889,
  items: [{ productName: 'Badam Mamra', productQuantity: 1 }],
  expectedDeliveryDate: new Date('2026-08-08T09:00:00Z'),
  createdAt: new Date('2026-08-05T09:00:00Z'),
  statusCheckedAt: new Date('2026-08-10T09:00:00Z'),
  orderState: 'Accepted',
  deliveredAt: null,
  fulfillments: [{ type: 'Delivery', state: { descriptor: { code: 'In-transit' } } }],
  billing: { address: { city: 'Srinagar', area_code: '190018' } },
  ...overrides,
});

const withSettings = (details) => setting.findOne.mockResolvedValue({ details });
/** The ONDC serviceOperators row, with its joined vendor. */
const withVendorEmail = (vendorEmail) =>
  serviceOperator.findOne.mockResolvedValue({ accessKey: 'ondc_gateway', vendor: { vendorEmail } });

beforeEach(() => {
  jest.clearAllMocks();
  serviceOperator.findOne.mockResolvedValue(null);
  withSettings({ notifyEmails: ['ops@peko.one'] });
  ondcOrders.findAll.mockResolvedValue([breachedRow()]);
  // [affectedRows] — 1 means this pass won the claim.
  ondcOrders.update.mockResolvedValue([1]);
  ondcSellers.findOne.mockResolvedValue({
    npName: 'DigiDukaan',
    npContactEmail: 'support@digidukaan.example',
    npContactPhone: '9876543210',
  });
  corporateUser.findOne.mockResolvedValue({ companyName: 'Acme Pvt Ltd', city: 'Delhi' });
});

describe('triggerOndcTatBreachSweep', () => {
  it('claims and emails a breached order exactly once', async () => {
    const summary = await triggerOndcTatBreachSweep({ now: NOW });

    expect(ondcOrders.update).toHaveBeenCalledTimes(1);
    expect(emailer.email).toHaveBeenCalledTimes(1);
    expect(summary).toMatchObject({ found: 1, notified: 1, skipped: 0, failed: 0 });
  });

  // The claim is a compare-and-set: only a row still NULL can be taken.
  it('claims with a compare-and-set on tatBreachNotifiedAt', async () => {
    await triggerOndcTatBreachSweep({ now: NOW });

    const [values, options] = ondcOrders.update.mock.calls[0];
    expect(values).toEqual({ tatBreachNotifiedAt: NOW });
    expect(options.where.id).toBe(1);
    expect(options.where.tatBreachNotifiedAt).toBeDefined();
  });

  it('sends nothing on a later pass, because the claimed order is no longer selected', async () => {
    ondcOrders.findAll.mockResolvedValue([]);

    const summary = await triggerOndcTatBreachSweep({ now: NOW });

    expect(emailer.email).not.toHaveBeenCalled();
    expect(summary).toMatchObject({ found: 0, notified: 0 });
  });

  // The row is the lock: whoever flips tatBreachNotifiedAt out of NULL owns the alert.
  it('does not email when the claim is lost to an overlapping pass', async () => {
    ondcOrders.update.mockResolvedValue([0]);

    const summary = await triggerOndcTatBreachSweep({ now: NOW });

    expect(emailer.email).not.toHaveBeenCalled();
    expect(summary).toMatchObject({ notified: 0, skipped: 1 });
  });

  // The dangerous failure: claiming rows we never emailed about would silence them
  // permanently, so an unconfigured recipient must be a total no-op.
  it('claims nothing when no recipients are configured', async () => {
    withSettings({ notifyEmails: [] });

    const summary = await triggerOndcTatBreachSweep({ now: NOW });

    expect(ondcOrders.update).not.toHaveBeenCalled();
    expect(ondcOrders.findAll).not.toHaveBeenCalled();
    expect(emailer.email).not.toHaveBeenCalled();
    expect(summary).toEqual({ skipped: true, reason: 'no_recipients' });
  });

  it('is a no-op when disabled', async () => {
    withSettings({ enabled: false, notifyEmails: ['ops@peko.one'] });

    const summary = await triggerOndcTatBreachSweep({ now: NOW });

    expect(ondcOrders.update).not.toHaveBeenCalled();
    expect(summary).toEqual({ skipped: true, reason: 'disabled' });
  });

  it('alerts the ONDC vendor row\'s vendorEmail list', async () => {
    withVendorEmail(['ondc-ops@peko.one', 'escalations@peko.one']);

    await triggerOndcTatBreachSweep({ now: NOW });

    expect(serviceOperator.findOne).toHaveBeenCalledWith({ accessKey: 'ondc_gateway' });
    expect(emailer.email).toHaveBeenCalledWith(
      ['ondc-ops@peko.one', 'escalations@peko.one'],
      expect.any(String),
      expect.any(String),
      expect.any(Function)
    );
  });

  it('prefers the vendor row over the settings row', async () => {
    withVendorEmail(['ondc-ops@peko.one']);
    withSettings({ notifyEmails: ['stale@peko.one'] });

    await triggerOndcTatBreachSweep({ now: NOW });

    expect(emailer.email).toHaveBeenCalledWith(
      ['ondc-ops@peko.one'],
      expect.any(String),
      expect.any(String),
      expect.any(Function)
    );
  });

  // vendorEmail is a JSON column — some drivers hand it back still encoded.
  it('reads a JSON-encoded vendorEmail array', async () => {
    withVendorEmail('["ondc-ops@peko.one","escalations@peko.one"]');

    await triggerOndcTatBreachSweep({ now: NOW });

    expect(emailer.email).toHaveBeenCalledWith(
      ['ondc-ops@peko.one', 'escalations@peko.one'],
      expect.any(String),
      expect.any(String),
      expect.any(Function)
    );
  });

  // An environment configured before the vendor row became the source must keep alerting.
  it('falls back to the settings row when the vendor has no emails', async () => {
    withVendorEmail([]);
    withSettings({ notifyEmails: ['ops@peko.one'] });

    await triggerOndcTatBreachSweep({ now: NOW });

    expect(emailer.email).toHaveBeenCalledWith(
      ['ops@peko.one'],
      expect.any(String),
      expect.any(String),
      expect.any(Function)
    );
  });

  it('falls back to the settings row when the vendor lookup throws', async () => {
    serviceOperator.findOne.mockRejectedValue(new Error('db down'));

    const summary = await triggerOndcTatBreachSweep({ now: NOW });

    expect(emailer.email).toHaveBeenCalledWith(
      ['ops@peko.one'],
      expect.any(String),
      expect.any(String),
      expect.any(Function)
    );
    // A normal pass, not the no_recipients early return (whose shape carries `reason`).
    expect(summary.reason).toBeUndefined();
  });

  it('accepts a comma-separated recipient string as well as an array', async () => {
    withSettings({ notifyEmails: 'ops@peko.one, ondc@peko.one' });

    await triggerOndcTatBreachSweep({ now: NOW });

    expect(emailer.email).toHaveBeenCalledWith(
      ['ops@peko.one', 'ondc@peko.one'],
      expect.any(String),
      expect.any(String),
      expect.any(Function)
    );
  });

  it('puts the order, seller and overdue count in the subject', async () => {
    await triggerOndcTatBreachSweep({ now: NOW });

    const [, subject] = emailer.email.mock.calls[0];
    expect(subject).toBe(
      'Peko IN | Office Supplies | TAT breached - Order ONDC-123 | DigiDukaan | 3 day(s) overdue'
    );
  });

  it('falls back to the bppId and says "not on file" when the NP is unknown', async () => {
    ondcSellers.findOne.mockResolvedValue(null);

    await triggerOndcTatBreachSweep({ now: NOW });

    const [, subject, body] = emailer.email.mock.calls[0];
    expect(subject).toContain('bpp.example.com');
    expect(body).toContain('not on file');
  });

  it('keeps going when one order fails to send', async () => {
    ondcOrders.findAll.mockResolvedValue([breachedRow(), breachedRow({ id: 2 })]);
    emailer.email.mockImplementationOnce(() => {
      throw new Error('smtp down');
    });

    const summary = await triggerOndcTatBreachSweep({ now: NOW });

    expect(summary).toMatchObject({ found: 2, notified: 1, failed: 1 });
  });

  it('reports rather than throws when the selection query fails', async () => {
    ondcOrders.findAll.mockRejectedValue(new Error('db down'));

    const summary = await triggerOndcTatBreachSweep({ now: NOW });

    expect(summary).toMatchObject({ skipped: true, reason: 'select_failed' });
    expect(emailer.email).not.toHaveBeenCalled();
  });

  // MySQL returns JSON columns parsed, but tolerate a driver that hands back strings.
  it('tolerates JSON columns arriving as strings', async () => {
    ondcOrders.findAll.mockResolvedValue([
      breachedRow({
        items: JSON.stringify([{ productName: 'Pens', productQuantity: 2 }]),
        billing: JSON.stringify({ address: { city: 'Pune' } }),
        fulfillments: JSON.stringify([
          { type: 'Delivery', state: { descriptor: { code: 'In-transit' } } },
        ]),
      }),
    ]);

    await triggerOndcTatBreachSweep({ now: NOW });

    const [, , body] = emailer.email.mock.calls[0];
    expect(body).toContain('Pens × 2');
    expect(body).toContain('Pune');
    expect(body).toContain('In-transit');
  });
});

describe('resolveDueBy', () => {
  it("uses the seller's ETA when there is one", () => {
    const due = resolveDueBy({ expectedDeliveryDate: '2026-08-08T09:00:00Z' }, 24);
    expect(due.isFallback).toBe(false);
    expect(due.dueBy.toISOString()).toBe('2026-08-08T09:00:00.000Z');
  });

  // A BPP that declares no TAT could otherwise never be judged late — which is
  // exactly when a buyer is most stranded.
  it('falls back to placed + fallback hours when the BPP declared no TAT', () => {
    const due = resolveDueBy({ createdAt: '2026-08-05T09:00:00Z' }, 24);
    expect(due.isFallback).toBe(true);
    expect(due.dueBy.toISOString()).toBe('2026-08-06T09:00:00.000Z');
  });

  it('returns null when there is nothing to measure against', () => {
    expect(resolveDueBy({}, 24)).toBeNull();
    expect(resolveDueBy({ expectedDeliveryDate: 'nonsense' }, 24)).toBeNull();
  });
});

describe('daysBetween', () => {
  it('floors to whole days and never goes negative', () => {
    expect(daysBetween(new Date('2026-08-08T09:00:00Z'), NOW)).toBe(3);
    expect(daysBetween(new Date('2026-08-11T00:00:00Z'), NOW)).toBe(0);
    expect(daysBetween(new Date('2026-08-20T09:00:00Z'), NOW)).toBe(0);
  });
});

describe('summariseItems', () => {
  it('renders "name × qty", tolerating junk', () => {
    expect(summariseItems([{ productName: 'Pens', productQuantity: 2 }])).toBe('Pens × 2');
    expect(summariseItems([{}])).toBe('item × 1');
    expect(summariseItems(null)).toBe('');
  });
});
