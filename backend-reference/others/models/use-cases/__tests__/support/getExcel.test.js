const { getExcel } = require('../../support'); // Adjust path as needed
const messages = require('../../../entities/support');
const corporateUser = require('../../../entities/corporateUser');
const systemUser = require('../../../entities/systemUser');
const credential = require('../../../entities/credential');
const { Op } = require('sequelize');

// Mock the models and methods
jest.mock('../../../entities/support', () => ({
  findAndCountAll: jest.fn(),
}));

jest.mock('../../../entities/corporateUser', () => ({
  hasMany: jest.fn(),
}));

jest.mock('../../../entities/systemUser', () => ({
  hasMany: jest.fn(),
}));

jest.mock('../../../entities/credential', () => ({
  // Mock specific methods if needed
}));

describe('getExcel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should retrieve data and format it correctly based on given parameters', async () => {
    const mockData = {
      count: 2,
      rows: [
        {
          corporateUser: {
            credential: {
              name: 'Corporate User 1',
            },
          },
          issueType: 'Issue Type 1',
          module: 'Module 1',
          status: 'PENDING',
          description: 'Description 1',
        },
        {
          corporateUser: {
            credential: {
              name: 'Corporate User 2',
            },
          },
          issueType: 'Issue Type 2',
          module: 'Module 2',
          status: 'RESOLVED',
          description: 'Description 2',
        },
      ],
    };

    messages.findAndCountAll.mockResolvedValue(mockData);

    const params = {
      registeredBy: 'User1',
      from: new Date('2024-01-01T00:00:00.000Z'),
      to: new Date('2024-01-31T23:59:59.999Z'),
      order: 'ASC',
      column: 'createdAt',
      status: 'PENDING',
      corporateUserId: 123,
    };

    const result = await getExcel(params);

    const expectedData = [
      {
        "Corporate ID": 'Corporate User 1',
        "Issue Type": 'Issue Type 1',
        Module: 'Module 1',
        Status: 'PENDING',
        Description: 'Description 1',
      },
      {
        "Corporate ID": 'Corporate User 2',
        "Issue Type": 'Issue Type 2',
        Module: 'Module 2',
        Status: 'RESOLVED',
        Description: 'Description 2',
      },
    ];

    expect(messages.findAndCountAll).toHaveBeenCalledWith({
      include: [
        {
          model: corporateUser,
          attributes: ["id", "credentialId", "registeredBy"],
          include: [
            {
              model: credential,
            },
          ],
        },
        {
          model: systemUser,
          attributes: ["id", "credentialId", "registeredBy"],
          include: [
            {
              model: credential,
            },
          ],
        },
      ],
      where: {
        createdAt: {
          [Op.between]: [params.from, params.to],
        },
        status: params.status && params.status !== 'all' ? params.status : undefined,
        corporateUserId: params.corporateUserId || undefined,
        ["$corporateUser.credential.registeredBy$"]: params.registeredBy,
      },
      order: [[params.column, params.order]],
    });

    expect(result).toEqual(expectedData);
  });

  it('should handle cases where data is not found', async () => {
    const mockData = {
      count: 0,
      rows: [],
    };

    messages.findAndCountAll.mockResolvedValue(mockData);

    const params = {
      registeredBy: 'User1',
      from: new Date('2024-01-01T00:00:00.000Z'),
      to: new Date('2024-01-31T23:59:59.999Z'),
      order: 'ASC',
      column: 'createdAt',
      status: 'PENDING',
      corporateUserId: 123,
    };

    const result = await getExcel(params);

    const expectedData = [];

    expect(result).toEqual(expectedData);
  });

  it('should handle errors gracefully', async () => {
    messages.findAndCountAll.mockRejectedValue(new Error('Database error'));

    const params = {
      registeredBy: 'User1',
      from: new Date('2024-01-01T00:00:00.000Z'),
      to: new Date('2024-01-31T23:59:59.999Z'),
      order: 'ASC',
      column: 'createdAt',
      status: 'PENDING',
      corporateUserId: 123,
    };

    // Ensure the function under test handles the rejection
    await expect(getExcel(params)).rejects.toThrow('Database error');
  });
});
