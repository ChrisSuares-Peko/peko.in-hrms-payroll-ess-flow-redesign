const { Excel } = require('../../corporateUser');
const corporateUser = require('../../../entities/corporateUser');
const credential = require('../../../entities/credential');
const wallets = require('../../../entities/wallet');
const { Op } = require("sequelize");

jest.mock('../../../entities/corporateUser', () => ({
  findAndCountAll: jest.fn(),
}));

jest.mock('../../../entities/credential', () => ({
  findAll: jest.fn(),
}));

jest.mock('../../../entities/wallet', () => ({
  findAll: jest.fn(),
}));

describe('Excel', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return formatted data with correct values', async () => {
    const mockCorporateUsers = {
      rows: [
        {
          id: 1,
          name: 'Corp A',
          email: 'corpa@example.com',
          mobileNo: '1234567890',
          website: 'www.corpA.com',
          country: 'Country A',
          city: 'City A',
          credentialId: 101,
          credential: {
            username: 'userA',
            role: 'CORPORATE',
            registeredBy: 201,
          },
        },
      ],
    };

    const mockWallets = [
      { credentialId: 101, balance: 5000 },
    ];

    const mockPartners = [
      { id: 201, name: 'Partner A' },
    ];

    corporateUser.findAndCountAll.mockResolvedValue(mockCorporateUsers);
    wallets.findAll.mockResolvedValue(mockWallets);
    credential.findAll.mockResolvedValue(mockPartners);

    const params = {
      order: 'ASC',
      column: 'name',
      partnerId: '201',
    };

    const result = await Excel(params);

    expect(corporateUser.findAndCountAll).toHaveBeenCalledWith({
      include: [
        {
          model: credential,
          where: { role: 'CORPORATE', registeredBy: '201' },
          attributes: ['username', 'role', 'registeredBy'],
        },
      ],
      order: [[params.column, params.order]],
      raw: true,
      nest: true,
    });

    expect(wallets.findAll).toHaveBeenCalledWith({
      where: {
        credentialId: {
          [Op.in]: [101],
        },
      },
      raw: true,
    });

    expect(credential.findAll).toHaveBeenCalledWith({
      where: {
        id: {
          [Op.in]: [201],
        },
      },
      raw: true,
    });

    expect(result).toEqual([
      {
        CorporateId: 1,
        CorporateName: 'Corp A',
        Username: 'userA',
        Email: 'corpa@example.com',
        'Mobile No': '1234567890',
        'Partner ID': 201,
        'Partner Name': 'Partner A',
        Website: 'www.corpA.com',
        Country: 'Country A',
        City: 'City A',
        Balance: '5000INR',
      },
    ]);
  });

  it('should handle missing partnerId parameter', async () => {
    const mockCorporateUsers = {
      rows: [
        {
          id: 1,
          name: 'Corp A',
          email: 'corpa@example.com',
          mobileNo: '1234567890',
          website: 'www.corpA.com',
          country: 'Country A',
          city: 'City A',
          credentialId: 101,
          credential: {
            username: 'userA',
            role: 'CORPORATE',
            registeredBy: 201,
          },
        },
      ],
    };

    const mockWallets = [
      { credentialId: 101, balance: 5000 },
    ];

    const mockPartners = [
      { id: 201, name: 'Partner A' },
    ];

    corporateUser.findAndCountAll.mockResolvedValue(mockCorporateUsers);
    wallets.findAll.mockResolvedValue(mockWallets);
    credential.findAll.mockResolvedValue(mockPartners);

    const params = {
      order: 'ASC',
      column: 'name',
      partnerId: undefined,
    };

    const result = await Excel(params);

    expect(corporateUser.findAndCountAll).toHaveBeenCalledWith({
      include: [
        {
          model: credential,
          where: { role: 'CORPORATE' },
          attributes: ['username', 'role', 'registeredBy'],
        },
      ],
      order: [[params.column, params.order]],
      raw: true,
      nest: true,
    });

    expect(result).toEqual([
      {
        CorporateId: 1,
        CorporateName: 'Corp A',
        Username: 'userA',
        Email: 'corpa@example.com',
        'Mobile No': '1234567890',
        'Partner ID': 201,
        'Partner Name': 'Partner A',
        Website: 'www.corpA.com',
        Country: 'Country A',
        City: 'City A',
        Balance: '5000INR',
      },
    ]);
  });

});
