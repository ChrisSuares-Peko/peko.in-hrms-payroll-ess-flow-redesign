const { getExcelCSVData } = require('../../../use-cases/referral_codes');
const referral_codes = require('../../../entities/referral_codes');

jest.mock('../../../entities/referral_codes', () => ({
  findAll: jest.fn(),
}));

describe('getExcelCSVData', () => {
  const mockData = [
    {
      id: 1,
      referralCode: 'REF123',
      contactPersonName: 'John Doe',
      contactPersonPhone: '1234567890',
    },
    {
      id: 2,
      referralCode: null,
      contactPersonName: 'Jane Doe',
      contactPersonPhone: null,
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return formatted CSV data successfully', async () => {
    referral_codes.findAll.mockResolvedValue(mockData);

    const result = await getExcelCSVData();

    expect(referral_codes.findAll).toHaveBeenCalledTimes(1);
    expect(referral_codes.findAll).toHaveBeenCalledWith({
      attributes: ['id', 'referralCode', 'contactPersonName', 'contactPersonPhone'],
      order: [['createdAt', 'DESC']],
      raw: true,
    });

    expect(result).toEqual([
      {
        'ID': 1,
        'Referral Code': 'REF123',
        'Contact Person Name': 'John Doe',
        'Contact Person Number': '1234567890',
      },
      {
        'ID': 2,
        'Referral Code': 'Not Available',
        'Contact Person Name': 'Jane Doe',
        'Contact Person Number': 'Not Available',
      },
    ]);
  });

  it('should return an empty array when no data is found', async () => {
    referral_codes.findAll.mockResolvedValue([]);

    const result = await getExcelCSVData();

    expect(referral_codes.findAll).toHaveBeenCalledTimes(1);
    expect(result).toEqual([]);
  });

  it('should throw an error if database query fails', async () => {
    referral_codes.findAll.mockRejectedValue(new Error('Database error'));

    await expect(getExcelCSVData()).rejects.toThrow('Database error');

    expect(referral_codes.findAll).toHaveBeenCalledTimes(1);
  });
});
