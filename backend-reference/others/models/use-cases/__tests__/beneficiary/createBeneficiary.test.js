const { createBeneficiary } = require('../../beneficiary');
const beneficiary = require('../../../entities/beneficiary');
const serviceOperators = require('../../../entities/serviceOperator');

// Mock the beneficiary and serviceOperators models
jest.mock('../../../entities/beneficiary', () => ({
    findOne: jest.fn(),
    findAll: jest.fn(),
    create: jest.fn(),
}));

jest.mock('../../../entities/serviceOperator', () => ({
    findOne: jest.fn(),
}));

describe('createBeneficiary', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should return an error if the beneficiary already exists (non-prepaid)', async () => {
        const mockParams = {
            accountNo: '123456789',
            accessKey: 'REDACTED',
            credentialId: 1,
            customerParams: [{ name: 'param1', value: 'val1' }],
        };

        // findAll returns existing beneficiaries with matching customerParams
        beneficiary.findAll.mockResolvedValue([
            { customerParams: [{ name: 'param1', value: 'val1' }] },
        ]);

        const result = await createBeneficiary(mockParams);

        expect(result).toEqual({ error: 'This beneficiary is already added. Please add another beneficiary.' });
        expect(beneficiary.findAll).toHaveBeenCalledWith({
            where: {
                accessKey: mockParams.accessKey,
                credentialId: mockParams.credentialId,
            },
        });
    });

    it('should return an error if prepaid beneficiary with same phoneNo exists', async () => {
        const mockParams = {
            accountNo: '123456789',
            accessKey: 'REDACTED',
            credentialId: 1,
            phoneNo: '9876543210',
        };

        beneficiary.findAll.mockResolvedValue([
            { phoneNo: '9876543210' },
        ]);

        const result = await createBeneficiary(mockParams);

        expect(result).toEqual({ error: 'This beneficiary is already added. Please add another beneficiary.' });
    });

    it('should return an error if the service operator is not found', async () => {
        const mockParams = {
            accountNo: '123456789',
            accessKey: 'REDACTED',
            credentialId: 1,
        };

        beneficiary.findAll.mockResolvedValue([]);
        serviceOperators.findOne.mockResolvedValue(null);

        const result = await createBeneficiary(mockParams);

        expect(result).toEqual({ error: `Service Operator not found for accessKey: ${mockParams.accessKey}` });
        expect(serviceOperators.findOne).toHaveBeenCalledWith({
            where: { accessKey: mockParams.accessKey },
        });
    });

    it('should create a new beneficiary when valid params are provided', async () => {
        const mockParams = {
            accountNo: '123456789',
            accessKey: 'REDACTED',
            credentialId: 1,
        };

        const mockServiceOperator = { id: 1 };

        beneficiary.findAll.mockResolvedValue([]);
        serviceOperators.findOne.mockResolvedValue(mockServiceOperator);

        const mockCreatedBeneficiary = {
            id: 1,
            ...mockParams,
            serviceOperatorId: mockServiceOperator.id,
        };

        beneficiary.create.mockResolvedValue(mockCreatedBeneficiary);

        const result = await createBeneficiary(mockParams);

        expect(result).toEqual(mockCreatedBeneficiary);
        // Source mutates params by adding serviceOperatorId before calling create
        expect(beneficiary.create).toHaveBeenCalledWith({
            ...mockParams,
            serviceOperatorId: mockServiceOperator.id,
        });
    });

    it('should return error object if an exception occurs', async () => {
        const mockParams = {
            accountNo: '123456789',
            accessKey: 'REDACTED',
            credentialId: 1,
        };

        const mockError = new Error('Database error');

        beneficiary.findAll.mockRejectedValue(mockError);

        console.log = jest.fn();

        const result = await createBeneficiary(mockParams);

        expect(result).toEqual({ error: 'Something went wrong' });
        expect(console.log).toHaveBeenCalledWith('ERROR BLOCK - ', mockError.message);
    });
});
