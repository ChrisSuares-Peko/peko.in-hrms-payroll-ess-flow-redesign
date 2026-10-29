const { KYBDetailsExport } = require('../../../use-cases/vendorPayout/kybDetails'); 
const kybDetails = require('../../../entities/vendorPayout/kybDetails'); 
const credential = require('../../../entities/credential'); 
const { Op } = require('sequelize'); 
const { handleSortFields } = require('../../../../utils/sortHandle');  
const { formattedDateTime } = require('../../../../utils/formatter');  


jest.mock('../../../entities/vendorPayout/kybDetails', () => ({
    findAndCountAll: jest.fn(),
}));

jest.mock('../../../../utils/sortHandle', () => ({
    handleSortFields: jest.fn(),
}));

jest.mock('../../../../utils/formatter', () => ({
    formattedDateTime: jest.fn(),
}));



describe('KYBDetailsExport', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return formatted KYB details for export', async () => {
        const mockParams = {
            searchText: 'test',
            sort: 'ASC',
            sortField: 'companyName',
            from: new Date('2024-01-01'),
            to: new Date('2024-01-31'),
        };
        const mockUserId = 1;
        const mockKYBDetails = {
            count: 2,
            rows: [
                {
                    createdAt: new Date('2024-01-01T10:00:00.000Z'), // Mock date
                    companyName: 'Test Company 1',
                    contactPersonName: 'Test Person 1',
                    offEmail: 'test1@example.com',
                    status: 'ACTIVE',
                    credentialId: 1,
                    corporateAddress: { buildingName: 'Building A', city: 'City X', country: 'Country Y', poBox: '123' },
                    shareholders: [{ ownerName: 'Shareholder 1', percentageShares: '50' }],
                    natureOfBusiness: 'IT',
                    countryOfIncorporation: 'USA',
                    dateOfIncorporation: new Date('2023-05-15T00:00:00.000Z'),
                    TLNumber: 'TL123',
                    TLIssuingAuthority: 'Authority A',
                    expiryDateofTL: new Date('2025-01-01T00:00:00.000Z'),
                    VATTRN: 'VAT123',
                    authorizedPersonName: 'Auth Person 1',
                    authorizedPersonNationality: 'Nationality A',
                    authorizedPersonID: 'ID123',
                    hasPresenceInIranOrNorthKorea: true,
                    phoneNumber: '123-456-7890',
                    remarks: 'Some remarks',
                    credential: { id: 1, name: 'testuser1', username: 'testuser1' },
                },
                {
                  createdAt: new Date('2024-01-02T12:00:00.000Z'), // Mock date
                    companyName: 'Another Company',
                    contactPersonName: 'Another Person',
                    offEmail: 'test2@example.com',
                    status: 'PENDING',
                    credentialId: 1,
                    corporateAddress: null, // Missing address
                    shareholders: [], // No shareholders
                    natureOfBusiness: null,
                    countryOfIncorporation: null,
                    dateOfIncorporation: null,
                    TLNumber: null,
                    TLIssuingAuthority: null,
                    expiryDateofTL: null,
                    VATTRN: null,
                    authorizedPersonName: null,
                    authorizedPersonNationality: null,
                    authorizedPersonID: null,
                    hasPresenceInIranOrNorthKorea: false,
                    phoneNumber: null,
                    remarks: null,
                    credential: { id: 1, name: 'testuser1', username: 'testuser1' },
                },
            ],
        };

        handleSortFields.mockReturnValue([['companyName', 'ASC']]);
        kybDetails.findAndCountAll.mockResolvedValue(mockKYBDetails);
        formattedDateTime.mockImplementation((date) => date.toISOString()); // Mock date formatting

        const result = await KYBDetailsExport(mockParams, mockUserId);

        expect(handleSortFields).toHaveBeenCalledWith('companyName', 'ASC');
        const call = kybDetails.findAndCountAll.mock.calls[0][0];
        expect(call.include).toEqual([{
            model: credential,
            attributes: ['id', 'name', 'username']
        }]);
        expect(call.where.credentialId).toBe(1);
        expect(call.where.createdAt).toBeDefined();
        expect(call.where[Op.or]).toEqual([
            { companyName: { [Op.like]: '%test%' } },
            { contactPersonName: { [Op.like]: '%test%' } },
            { offEmail: { [Op.like]: '%test%' } },
            { status: { [Op.like]: '%test%' } },
            { '$credential.username$': { [Op.like]: '%test%' } },
        ]);
        expect(call.order).toEqual([['companyName', 'ASC']]);
        expect(call.raw).toBe(true);
        expect(call.nest).toBe(true);
        expect(formattedDateTime).toHaveBeenCalledTimes(2); // Check if formattedDateTime is called twice

        const expectedResult = [
            {
                Date: new Date('2024-01-01T10:00:00.000Z').toISOString(),
                "Company Name": 'Test Company 1',
                "Contact Person Name": 'Test Person 1',
                "Corporate ID": 'testuser1',
                "Email ID": 'test1@example.com',
                Status: 'Active',
            },
            {
                Date: new Date('2024-01-02T12:00:00.000Z').toISOString(),
                "Company Name": 'Another Company',
                "Contact Person Name": 'Another Person',
                "Corporate ID": 'testuser1',
                "Email ID": 'test2@example.com',
                Status: 'Pending',
            },
        ];
        expect(result).toEqual(expectedResult);
    });


    // ... (other test cases: no results, database errors, no userId, etc. - similar to findAllKYBDetails)

    it('should handle errors during database operations', async () => {
        const mockParams = { /* ... */ };
        const mockUserId = 1;
        const mockError = new Error('Database error');

        kybDetails.findAndCountAll.mockRejectedValue(mockError);

        const result = await KYBDetailsExport(mockParams, mockUserId);

        expect(result).toBe(false); // Or throw the error, depending on your error handling
    });
});