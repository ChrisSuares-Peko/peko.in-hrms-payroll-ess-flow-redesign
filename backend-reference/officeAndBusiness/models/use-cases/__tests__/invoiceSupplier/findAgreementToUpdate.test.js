const { findAgreementToUpdate } = require('../../../use-cases/invoiceSupplier');
const invoiceSuppliers = require('../../../entities/invoiceSuppliers');
const corporateUser = require('../../../entities/corporateUser');
const credential = require('../../../entities/credential');
const { Op } = require('sequelize');

jest.mock('../../../entities/invoiceSuppliers', () => ({
    findOne: jest.fn(),
}));

jest.mock('../../../entities/corporateUser', () => ({
    belongsTo: jest.fn(),
}));

describe('findAgreementToUpdate', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return the agreement when a matching document is found', async () => {
        const mockParams = { document_id: 'doc123', docket_id: 'dock456' };
        const mockAgreement = {
            id: 1,
            agreementDetails: { document_id: 'doc123', docket_id: 'dock456' },
            corporateUser: {
                id: 10,
                credentialId: 20,
                name: 'Test User',
                email: 'test@user.com',
                mobileNo: '1234567890',
                credential: {},
            },
        };

        invoiceSuppliers.findOne.mockResolvedValue(mockAgreement);

        const result = await findAgreementToUpdate(mockParams);

        expect(invoiceSuppliers.findOne).toHaveBeenCalledWith({
            include: [{
                model: corporateUser,
                attributes: ['id', 'credentialId', 'name', 'email', 'mobileNo'],
                include: [{ model: credential }],
            }],
            where: {
                [Op.and]: [
                    { 'agreementDetails.document_id': mockParams.document_id },
                    { 'agreementDetails.docket_id': mockParams.docket_id },
                ],
            },
            nest: true,
        });
        expect(result).toEqual({ status: true, data: mockAgreement });
    });

    it('should return an error message when no agreement is found', async () => {
        const mockParams = { document_id: 'doc999', docket_id: 'dock999' };
        invoiceSuppliers.findOne.mockResolvedValue(null);

        const result = await findAgreementToUpdate(mockParams);

        expect(result).toEqual({ status: false, message: 'eSign document not found' });
    });

    it('should return an error message when an error occurs', async () => {
        const mockParams = { document_id: 'error_doc', docket_id: 'error_dock' };
        const mockError = new Error('Database error');

        invoiceSuppliers.findOne.mockRejectedValue(mockError);
        console.log = jest.fn();

        const result = await findAgreementToUpdate(mockParams);

        expect(console.log).toHaveBeenCalledWith({ error: mockError });
        expect(result).toEqual({ status: false, message: 'Something went wrong while fetching the document' });
    });
});
