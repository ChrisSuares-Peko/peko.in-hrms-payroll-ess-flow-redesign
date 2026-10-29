const { createBulk } = require('../../invoiceGuideline');
const invoiceGuideline = require('../../../entities/invoiceGuideline'); 

jest.mock('../../../entities/invoiceGuideline', () => ({
  bulkCreate: jest.fn(), // Mock the bulkCreate method
}));

describe('createBulk', () => {
  let mockParamsArray, mockResponseDataArray;

  beforeEach(() => {
    jest.clearAllMocks();

    mockParamsArray = [
      {
        name: "test",
        actionDate: "2024-05-03 10:38:09",
        email: true,
        sms: true,
        templet: {
          email: {
            emailId: "saepabdu@gmail.com",
            subject: "test",
            body: "test body next line"
          },
          sms: {
            mobileNo: 4343434,
            body: "test body"
          }
        },
        invoiceId: 680
      }
    ];

    mockResponseDataArray = [
      {
        notification: false,
        status: "PENDING",
        id: 3,
        name: "test",
        actionDate: "2024-05-03 10:38:09",
        email: true,
        sms: true,
        templet: {
          email: {
            emailId: "saepabdu@gmail.com",
            subject: "test",
            body: "test body next line"
          },
          sms: {
            mobileNo: 4343434,
            body: "test body"
          }
        },
        invoiceId: 680,
        updatedAt: "2024-05-11T04:49:51.483Z",
        createdAt: "2024-05-11T04:49:51.483Z"
      }
    ];
  });

  it('should create bulk entries and return the response data array', async () => {
    invoiceGuideline.bulkCreate.mockResolvedValue(mockResponseDataArray);

    const result = await createBulk(mockParamsArray);

    expect(invoiceGuideline.bulkCreate).toHaveBeenCalledWith(mockParamsArray);
    expect(result).toEqual(mockResponseDataArray);
  });

  it('should return false if bulk create fails', async () => {
    invoiceGuideline.bulkCreate.mockRejectedValue(new Error('Bulk create error'));

    const result = await createBulk(mockParamsArray);

    expect(invoiceGuideline.bulkCreate).toHaveBeenCalledWith(mockParamsArray);
    expect(result).toBe(false);
  });
});
