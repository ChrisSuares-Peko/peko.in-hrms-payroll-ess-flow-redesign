const { referralCodesAndCountExport } = require('../../referral_codes');
const sequelizeConfig = require('../../../../configs/database/index');


jest.mock('../../../entities/referral_codes', () => ({
  findAndCountAll: jest.fn(),
}));

jest.mock('../../../../utils/sortHandle', () => ({
  handleSortFields: jest.fn((field, order) => [[field || 'id', order || 'ASC']]),
}));
jest.mock('../../../entities/corporateUser', () => ({
  hasMany: jest.fn(),
}));

describe('referralCodesAndCountExport', () => {
  const mockParams = {
    searchText: 'test',
    sort: 'ASC',
    sortField: 'referralCode',
  };
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockData = [
    {
      createdAt: '2024-02-10',
      referralCode: 'REF123',
      contactPersonName: 'John Doe',
      contactPersonPhone: '1234567890',
      partnerName: 'Partner A',
      status: 1,
    },
    {
      createdAt: '2024-02-11',
      referralCode: 'REF456',
      contactPersonName: 'Jane Doe',
      contactPersonPhone: '0987654321',
      partnerName: 'Partner B',
      status: 0,
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return formatted referral code data when query is successful', async () => {
    sequelizeConfig.query.mockResolvedValue(mockData);

    const result = await referralCodesAndCountExport(mockParams);

    expect(sequelizeConfig.query).toHaveBeenCalledTimes(1);
    expect(sequelizeConfig.query).toHaveBeenCalledWith(
      expect.stringContaining('SELECT'),
      {
        replacements: { searchText: 'test' },
        type: sequelizeConfig.QueryTypes.SELECT,
      }
    );

    expect(result).toEqual([
      {
        Date: "2024-02-10",
        'Referral Code': 'REF123',
        'Contact Person Name': 'John Doe',
        'Contact Person Mobile': '1234567890',
        'Partner Name': 'Partner A',
        Status: 'Active',
      },
      {
        Date: "2024-02-11",
        'Referral Code': 'REF456',
        'Contact Person Name': 'Jane Doe',
        'Contact Person Mobile': '0987654321',
        'Partner Name': 'Partner B',
        Status: 'In Active',
      },
    ]);
  });

  it('should return "Not Available" for missing data fields', async () => {
    sequelizeConfig.query.mockResolvedValue([
      {
        createdAt: null,
        referralCode: null,
        contactPersonName: null,
        contactPersonPhone: null,
        partnerName: null,
        status: 1,
      },
    ]);

    const result = await referralCodesAndCountExport(mockParams);

    expect(result).toEqual([
      {
        Date: 'Not Available',
        'Referral Code': 'Not Available',
        'Contact Person Name': 'Not Available',
        'Contact Person Mobile': 'Not Available',
        'Partner Name': 'Not Available',
        Status: 'Active',
      },
    ]);
  });

  it('should throw an error when the query fails', async () => {
    sequelizeConfig.query.mockRejectedValue(new Error('Database error'));
  
    await expect(referralCodesAndCountExport(mockParams)).rejects.toEqual({
      message: 'Something went wrong',
    });
  
    expect(sequelizeConfig.query).toHaveBeenCalledTimes(1);
  });
});
