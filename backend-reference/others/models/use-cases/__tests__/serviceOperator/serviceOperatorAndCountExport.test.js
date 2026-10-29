const { serviceOperatorAndCountExport } = require('../../serviceOperator'); // Adjust the path as needed
const serviceOperator = require('../../../entities/serviceOperator');
const vendors = require('../../../entities/vendor');
const { handleSortFields } = require('../../../../utils/sortHandle');

jest.mock('../../../entities/serviceOperator', () => ({
  findAndCountAll: jest.fn(),
}));

jest.mock('../../../../utils/sortHandle', () => ({
  handleSortFields: jest.fn(),
}));

jest.mock('../../../../utils/formatter', () => ({
  formattedDateTime: jest.fn((date) => date.toISOString()),
}));

describe('serviceOperatorAndCountExport', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });


  it('should return empty data if no operators match the criteria', async () => {
    const mockParams = {
      searchText: 'nonexistent',
      sort: 'ASC',
      sortField: 'serviceProvider',
    };
    const mockOrder = [['serviceProvider', 'ASC']];
    const mockData = {
      rows: [],
      count: 0,
    };

    handleSortFields.mockReturnValue(mockOrder);
    serviceOperator.findAndCountAll.mockResolvedValue(mockData);

    const result = await serviceOperatorAndCountExport(mockParams);

    expect(handleSortFields).toHaveBeenCalledWith('serviceProvider', 'ASC');
    expect(serviceOperator.findAndCountAll).toHaveBeenCalledWith({
      include: [
        {
          model: vendors,
          attributes: ['vendorName', 'apiUrl', ['optional1', 'token']],
        },
      ],
      where: expect.any(Object),
      order: mockOrder,
    });

    expect(result).toEqual([]);
  });

  it('should handle errors during data fetch', async () => {
    const mockParams = {
      searchText: 'test',
      sort: 'ASC',
      sortField: 'serviceProvider',
    };
    const mockError = new Error('Database error');

    serviceOperator.findAndCountAll.mockRejectedValue(mockError);

    await expect(serviceOperatorAndCountExport(mockParams)).rejects.toEqual({
      message: 'Something went wrong',
    });

    expect(serviceOperator.findAndCountAll).toHaveBeenCalledWith({
      include: [
        {
          model: vendors,
          attributes: ['vendorName', 'apiUrl', ['optional1', 'token']],
        },
      ],
      where: expect.any(Object),
      order: expect.any(Array),
    });
  });
});
