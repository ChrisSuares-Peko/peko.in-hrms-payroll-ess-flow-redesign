const corporateTaxRegistration = require('../../../entities/corporateTaxRegistration');
const credential = require('../../../entities/credential');
const { findOneRegistration } = require('../../corporateTaxRegistration');

jest.mock('../../../entities/corporateTaxRegistration', () => ({
    findOne: jest.fn(),
}));

describe('findOneRegistration use case', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should find and return corporateTaxRegistration details', async () => {
        const registrationId = 1;

        const expectedDBResponse = {
            createdAt: new Date(),
            updatedAt: new Date(),
            companyName: "Company Name",
            tradeLicenseDoc: [],
            taxPeriod: 'May - April',
            contactPerson: 'ICSC',
            phoneNumber: '7676876876',
            email: "example@peko.com",
        };

        corporateTaxRegistration.findOne.mockResolvedValue(expectedDBResponse);

        const result = await findOneRegistration(registrationId);

        expect(corporateTaxRegistration.findOne).toHaveBeenCalledWith({
            where: {
                id: registrationId
            },
            include: [{
                model: credential,
                attributes: ['id', 'name', 'username', 'registeredBy']
            }],
            raw: true,
            nest: true,
        });
        expect(result).toEqual(expectedDBResponse);
    });

    it('should return null if no corporateTaxRegistration found', async () => {
        const registrationId = 1;

        corporateTaxRegistration.findOne.mockResolvedValue(null);  // Mock for no result

        const result = await findOneRegistration(registrationId);

        expect(corporateTaxRegistration.findOne).toHaveBeenCalledWith({
            where: {
                id: registrationId
            },
            include: [{
                model: credential,
                attributes: ['id', 'name', 'username', 'registeredBy']
            }],
            raw: true,
            nest: true,
        });
        expect(result).toBeNull();  // Ensure result is null if nothing found
    });

    it('should throw an error if findOne throws an error', async () => {
        const registrationId = 1;

        corporateTaxRegistration.findOne.mockRejectedValue(new Error("Database Error"));  // Mock rejected promise

        await expect(findOneRegistration(registrationId)).rejects.toThrow("Database Error");  // Expect error to be thrown
    });

    it('should include credentials in the result', async () => {
        const registrationId = 1;

        const expectedDBResponse = {
            createdAt: new Date(),
            updatedAt: new Date(),
            companyName: "Company Name",
            tradeLicenseDoc: [],
            taxPeriod: 'May - April',
            contactPerson: 'ICSC',
            phoneNumber: '7676876876',
            email: "example@peko.com",
            credential: {
                id: 1,
                name: 'John Doe',
                username: 'johndoe',
                registeredBy: 'Admin'
            }
        };

        corporateTaxRegistration.findOne.mockResolvedValue(expectedDBResponse);

        const result = await findOneRegistration(registrationId);

        expect(result.credential).toEqual({
            id: 1,
            name: 'John Doe',
            username: 'johndoe',
            registeredBy: 'Admin',
        });  // Ensure the credential is correctly included
        expect(result).toEqual(expectedDBResponse);  // Ensure all data matches the expected response
    });
});
