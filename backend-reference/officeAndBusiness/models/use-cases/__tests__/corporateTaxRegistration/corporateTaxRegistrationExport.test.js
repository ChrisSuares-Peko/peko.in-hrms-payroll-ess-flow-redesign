const { formattedDateTime } = require('../../../../utils/formatter');
const corporateTaxRegistration = require('../../../entities/corporateTaxRegistration');
const { corporateTaxRegistrationExport } = require('../../../use-cases/corporateTaxRegistration')

jest.mock('../../../entities/corporateTaxRegistration', () => ({
    findAndCountAll: jest.fn(),
}));

describe('corporateTaxRegistrationExport use case', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('fetch, format and return the list', async () => {

        const params = {
            searchText: "", 
            sort: "DESC", 
            sortField: "createdAt"
        }
        const userId = 123

        const expectedDBResponse = {
            count: 1,
            rows: [{
                createdAt: new Date(), 
                updatedAt: new Date(), 
                companyName: "Company Name", 
                tradeLicenseDoc: [{"tradeLicenseDoc_1": "https://firebasestorage.googleapis.com/v0/b/peko-storage.appspot.com/o/tradeLicenseDocDocs%2F1715749482780.png?alt=media&token=92e7368c-9768-44a1-bec3-9dea4a651a86"}],
                taxPeriod: 'May - April', 
                contactPerson: 'ICSC', 
                phoneNumber: '7676876876',
                email: "example@peko.com",
                corporateGovernanceDoc: 'https://firebasestorage.googleapis.com/v0/b/peko-storage.appspot.com/o/corporateGovernanceDocDocs%2F1715749481129.png?alt=media&token=3f4b7ade-01a3-4799-b3eb-5b7b7410a4f4',
                emiratesIDDoc: 'https://firebasestorage.googleapis.com/v0/b/peko-storage.appspot.com/o/emiratesIDDocDocs%2F1715749481771.png?alt=media&token=15f11103-384b-4683-bf65-39b1025d20ff',
                passportDoc: 'https://firebasestorage.googleapis.com/v0/b/peko-storage.appspot.com/o/passportDocDocs%2F1715749482276.png?alt=media&token=7840e362-7c7e-4d85-bd79-0597c4244abd',
                credential: {
                    name: "Corporate Name", 
                    username: 100001
                }, 
                status: 'PENDING'
            }]
        }

        const details = expectedDBResponse.rows[0];
        let tradeLicenses = "";
        details.tradeLicenseDoc.forEach((license, i) => {
            const key = `tradeLicenseDoc_${i+1}`;
            if (license[key]) {
                tradeLicenses += `${license[key]},`;
            }
        });
        tradeLicenses.slice(0, -1);
        const expectedResult = [{
            Date: formattedDateTime(details.createdAt),
            "Company Name": details.companyName,
            "Corporate Name": details.credential.name,
            "Contact Person": details.contactPerson,
            "Corporate ID": details.credential.username,
            // "Trade License": tradeLicenses,
            // "Corporate Governance": details.corporateGovernanceDoc,
            // "Emirates ID": details.emiratesIDDoc,
            // "Passport": details.passportDoc,
            // "Tax Period": details.taxPeriod,
            "Email ID": details.email,
            // "Mobile Number": details.phoneNumber,
            Status: "Pending",
        }]

        corporateTaxRegistration.findAndCountAll.mockResolvedValue(expectedDBResponse);

        const result = await corporateTaxRegistrationExport(params, userId);

        expect(corporateTaxRegistration.findAndCountAll).toHaveBeenCalledWith({
            include: expect.any(Array),
            where: expect.any(Object),
            order: [[params.sortField, params.sort]],
            raw: true,
            nest: true
        })
        expect(result).toEqual(expectedResult);
    })

    it('should use Not Availabe if fields are missing', async () => {

        const params = {
            searchText: "", 
            sort: "DESC", 
            sortField: "createdAt"
        }
        const userId = 123

        const expectedDBResponse = {
            count: 1,
            rows: [{}]
        }

        const expectedResult = [{
            Date: "Not Available",
            "Company Name": "Not Available",
            "Corporate Name": "Not Available",
            "Contact Person": "Not Available",
            "Corporate ID": "Not Available",
            "Email ID": "Not Available",
            Status: "Not Available",
        }]

        corporateTaxRegistration.findAndCountAll.mockResolvedValue(expectedDBResponse);

        const result = await corporateTaxRegistrationExport(params, userId);

        expect(corporateTaxRegistration.findAndCountAll).toHaveBeenCalledWith({
            include: expect.any(Array),
            where: expect.any(Object),
            order: [[params.sortField, params.sort]],
            raw: true,
            nest: true
        })
        expect(result).toEqual(expectedResult);
    })

    it('should throw an error if the findAndCountAll method throws an error', async () => {
        const params = {
            searchText: "", 
            sort: "DESC", 
            sortField: "createdAt"
        }

        const expectedError = new Error('Something went wrong');

        corporateTaxRegistration.findAndCountAll.mockRejectedValue(expectedError);
        const result = await corporateTaxRegistrationExport(params);

        expect(result).toEqual(false);
    })


});