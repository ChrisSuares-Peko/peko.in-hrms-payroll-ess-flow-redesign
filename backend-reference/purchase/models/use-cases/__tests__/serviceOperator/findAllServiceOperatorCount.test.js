const { findAllServiceOperatorCount } = require('../../serviceOperator'); // adjust path
const serviceOperator = require('../../../entities/serviceOperator');
const vendors = require('../../../entities/vendor');
const { Op } = require('sequelize');

jest.mock('../../../entities/serviceOperator', () => ({
  findAndCountAll: jest.fn(),
}));

jest.mock('../../../entities/vendor', () => ({}));

describe('findAllServiceOperatorCount', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch service operators with count successfully', async () => {
    const params = {
      start: 0,
      length: 10,
      searchText: 'ServiceA',
      order: 'DESC',
      column: 0, // maps to 'serviceProvider'
    };

    const mockResult = {
      count: 2,
      rows: [
        { id: 1, serviceProvider: 'ServiceA1' },
        { id: 2, serviceProvider: 'ServiceA2' },
      ],
    };

    serviceOperator.findAndCountAll.mockResolvedValue(mockResult);

    const result = await findAllServiceOperatorCount(params);

    expect(serviceOperator.findAndCountAll).toHaveBeenCalledWith({
      include: [{
        model: vendors,
        as: '',
        attributes: ['vendorName', 'apiUrl', ['optional1', 'token']],
      }],
      where: expect.objectContaining({
        [Op.or]: expect.any(Array),
      }),
      order: [['serviceProvider', 'DESC']],
      limit: 10,
      offset: 0,
    });

    expect(result).toEqual(mockResult);
  });

  it('should default to createdAt column if index is invalid', async () => {
    const params = {
      start: 0,
      length: 10,
      searchText: 'ServiceA',
      order: 'ASC',
      column: 100, // invalid index
    };

    const mockResult = { count: 1, rows: [{ id: 1 }] };
    serviceOperator.findAndCountAll.mockResolvedValue(mockResult);

    const result = await findAllServiceOperatorCount(params);

    expect(serviceOperator.findAndCountAll).toHaveBeenCalledWith(
      expect.objectContaining({
        order: [['createdAt', 'ASC']],
      })
    );

    expect(result).toEqual(mockResult);
  });

  it('should throw an error if findAndCountAll fails', async () => {
    const params = { start: 0, length: 10, searchText: '', order: 'DESC', column: 0 };
    const error = new Error('DB Error');

    serviceOperator.findAndCountAll.mockRejectedValue(error);

    await expect(findAllServiceOperatorCount(params)).rejects.toThrow(error);
  });
});
