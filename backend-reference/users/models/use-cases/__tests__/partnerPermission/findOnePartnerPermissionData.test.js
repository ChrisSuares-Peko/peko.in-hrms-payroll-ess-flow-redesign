const { findOnePartnerPermissionData } = require('../../../use-cases/partnerPermission'); // Path to your function
const partnerPermission = require('../../../entities/partnerPermission'); // Path to your entity

jest.mock('../../../entities/partnerPermission', () => ({
    findOne: jest.fn(),
}));

describe('findOnePartnerPermissionData', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return partner permission data when found', async () => {
        const mockRegisteredBy = 123;
        const mockAttributes = ['id', 'permission'];
        const mockPermissionData = { id: 1, registeredBy: mockRegisteredBy, permission: 'read' };

        partnerPermission.findOne.mockResolvedValue(mockPermissionData);

        const result = await findOnePartnerPermissionData(mockRegisteredBy, mockAttributes);

        expect(partnerPermission.findOne).toHaveBeenCalledWith({
            where: { registeredBy: mockRegisteredBy },
            attributes: mockAttributes,
        });
        expect(result).toEqual(mockPermissionData);
    });

    it('should return null when no partner permission data is found', async () => {
        const mockRegisteredBy = 123;
        const mockAttributes = ['id', 'permission'];

        partnerPermission.findOne.mockResolvedValue(null); // Simulate no data found

        const result = await findOnePartnerPermissionData(mockRegisteredBy, mockAttributes);

        expect(partnerPermission.findOne).toHaveBeenCalledWith({
            where: { registeredBy: mockRegisteredBy },
            attributes: mockAttributes,
        });
        expect(result).toBeNull();
    });

    it('should log and propagate database errors', async () => {
        const mockRegisteredBy = 123;
        const mockAttributes = ['id', 'permission'];
        const mockError = new Error('Database error');

        partnerPermission.findOne.mockRejectedValue(mockError);


        const consoleLogSpy = jest.spyOn(console, 'log'); // Spy on console.log

        await expect(findOnePartnerPermissionData(mockRegisteredBy, mockAttributes)).rejects.toThrow('Database error');

        expect(partnerPermission.findOne).toHaveBeenCalledWith({
            where: { registeredBy: mockRegisteredBy },
            attributes: mockAttributes,
        });
        expect(consoleLogSpy).toHaveBeenCalledWith(mockError); // Verify error logged
        expect(consoleLogSpy).toHaveBeenCalledWith("PARTNER PERMISSION FIND ONE ROUTE CALLED"); // Verify finally block called
        consoleLogSpy.mockRestore(); // Restore console.log
    });

    it('should call findOne with default registeredBy and attributes if not provided', async () => {
        partnerPermission.findOne.mockResolvedValue({}); // Mock return value

        await findOnePartnerPermissionData(); // Call without arguments

        expect(partnerPermission.findOne).toHaveBeenCalledWith({
            where: { registeredBy: null }, // Or null, or whatever your default is.
            attributes: undefined,
        });
    });


});