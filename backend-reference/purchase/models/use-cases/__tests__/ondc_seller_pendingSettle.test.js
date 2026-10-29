const {
  attachPendingSettle,
  PENDING_PAYOUT_STATUSES,
} = require('../ondc_seller');

describe('PENDING_PAYOUT_STATUSES', () => {
  it('includes held / releasing / release_failed only', () => {
    expect(PENDING_PAYOUT_STATUSES).toEqual(['HELD', 'RELEASING', 'RELEASE_FAILED']);
    expect(PENDING_PAYOUT_STATUSES).not.toContain('RELEASED');
    expect(PENDING_PAYOUT_STATUSES).not.toContain('BLOCKED');
  });
});

describe('attachPendingSettle', () => {
  const sellers = [
    {
      id: 1,
      vendorName: 'Acme Dist',
      bppId: 'bpp.a',
      providerId: 'P1',
      cashfreeVendorId: 'ondc_vendor_1',
      cashfreeVendorStatus: 'ACTIVE',
      splitEligible: true,
      ineligibleReason: null,
      vendorSyncedAt: '2026-01-01T00:00:00.000Z',
    },
    {
      id: 2,
      vendorName: 'No Orders Yet',
      bppId: 'bpp.b',
      providerId: 'P2',
      cashfreeVendorId: 'ondc_vendor_2',
      cashfreeVendorStatus: 'ACTIVE',
      splitEligible: true,
      ineligibleReason: null,
      vendorSyncedAt: null,
    },
  ];

  it('sums pending HELD splits onto matching vendors', () => {
    const aggregates = new Map([
      [
        'ondc_vendor_1',
        {
          pendingToSettle: 1500.5,
          pendingOrderCount: 3,
          earliestPayoutDueAt: '2026-08-01T10:00:00.000Z',
        },
      ],
    ]);

    const rows = attachPendingSettle(sellers, aggregates);

    expect(rows[0]).toMatchObject({
      id: 1,
      cashfreeVendorId: 'ondc_vendor_1',
      pendingToSettle: 1500.5,
      pendingOrderCount: 3,
      earliestPayoutDueAt: '2026-08-01T10:00:00.000Z',
    });
  });

  it('lists sellers with zero pending when they have no held orders', () => {
    const rows = attachPendingSettle(sellers, new Map());
    expect(rows).toHaveLength(2);
    expect(rows[0].pendingToSettle).toBe(0);
    expect(rows[0].pendingOrderCount).toBe(0);
    expect(rows[1].pendingToSettle).toBe(0);
    expect(rows[1].cashfreeVendorId).toBe('ondc_vendor_2');
  });

  it('does not attribute another vendor’s aggregates', () => {
    const aggregates = new Map([
      ['ondc_vendor_other', { pendingToSettle: 999, pendingOrderCount: 9, earliestPayoutDueAt: null }],
    ]);
    const rows = attachPendingSettle(sellers, aggregates);
    expect(rows.every((r) => r.pendingToSettle === 0)).toBe(true);
  });
});
