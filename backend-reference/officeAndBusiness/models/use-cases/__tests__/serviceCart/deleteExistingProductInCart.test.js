'use strict';
const { deleteExistingProductInCart } = require('../../serviceCart');
const ServiceCart = require('../../../entities/serviceCart');

jest.mock('../../../entities/serviceCart', () => ({
    findOne: jest.fn(),
    update: jest.fn(),
    destroy: jest.fn(),
}));

describe('deleteExistingProductInCart', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return -2 when cart record is not found', async () => {
        ServiceCart.findOne.mockResolvedValue(null);

        const result = await deleteExistingProductInCart(
            { productId: 'linux-hosting', planId: 'starter' },
            { corporateUserId: 1 }
        );

        expect(result).toBe(-2);
    });

    it('should return -2 when item is not found in cart', async () => {
        ServiceCart.findOne.mockResolvedValue({
            productDetails: JSON.stringify([{ productId: 'domain-com', planId: null, productQuantity: 1 }]),
        });

        const result = await deleteExistingProductInCart(
            { productId: 'linux-hosting', planId: 'starter' },
            { corporateUserId: 1 }
        );

        expect(result).toBe(-2);
    });

    it('should remove item from cart, update, and return removed quantity', async () => {
        const existing = [
            { productId: 'linux-hosting', planId: 'starter', productQuantity: 3 },
            { productId: 'domain-com', planId: null, productQuantity: 1 },
        ];
        ServiceCart.findOne.mockResolvedValue({ productDetails: JSON.stringify(existing) });
        ServiceCart.update.mockResolvedValue([1]);

        const result = await deleteExistingProductInCart(
            { productId: 'linux-hosting', planId: 'starter' },
            { corporateUserId: 1 }
        );

        expect(result).toBe(3);
        const updatedDetails = JSON.parse(ServiceCart.update.mock.calls[0][0].productDetails);
        expect(updatedDetails.length).toBe(1);
        expect(updatedDetails[0].productId).toBe('domain-com');
    });

    it('should destroy cart and return -1 when last item is removed', async () => {
        const existing = [{ productId: 'linux-hosting', planId: 'starter', productQuantity: 2 }];
        ServiceCart.findOne.mockResolvedValue({ productDetails: JSON.stringify(existing) });
        ServiceCart.destroy.mockResolvedValue(1);

        const result = await deleteExistingProductInCart(
            { productId: 'linux-hosting', planId: 'starter' },
            { corporateUserId: 1 }
        );

        expect(ServiceCart.destroy).toHaveBeenCalled();
        expect(ServiceCart.update).not.toHaveBeenCalled();
        expect(result).toBe(-1);
    });

    it('should delete domain item matched by productName', async () => {
        const existing = [
            { productId: 'domain-com', planId: null, itemType: 'domain', productName: 'example.com', productQuantity: 1 },
            { productId: 'domain-com', planId: null, itemType: 'domain', productName: 'other.com', productQuantity: 1 },
        ];
        ServiceCart.findOne.mockResolvedValue({ productDetails: JSON.stringify(existing) });
        ServiceCart.update.mockResolvedValue([1]);

        const result = await deleteExistingProductInCart(
            { productId: 'domain-com', planId: null, productName: 'example.com' },
            { corporateUserId: 1 }
        );

        expect(result).toBe(1);
        const updatedDetails = JSON.parse(ServiceCart.update.mock.calls[0][0].productDetails);
        expect(updatedDetails.length).toBe(1);
        expect(updatedDetails[0].productName).toBe('other.com');
    });

    it('should use subCorporateUserId in where clause when provided', async () => {
        ServiceCart.findOne.mockResolvedValue(null);

        await deleteExistingProductInCart(
            { productId: 'linux-hosting', planId: 'starter' },
            { corporateUserId: 1, subCorporateUserId: 99 }
        );

        expect(ServiceCart.findOne).toHaveBeenCalledWith(
            expect.objectContaining({ where: { itemType: 'domainAndHosting', subCorporateUserId: 99 } })
        );
    });

    it('should throw error on DB failure', async () => {
        ServiceCart.findOne.mockRejectedValue(new Error('DB Error'));

        await expect(
            deleteExistingProductInCart({ productId: 'linux-hosting', planId: 'starter' }, { corporateUserId: 1 })
        ).rejects.toThrow('DB Error');
    });
});
