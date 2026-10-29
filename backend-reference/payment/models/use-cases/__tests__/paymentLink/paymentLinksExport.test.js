const paymentLinks = require('../../../entities/paymentLink');
const { paymentLinksExport } = require('../../paymentLink');

jest.mock('../../../entities/paymentLink', () => ({
  findAndCountAll: jest.fn(),
}));

jest.mock('../../../../utils/formatter', () => ({
  formattedDateTime: jest.fn(() => '2026-01-15 10:00:00'),
  capitalizeFirstLetter: jest.fn((str) => str ? str.charAt(0).toUpperCase() + str.slice(1).toLowerCase() : str),
}));

describe('paymentLinksExport', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return formatted payment link data when records exist', async () => {
    const mockParams = {
      sort: 'DESC',
      sortField: 'createdAt',
      searchText: '',
      from: '2026-01-01',
      to: '2026-01-31',
    };

    const mockData = {
      count: 1,
      rows: [
        {
          createdAt: '2026-01-15T10:00:00Z',
          sentPayload: { full_name: 'John Doe' },
          amount: 500,
          expireDate: '2026-02-15T10:00:00Z',
          status: 'active',
          paymentLink: 'https://pay.example.com/link123',
        },
      ],
    };

    paymentLinks.findAndCountAll.mockResolvedValue(mockData);

    const result = await paymentLinksExport(mockParams);

    expect(paymentLinks.findAndCountAll).toHaveBeenCalledTimes(1);
    expect(result).toHaveLength(1);
    expect(result[0]).toHaveProperty('Customer Name', 'John Doe');
    expect(result[0]).toHaveProperty('Amount', 500);
    expect(result[0]).toHaveProperty('Payment Link', 'https://pay.example.com/link123');
  });

  it('should return empty array when no records found', async () => {
    const mockParams = {
      sort: 'DESC',
      sortField: 'createdAt',
      searchText: '',
      from: '2026-01-01',
      to: '2026-01-31',
    };

    paymentLinks.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });

    const result = await paymentLinksExport(mockParams);

    expect(result).toEqual([]);
  });

  it('should add search conditions when searchText is provided', async () => {
    const mockParams = {
      sort: 'DESC',
      sortField: 'createdAt',
      searchText: 'test',
      from: '2026-01-01',
      to: '2026-01-31',
    };

    paymentLinks.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });

    await paymentLinksExport(mockParams);

    const callArgs = paymentLinks.findAndCountAll.mock.calls[0][0];
    expect(callArgs.where).toBeDefined();
  });

  it('should handle missing field values with fallback "Not Available"', async () => {
    const mockParams = {
      sort: 'DESC',
      sortField: 'createdAt',
      searchText: '',
      from: '2026-01-01',
      to: '2026-01-31',
    };

    const mockData = {
      count: 1,
      rows: [
        {
          createdAt: null,
          sentPayload: null,
          amount: null,
          expireDate: null,
          status: null,
          paymentLink: null,
        },
      ],
    };

    paymentLinks.findAndCountAll.mockResolvedValue(mockData);

    const result = await paymentLinksExport(mockParams);

    expect(result[0]).toHaveProperty('Customer Name', 'Not Available');
    expect(result[0]).toHaveProperty('Amount', 'Not Available');
    expect(result[0]).toHaveProperty('Payment Link', 'Not Available');
  });

  it('should return false when an error occurs', async () => {
    const mockParams = {
      sort: 'DESC',
      sortField: 'createdAt',
      searchText: '',
      from: '2026-01-01',
      to: '2026-01-31',
    };

    paymentLinks.findAndCountAll.mockRejectedValue(new Error('DB Error'));

    const result = await paymentLinksExport(mockParams);

    expect(result).toBe(false);
  });
});
