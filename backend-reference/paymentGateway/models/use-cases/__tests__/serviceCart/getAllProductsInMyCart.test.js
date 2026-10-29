'use strict';
const { getAllProductsInMyCart } = require('../../serviceCart');
const ServiceCart = require('../../../entities/serviceCart');

jest.mock('../../../entities/serviceCart', () => ({
    findOne: jest.fn(),
}));

describe('getAllProductsInMyCart', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return cart data with parsed productsArray for corporateUserId', async () => {
        const products = [{ name: 'domain.com', type: 'domain' }];
        ServiceCart.findOne.mockResolvedValue({
            cartId: 10,
            itemType: 'domainAndHosting',
            productDetails: JSON.stringify(products),
        });

        const result = await getAllProductsInMyCart({ corporateUserId: 1 });

        expect(ServiceCart.findOne).toHaveBeenCalledWith({
            where: { itemType: 'domainAndHosting', corporateUserId: 1 },
            attributes: [['id', 'cartId'], 'itemType', 'productDetails'],
            raw: true,
        });
        expect(result).toEqual({
            cartId: 10,
            itemType: 'domainAndHosting',
            productsArray: products,
        });
    });

    it('should use subCorporateUserId in where clause when provided', async () => {
        ServiceCart.findOne.mockResolvedValue({
            cartId: 5,
            itemType: 'domainAndHosting',
            productDetails: '[]',
        });

        await getAllProductsInMyCart({ corporateUserId: 1, subCorporateUserId: 99 });

        expect(ServiceCart.findOne).toHaveBeenCalledWith(
            expect.objectContaining({
                where: { itemType: 'domainAndHosting', subCorporateUserId: 99 },
            })
        );
    });

    it('should not include corporateUserId when subCorporateUserId is provided', async () => {
        ServiceCart.findOne.mockResolvedValue({
            cartId: 5,
            itemType: 'domainAndHosting',
            productDetails: '[]',
        });

        await getAllProductsInMyCart({ corporateUserId: 1, subCorporateUserId: 99 });

        const calledWith = ServiceCart.findOne.mock.calls[0][0];
        expect(calledWith.where.corporateUserId).toBeUndefined();
    });

    it('should return -1 when no cart record is found', async () => {
        ServiceCart.findOne.mockResolvedValue(null);

        const result = await getAllProductsInMyCart({ corporateUserId: 1 });

        expect(result).toBe(-1);
    });

    it('should return empty productsArray when productDetails is null', async () => {
        ServiceCart.findOne.mockResolvedValue({
            cartId: 3,
            itemType: 'domainAndHosting',
            productDetails: null,
        });

        const result = await getAllProductsInMyCart({ corporateUserId: 1 });

        expect(result.productsArray).toEqual([]);
    });

    it('should throw error on DB failure', async () => {
        ServiceCart.findOne.mockRejectedValue(new Error('DB Error'));

        await expect(getAllProductsInMyCart({ corporateUserId: 1 })).rejects.toThrow('DB Error');
    });
});
