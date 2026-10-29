const { checkEmailExist } =require("../../invoiceCustomer");
const invoiceCustomer = require("../../../entities/invoiceCustomer");
const { Op } = require('sequelize');


jest.mock('../../../entities/invoiceCustomer', () => ({
  findOne: jest.fn(),
  hasOne: jest.fn(),
}));

describe('checkEmailExist', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return a customer if email and corporateUserId match', async () => {
        const mockCustomer = { id: 1, email: 'test@example.com', corporateUserId: 100 };

        // Mock the response of invoiceCustomer.findOne
        invoiceCustomer.findOne.mockResolvedValue(mockCustomer);

        const email = 'test@example.com';
        const corporateUserId = 100;

        const result = await checkEmailExist(email, corporateUserId);

        // Check if invoiceCustomer.findOne was called with the correct where clause
        expect(invoiceCustomer.findOne).toHaveBeenCalledWith({
            where: { email, corporateUserId },
        });

        // Validate the returned result
        expect(result).toEqual(mockCustomer);
    });

    it('should return a customer if email and corporateUserId match but id does not', async () => {
        const mockCustomer = { id: 2, email: 'test@example.com', corporateUserId: 100 };

        invoiceCustomer.findOne.mockResolvedValue(mockCustomer);

        const email = 'test@example.com';
        const corporateUserId = 100;
        const id = 1;

        const result = await checkEmailExist(email, corporateUserId, id);

        // Check if invoiceCustomer.findOne was called with the correct where clause
        expect(invoiceCustomer.findOne).toHaveBeenCalledWith({
            where: {
                email,
                corporateUserId,
                id: { [Op.ne]: id },
            },
        });

        // Validate the returned result
        expect(result).toEqual(mockCustomer);
    });

    it('should return null if no matching customer is found', async () => {
        invoiceCustomer.findOne.mockResolvedValue(null);

        const email = 'nonexistent@example.com';
        const corporateUserId = 101;

        const result = await checkEmailExist(email, corporateUserId);

        // Check if invoiceCustomer.findOne was called with the correct where clause
        expect(invoiceCustomer.findOne).toHaveBeenCalledWith({
            where: { email, corporateUserId },
        });

        // Validate the returned result
        expect(result).toBeNull();
    });

    it('should handle errors gracefully', async () => {
        const error = new Error('Database error');
        invoiceCustomer.findOne.mockRejectedValue(error);

        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

        const email = 'error@example.com';
        const corporateUserId = 102;

        await expect(checkEmailExist(email, corporateUserId)).rejects.toThrow(error);

        consoleSpy.mockRestore();
    });
});
