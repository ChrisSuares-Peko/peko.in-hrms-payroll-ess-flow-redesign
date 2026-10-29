const { findOneServiceOperator } = require('../../serviceOperator'); 
const serviceOperator = require('../../../entities/serviceOperator');

jest.mock('../../../entities/serviceOperator', () => ({
  findOne: jest.fn(),
}));

describe('findOneServiceOperator', () => {
  let consoleLogSpy;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
  });

  it('should return service operator when found', async () => {
    const mockServiceOperator = { id: 1, serviceProvider: 'Provider A' };
    serviceOperator.findOne.mockResolvedValue(mockServiceOperator);

    const params = { serviceOperatorId: 1 };
    const result = await findOneServiceOperator(params);

    expect(serviceOperator.findOne).toHaveBeenCalledWith({
      where: { id: 1 },
    });
    expect(result).toEqual(mockServiceOperator);
    expect(consoleLogSpy).toHaveBeenCalledWith('SERVICE OPERATOR FIND ONE ROUTE CALLED');
  });

  it('should return undefined when service operator not found', async () => {
    serviceOperator.findOne.mockResolvedValue(null);

    const params = { serviceOperatorId: 999 };
    const result = await findOneServiceOperator(params);

    expect(serviceOperator.findOne).toHaveBeenCalledWith({
      where: { id: 999 },
    });
    expect(result).toBeNull();
    expect(consoleLogSpy).toHaveBeenCalledWith('SERVICE OPERATOR FIND ONE ROUTE CALLED');
  });

  it('should log error if findOne throws', async () => {
    const error = new Error('DB Error');
    serviceOperator.findOne.mockRejectedValue(error);

    const params = { serviceOperatorId: 1 };
    const result = await findOneServiceOperator(params);

    expect(consoleLogSpy).toHaveBeenCalledWith(error);
    expect(consoleLogSpy).toHaveBeenCalledWith('SERVICE OPERATOR FIND ONE ROUTE CALLED');
    expect(result).toBeUndefined();
  });
});
