const { Delete } = require('../../softwares');
const softwares = require('../../../entities/softwares');

jest.mock('../../../entities/softwares', () => ({
  destroy: jest.fn(),
}));
jest.mock('../../../entities/subCorporateUsers', () => ({
  belongsTo: jest.fn(),
}));

describe('Delete Software Use-Case', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should delete the software and return the result', async () => {
    const params = { productCode: '1234' };

    softwares.destroy.mockResolvedValue(1);

    const result = await Delete(params);

    expect(softwares.destroy).toHaveBeenCalledWith({
      where: {
        id: params.productCode,
      },
    });
    expect(result).toBe(1);
  });

  it('should handle errors', async () => {
    const params = { productCode: '1234' };
    const error = new Error('Deletion failed');

    softwares.destroy.mockRejectedValue(error);

    await expect(Delete(params)).rejects.toEqual(error);

    expect(softwares.destroy).toHaveBeenCalledWith({
      where: {
        id: params.productCode,
      },
    });
  });

  it('should handle no rows affected and return 0', async () => {
    const params = { productCode: '1234' };

    softwares.destroy.mockResolvedValue(0);

    const result = await Delete(params);

    expect(softwares.destroy).toHaveBeenCalledWith({
      where: {
        id: params.productCode,
      },
    });
    expect(result).toBe(0);
  });

 it('should handle invalid parameters gracefully', async () => {
  const invalidParams = { productCode: null };

  softwares.destroy.mockRejectedValue(new Error('Invoice product code'));

  await expect(Delete(invalidParams)).rejects.toThrow('Invoice product code');

  expect(softwares.destroy).not.toHaveBeenCalled();
});

it('should handle empty productCode and return false', async () => {
  const params = { productCode: '' };

  softwares.destroy.mockRejectedValue(new Error('Invoice product code'));

  await expect(Delete(params)).rejects.toThrow('Invoice product code');

  expect(softwares.destroy).not.toHaveBeenCalled();
});

});
