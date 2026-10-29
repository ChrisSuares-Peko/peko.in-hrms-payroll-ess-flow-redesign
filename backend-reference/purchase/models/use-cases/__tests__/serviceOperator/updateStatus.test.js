const { updateStatus } = require('../../serviceOperator'); 
const serviceOperator = require('../../../entities/serviceOperator');

jest.mock('../../../entities/serviceOperator', () => ({
  update: jest.fn(),
}));

jest.mock('../../../../utils/loggerHelper', () => ({
  customLog: jest.fn(),
}));

describe('updateStatus', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should update the service operator status successfully', async () => {
    const req = {
      params: { id: 1 },
      body: { status: 'ACTIVE' },
    };
    const mockResult = [1];

    serviceOperator.update.mockResolvedValue(mockResult);

    const result = await updateStatus(req);

    expect(serviceOperator.update).toHaveBeenCalledWith(req.body, {
      where: { id: req.params.id },
    });

    expect(result).toEqual(mockResult);
  });

  it('should throw an error if update fails', async () => {
    const req = {
      params: { id: 1 },
      body: { status: 'INACTIVE' },
    };
    const error = new Error('DB Error');

    serviceOperator.update.mockRejectedValue(error);

    await expect(updateStatus(req)).rejects.toThrow(error);
  });
});
