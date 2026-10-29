const { getAllGuidelines } = require('../../invoiceGuideline');
const invoiceGuideline = require('../../../entities/invoiceGuideline');
const invoices = require('../../../entities/invoices');

jest.mock('../../../entities/invoiceGuideline');

describe('getAllGuidelines', () => {
  const mockParams = { invoiceId: 680 };
  const mockResponseData = {
    count: 1,
    rows: [
      {
        id: 3,
        name: "test1",
        actionDate: "2024-05-03 10:38:09",
        email: 1,
        sms: 1,
        notification: 0,
        templet: {
          sms: {
            body: "test body1",
            index: 2,
            mobileNo: 43434341
          },
          email: {
            body: "test body next line1",
            index: 1,
            emailId: "saepabdu@gmail.com",
            subject: "test1"
          }
        },
        status: "PENDING",
        createdAt: "2024-05-11T04:49:51.000Z",
        updatedAt: "2024-05-11T05:02:37.000Z",
        invoiceId: 680,
        invoice: {
          id: 680,
          recipientDetails: "{\"billerName\":\"abdu sap\",\"billerEmail\":\"sapabdutab@gmail.com\",\"billerCompanyAddress\":\"fff\",\"billerPhone\":\"71543956911\",\"billerGST\":\"\",\"customerName\":\"abdu ff\",\"customerAddress\":\"ff33\",\"customerEmail\":\"\",\"customerPhone\":\"\"}",
          invoiceDetails: "{\"invoiceNo\":\"1234\",\"dueDate\":null,\"invoiceDate\":\"2024-05-24\",\"logo\":\"https://firebasestorage.googleapis.com/v0/b/peko-storage.appspot.com/o/profile%2Fimages%2F1695477827757.png?alt=media&token=0fca4729-cd81-4320-ad91-50bb12e11dbd\",\"invoiceName\":\"Invoice\"}",
          productDetails: "[{\"amount\":\"1099.89\",\"discount\":\"2\",\"item\":\"fdsf\",\"price\":\"33\",\"quantity\":\"33\",\"vat\":\"3\"}]",
          paymentDetails: "{\"subTotal\":\"1089.00\",\"vat\":\"32.67\",\"discount\":\"21.78\",\"shipping\":\"\",\"total\":\"1099.89\",\"amountDue\":\"1096.89\",\"amountPaid\":\"3\"}",
          comments: "\"\"",
          termsConditions: "",
          paymentMode: "",
          status: "PENDING",
          dueDate: null,
          amount: null,
          createdAt: "2024-05-03T06:33:15.000Z",
          updatedAt: "2024-05-03T06:33:15.000Z",
          credentialId: 356
        }
      }
      
    ]
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return guidelines with associated invoices when the invoiceId is provided', async () => {
    invoiceGuideline.findAndCountAll.mockResolvedValue(mockResponseData);

    const result = await getAllGuidelines(mockParams);

    expect(invoiceGuideline.findAndCountAll).toHaveBeenCalledWith({
      where: { invoiceId: mockParams.invoiceId },
      order: [['createdAt', 'DESC']],
      include: [{ model: invoices }],
      raw: true,
      nest: true,
    });

    expect(result).toEqual(mockResponseData);
  });

  it('should return false if no data is found', async () => {
    invoiceGuideline.findAndCountAll.mockResolvedValue(null);

    const result = await getAllGuidelines(mockParams);

    expect(result).toBe(false);
  });

 
});
