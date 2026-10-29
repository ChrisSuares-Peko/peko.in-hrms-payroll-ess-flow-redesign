const {
    createBeneficiary,
    findOneBeneficiary,
    updateBeneficiary,
    Delete,
    getExcelCSVData,
    fetchBeneficiaries
} = require('../../beneficiary');
const beneficiary = require('../../../entities/beneficiary');

beforeEach(() => {
    jest.clearAllMocks();
});

describe('createBeneficiary', () => {
    it('should create a new beneficiary when it does not exist', async () => {
        beneficiary.findOne.mockResolvedValue(null);
        const mockResult = { id: 1, billerId: 'B1', accessKey: 'A1', credentialId: 1 };
        beneficiary.create.mockResolvedValue(mockResult);

        const result = await createBeneficiary({ billerId: 'B1', accessKey: 'A1', credentialId: 1 });
        expect(result).toEqual(mockResult);
    });

    it('should return error if beneficiary already exists', async () => {
        beneficiary.findOne.mockResolvedValue({ id: 1 });

        const result = await createBeneficiary({ billerId: 'B1', accessKey: 'A1', credentialId: 1 });
        expect(result).toEqual({ error: 'This beneficiary is already added. Please add another beneficiary.' });
    });
});

describe('findOneBeneficiary', () => {
    it('should find one beneficiary by id', async () => {
        const mockResult = { id: 1, name: 'Test' };
        beneficiary.findOne.mockResolvedValue(mockResult);

        const result = await findOneBeneficiary({ id: 1 });
        expect(result).toEqual(mockResult);
        expect(beneficiary.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
    });
});

describe('updateBeneficiary', () => {
    it('should update a beneficiary', async () => {
        beneficiary.update.mockResolvedValue([1]);

        const result = await updateBeneficiary({ id: 1 }, { name: 'Updated' });
        expect(result).toEqual([1]);
        expect(beneficiary.update).toHaveBeenCalledWith({ name: 'Updated' }, { where: { id: 1 } });
    });
});

describe('Delete', () => {
    it('should delete a beneficiary', async () => {
        beneficiary.destroy.mockResolvedValue(1);

        const result = await Delete({ id: 1 });
        expect(result).toBe(1);
        expect(beneficiary.destroy).toHaveBeenCalledWith({ where: { id: 1 } });
    });
});

describe('fetchBeneficiaries', () => {
    it('should fetch beneficiaries by accessKey and credentialId', async () => {
        const mockResult = [{ id: 1 }, { id: 2 }];
        beneficiary.findAll.mockResolvedValue(mockResult);

        const result = await fetchBeneficiaries({ accessKey: 'A1', credentialId: 1 });
        expect(result).toEqual(mockResult);
    });
});

describe('getExcelCSVData', () => {
    it('should format beneficiary data for CSV export', async () => {
        beneficiary.findAll.mockResolvedValue([
            { id: 1, name: 'Ben1', accountNo: '123', accessKey: 'A1', isActive: true },
            { id: 2, name: null, accountNo: null, accessKey: null, isActive: false }
        ]);

        const result = await getExcelCSVData({ credentialId: 1 });
        expect(result).toEqual([
            { 'ID': 1, 'Beneficiary Name': 'Ben1', 'Account Number': '123', 'Access Key': 'A1', 'Status': 'Active' },
            { 'ID': 2, 'Beneficiary Name': 'Not Available', 'Account Number': 'Not Available', 'Access Key': 'Not AVailable', 'Status': 'Inactive' }
        ]);
    });
});
