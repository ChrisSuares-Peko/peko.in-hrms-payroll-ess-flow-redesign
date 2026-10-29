const { findOneById } = require('../../../use-cases/serviceOperator'); 
const serviceOperator = require('../../../entities/serviceOperator'); 

jest.mock('../../../entities/serviceOperator', () => ({
    findOne: jest.fn(),
}));


describe('findOneById', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return the service operator when found', async () => {
        const mockId = 1;
        const mockServiceOperator = { id: mockId, /* ... other service operator data */ };

        serviceOperator.findOne.mockResolvedValue(mockServiceOperator);

        const result = await findOneById(mockId);

        expect(serviceOperator.findOne).toHaveBeenCalledWith({ where: { id: mockId } });
        expect(result).toEqual(mockServiceOperator);
    });

    it('should return null when service operator is not found', async () => {
        const mockId = 1;

        serviceOperator.findOne.mockResolvedValue(null);

        const result = await findOneById(mockId);

        expect(serviceOperator.findOne).toHaveBeenCalledWith({ where: { id: mockId } });
        expect(result).toBeNull();
    });

    it('should handle errors during database operations', async () => {
        const mockId = 1;
        const mockError = new Error('Database error');

        serviceOperator.findOne.mockRejectedValue(mockError);

        await expect(findOneById(mockId)).rejects.toThrow(mockError); // Or handle as you prefer

        expect(serviceOperator.findOne).toHaveBeenCalledWith({ where: { id: mockId } });
    });

   
});