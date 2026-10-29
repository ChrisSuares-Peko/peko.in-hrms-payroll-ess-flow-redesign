const { updateBeneficiary } = require('../../beneficiary');
const beneficiary = require('../../../entities/beneficiary');

// Mock the beneficiary model
jest.mock('../../../entities/beneficiary', () => ({
    update: jest.fn(),
}));

describe('updateBeneficiary', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should update the beneficiary with the provided data', async () => {
        const mockParams = { id: 1 };
        const mockData = { name: 'Updated Name', accountNo: '123456789' };
        const mockResult = [1]; // Sequelize returns an array where the first element is the number of affected rows

        // Mock the update method to resolve with the mock result
        beneficiary.update.mockResolvedValue(mockResult);

        const result = await updateBeneficiary(mockParams, mockData);

        expect(beneficiary.update).toHaveBeenCalledWith(mockData, {
            where: {
                id: mockParams.id,
            },
        });
        expect(result).toEqual(mockResult);
    });

    it('should handle errors and log them', async () => {
        const mockParams = { id: 1 };
        const mockData = { name: 'Updated Name' };
        const mockError = new Error('Database error');

        // Mock the update method to reject with an error
        beneficiary.update.mockRejectedValue(mockError);

        console.log = jest.fn(); // Mock console.log to capture the error

        const result = await updateBeneficiary(mockParams, mockData);

        // Expect the error to be logged
        expect(console.log).toHaveBeenCalledWith(mockError);
        // Result should be undefined due to the error
        expect(result).toBeUndefined();
    });

    it('should log a message after the update operation', async () => {
        const mockParams = { id: 1 };
        const mockData = { name: 'Updated Name' };
        const mockResult = [1];

        beneficiary.update.mockResolvedValue(mockResult);

        console.log = jest.fn(); // Mock console.log to capture the "finally" message

        await updateBeneficiary(mockParams, mockData);

        // Ensure the "finally" message is logged
        expect(console.log).toHaveBeenCalledWith('BENEFICIARY UPDATE ROUTE CALLED');
    });
});
