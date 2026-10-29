const { findPackageByAccessCode } = require('../../../use-cases/whatsappBusiness');
const pkgModel = require('../../../entities/package');

jest.mock('../../../entities/package', () => ({
    findAll: jest.fn(),
}));
jest.mock('../../../entities/corporateUser', () => ({
    belongsTo: jest.fn(),
}));
describe('findPackageByAccessCode', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return packages when found', async () => {
        const mockAccessKey = 'test-key';
        const mockPartnerId = 1;
        const mockResponse = [
            {
                id: 1,
                packageName: 'Basic Package',
                packagePrices: 100,
                description: 'Test description',
                discount: 10,
                priorityLevel: 1,
            },
        ];

        pkgModel.findAll.mockResolvedValue(mockResponse);

        const result = await findPackageByAccessCode(mockAccessKey, mockPartnerId);

        expect(pkgModel.findAll).toHaveBeenCalledWith({
            where: { status: true, accessCode: mockAccessKey, partnerId: mockPartnerId },
            attributes: ['id', 'packageName', 'packagePrices', 'description', 'discount', 'priorityLevel', 'commissionMode', 'commissionType', 'commission', 'fixedCommissionPerTransaction', 'isCommissionInclGST', 'planCommissions'],
            order: [['priorityLevel', 'ASC']],
            raw: true,
            nest: true,
        });
        expect(result).toEqual(mockResponse);
    });

    it('should return an empty array when no packages are found', async () => {
        const mockAccessKey = 'invalid-key';
        const mockPartnerId = 2;
        pkgModel.findAll.mockResolvedValue([]);

        const result = await findPackageByAccessCode(mockAccessKey, mockPartnerId);

        expect(result).toEqual([]);
    });

    it('should return false when an error occurs', async () => {
        const mockAccessKey = 'error-key';
        const mockPartnerId = 3;
        const mockError = new Error('Database error');

        pkgModel.findAll.mockRejectedValue(mockError);
        console.error = jest.fn();

        const result = await findPackageByAccessCode(mockAccessKey, mockPartnerId);

        expect(console.error).toHaveBeenCalledWith('Error finding package details:', mockError);
        expect(result).toBe(false);
    });
});
