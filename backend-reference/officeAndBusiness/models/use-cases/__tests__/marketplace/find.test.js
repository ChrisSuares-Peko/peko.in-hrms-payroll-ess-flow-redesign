const { find } = require('../../peko_connect');
const peko_connect = require('../../../entities/peko_connect');

jest.mock('../../../entities/peko_connect', () => ({
  findOne: jest.fn(),
}));

describe('find Use-Case', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should find and return a peko record by id with excluded attributes', async () => {
    const params = { id: 1 };
    const exclude = ['email', 'mobileNo'];

    const mockPekoRecord = {
      id: 1,
      serviceProvider: 'ServiceProvider1',
      name: 'John Doe',
      address: '123 Street',
      // other fields without email and mobileNo
    };

    peko_connect.findOne.mockResolvedValue(mockPekoRecord);

    const result = await find(params, exclude);

    expect(peko_connect.findOne).toHaveBeenCalledWith({
      where: { id: params.id },
      attributes: {
        exclude
      }
    });
    expect(result).toEqual(mockPekoRecord);
  });

  it('should throw an error if the findOne method throws an error', async () => {
    const params = { id: 1 };
    const exclude = ['email', 'mobileNo'];

    const errorMessage = 'Something went wrong';
    peko_connect.findOne.mockRejectedValue(new Error(errorMessage));

    await expect(find(params, exclude)).rejects.toThrow(errorMessage);

    expect(peko_connect.findOne).toHaveBeenCalledWith({
      where: { id: params.id },
      attributes: {
        exclude
      }
    });
  });
});
