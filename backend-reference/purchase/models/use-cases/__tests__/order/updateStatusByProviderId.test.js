const order = require('../../../entities/order');
const credential = require('../../../entities/credential');
const { updateStatusByProviderId } = require('../../order');

jest.mock('../../../entities/order', () => ({
  findOne: jest.fn(),
}));

jest.mock('../../../entities/credential', () => ({}));

describe('updateStatusByProviderId', () => {
  let consoleLogSpy;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
  });

  it('should update shipmentStatus when order is found', async () => {
    const params = {
      Key: 'PROV123',
      Value: {
        UpdateCode: 'DELIVERED',
        UpdateDateTime: '2024-01-01T10:00:00Z',
        Comments: 'Package delivered',
      },
    };

    const existingShipmentStatus = [
      { UpdateCode: 'SHIPPED' },
    ];

    const saveMock = jest.fn().mockResolvedValue(true);
    const setDataValueMock = jest.fn();
    const getDataValueMock = jest
      .fn()
      .mockReturnValue(existingShipmentStatus);

    const mockOrderInstance = {
      getDataValue: getDataValueMock,
      setDataValue: setDataValueMock,
      save: saveMock,
    };

    order.findOne.mockResolvedValue(mockOrderInstance);

    const result = await updateStatusByProviderId(params);

    expect(order.findOne).toHaveBeenCalledWith({
      where: {
        providerId: params.Key,
      },
      include: [
        {
          model: credential,
          attributes: ['username', 'name', 'email'],
        },
      ],
    });

    expect(getDataValueMock).toHaveBeenCalledWith('shipmentStatus');

    expect(setDataValueMock).toHaveBeenCalledWith(
      'shipmentStatus',
      expect.arrayContaining([
        ...existingShipmentStatus,
        {
          UpdateCode: params.Value.UpdateCode,
          UpdateDateTime: params.Value.UpdateDateTime,
          UpdateLocation: params.Value,
          Comments: params.Value.Comments,
        },
      ])
    );

    expect(saveMock).toHaveBeenCalled();
    expect(result).toBe(mockOrderInstance);

    expect(console.log).toHaveBeenCalledWith(
      'ORDER UPDATE BY PROVIDER ID ONE ROUTE CALLED'
    );
  });

  it('should return null when order is not found', async () => {
    order.findOne.mockResolvedValue(null);

    const result = await updateStatusByProviderId({
      Key: 'UNKNOWN',
      Value: {},
    });

    expect(result).toBeNull();
    expect(console.log).toHaveBeenCalledWith(
      'ORDER UPDATE BY PROVIDER ID ONE ROUTE CALLED'
    );
  });

  it('should handle errors and return null', async () => {
    const error = new Error('DB error');

    order.findOne.mockRejectedValue(error);

    const result = await updateStatusByProviderId({
      Key: 'FAIL',
      Value: {},
    });

    expect(console.log).toHaveBeenCalledWith(
      'Error:',
      error.message
    );

    expect(console.log).toHaveBeenCalledWith(
      'ORDER UPDATE BY PROVIDER ID ONE ROUTE CALLED'
    );

    expect(result).toBeNull();
  });
});
