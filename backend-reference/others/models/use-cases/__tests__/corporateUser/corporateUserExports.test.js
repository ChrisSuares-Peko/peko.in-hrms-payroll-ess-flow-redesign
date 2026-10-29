const { corporateUserExports } = require('../../corporateUser');
const corporateUser = require('../../../entities/corporateUser');
const wallets = require('../../../entities/wallet');
const credential = require('../../../entities/credential');
const { Op } = require('sequelize');
const { formattedDateTime, formatNumberWithLocalString } = require('../../../../utils/formatter');

jest.mock('../../../../utils/formatter', () => ({
  formattedDateTime: jest.fn(),
  formatNumberWithLocalString: jest.fn(),
}));

describe('corporate User Exports Use-Case', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should successfully retrieve and format data', async () => {
    const params = {
      sort: 'ASC',
      sortField: 'createdAt',
      searchText: 'Test Corp',
      partnerId: 123,
    };

    const mockData = {
      rows: [
        {
          credentialId: 1,
          createdAt: '2024-01-01T00:00:00.000Z',
          mobileNo: '1234567890',
          email: 'test@example.com',
          city: 'Dubai',
          isActive: 1,
          credential: {
            name: 'Test Corp',
            username: 'testcorp',
            registeredBy: 123,
          },
        },
      ],
      count: 1
    };

    const mockWalletData = [
      {
        credentialId: 1,
        balance: 1000.5,
      },
    ];

    const mockPartnerData = [
      {
        id: 123,
        name: 'Partner Corp',
      },
    ];

    corporateUser.findAndCountAll = jest.fn().mockResolvedValue(mockData);
    wallets.findAll = jest.fn().mockResolvedValue(mockWalletData);
    credential.findAll = jest.fn().mockResolvedValue(mockPartnerData);

    formattedDateTime.mockReturnValue('01/01/2024');
    formatNumberWithLocalString.mockReturnValue('1,000.50');

    const result = await corporateUserExports(params);

    expect(result[0]).toEqual({
      Date: '01/01/2024',
      'Corporate Name': 'Test Corp',
      'Account ID': 'testcorp',
      'Mobile No': '1234567890',
      'Email ID': 'test@example.com',
      'Partner ID': 123,
      'Partner Name': 'Partner Corp',
      Balance: '₹ 1,000.50',
      City: 'Dubai',
      Status: 'Active',
    });

    expect(corporateUser.findAndCountAll).toHaveBeenCalledWith(
      expect.objectContaining({
        include: [{
          model: credential,
          where: {
            role: "CORPORATE",
            registeredBy: 123
          },
          attributes: ["username", "role", "name", "registeredBy", "passwordProtection"],
        }],
        order: [['createdAt', 'ASC']],
        raw: true,
        nest: true
      })
    );
  });

  it('should handle no matching records', async () => {
    const params = {
      sort: 'ASC',
      sortField: 'createdAt',
      searchText: 'Nonexistent Corp',
      partnerId: 123,
    };

    corporateUser.findAndCountAll = jest.fn().mockResolvedValue({ rows: [], count: 0 });
    wallets.findAll = jest.fn().mockResolvedValue([]);
    credential.findAll = jest.fn().mockResolvedValue([]);

    const result = await corporateUserExports(params);

    expect(result).toEqual([]);
  });

  it('should handle empty partnerId and searchText', async () => {
    const params = {
      sort: 'ASC',
      sortField: 'createdAt',
    };
  
    const mockData = {
      rows: [
        {
          credentialId: 1,
          createdAt: '2024-01-01T00:00:00.000Z',
          mobileNo: '1234567890',
          email: 'test@example.com',
          city: 'Dubai',
          isActive: 1,
          credential: {
            name: 'Test Corp',
            username: 'testcorp',
            registeredBy: 123,
          },
        },
      ],
      count: 1
    };

    const mockPartnerData = [
      {
        id: 123,
        name: 'Partner Corp',
      },
    ];
  
    corporateUser.findAndCountAll = jest.fn().mockResolvedValue(mockData);
    wallets.findAll = jest.fn().mockResolvedValue([]); 
    credential.findAll = jest.fn().mockResolvedValue(mockPartnerData);
  
    formattedDateTime.mockReturnValue('01/01/2024');
    formatNumberWithLocalString.mockReturnValue('0.00');
  
    const result = await corporateUserExports(params);
  
    expect(result[0]).toEqual({
      Date: '01/01/2024',
      'Corporate Name': 'Test Corp',
      'Account ID': 'testcorp',
      'Mobile No': '1234567890',
      'Email ID': 'test@example.com',
      'Partner ID': 123,
      'Partner Name': 'Partner Corp',
      Balance: '0.00', 
      City: 'Dubai',
      Status: 'Active',
    });

    expect(corporateUser.findAndCountAll).toHaveBeenCalledWith(
      expect.objectContaining({
        include: [{
          model: credential,
          where: {
            role: "CORPORATE"
          },
          attributes: ["username", "role", "name", "registeredBy", "passwordProtection"],
        }],
        raw: true,
        nest: true
      })
    );
  });

  it('should apply search and partner ID filters', async () => {
    const params = {
      sort: 'DESC',
      sortField: 'name',
      searchText: 'Test',
      partnerId: 123,
    };

    corporateUser.findAndCountAll = jest.fn().mockResolvedValue({ rows: [], count: 0 });
    credential.findAll = jest.fn().mockResolvedValue([]);

    await corporateUserExports(params);

    expect(corporateUser.findAndCountAll).toHaveBeenCalledWith(
      expect.objectContaining({
        include: expect.any(Array),
        where: {
          [Op.or]: expect.any(Array),
        },
        order: [['name', 'DESC']],
      })
    );
  });

  it('should throw an error if something goes wrong', async () => {
    const params = {
      sort: 'ASC',
      sortField: 'createdAt',
      searchText: '',
      partnerId: 123,
    };

    corporateUser.findAndCountAll = jest.fn().mockRejectedValue(new Error('Database error'));

    await expect(corporateUserExports(params)).rejects.toEqual({
      message: 'Something went wrong',
    });
  });
});