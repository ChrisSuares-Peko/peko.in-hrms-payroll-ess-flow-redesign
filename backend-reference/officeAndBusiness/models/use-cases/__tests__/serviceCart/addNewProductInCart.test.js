'use strict';
const { addNewProductInCart } = require('../../serviceCart');
const ServiceCart = require('../../../entities/serviceCart');

jest.mock('../../../entities/serviceCart', () => ({
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
}));

describe('addNewProductInCart', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should create a new cart when no existing cart is found', async () => {
        ServiceCart.findOne.mockResolvedValue(null);
        ServiceCart.create.mockResolvedValue({ id: 1 });

        const params = { productId: 'linux-hosting', planId: 'starter', productQuantity: '1', totalPrice: 600 };
        const result = await addNewProductInCart(params, { corporateUserId: 1 });

        expect(ServiceCart.create).toHaveBeenCalledWith({
            itemType: 'domainAndHosting',
            corporateUserId: 1,
            productDetails: JSON.stringify([{ ...params, productQuantity: 1 }]),
        });
        expect(result).toBe(true);
    });

    it('should return false when cart creation fails', async () => {
        ServiceCart.findOne.mockResolvedValue(null);
        ServiceCart.create.mockResolvedValue(null);

        const result = await addNewProductInCart(
            { productId: 'linux-hosting', planId: 'starter', productQuantity: '1', totalPrice: 600 },
            { corporateUserId: 1 }
        );

        expect(result).toBe(false);
    });

    it('should add new item to existing cart and update', async () => {
        const existing = [{ productId: 'domain-com', planId: null, productQuantity: 1, totalPrice: 899 }];
        ServiceCart.findOne.mockResolvedValue({ productDetails: JSON.stringify(existing) });
        ServiceCart.update.mockResolvedValue([1]);

        const newItem = { productId: 'linux-hosting', planId: 'starter', productQuantity: '1', totalPrice: 600 };
        const result = await addNewProductInCart(newItem, { corporateUserId: 1 });

        expect(ServiceCart.update).toHaveBeenCalled();
        expect(result).toBe(true);
    });

    it('should accumulate quantity and price for duplicate item and return duplicate', async () => {
        const existing = [{ productId: 'linux-hosting', planId: 'starter', productQuantity: 1, totalPrice: 600 }];
        ServiceCart.findOne.mockResolvedValue({ productDetails: JSON.stringify(existing) });
        ServiceCart.update.mockResolvedValue([1]);

        const result = await addNewProductInCart(
            { productId: 'linux-hosting', planId: 'starter', productQuantity: '2', totalPrice: 1200 },
            { corporateUserId: 1 }
        );

        expect(result).toBe('duplicate');
        const updatedDetails = JSON.parse(ServiceCart.update.mock.calls[0][0].productDetails);
        expect(updatedDetails[0].productQuantity).toBe(3);
        expect(updatedDetails[0].totalPrice).toBe(1800);
    });

    it('should treat domain items with different names as separate items', async () => {
        const existing = [{ productId: 'domain-com', planId: null, itemType: 'domain', productName: 'example.com', productQuantity: 1, totalPrice: 899 }];
        ServiceCart.findOne.mockResolvedValue({ productDetails: JSON.stringify(existing) });
        ServiceCart.update.mockResolvedValue([1]);

        const result = await addNewProductInCart(
            { productId: 'domain-com', planId: null, itemType: 'domain', productName: 'other.com', productQuantity: '1', totalPrice: 899 },
            { corporateUserId: 1 }
        );

        expect(result).toBe(true);
        const updatedDetails = JSON.parse(ServiceCart.update.mock.calls[0][0].productDetails);
        expect(updatedDetails.length).toBe(2);
    });

    it('should use subCorporateUserId in where clause when provided', async () => {
        ServiceCart.findOne.mockResolvedValue(null);
        ServiceCart.create.mockResolvedValue({ id: 1 });

        await addNewProductInCart(
            { productId: 'linux-hosting', planId: 'starter', productQuantity: '1', totalPrice: 600 },
            { corporateUserId: 1, subCorporateUserId: 99 }
        );

        expect(ServiceCart.findOne).toHaveBeenCalledWith(
            expect.objectContaining({ where: { itemType: 'domainAndHosting', subCorporateUserId: 99 } })
        );
    });
});
