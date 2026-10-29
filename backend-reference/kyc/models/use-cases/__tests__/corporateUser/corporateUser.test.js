jest.mock('../../../../utils/commonUploadFile', () => ({
    uploadFile: jest.fn().mockResolvedValue('https://example.com/uploaded-file.png')
}));

const corporateUserUseCase = require('../../corporateUser');
const corporateUser = require('../../../entities/corporateUser');
const credential = require('../../../entities/credential');
const wallet = require('../../../entities/wallet');
const wallets = require('../../../entities/wallet');
const sequelizeConfig = require('../../../../configs/database/index');

beforeEach(() => {
    jest.clearAllMocks();
});

describe('create', () => {
    it('should create a corporate user with credential and wallet in a transaction', async () => {
        const mockTransaction = {
            commit: jest.fn(),
            rollback: jest.fn()
        };
        sequelizeConfig.transaction.mockResolvedValue(mockTransaction);
        credential.create.mockResolvedValue({ id: 1 });
        wallet.create.mockResolvedValue({ id: 1 });
        corporateUser.create.mockResolvedValue({ id: 1, credentialId: 1 });

        const result = await corporateUserUseCase.create({ name: 'Corp1', email: 'e@e.com' });
        expect(result).toEqual({ id: 1, credentialId: 1 });
        expect(mockTransaction.commit).toHaveBeenCalled();
    });

    it('should rollback transaction on error and return false', async () => {
        const mockTransaction = {
            commit: jest.fn(),
            rollback: jest.fn()
        };
        sequelizeConfig.transaction.mockResolvedValue(mockTransaction);
        credential.create.mockRejectedValue(new Error('DB Error'));

        const result = await corporateUserUseCase.create({ name: 'Corp1' });
        expect(result).toBe(false);
        expect(mockTransaction.rollback).toHaveBeenCalled();
    });
});

describe('findOne', () => {
    it('should find a corporate user by credentialId', async () => {
        const mockResult = { id: 1, credentialId: 1, name: 'Corp1' };
        corporateUser.findOne.mockResolvedValue(mockResult);

        const result = await corporateUserUseCase.findOne({ id: 1 });
        expect(result).toEqual(mockResult);
    });
});

describe('findCorporateUserByEmail', () => {
    it('should find a corporate user by email', async () => {
        const mockResult = { id: 1, email: 'e@e.com' };
        corporateUser.findOne.mockResolvedValue(mockResult);

        const result = await corporateUserUseCase.findCorporateUserByEmail('e@e.com');
        expect(result).toEqual(mockResult);
    });

    it('should throw error when user not found', async () => {
        corporateUser.findOne.mockResolvedValue(null);

        await expect(corporateUserUseCase.findCorporateUserByEmail('none@test.com'))
            .rejects.toThrow('Error fetching corporate user');
    });
});

describe('update', () => {
    it('should update corporate user data', async () => {
        corporateUser.update.mockResolvedValue([1]);

        const result = await corporateUserUseCase.update({ id: 1 }, { name: 'Updated' });
        expect(result).toEqual({ result: [1], docs: {} });
    });

    it('should handle profile image upload', async () => {
        corporateUser.update.mockResolvedValue([1]);

        const result = await corporateUserUseCase.update({ id: 1 }, {
            profileImageBase: 'base64data',
            profileImageFormat: 'png'
        });
        expect(result.result).toBe('https://example.com/uploaded-file.png');
    });
});

describe('deleteAccount', () => {
    it('should deactivate a corporate account', async () => {
        corporateUser.update.mockResolvedValue([1]);

        const result = await corporateUserUseCase.deleteAccount(1);
        expect(result).toEqual([1]);
        expect(corporateUser.update).toHaveBeenCalledWith(
            { isActive: false },
            { where: { credentialId: 1 } }
        );
    });
});

describe('Delete', () => {
    it('should delete a corporate user', async () => {
        corporateUser.destroy.mockResolvedValue(1);

        const result = await corporateUserUseCase.Delete({ id: 1 });
        expect(result).toBe(1);
    });
});

describe('updateStatus', () => {
    it('should update corporate user status', async () => {
        corporateUser.update.mockResolvedValue([1]);

        const mockReq = { params: { id: 1 }, body: { isActive: true } };
        const result = await corporateUserUseCase.updateStatus(mockReq, {}, jest.fn());
        expect(result).toEqual([1]);
    });
});

describe('fetchAll', () => {
    it('should fetch all corporate users matching query', async () => {
        const mockResult = [{ id: 1 }];
        corporateUser.findAll.mockResolvedValue(mockResult);

        const result = await corporateUserUseCase.fetchAll('Corp');
        expect(result).toEqual(mockResult);
    });
});

describe('fetchAllCorporates', () => {
    it('should fetch all corporates for a partner', async () => {
        const mockResult = [{ id: 1 }];
        corporateUser.findAll.mockResolvedValue(mockResult);

        const result = await corporateUserUseCase.fetchAllCorporates('Corp', 5);
        expect(result).toEqual(mockResult);
    });
});

describe('Excel', () => {
    it('should format corporate user data for Excel export', async () => {
        corporateUser.findAndCountAll.mockResolvedValue({
            count: 1,
            rows: [{
                id: 1, name: 'Corp1', credentialId: 1,
                credential: { username: 'user1', role: 'CORPORATE' },
                email: 'e@e.com', mobileNo: '123', website: 'web.com',
                country: 'India', city: 'Mumbai', balance: null
            }]
        });
        wallets.findAll.mockResolvedValue([{ credentialId: 1, balance: 500 }]);

        const result = await corporateUserUseCase.Excel({ order: 'DESC', column: 'createdAt' });
        expect(result[0]['CorporateName']).toBe('Corp1');
        expect(result[0]['Balance']).toBe('500INR');
    });
});
