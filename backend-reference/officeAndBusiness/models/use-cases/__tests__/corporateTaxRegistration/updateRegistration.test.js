const corporateTaxRegistration = require('../../../entities/corporateTaxRegistration');
const { updateRegistration } = require('../../corporateTaxRegistration')

jest.mock('../../../entities/corporateTaxRegistration', () => ({
    update: jest.fn(),
}));

describe('updateRegistration use case', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('update corporate tax registration and return', async () => {
        const registrationId = 1
        const data = {
            companyName: "Company Name", 
            tradeLicenseDoc: [],
            taxPeriod: 'May - April', 
            contactPerson: 'ICSC', 
            phoneNumber: '7676876876',
            email: "example@peko.com",
        }

        const expectedDBResponse = {
            createdAt: new Date(), 
            updatedAt: new Date(), 
            companyName: "Company Name", 
            tradeLicenseDoc: [],
            taxPeriod: 'May - April', 
            contactPerson: 'ICSC', 
            phoneNumber: '7676876876',
            email: "example@peko.com",
            corporateGovernanceDoc: 'https://firebasestorage.googleapis.com/v0/b/peko-storage.appspot.com/o/corporateGovernanceDocDocs%2F1715749481129.png?alt=media&token=3f4b7ade-01a3-4799-b3eb-5b7b7410a4f4',
            emiratesIDDoc: 'https://firebasestorage.googleapis.com/v0/b/peko-storage.appspot.com/o/emiratesIDDocDocs%2F1715749481771.png?alt=media&token=15f11103-384b-4683-bf65-39b1025d20ff',
            passportDoc: 'https://firebasestorage.googleapis.com/v0/b/peko-storage.appspot.com/o/passportDocDocs%2F1715749482276.png?alt=media&token=7840e362-7c7e-4d85-bd79-0597c4244abd',
            credential: {
                name: "Corporate Name"
            }, 
            status: 'PENDING'
        }

        corporateTaxRegistration.update.mockResolvedValue(expectedDBResponse);

        const result = await updateRegistration(registrationId, data);

        expect(corporateTaxRegistration.update).toHaveBeenCalledWith(data, {
            where: {
                id: registrationId
            }
        })
        expect(result).toEqual(expectedDBResponse);
    })

    it('should throw an error if the update method throws an error', async () => {
        const registrationId = 1
        const data = {
            companyName: "Company Name", 
            tradeLicenseDoc: [],
            taxPeriod: 'May - April', 
            contactPerson: 'ICSC', 
            phoneNumber: '7676876876',
            email: "example@peko.com",
        }

        const expectedError = new Error('Something went wrong');

        corporateTaxRegistration.update.mockRejectedValue(expectedError);
        const result = updateRegistration(registrationId, data);

        await expect(result).rejects.toThrow(expectedError)
    })


});