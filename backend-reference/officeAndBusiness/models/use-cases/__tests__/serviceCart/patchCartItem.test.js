'use strict';
const { patchCartItem } = require('../../serviceCart');
const ServiceCart = require('../../../entities/serviceCart');

jest.mock('../../../entities/serviceCart', () => ({
    findOne: jest.fn(),
    update: jest.fn(),
}));

describe('patchCartItem', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return -2 when cart record is not found', async () => {
        ServiceCart.findOne.mockResolvedValue(null);

        const result = await patchCartItem(
            { productId: 'linux-hosting', planId: 'starter' },
            { billingCycle: 24 },
            { corporateUserId: 1 }
        );

        expect(result).toBe(-2);
    });

    it('should return -2 when item is not found in cart', async () => {
        ServiceCart.findOne.mockResolvedValue({
            productDetails: JSON.stringify([{ productId: 'domain-com', planId: null }]),
        });

        const result = await patchCartItem(
            { productId: 'linux-hosting', planId: 'starter' },
            { billingCycle: 24 },
            { corporateUserId: 1 }
        );

        expect(result).toBe(-2);
    });

    it('should patch the matching cart item and return updated item', async () => {
        const existing = [{ productId: 'linux-hosting', planId: 'starter', billingCycle: 12, totalPrice: 600 }];
        ServiceCart.findOne.mockResolvedValue({ productDetails: JSON.stringify(existing) });
        ServiceCart.update.mockResolvedValue([1]);

        const result = await patchCartItem(
            { productId: 'linux-hosting', planId: 'starter' },
            { billingCycle: 24, totalPrice: 1100 },
            { corporateUserId: 1 }
        );

        expect(result).toEqual({ productId: 'linux-hosting', planId: 'starter', billingCycle: 24, totalPrice: 1100 });
        const updatedDetails = JSON.parse(ServiceCart.update.mock.calls[0][0].productDetails);
        expect(updatedDetails[0].billingCycle).toBe(24);
    });

    it('should match domain item by productName', async () => {
        const existing = [
            { productId: 'domain-com', planId: null, itemType: 'domain', productName: 'example.com', totalPrice: 899 },
        ];
        ServiceCart.findOne.mockResolvedValue({ productDetails: JSON.stringify(existing) });
        ServiceCart.update.mockResolvedValue([1]);

        const result = await patchCartItem(
            { productId: 'domain-com', planId: null, productName: 'example.com' },
            { totalPrice: 950 },
            { corporateUserId: 1 }
        );

        expect(result.totalPrice).toBe(950);
    });

    it('should use subCorporateUserId in where clause when provided', async () => {
        ServiceCart.findOne.mockResolvedValue(null);

        await patchCartItem(
            { productId: 'linux-hosting', planId: 'starter' },
            { billingCycle: 24 },
            { corporateUserId: 1, subCorporateUserId: 99 }
        );

        expect(ServiceCart.findOne).toHaveBeenCalledWith(
            expect.objectContaining({ where: { itemType: 'domainAndHosting', subCorporateUserId: 99 } })
        );
    });

    it('should throw error on DB failure', async () => {
        ServiceCart.findOne.mockRejectedValue(new Error('DB Error'));

        await expect(
            patchCartItem({ productId: 'linux-hosting', planId: 'starter' }, {}, { corporateUserId: 1 })
        ).rejects.toThrow('DB Error');
    });
});
