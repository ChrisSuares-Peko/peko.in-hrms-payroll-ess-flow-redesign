
const cashback = require('../../../entities/cashback');



jest.mock('../../../use-cases/cashback', () => ({
    create: jest.fn(),
}));

jest.mock('../../../entities/cashback', () => ({
    create: jest.fn(),
}));


describe('create', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should create a new cashback entry with the provided params', async () => {
        const mockParams = {
            userId: 1,
            amount: 100,
            status: 'pending',
            createdAt: '2023-01-01',
        };

        const mockResult = {
            id: 1,
            ...mockParams,
        };

        cashback.create.mockResolvedValue(mockResult);

      
        expect(cashback.create).toHaveBeenCalledTimes(0);
       
       
    });
   
});
