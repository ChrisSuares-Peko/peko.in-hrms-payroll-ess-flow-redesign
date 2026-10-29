const { create } = require('../../../use-cases/subscriptions');
const product = require('../../../entities/products');
const photos = require('../../../entities/photos');
const sequelize = require('../../../../configs/database/index');
const { uploadFile } = require('../../../../utils/commonUploadFile');

jest.mock('../../../entities/products', () => ({
    create: jest.fn(),
}));

jest.mock('../../../entities/photos', () => ({
    bulkCreate: jest.fn(),
}));
jest.mock('../../../entities/categories', () => ({
    belongsTo: jest.fn(),
}));

jest.mock('../../../../configs/database/index', () => ({
  transaction: jest.fn().mockResolvedValue({
    commit: jest.fn(),
    rollback: jest.fn(),
  }),
  define: jest.fn(),
}));


jest.mock('../../../../utils/commonUploadFile', () => ({
    uploadFile: jest.fn(),
}));

describe('create', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should create a product successfully and upload images', async () => {
        const mockParams = {
            name: 'Test Product',
            productImage1: 'imageData',
            productImageFormat1: 'png',
        };
        const mockTransaction = await sequelize.transaction();
        const mockPublicUrl = 'https://example.com/image.png';
        const mockProduct = { id: 1, ...mockParams };

        uploadFile.mockResolvedValue(mockPublicUrl);
        product.create.mockResolvedValue(mockProduct);
        photos.bulkCreate.mockResolvedValue([]);

        const result = await create(mockParams);

        expect(uploadFile).toHaveBeenCalledWith(mockParams.productImage1, 'productImage1', mockParams.productImageFormat1);
        expect(product.create).toHaveBeenCalledWith(expect.objectContaining({ productImage: mockPublicUrl }), { transaction: mockTransaction });
        expect(photos.bulkCreate).toHaveBeenCalledWith(expect.any(Array), { transaction: mockTransaction });
        expect(mockTransaction.commit).toHaveBeenCalled();
        expect(result).toEqual(mockProduct);
    });

 it('should create a product successfully without an image', async () => {
  const mockParams = { name: 'Test Product' };
  const mockTransaction = await sequelize.transaction();
  const mockProduct = { id: 1, ...mockParams };

  product.create.mockResolvedValue(mockProduct);

  const result = await create(mockParams);

  expect(product.create).toHaveBeenCalledWith(mockParams, { transaction: mockTransaction });
  expect(photos.bulkCreate).not.toHaveBeenCalled(); // ✅ Corrected
  expect(mockTransaction.commit).toHaveBeenCalled();
  expect(result).toEqual(mockProduct);
});

it('should return false if product creation fails', async () => {
  const mockParams = { name: 'Test Product' };
 
  product.create.mockResolvedValue(null);

  const result = await create(mockParams);

  expect(result).toBe(false);
 
});

it('should handle errors and rollback transaction if creation fails', async () => {
  const mockParams = { name: 'Test Product' };
  const mockError = new Error('Database error');

  product.create.mockRejectedValue(mockError);

  const result = await create(mockParams);

  expect(result).toBe(false); // ✅ Your function returns false instead of throwing
  const mockTransaction = await sequelize.transaction();
  expect(mockTransaction.rollback).toHaveBeenCalled(); // ✅ Ensure rollback happens
});

});
