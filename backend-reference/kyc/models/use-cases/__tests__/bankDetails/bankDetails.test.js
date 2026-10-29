const bankDetails = require('../../bankDetails');
const bankDetailsModel = require('../../../entities/bankDetails');

beforeEach(() => {
    jest.clearAllMocks();
});

describe('createAccount', () => {
    it('should create a bank account successfully', async () => {
        const mockParams = { credentialId: 1, accountNumber: '12345', default: false };
        const mockResult = { id: 1, ...mockParams };
        bankDetailsModel.create.mockResolvedValue(mockResult);

        const result = await bankDetails.createAccount(mockParams);
        expect(result).toEqual(mockResult);
        expect(bankDetailsModel.create).toHaveBeenCalledWith(mockParams);
    });

    it('should reset default flag before creating if default is true', async () => {
        const mockParams = { credentialId: 1, accountNumber: '12345', default: true };
        const mockResult = { id: 1, ...mockParams };
        bankDetailsModel.update.mockResolvedValue([1]);
        bankDetailsModel.create.mockResolvedValue(mockResult);

        const result = await bankDetails.createAccount(mockParams);
        expect(bankDetailsModel.update).toHaveBeenCalledWith(
            { default: false },
            { where: { credentialId: 1 } }
        );
        expect(bankDetailsModel.create).toHaveBeenCalledWith(mockParams);
        expect(result).toEqual(mockResult);
    });
});

describe('findOneBankAccount', () => {
    it('should find a bank account by credentialId', async () => {
        const mockResult = { id: 1, credentialId: 1, accountNumber: '12345' };
        bankDetailsModel.findOne.mockResolvedValue(mockResult);

        const result = await bankDetails.findOneBankAccount({ id: 1 });
        expect(result).toEqual(mockResult);
        expect(bankDetailsModel.findOne).toHaveBeenCalledWith({
            where: { credentialId: 1 },
            nest: true,
            raw: true
        });
    });
});

describe('findBankAccountByAccountOrIBAN', () => {
    it('should find a bank account by account number or IBAN excluding selectedId', async () => {
        const mockResult = { id: 2, accountNumber: '12345', iban: 'IBAN123' };
        bankDetailsModel.findOne.mockResolvedValue(mockResult);

        const result = await bankDetails.findBankAccountByAccountOrIBAN('12345', 'IBAN123', 1);
        expect(result).toEqual(mockResult);
    });

    it('should return null when no matching account found', async () => {
        bankDetailsModel.findOne.mockResolvedValue(null);

        const result = await bankDetails.findBankAccountByAccountOrIBAN('99999', 'IBAN999', 1);
        expect(result).toBeNull();
    });
});

describe('updateBank', () => {
    it('should update bank details', async () => {
        const mockData = { id: 1, credentialId: 1, accountNumber: '99999', default: false };
        bankDetailsModel.update.mockResolvedValue([1]);

        const result = await bankDetails.updateBank(mockData);
        expect(result).toEqual([1]);
        expect(bankDetailsModel.update).toHaveBeenCalledWith(mockData, {
            where: { id: 1, credentialId: 1 }
        });
    });

    it('should reset default flag before updating if default is true', async () => {
        const mockData = { id: 1, credentialId: 1, accountNumber: '99999', default: true };
        bankDetailsModel.update.mockResolvedValue([1]);

        await bankDetails.updateBank(mockData);
        expect(bankDetailsModel.update).toHaveBeenCalledTimes(2);
    });
});

describe('findAllBankAccount', () => {
    it('should find all bank accounts for a credential', async () => {
        const mockResult = [{ id: 1, credentialId: 1 }, { id: 2, credentialId: 1 }];
        bankDetailsModel.findAll.mockResolvedValue(mockResult);

        const result = await bankDetails.findAllBankAccount({ id: 1 });
        expect(result).toEqual(mockResult);
        expect(bankDetailsModel.findAll).toHaveBeenCalledWith({
            where: { credentialId: 1 },
            nest: true,
            raw: true
        });
    });
});

describe('findDefaultBankAccount', () => {
    it('should find the default bank account', async () => {
        const mockResult = { id: 1, credentialId: 1, default: true, status: true };
        bankDetailsModel.findOne.mockResolvedValue(mockResult);

        const result = await bankDetails.findDefaultBankAccount({ id: 1 });
        expect(result).toEqual(mockResult);
        expect(bankDetailsModel.findOne).toHaveBeenCalledWith({
            where: { credentialId: 1, default: true, status: true },
            nest: true,
            raw: true
        });
    });

    it('should return null when no default account exists', async () => {
        bankDetailsModel.findOne.mockResolvedValue(null);

        const result = await bankDetails.findDefaultBankAccount({ id: 1 });
        expect(result).toBeNull();
    });
});
