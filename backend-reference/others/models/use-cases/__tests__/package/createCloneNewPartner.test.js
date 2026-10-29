const { createCloneNewPartner } = require('../../package'); // Replace with the actual path
const sequelize = require('../../../../configs/database/index');
const pkgModel = require('../../../entities/package'); // Replace with the actual path
const partnerPermission = require('../../../entities/partnerPermission'); // Replace with the actual path
const cashback = require('../../../entities/cashback');

jest.mock('../../../entities/cashback', () => ({
  bulkCreate: jest.fn(),
  findAll: jest.fn(), // Mock findAll here
}));



describe('createCloneNewPartner', () => {
    let mockTransaction;

    beforeEach(() => {
        mockTransaction = {
            commit: jest.fn(),
            rollback: jest.fn()
        };
        sequelize.transaction.mockResolvedValue(mockTransaction);
        partnerPermission.update.mockResolvedValue(true);
        pkgModel.create.mockResolvedValue({ id: 101 });
        cashback.bulkCreate.mockResolvedValue(true);
    });

    it('should successfully clone partner packages and update permissions', async () => {
        const mockParams = {
            bulkPackagesdata: [{ id: 1, name: 'Package A' }],
            newPartnerId: 123,
            partnerPermissions: { somePermission: true },
            cashbackIds: [10, 20]
        };
        
        cashback.findAll = jest.fn().mockResolvedValue([
            { id: 10, packageId: 1 },
            { id: 20, packageId: 1 }
        ]);
        
        const result = await createCloneNewPartner(mockParams);

        expect(partnerPermission.update).toHaveBeenCalledWith(
            { permissions: mockParams.partnerPermissions },
            { where: { registeredBy: mockParams.newPartnerId }, transaction: mockTransaction }
        );
        expect(pkgModel.create).toHaveBeenCalledTimes(mockParams.bulkPackagesdata.length);
        expect(cashback.bulkCreate).toHaveBeenCalledWith([
            { packageId: 101 },
            { packageId: 101 }
        ], { transaction: mockTransaction });
        expect(mockTransaction.commit).toHaveBeenCalled();
        expect(result).toHaveProperty('mapOldNewPkgs');
    });

    
});
