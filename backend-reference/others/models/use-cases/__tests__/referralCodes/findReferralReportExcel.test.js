const { findReferralReportExcel } = require('../../../use-cases/referral_codes');
const corporateUser = require('../../../entities/corporateUser');
const { formattedDateTime } = require('../../../../utils/formatter');
const { Op } = require('sequelize');

// Mock dependencies
jest.mock('../../../entities/corporateUser', () => ({
  findAll: jest.fn(),
}));

jest.mock('../../../../utils/formatter', () => ({
  formattedDateTime: jest.fn((date) => `Formatted(${date})`),
}));

describe('findReferralReportExcel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return formatted data for referral report excel', async () => {
    const mockData = [
      {
        email: 'john@example.com',
        name: 'John Doe',
        contactPersonName: 'John Doe',
        referralCode: 'REF123',
        mobileNo: '1234567890',
        createdAt: '2024-01-15T00:00:00.000Z',
      },
      {
        email: 'jane@example.com',
        name: 'Jane Doe',
        contactPersonName: 'Jane Doe',
        referralCode: null,
        mobileNo: null,
        createdAt: '2024-01-20T00:00:00.000Z',
      },
    ];
  
    corporateUser.findAll.mockResolvedValue(mockData);
  
    formattedDateTime.mockImplementation((date) => {
      if (date === '2024-01-15T00:00:00.000Z') return '2024-01-15';
      return '2024-01-20';
    });
  
    const params = {
      fromDate: '2024-01-01',
      toDate: '2024-01-31',
      partnerId: 'partner_123',
      referralCode: 'REF123',
    };
  
    const result = await findReferralReportExcel(params);
  
    expect(corporateUser.findAll).toHaveBeenCalledWith({
      where: {
        // referralCode: { [Op.ne]: null },
        registeredBy: 'partner_123',
        referralCode: 'REF123',
        createdAt: { [Op.between]: [params.fromDate, expect.any(Date)] },
      },
      attributes: ['email', 'name', 'contactPersonName', 'referralCode', 'mobileNo', 'createdAt'],
      raw: true,
    });
  
    expect(result).toEqual([
      {
        Date: '2024-01-15',
        'Referral Code': 'REF123',
        'Name': 'John Doe',
        'Mobile': '1234567890',
        'Email': 'john@example.com',
      },
      {
        Date: '2024-01-20',
        'Referral Code': 'Not Available',
        'Name': 'Jane Doe',
        'Mobile': 'Not Available',
        'Email': 'jane@example.com',
      },
    ]);
  });
  

  it('should return "Not Available" for missing data', async () => {
    const mockData = [
      {
        email: null,
        name: null,
        contactPersonName: null,
        referralCode: null,
        mobileNo: null,
        createdAt: null,
      },
    ];

    // Mock formattedDateTime to return "Not Available"
    formattedDateTime.mockReturnValue('Not Available');

    corporateUser.findAll.mockResolvedValue(mockData);

    const params = {
      fromDate: '2024-01-01',
      toDate: '2024-01-31',
    };

    const result = await findReferralReportExcel(params);

    expect(result).toEqual([
      {
        Date: 'Not Available',
        'Referral Code': 'Not Available',
        'Name': 'Not Available',
        'Mobile': 'Not Available',
        'Email': 'Not Available',
      },
    ]);
  });

 
  
});
