jest.mock('../../utils/loggerHelper', () => ({ customLog: jest.fn() }));

const {
  waitForProducts,
  notifyOnSearch,
  resetForTests,
} = require('../ondcSearchWaiter');

describe('notifyOnSearch', () => {
  afterEach(() => {
    resetForTests();
  });

  it('settles a directed productId wait on NACK', async () => {
    const wait = waitForProducts('txn-directed', {
      productId: 'SKU-1',
      threshold: 1,
      timeoutMs: 5000,
    });
    notifyOnSearch('txn-directed', [], { message: 'not found' });
    const result = await wait;
    expect(result.reason).toBe('error');
    expect(result.error).toEqual({ message: 'not found' });
  });

  it('does not settle a wait that has no productId on NACK', async () => {
    const wait = waitForProducts('txn-browse', {
      threshold: 99,
      timeoutMs: 80,
    });
    notifyOnSearch('txn-browse', [], { message: 'one seller nacked' });
    const result = await wait;
    expect(result.reason).toBe('timeout');
  });

  it('is a no-op when nobody is waiting (city-browse ingest)', () => {
    expect(() => notifyOnSearch('unknown-txn', ['SKU-1'])).not.toThrow();
    expect(() => notifyOnSearch('unknown-txn', [], { message: 'nack' })).not.toThrow();
  });
});
