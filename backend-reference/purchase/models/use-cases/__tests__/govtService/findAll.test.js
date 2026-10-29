const govtService = require('../../../entities/govtService');
const { Op } = require('sequelize');
const { findAll } = require('../../govtService');

jest.mock('../../../entities/govtService', () => ({
  findAll: jest.fn(),
}));

jest.mock('../../../../utils/loggerHelper', () => ({
  customLog: jest.fn(),
}));

describe('govtService findAll use-case', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return all govt services without search text', async () => {
    const params = { status: true };
    const mockResult = [
      { id: 1, name: 'GST Registration' },
      { id: 2, name: 'MSME Registration' },
    ];

    govtService.findAll.mockResolvedValue(mockResult);

    const result = await findAll(params);

    expect(govtService.findAll).toHaveBeenCalledWith({
      where: { status: true },
      order: [['sortOrder', 'ASC'], ['createdAt', 'DESC']],
    });
    expect(result).toEqual(mockResult);
  });

  it('should use default empty params when none provided', async () => {
    govtService.findAll.mockResolvedValue([]);

    const result = await findAll();

    expect(govtService.findAll).toHaveBeenCalledWith({
      where: {},
      order: [['sortOrder', 'ASC'], ['createdAt', 'DESC']],
    });
    expect(result).toEqual([]);
  });

  it('should apply name filter when search text is provided', async () => {
    const searchText = 'GST';
    const mockResult = [{ id: 1, name: 'GST Registration' }];

    govtService.findAll.mockResolvedValue(mockResult);

    const result = await findAll({}, searchText);

    expect(govtService.findAll).toHaveBeenCalledWith({
      where: { name: { [Op.like]: '%GST%' } },
      order: [['sortOrder', 'ASC'], ['createdAt', 'DESC']],
    });
    expect(result).toEqual(mockResult);
  });

  it('should return false when an error occurs', async () => {
    govtService.findAll.mockRejectedValue(new Error('DB error'));

    const result = await findAll();

    expect(result).toBe(false);
  });
});
