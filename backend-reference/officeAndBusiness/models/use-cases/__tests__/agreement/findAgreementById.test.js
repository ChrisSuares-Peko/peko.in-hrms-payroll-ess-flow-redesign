const { findAgreementById } = require('../../agreement');
const agreement = require('../../../entities/agreement');
const corporateUser = require('../../../entities/corporateUser');
const InvoiceCustomerV2 = require('../../../entities/invoiceCustomerV2');
const invoicingV2 = require('../../../entities/invoicingV2');
const SubCorporateUser = require('../../../entities/subCorporateUsers');
const eSign = require('../../../entities/eSign');

jest.mock('../../../entities/agreement', () => ({
    create: jest.fn(),
    findAndCountAll: jest.fn(),
    count: jest.fn(),
    findOne: jest.fn(),
}));
jest.mock('../../../entities/corporateUser');
jest.mock('../../../entities/invoiceCustomerV2');
jest.mock('../../../entities/invoicingV2');
jest.mock('../../../entities/subCorporateUsers');
jest.mock('../../../entities/eSign', () => ({
    update: jest.fn(),
}));

describe('findAgreementById', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return the agreement with all associations', async () => {
        const mockDoc = {
            id: 1,
            corporateUserId: 10,
            corporateUser: { name: 'Test Corp' },
            invoiceCustomerV2: { id: 2, name: 'Customer' },
            quotation: { id: 3, invoiceNumber: 'QT-001' },
            subCorporateUser: { id: 4, name: 'Sub User' },
            eSign: { id: 5, status: 'PENDING' },
        };
        agreement.findOne.mockResolvedValue(mockDoc);

        const result = await findAgreementById(1, 10);

        expect(agreement.findOne).toHaveBeenCalledWith({
            where: { id: 1, corporateUserId: 10 },
            include: [
                {
                    model: corporateUser,
                    attributes: ['name', 'email', 'mobileNo', 'gstNumber', 'logo'],
                },
                {
                    model: InvoiceCustomerV2,
                    attributes: ['id', 'name', 'email', 'phoneNumber', 'gstin', 'primaryAddress', 'primaryCity', 'primaryState', 'primaryPincode', 'primaryCountry'],
                },
                {
                    model: invoicingV2,
                    as: 'quotation',
                    attributes: ['id', 'invoiceNumber', 'prefix'],
                    required: false,
                },
                {
                    model: SubCorporateUser,
                    attributes: ['id', 'name'],
                    required: false,
                },
                {
                    model: eSign,
                    as: 'eSign',
                    attributes: ['id', 'docket_id', 'docket_title', 'status', 'signers_info', 'expiry_date', 'sequentialSignature', 'initiator_name', 'initiator_email', 'document_url', 'audit_trail_url'],
                    required: false,
                },
            ],
            raw: true,
            nest: true,
        });
        expect(result).toEqual(mockDoc);
    });

    it('should return null when agreement is not found', async () => {
        agreement.findOne.mockResolvedValue(null);

        const result = await findAgreementById(999, 10);

        expect(result).toBeNull();
    });

    it('should throw an error if database call fails', async () => {
        agreement.findOne.mockRejectedValue(new Error('Database error'));

        await expect(findAgreementById(1, 10)).rejects.toThrow('Database error');
    });
});
