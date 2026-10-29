'use strict';
const { updateExistingProductInCart } = require('../../serviceCart');
const ServiceCart = require('../../../entities/serviceCart');

jest.mock('../../../entities/serviceCart', () => ({
    findOne: jest.fn(),
    update: jest.fn(),
    destroy: jest.fn(),
}));

describe('updateExistingProductInCart', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return -2 when no cart record is found', async () => {
        ServiceCart.findOne.mockResolvedValue(null);

        const result = await updateExistingProductInCart(
            { productId: 'linux-hosting', planId: 'starter', operation: 'increase', corporateUserId: 1, productQuantity: 1 },
            600, 50
        );

        expect(result).toBe(-2);
    });

    it('should return -2 when item is not found in cart', async () => {
        ServiceCart.findOne.mockResolvedValue({
            productDetails: JSON.stringify([{ productId: 'domain-com', planId: null, productQuantity: 1, totalPrice: 899, totalVat: 0 }]),
        });

        const result = await updateExistingProductInCart(
            { productId: 'linux-hosting', planId: 'starter', operation: 'increase', corporateUserId: 1, productQuantity: 1 },
            600, 50
        );

        expect(result).toBe(-2);
    });

    it('should increase quantity and price on increase operation', async () => {
        const existing = [{ productId: 'linux-hosting', planId: 'starter', productQuantity: 1, totalPrice: 600, totalVat: 50 }];
        ServiceCart.findOne.mockResolvedValue({ productDetails: JSON.stringify(existing) });
        ServiceCart.update.mockResolvedValue([1]);

        const result = await updateExistingProductInCart(
            { productId: 'linux-hosting', planId: 'starter', operation: 'increase', corporateUserId: 1, productQuantity: 1 },
            600, 50
        );

        expect(result).toEqual({ newQuantity: 2 });
        const updated = JSON.parse(ServiceCart.update.mock.calls[0][0].productDetails);
        expect(updated[0].productQuantity).toBe(2);
        expect(updated[0].totalPrice).toBe(1200);
        expect(updated[0].totalVat).toBe(100);
    });

    it('should decrease quantity and price on decrease operation', async () => {
        const existing = [{ productId: 'linux-hosting', planId: 'starter', productQuantity: 2, totalPrice: 1200, totalVat: 100 }];
        ServiceCart.findOne.mockResolvedValue({ productDetails: JSON.stringify(existing) });
        ServiceCart.update.mockResolvedValue([1]);

        const result = await updateExistingProductInCart(
            { productId: 'linux-hosting', planId: 'starter', operation: 'decrease', corporateUserId: 1, productQuantity: 1 },
            600, 50
        );

        expect(result).toEqual({ newQuantity: 1 });
    });

    it('should destroy cart and return -1 when last item quantity reaches zero', async () => {
        const existing = [{ productId: 'linux-hosting', planId: 'starter', productQuantity: 1, totalPrice: 600, totalVat: 50 }];
        ServiceCart.findOne.mockResolvedValue({ productDetails: JSON.stringify(existing) });
        ServiceCart.destroy.mockResolvedValue(1);

        const result = await updateExistingProductInCart(
            { productId: 'linux-hosting', planId: 'starter', operation: 'decrease', corporateUserId: 1, productQuantity: 1 },
            600, 50
        );

        expect(ServiceCart.destroy).toHaveBeenCalled();
        expect(result).toBe(-1);
    });

    it('should throw error on DB failure', async () => {
        ServiceCart.findOne.mockRejectedValue(new Error('DB Error'));

        await expect(
            updateExistingProductInCart(
                { productId: 'linux-hosting', planId: 'starter', operation: 'increase', corporateUserId: 1, productQuantity: 1 },
                600, 50
            )
        ).rejects.toThrow('DB Error');
    });
});
