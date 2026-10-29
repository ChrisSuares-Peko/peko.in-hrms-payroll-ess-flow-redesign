const governmentServicesApplication = require('../../../entities/governmentServicesApplication');
const credential = require('../../../entities/credential');
const { findByIdAdmin } = require('../../governmentServicesApplication');

jest.mock('../../../entities/governmentServicesApplication', () => ({
  findOne: jest.fn(),
}));
jest.mock('../../../entities/credential', () => ({}));

describe('governmentServicesApplication findByIdAdmin use-case', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch the full row with credential, without a credential scope', async () => {
    const mockResult = { id: 1 };
    governmentServicesApplication.findOne.mockResolvedValue(mockResult);

    const result = await findByIdAdmin(1);

    expect(governmentServicesApplication.findOne).toHaveBeenCalledWith({
      where: { id: 1 },
      include: [{ model: credential, as: 'credential', attributes: ['id', 'username', 'name'], required: false }],
    });
    expect(result).toEqual(mockResult);
  });

  it('should return null when not found', async () => {
    governmentServicesApplication.findOne.mockResolvedValue(null);

    expect(await findByIdAdmin(99)).toBeNull();
  });

  it('should throw an error when database query fails', async () => {
    governmentServicesApplication.findOne.mockRejectedValue(new Error('DB error'));

    await expect(findByIdAdmin(1)).rejects.toThrow('DB error');
  });
});
