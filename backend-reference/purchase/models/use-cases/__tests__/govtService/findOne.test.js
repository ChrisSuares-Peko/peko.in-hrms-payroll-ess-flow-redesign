const govtService = require('../../../entities/govtService');
const { findOne } = require('../../govtService');

jest.mock('../../../entities/govtService', () => ({
  findOne: jest.fn(),
}));

jest.mock('../../../../utils/loggerHelper', () => ({
  customLog: jest.fn(),
}));

describe('govtService findOne use-case', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return a govt service when found', async () => {
    const params = { slug: 'gst-registration' };
    const mockResult = { id: 1, name: 'GST Registration', slug: 'gst-registration' };

    govtService.findOne.mockResolvedValue(mockResult);

    const result = await findOne(params);

    expect(govtService.findOne).toHaveBeenCalledWith({ where: params });
    expect(result).toEqual(mockResult);
  });

  it('should return null when no service is found', async () => {
    govtService.findOne.mockResolvedValue(null);

    const result = await findOne({ slug: 'nonexistent' });

    expect(result).toBeNull();
  });

  it('should return false when an error occurs', async () => {
    govtService.findOne.mockRejectedValue(new Error('DB error'));

    const result = await findOne({ slug: 'gst-registration' });

    expect(result).toBe(false);
  });
});
