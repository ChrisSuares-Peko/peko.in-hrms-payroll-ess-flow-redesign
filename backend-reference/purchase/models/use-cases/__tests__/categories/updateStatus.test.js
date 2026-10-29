const { updateStatus } = require('../../categories'); 
const categories = require('../../../entities/categories'); 

jest.mock('../../../entities/categories', () => ({
    update: jest.fn(),
}));

jest.mock('../../../entities/products', () =>({
    belongsTo: jest.fn(),
    }));
    jest.mock('../../../entities/subCorporateUsers', () =>({
        belongsTo: jest.fn(),
        }));

describe('updateStatus function', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should update category status successfully', async () => {
        const req = {
            params: {
                id: 1
            },
            body: {
                categoryStatus: false
            }
        };
        const mockUpdateResult = [1]; // Sequelize update method returns an array with the number of affected rows

        categories.update.mockResolvedValue(mockUpdateResult);

        const result = await updateStatus(req);

        expect(categories.update).toHaveBeenCalledWith(req.body, {
            where: {
                id: req.params.id
            }
        });
        expect(result).toEqual(mockUpdateResult);
    });

    it('should handle errors during category status update', async () => {
        const req = {
            params: {
                id: 1
            },
            body: {
                categoryStatus: false
            }
        };
        const errorMessage = 'Update failed';

        categories.update.mockRejectedValue(new Error(errorMessage));

        await expect(updateStatus(req)).rejects.toThrow(errorMessage);
    });
});
