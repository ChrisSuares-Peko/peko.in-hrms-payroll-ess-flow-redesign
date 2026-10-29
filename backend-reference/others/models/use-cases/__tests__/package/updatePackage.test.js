const { updatePackage } = require('../../package');
const pkgModel = require('../../../entities/package');
const sequelize = require('../../../../configs/database/index');

jest.mock('../../../entities/package');

describe('updatePackage', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should update the package successfully', async () => {
        const data = { packageName: 'Updated Package', packagePrice: '150' };
        const id = 1;
        const mockUpdateResult = [1]; // Sequelize `update` method returns an array, where the first element is the number of affected rows

        // Mocking the transaction
        const mockTransaction = { commit: jest.fn(), rollback: jest.fn() };
        sequelize.transaction.mockResolvedValue(mockTransaction);
        pkgModel.update.mockResolvedValue(mockUpdateResult);

        const result = await updatePackage(data, id);

        expect(pkgModel.update).toHaveBeenCalledWith(data, { where: { id: id }, transaction: mockTransaction });
        expect(mockTransaction.commit).toHaveBeenCalled();
        expect(result).toEqual({ success: true, message: 'Package updated successfully.' });
    });
    

    it('should rollback the transaction and return an error message if something goes wrong', async () => {
        const data = { packageName: 'Updated Package', packagePrice: '150' };
        const id = 1;

        const mockTransaction = { commit: jest.fn(), rollback: jest.fn() };
        sequelize.transaction.mockResolvedValue(mockTransaction);
        pkgModel.update.mockRejectedValue(new Error('Database error'));

        const result = await updatePackage(data, id);

        expect(pkgModel.update).toHaveBeenCalledWith(data, { where: { id: id }, transaction: mockTransaction });
        expect(mockTransaction.rollback).toHaveBeenCalled();
        expect(result).toEqual({ success: false, message: 'Something went wrong.' });
    });

   
});
