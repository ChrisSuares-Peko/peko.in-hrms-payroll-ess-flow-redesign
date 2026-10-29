'use strict';
const { clearCart } = require('../../serviceCart');
const ServiceCart = require('../../../entities/serviceCart');

jest.mock('../../../entities/serviceCart', () => ({
    destroy: jest.fn(),
}));

describe('clearCart', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should clear cart for corporateUserId and return true', async () => {
        ServiceCart.destroy.mockResolvedValue(1);

        const result = await clearCart({ corporateUserId: 1 });

        expect(ServiceCart.destroy).toHaveBeenCalledWith({
            where: { itemType: 'domainAndHosting', corporateUserId: 1 },
        });
        expect(result).toBe(true);
    });

    it('should clear cart for subCorporateUserId when provided', async () => {
        ServiceCart.destroy.mockResolvedValue(1);

        const result = await clearCart({ corporateUserId: 1, subCorporateUserId: 99 });

        expect(ServiceCart.destroy).toHaveBeenCalledWith({
            where: { itemType: 'domainAndHosting', subCorporateUserId: 99 },
        });
        expect(result).toBe(true);
    });

    it('should return true even when no cart record exists (0 rows deleted)', async () => {
        ServiceCart.destroy.mockResolvedValue(0);

        const result = await clearCart({ corporateUserId: 1 });

        expect(result).toBe(true);
    });

    it('should throw error on DB failure', async () => {
        ServiceCart.destroy.mockRejectedValue(new Error('DB Error'));

        await expect(clearCart({ corporateUserId: 1 })).rejects.toThrow('DB Error');
    });
});
