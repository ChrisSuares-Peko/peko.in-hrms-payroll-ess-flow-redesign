jest.mock('../ondc', () => ({ status: jest.fn(), isOndcWorkbenchMode: jest.fn() }));
jest.mock('../../models/entities/ondc_order', () => ({ findAll: jest.fn(), update: jest.fn() }));
jest.mock('../../models/entities/setting', () => ({ findOne: jest.fn() }));

const { Op } = require('sequelize');
const ondc = require('../ondc');
const ondcOrders = require('../../models/entities/ondc_order');
const setting = require('../../models/entities/setting');
const { triggerOndcDeliveryStatusPoll } = require('../ondcDeliveryStatus');

const NOW = new Date('2026-08-12T09:00:00Z');

const awaitingRow = (overrides = {}) => ({
  id: 1,
  orderId: 'ONDC-123',
  transactionId: 'txn-1',
  bppId: 'bpp.example.com',
  bppUri: 'https://bpp.example.com/ondc',
  city: 'std:080',
  domain: 'ONDC:RET14',
  expectedDeliveryDate: new Date('2026-08-11T09:00:00Z'),
  statusCheckedAt: null,
  deliveredAt: null,
  orderState: 'Accepted',
  ...overrides,
});

const withSettings = (details) => setting.findOne.mockResolvedValue({ details });
const whereClause = () => ondcOrders.findAll.mock.calls[0][0].where;

beforeEach(() => {
  jest.clearAllMocks();
  setting.findOne.mockResolvedValue(null);
  ondcOrders.findAll.mockResolvedValue([]);
  ondc.status.mockResolvedValue({ status: 200 });
  ondc.isOndcWorkbenchMode.mockResolvedValue(false);
});

describe('triggerOndcDeliveryStatusPoll', () => {
  it('asks the BPP about each candidate with that order\'s own identifiers', async () => {
    ondcOrders.findAll.mockResolvedValue([awaitingRow()]);

    const result = await triggerOndcDeliveryStatusPoll({ now: NOW });

    expect(ondc.status).toHaveBeenCalledTimes(1);
    expect(ondc.status).toHaveBeenCalledWith({
      bppId: 'bpp.example.com',
      bppUri: 'https://bpp.example.com/ondc',
      orderId: 'ONDC-123',
      transactionId: 'txn-1',
      city: 'std:080',
      domain: 'ONDC:RET14',
    });
    expect(result).toEqual({ candidates: 1, fired: 1, failed: 0 });
  });

  it('selects live orders that are due and not recently checked', async () => {
    await triggerOndcDeliveryStatusPoll({ now: NOW });

    const where = whereClause();
    expect(where.orderId).toEqual({ [Op.ne]: null });
    expect(where.bppUri).toEqual({ [Op.ne]: null });
    expect(where.orderState).toEqual({
      [Op.or]: [{ [Op.notIn]: ['Cancelled', 'Returned'] }, { [Op.is]: null }],
    });

    const [dueClause, throttleClause] = where[Op.and];
    const [awaitingDelivery] = dueClause[Op.or];
    expect(awaitingDelivery.deliveredAt).toEqual({ [Op.is]: null });
    // Default 24 h no-ETA fallback → placed on or before 2026-08-11T09:00:00Z.
    expect(awaitingDelivery[Op.or][1].createdAt[Op.lte]).toEqual(new Date('2026-08-11T09:00:00Z'));
    // Default 6 h throttle → last checked on or before 2026-08-12T03:00:00Z.
    expect(throttleClause[Op.or][0]).toEqual({ statusCheckedAt: { [Op.is]: null } });
    expect(throttleClause[Op.or][1].statusCheckedAt[Op.lte]).toEqual(new Date('2026-08-12T03:00:00Z'));
  });

  // A returning order is delivered, so the awaiting-delivery branch excludes it — yet
  // Return_Initiated → Picked → Liquidated still has to be chased.
  it('also polls orders with a return in flight, regardless of delivery', async () => {
    await triggerOndcDeliveryStatusPoll({ now: NOW });

    const [dueClause] = whereClause()[Op.and];
    const [, returnInFlight] = dueClause[Op.or];
    expect(returnInFlight).toEqual({
      returnStatus: {
        [Op.ne]: null,
        [Op.notIn]: ['Liquidated', 'Returned', 'Return_Rejected', 'Return_Failed'],
      },
    });
    // The return branch carries no deliveredAt / ETA condition of its own, and none
    // is imposed at the top level — either would exclude every returning order.
    expect(returnInFlight.deliveredAt).toBeUndefined();
    expect(whereClause().deliveredAt).toBeUndefined();
  });

  it('asks about a returning order using the same /status call', async () => {
    ondcOrders.findAll.mockResolvedValue([
      awaitingRow({ deliveredAt: new Date('2026-08-10T09:00:00Z'), returnStatus: 'Return_Initiated' }),
    ]);

    const result = await triggerOndcDeliveryStatusPoll({ now: NOW });

    expect(ondc.status).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ candidates: 1, fired: 1, failed: 0 });
  });

  it('applies throttle, fallback and limit from the settings row', async () => {
    withSettings({ throttleHours: 1, noEtaFallbackHours: 2, batchLimit: 10 });

    await triggerOndcDeliveryStatusPoll({ now: NOW });

    const call = ondcOrders.findAll.mock.calls[0][0];
    expect(call.limit).toBe(10);
    const [dueClause, throttleClause] = call.where[Op.and];
    const [awaitingDelivery] = dueClause[Op.or];
    expect(awaitingDelivery[Op.or][1].createdAt[Op.lte]).toEqual(new Date('2026-08-12T07:00:00Z'));
    expect(throttleClause[Op.or][1].statusCheckedAt[Op.lte]).toEqual(new Date('2026-08-12T08:00:00Z'));
  });

  it('falls back to defaults when the settings row cannot be read', async () => {
    setting.findOne.mockRejectedValue(new Error('db down'));
    ondcOrders.findAll.mockResolvedValue([awaitingRow()]);

    const result = await triggerOndcDeliveryStatusPoll({ now: NOW });

    expect(ondcOrders.findAll.mock.calls[0][0].limit).toBe(200);
    expect(result).toEqual({ candidates: 1, fired: 1, failed: 0 });
  });

  it('honours the enabled kill switch', async () => {
    withSettings({ enabled: false });

    const result = await triggerOndcDeliveryStatusPoll({ now: NOW });

    expect(ondcOrders.findAll).not.toHaveBeenCalled();
    expect(ondc.status).not.toHaveBeenCalled();
    expect(result).toEqual({ skipped: true, reason: 'disabled' });
  });

  // A scripted test scenario tracks one transaction id and rejects anything it
  // did not expect, so an unsolicited /status breaks the run someone is midway
  // through — and it breaks on THEIR next click, not here.
  it('sends nothing while ONDC is pinned to a test scenario', async () => {
    ondc.isOndcWorkbenchMode.mockResolvedValue(true);
    ondcOrders.findAll.mockResolvedValue([awaitingRow()]);

    const result = await triggerOndcDeliveryStatusPoll({ now: NOW });

    expect(ondcOrders.findAll).not.toHaveBeenCalled();
    expect(ondc.status).not.toHaveBeenCalled();
    expect(result).toEqual({ skipped: true, reason: 'workbench_mode' });
  });

  it('keeps polling the rest of the batch when one seller fails', async () => {
    ondcOrders.findAll.mockResolvedValue([
      awaitingRow({ id: 1, transactionId: 'txn-1' }),
      awaitingRow({ id: 2, transactionId: 'txn-2' }),
    ]);
    ondc.status
      .mockRejectedValueOnce(new Error('bpp unreachable'))
      .mockResolvedValueOnce({ status: 200 });

    const result = await triggerOndcDeliveryStatusPoll({ now: NOW });

    expect(ondc.status).toHaveBeenCalledTimes(2);
    expect(result).toEqual({ candidates: 2, fired: 1, failed: 1 });
  });

  // Purchase's on_status webhook owns that column. Stamping it here would mark orders
  // whose seller never answered as checked, and quietly drop them from every later pass.
  it('never writes statusCheckedAt itself', async () => {
    ondcOrders.findAll.mockResolvedValue([awaitingRow()]);

    await triggerOndcDeliveryStatusPoll({ now: NOW });

    expect(ondc.status).toHaveBeenCalled();
    expect(ondcOrders.update).not.toHaveBeenCalled();
  });

  it('resolves rather than throws when the query blows up — a rejection would kill the scheduler', async () => {
    ondcOrders.findAll.mockRejectedValue(new Error('db down'));

    const result = await triggerOndcDeliveryStatusPoll({ now: NOW });

    expect(result).toEqual({ skipped: true, reason: 'poll_failed', error: 'db down' });
  });
});
