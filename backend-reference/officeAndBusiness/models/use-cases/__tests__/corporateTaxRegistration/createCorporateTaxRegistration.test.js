const { createCorporateTaxRegistration } = require('../../corporateTaxRegistration');
const corporateTaxRegistration = require('../../../entities/corporateTaxRegistration');

jest.mock('../../../entities/corporateTaxRegistration');

describe('createCorporateTaxRegistration', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should create registration when amount matches', async () => {
        const params = { quantity: 2, amount: 200 };
        const serviceDetails = { vendor: { optional1: '100' } };
        const mockRes = { id: 1, ...params };
        corporateTaxRegistration.create.mockResolvedValue(mockRes);

        const result = await createCorporateTaxRegistration(params, serviceDetails);

        expect(corporateTaxRegistration.create).toHaveBeenCalledWith(params);
        expect(result).toEqual(mockRes);
    });

    it('should return false when optional1 is missing', async () => {
        const result = await createCorporateTaxRegistration({}, { vendor: {} });
        expect(result).toBe(false);
    });

    it('should return false when optional1 is not a number', async () => {
        const result = await createCorporateTaxRegistration({}, { vendor: { optional1: 'abc' } });
        expect(result).toBe(false);
    });

    it('should return false when calculated amount does not match', async () => {
        const params = { quantity: 2, amount: 999 };
        const serviceDetails = { vendor: { optional1: '100' } };

        const result = await createCorporateTaxRegistration(params, serviceDetails);
        expect(result).toBe(false);
        expect(corporateTaxRegistration.create).not.toHaveBeenCalled();
    });

    it('should return false when create returns falsy', async () => {
        const params = { quantity: 1, amount: 50 };
        const serviceDetails = { vendor: { optional1: '50' } };
        corporateTaxRegistration.create.mockResolvedValue(null);

        const result = await createCorporateTaxRegistration(params, serviceDetails);
        expect(result).toBe(false);
    });

    it('should return false on error', async () => {
        const params = { quantity: 1, amount: 50 };
        const serviceDetails = { vendor: { optional1: '50' } };
        corporateTaxRegistration.create.mockRejectedValue(new Error('DB error'));

        const result = await createCorporateTaxRegistration(params, serviceDetails);
        expect(result).toBe(false);
    });
});
