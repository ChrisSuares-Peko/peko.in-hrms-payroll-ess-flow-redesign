jest.mock('../../utils/loggerHelper', () => ({ customLog: jest.fn() }));

const { describeCancelOutcome } = require('../ondcCancelWaiter');

// The waiter has always carried a `reason`, but both call sites discarded it and
// returned one 502 "Seller did not confirm the cancellation" for every failure —
// so ops could not tell a refusal from an outage from a double-click.
describe('describeCancelOutcome', () => {
  it('reports success when the seller cancelled', () => {
    const outcome = describeCancelOutcome({
      received: true,
      reason: 'on_cancel',
      order: { state: 'Cancelled' },
      error: null,
    });
    expect(outcome.ok).toBe(true);
    expect(outcome.outcome).toBe('cancelled');
  });

  it('reports a seller rejection with the seller’s own message', () => {
    const outcome = describeCancelOutcome({
      received: true,
      reason: 'error',
      order: null,
      error: { message: 'Order already dispatched' },
    });
    expect(outcome.ok).toBe(false);
    expect(outcome.outcome).toBe('seller_rejected');
    expect(outcome.message).toBe('Order already dispatched');
    expect(outcome.statusCode).toBe(502);
  });

  // Silence is how the network expresses a refusal — it is the signal that a
  // force cancellation is the next step, which is why it must not look like an
  // outage.
  it('reports silence as no_response and offers the force path', () => {
    const outcome = describeCancelOutcome({ received: false, reason: 'timeout', order: null, error: null });
    expect(outcome.outcome).toBe('no_response');
    expect(outcome.canForce).toBe(true);
    expect(outcome.message).toMatch(/did not respond/i);
  });

  it('offers the force path after an outright rejection too', () => {
    const outcome = describeCancelOutcome({ received: true, reason: 'error', error: { message: 'no' } });
    expect(outcome.canForce).toBe(true);
  });

  // Nothing left to escalate to once force has already been used.
  it('does not offer force again when the attempt was already forced', () => {
    for (const result of [
      { received: false, reason: 'timeout' },
      { received: true, reason: 'error', error: { message: 'no' } },
    ]) {
      expect(describeCancelOutcome(result, { forced: true }).canForce).toBe(false);
    }
  });

  it('says so explicitly when a forced attempt got no answer', () => {
    const outcome = describeCancelOutcome({ received: false, reason: 'timeout' }, { forced: true });
    expect(outcome.message).toMatch(/forced cancellation/i);
  });

  // A second cancel evicts the first waiter. The first request is NOT evidence
  // the cancellation failed — it may still be live at the seller — so it must
  // not be reported as a failure the operator should retry past.
  it('reports a superseded wait as a conflict, not a failure to cancel', () => {
    const outcome = describeCancelOutcome({ received: false, reason: 'superseded' });
    expect(outcome.outcome).toBe('superseded');
    expect(outcome.statusCode).toBe(409);
    expect(outcome.canForce).toBe(false);
    expect(outcome.message).toMatch(/already in progress/i);
  });

  it('distinguishes a wait we abandoned ourselves', () => {
    expect(describeCancelOutcome({ received: false, reason: 'cancelled' }).outcome).toBe('abandoned');
  });

  it('never claims success without a confirmed order', () => {
    for (const result of [
      { received: false, reason: 'timeout' },
      { received: false, reason: 'superseded' },
      { received: true, reason: 'error', error: {} },
      {},
    ]) {
      expect(describeCancelOutcome(result).ok).toBe(false);
    }
  });

  it('always returns a usable message and status code', () => {
    for (const reason of ['on_cancel', 'error', 'timeout', 'superseded', 'cancelled', 'something-new']) {
      const outcome = describeCancelOutcome({ received: reason === 'on_cancel', reason });
      expect(typeof outcome.message).toBe('string');
      expect(outcome.message.length).toBeGreaterThan(0);
      expect([200, 409, 502]).toContain(outcome.statusCode);
    }
  });
});
