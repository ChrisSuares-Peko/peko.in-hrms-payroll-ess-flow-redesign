const partnerPermission = require('../../../entities/partnerPermission');
const { findOnePartnerPermissionData } = require('../../partnerPermission');

jest.mock('../../../entities/partnerPermission', () => ({
  findOne: jest.fn(),
}));

describe('findOnePartnerPermissionData', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should find partner permission using registeredBy and default attributes', async () => {
    const mockResult = { id: 1, registeredBy: 50 };

    partnerPermission.findOne.mockResolvedValue(mockResult);

    const result = await findOnePartnerPermissionData(50);

    expect(partnerPermission.findOne).toHaveBeenCalledWith({
      where: { registeredBy: 50 },
      attributes: undefined
    });

    expect(result).toBe(mockResult);
  });

  it('should call with registeredBy = null when param is not passed', async () => {
    const mockResult = { id: 99 };

    partnerPermission.findOne.mockResolvedValue(mockResult);

    const result = await findOnePartnerPermissionData();

    expect(partnerPermission.findOne).toHaveBeenCalledWith({
      where: { registeredBy: null },
      attributes: undefined
    });

    expect(result).toBe(mockResult);
  });

  it('should accept and pass attributes to query', async () => {
    const mockResult = { id: 1, canView: true };

    partnerPermission.findOne.mockResolvedValue(mockResult);

    const attributes = ['id', 'canView'];

    const result = await findOnePartnerPermissionData(20, attributes);

    expect(partnerPermission.findOne).toHaveBeenCalledWith({
      where: { registeredBy: 20 },
      attributes
    });

    expect(result).toEqual(mockResult);
  });

  it('should return null if no partner permission exists', async () => {
    partnerPermission.findOne.mockResolvedValue(null);

    const result = await findOnePartnerPermissionData(200);

    expect(result).toBeNull();
  });

});