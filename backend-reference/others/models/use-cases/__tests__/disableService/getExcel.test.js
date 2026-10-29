const disableService = require('../../../entities/disabledService');
const serviceOperator = require('../../../entities/serviceOperator');
const credential = require('../../../entities/credential');
const { getExcel } = require('../../disableService');

jest.mock('../../../entities/disabledService', () => ({
  findAndCountAll: jest.fn(),
}));

jest.mock('../../../entities/serviceOperator', () => ({}));
jest.mock('../../../entities/credential', () => ({}));

describe('transactionsAndCountExport', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should format disable service rows correctly for Excel export', async () => {
    const mockRows = [
      {
        Id: 101,
        createdAt: '2024-01-01',
        serviceOperator: { serviceProvider: 'Airtel' },
        credential: { name: 'Corp A' },
        credentialId: 500,
        serviceStatus: 'ACTIVE'
      },
      {
        Id: 102,
        createdAt: '2024-01-02',
        serviceOperator: { serviceProvider: 'Jio' },
        credential: { name: 'Corp B' },
        credentialId: 600,
        serviceStatus: 'INACTIVE'
      }
    ];

    disableService.findAndCountAll.mockResolvedValue({
      rows: mockRows
    });

    const result = await getExcel();

    expect(disableService.findAndCountAll).toHaveBeenCalledWith({
      include: [
        { model: serviceOperator, attributes: ['serviceProvider'] },
        { model: credential, attributes: ['name'] }
      ],
      order: [['createdAt', 'DESC']],
      raw: true,
      nest: true
    });

    expect(result).toEqual([
      {
        ID: 101,
        'Service Operator': 'Airtel',
        CorporateId: 500,
        'Corporate Name': 'Corp A',
        'Service Status': 'ACTIVE'
      },
      {
        ID: 102,
        'Service Operator': 'Jio',
        CorporateId: 600,
        'Corporate Name': 'Corp B',
        'Service Status': 'INACTIVE'
      }
    ]);
  });


it('should return "Not Available" for missing nested fields', async () => {
    const mockRows = [
        {
            Id: 999,
            serviceOperator: null,
            credential: null,
            credentialId: null,
            serviceStatus: null
        }
    ];

    disableService.findAndCountAll.mockResolvedValue({ rows: mockRows });

    const result = await getExcel();

    expect(result).toEqual([
        {
            ID: 999,
            'Service Operator': 'Not Available',
            CorporateId: 'Not Available',
            'Corporate Name': 'Not Available',
            'Service Status': 'Not Available'
        }
    ]);
});


it('should return empty array when no rows exist', async () => {
    disableService.findAndCountAll.mockResolvedValue({ rows: [] });

    const result = await getExcel();

    expect(result).toEqual([]);
});

it('should handle partially missing nested values', async () => {
    const mockRows = [
        {
            Id: 500,
            serviceOperator: { serviceProvider: null },
            credential: { name: undefined },
            credentialId: 321,
            serviceStatus: 'ACTIVE'
        }
    ];

    disableService.findAndCountAll.mockResolvedValue({ rows: mockRows });

    const result = await getExcel();

    expect(result).toEqual([
        {
            ID: 500,
            'Service Operator': 'Not Available',
            CorporateId: 321,
            'Corporate Name': 'Not Available',
            'Service Status': 'ACTIVE'
        }
    ]);
});

it('should throw error when database query fails', async () => {
    const error = new Error('DB failure');
    disableService.findAndCountAll.mockRejectedValue(error);

    await expect(getExcel()).rejects.toThrow('DB failure');
});

});
