
const { createIncentive } = require('../../../use-cases/incentives');
const Incentives = require('../../../entities/incentives');

jest.mock('../../../entities/incentives');

describe('createIncentive Use-case', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        console.log = jest.fn();
        console.error = jest.fn();
    });

    it('should create and save a new incentive', async () => {
        const data = { name: 'Test Incentive', amount: 100 };
        const savedIncentive = { ...data, _id: 'some_id' };
        
        Incentives.mockImplementation(() => {
            return {
                save: jest.fn().mockResolvedValue(savedIncentive)
            };
        });

        const result = await createIncentive(data);

        expect(Incentives).toHaveBeenCalledWith(data);
        expect(result).toEqual(savedIncentive);
    });

    it('should return an error if saving fails', async () => {
        const data = { name: 'Test Incentive', amount: 100 };
        const errorMessage = 'Failed to save incentive';

        Incentives.mockImplementation(() => {
            return {
                save: jest.fn().mockRejectedValue(new Error(errorMessage))
            };
        });

        const result = await createIncentive(data);

        expect(Incentives).toHaveBeenCalledWith(data);
        expect(result.message).toBe(errorMessage);
    });
});
