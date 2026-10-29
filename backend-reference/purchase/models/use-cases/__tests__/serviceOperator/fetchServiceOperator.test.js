const { fetchServiceOperator } = require('../../serviceOperator'); 
const serviceOperator = require('../../../entities/serviceOperator');
const { Op } = require('sequelize');

jest.mock('../../../entities/serviceOperator', () => ({
  findAll: jest.fn(),
}));

describe('fetchServiceOperator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch service operators matching the query', async () => {
    const query = 'ServiceA';
    const mockResults = [
      { id: 1, serviceProvider: 'ServiceA1' },
      { id: 2, serviceProvider: 'ServiceA2' },
    ];

    serviceOperator.findAll.mockResolvedValue(mockResults);

    const result = await fetchServiceOperator(query);

    expect(serviceOperator.findAll).toHaveBeenCalledWith({
      where: {
        serviceProvider: { [Op.like]: `%${query}%` },
        serviceStatus: true,
      },
      attributes: ['id', 'serviceProvider'],
    });

    expect(result).toEqual(mockResults);
  });

  it('should throw an error if findAll fails', async () => {
    const query = 'ServiceA';
    const error = new Error('DB Error');

    serviceOperator.findAll.mockRejectedValue(error);

    await expect(fetchServiceOperator(query)).rejects.toThrow(error);
  });
});
