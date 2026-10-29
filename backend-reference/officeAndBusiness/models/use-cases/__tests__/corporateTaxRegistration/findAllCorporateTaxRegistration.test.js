const corporateTaxRegistration = require('../../../entities/corporateTaxRegistration');
const { findAllCorporateTaxRegistration } = require('../../../use-cases/corporateTaxRegistration')

jest.mock('../../../entities/corporateTaxRegistration', () => ({
    findAndCountAll: jest.fn(),
}));

describe('findAllCorporateTaxRegistration use case', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('fetch and return the list', async () => {

        const params = {
            page: 1, 
            itemsPerPage: 10, 
            searchText: "", 
            sort: "DESC", 
            sortField: "createdAt"
        }

        const expectedDBResponse = {
            count: 1,
            rows: [{
                createdAt: new Date(), 
                updatedAt: new Date(), 
                companyName: "Company Name", 
                tradeLicenseDoc: [],
                taxPeriod: 'May - April', 
                contactPerson: 'ICSC', 
                phoneNumber: '7676876876',
                email: "example@peko.com",
            }]
        }

        corporateTaxRegistration.findAndCountAll.mockResolvedValue(expectedDBResponse);

        const result = await findAllCorporateTaxRegistration(params);

        expect(corporateTaxRegistration.findAndCountAll).toHaveBeenCalledWith({
            include: expect.any(Array),
            where: expect.any(Object),
            order: [[params.sortField, params.sort]],
            limit: params.itemsPerPage,
            offset: (params.page - 1) * params.itemsPerPage,
            raw: true, // Fetch raw data
            nest: true
        })
        expect(result).toEqual(expectedDBResponse);
    })

    it('should throw an error if the findAndCountAll method throws an error', async () => {
        const params = {
            page: 1, 
            itemsPerPage: 10, 
            searchText: "", 
            sort: "DESC", 
            sortField: "createdAt"
        }

        const expectedError = new Error('Something went wrong');

        corporateTaxRegistration.findAndCountAll.mockRejectedValue(expectedError);
        const result = await findAllCorporateTaxRegistration(params);

        expect(result).toEqual(false);
    })


});