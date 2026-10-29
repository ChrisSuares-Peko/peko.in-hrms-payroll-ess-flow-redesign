jest.mock('../../utils/loggerHelper', () => ({ customLog: jest.fn() }));
jest.mock('../../models/use-cases/ondc_product_with_transactionId', () => ({
    reconcileCatalogSweep: jest.fn().mockResolvedValue({ skipped: false, uncity: 1, deleted: 0 }),
}));

const { reconcileCatalogSweep } = require('../../models/use-cases/ondc_product_with_transactionId');
const {
    DEBOUNCE_MS,
    scheduleCatalogSweepReconcile,
    cancelCatalogSweepReconcile,
} = require('../ondcCatalogSweepReconcile');

beforeEach(() => {
    jest.clearAllMocks();
    cancelCatalogSweepReconcile();
    jest.useFakeTimers();
});

afterEach(() => {
    cancelCatalogSweepReconcile();
    jest.useRealTimers();
});

describe('scheduleCatalogSweepReconcile', () => {
    it('reconciles after quiet debounce when products were ingested', async () => {
        scheduleCatalogSweepReconcile({
            city: 'std:044',
            domain: 'ONDC:RET14',
            sweepId: 'sweep-1',
            ingested: 2,
        });
        expect(reconcileCatalogSweep).not.toHaveBeenCalled();

        jest.advanceTimersByTime(DEBOUNCE_MS);
        await Promise.resolve();

        expect(reconcileCatalogSweep).toHaveBeenCalledWith({
            city: 'std:044',
            domain: 'ONDC:RET14',
            sweepId: 'sweep-1',
        });
    });

    it('does not reconcile a zero-product sweep', async () => {
        scheduleCatalogSweepReconcile({
            city: 'std:044',
            domain: 'ONDC:RET14',
            sweepId: 'sweep-empty',
            ingested: 0,
        });
        jest.advanceTimersByTime(DEBOUNCE_MS);
        await Promise.resolve();
        expect(reconcileCatalogSweep).not.toHaveBeenCalled();
    });

    it('does not schedule incremental city *', () => {
        scheduleCatalogSweepReconcile({
            city: '*',
            domain: 'ONDC:RET14',
            sweepId: 'sweep-1',
            ingested: 4,
        });
        jest.advanceTimersByTime(DEBOUNCE_MS);
        expect(reconcileCatalogSweep).not.toHaveBeenCalled();
    });
});
