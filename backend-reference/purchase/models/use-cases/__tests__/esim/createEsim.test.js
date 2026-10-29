const { createEsim } = require('../../../use-cases/esim');
const esim = require('../../../entities/esim');

jest.mock('../../../entities/esim', () => ({
    create: jest.fn(),
}));

describe('createEsim', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should create an eSIM plan successfully', async () => {
        const mockData = { planName: 'Basic Plan', price: 10, validity: '30 days' };
        const mockEsim = { id: 1, ...mockData };

        esim.create.mockResolvedValue(mockEsim);

        const result = await createEsim(mockData);

        expect(esim.create).toHaveBeenCalledWith(mockData);
        expect(result).toEqual(mockEsim);
    });

    it('should return false if eSIM creation fails', async () => {
        const mockData = { planName: 'Premium Plan', price: 20, validity: '60 days' };
        esim.create.mockResolvedValue(null);

        const result = await createEsim(mockData);

        expect(result).toBe(false);
    });

    it('should return false if an error occurs during eSIM creation', async () => {
        const mockData = { planName: 'Unlimited Plan', price: 50, validity: '90 days' };
        const mockError = new Error('Database error');

        esim.create.mockRejectedValue(mockError);

        const result = await createEsim(mockData);

        expect(result).toBe(false);
    });
});
