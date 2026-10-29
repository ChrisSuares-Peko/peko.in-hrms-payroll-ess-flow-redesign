jest.mock('../../../models/use-cases/govtService', () => ({ findOne: jest.fn() }));
jest.mock('../../../models/use-cases/govtServiceApplications', () => ({
  create: jest.fn(),
  updateApplicationNumber: jest.fn(),
  findById: jest.fn(),
  findByCredentialId: jest.fn(),
  findDraftByService: jest.fn(),
  findByService: jest.fn(),
  findDraftsByCredentialId: jest.fn(),
  submitApplication: jest.fn(),
  saveFormData: jest.fn(),
  updateApplicationData: jest.fn(),
}));
jest.mock('../../../utils/commonUploadFile', () => ({ uploadFile: jest.fn() }));
jest.mock('../../../utils/checkAndFetchServiceDetails', () => ({
  fetchServiceDetails: jest.fn(),
  calculateSurchargeWithTax: jest.fn(),
}));
jest.mock('../../../utils/emailer', () => ({ emailWithMultipleAttachment: jest.fn(), email: jest.fn() }));
jest.mock('../../../utils/emailTemplate/common', () => ({ commonFailedTemplate: jest.fn(() => 'failed') }));
jest.mock('../../../utils/emailTemplate/govtServices', () => ({
  generateGovtServicePaymentSuccessEmail: jest.fn(() => 'success'),
}));
jest.mock('../../../models/use-cases/systemUser', () => ({ fetchPartnerDetails: jest.fn() }));
jest.mock('../../../models/entities/wallet', () => ({ findOne: jest.fn() }));
jest.mock('../../../utils/walletTransaction', () => ({
  createWalletTransaction: jest.fn(),
  updateWalletTransaction: jest.fn(),
}));
jest.mock('../../../models/use-cases/notification', () => ({ createNotification: jest.fn() }));
jest.mock('../../../utils/pamentGatewayTransaction', () => ({ createPGTransaction: jest.fn() }));
jest.mock('../../../services/invoiceAndReceipt', () => ({ generateOrderInvoiceAttachments: jest.fn() }));
jest.mock('../../../models/use-cases/order', () => ({ findOneOrderByTxnId: jest.fn() }));
jest.mock('../../../utils/govtServicePdfGenerator', () => ({
  generateGovtServicePdf: jest.fn(),
  PDF_SERVICES: [],
}));
jest.mock('../../../utils/computeJournalData', () => ({ computeJournalData: jest.fn() }));
jest.mock('../../../utils/bull/queue/accountingEventsQueue', () => ({ publishJournalEvent: jest.fn() }));

const govtServiceUseCase = require('../../../models/use-cases/govtService');
const { findById, submitApplication } = require('../../../models/use-cases/govtServiceApplications');
const { fetchServiceDetails, calculateSurchargeWithTax } = require('../../../utils/checkAndFetchServiceDetails');
const { fetchPartnerDetails } = require('../../../models/use-cases/systemUser');
const { createWalletTransaction } = require('../../../utils/walletTransaction');
const { generateOrderInvoiceAttachments } = require('../../../services/invoiceAndReceipt');
const { computeJournalData } = require('../../../utils/computeJournalData');
const { publishJournalEvent } = require('../../../utils/bull/queue/accountingEventsQueue');
const { payApplication } = require('../govtServices');

const vendor = { vendorName: 'Govt Partner', state: 'Kerala' };
const partnerDetails = { sharePercentage: 0, state: 'Kerala' };
const serviceDetails = {
  id: 5,
  surcharge: 10,
  surchargeType: 'FLAT',
  commissionType: 'FLAT',
  cashbackType: 'FLAT',
  providerCommission: 0,
  cashback: 1,
  vendor,
};
const reportData = { journalData: { commissionIncludingGST: 1500, commissionMode: 'MARGIN' } };
const application = { id: 4, applicationNumber: 'APP-4', service: 'gst-registration' };
const serviceRecord = { name: 'GST Registration', price: '1500.00', govtFee: 0 };

const request = (body) => ({
  LogTraceId: 'trace-1',
  user: {
    id: 1,
    corporateId: 2,
    packageId: 3,
    registeredBy: 9,
    state: 'Kerala',
    username: 'corp',
    email: 'corp@example.test',
    name: 'Corp',
    role: 'CORPORATE_USER',
  },
  body: { applicationId: 4, accessKey: 'govt_gst_registration', amount: 1500, ...body },
});

const response = () => {
  const res = { status: jest.fn(), json: jest.fn() };
  res.status.mockReturnValue(res);
  return res;
};

beforeEach(() => {
  jest.clearAllMocks();
  findById.mockResolvedValue(application);
  fetchServiceDetails.mockResolvedValue(serviceDetails);
  fetchPartnerDetails.mockResolvedValue(partnerDetails);
  calculateSurchargeWithTax.mockResolvedValue({ surcharge: 11.8 });
  govtServiceUseCase.findOne.mockResolvedValue(serviceRecord);
  computeJournalData.mockResolvedValue(reportData);
  createWalletTransaction.mockResolvedValue({ orderId: 77, corporateFinalBalance: 100 });
  generateOrderInvoiceAttachments.mockResolvedValue([]);
});

describe('a government service application paid from the wallet', () => {
  it('takes the Peko service fee as the commission of its journal', async () => {
    await payApplication(request({}), response(), jest.fn());

    expect(govtServiceUseCase.findOne).toHaveBeenCalledWith({ slug: 'gst-registration' });
    expect(computeJournalData).toHaveBeenCalledTimes(1);
    expect(computeJournalData).toHaveBeenCalledWith(
      expect.objectContaining({
        serviceDetails,
        amount: 1500,
        paymentMethod: 'WALLET',
        paymentGatewayName: 'WALLET',
        partnerDetails,
        corporateState: 'Kerala',
        planDetails: [
          {
            commissionType: 'FLAT',
            commission: 1500,
            amount: 1500,
            fixedCommissionPerTransaction: 0,
            isCommissionInclGST: true,
          },
        ],
      })
    );
  });

  it('works out its journal as a wallet payment, whatever the request says about a gateway', async () => {
    await payApplication(request({ pgAmount: 500, couponTotalDiscount: 50 }), response(), jest.fn());

    const params = computeJournalData.mock.calls[0][0];
    expect(params.pgAmount ?? 0).toBe(0);
    expect(params.paymentMethod).toBe('WALLET');
    expect(params.paymentGatewayName).toBe('WALLET');
    expect(params.couponTotalDiscount).toBe(50);
  });

  it('looks the service up before it works out the journal', async () => {
    await payApplication(request({}), response(), jest.fn());

    expect(govtServiceUseCase.findOne.mock.invocationCallOrder[0]).toBeLessThan(
      computeJournalData.mock.invocationCallOrder[0]
    );
  });

  it('uses the amount asked for when the service has no price on record', async () => {
    govtServiceUseCase.findOne.mockResolvedValue(null);

    await payApplication(request({}), response(), jest.fn());

    expect(computeJournalData.mock.calls[0][0].planDetails[0]).toMatchObject({ commission: 1500, amount: 1500 });
  });

  it('keeps the journal with the order and sends the payment to the journal', async () => {
    await payApplication(request({}), response(), jest.fn());

    const { corporateTxnId } = createWalletTransaction.mock.calls[0][0];
    expect(createWalletTransaction).toHaveBeenCalledWith(expect.objectContaining({ reportData, amount: 1500 }));
    expect(publishJournalEvent).toHaveBeenCalledTimes(1);
    expect(publishJournalEvent).toHaveBeenCalledWith(
      {
        transactionRef: corporateTxnId,
        type: 'payment',
        contextSnapshot: { credentialId: 1, vendor, registeredBy: 9 },
        reportData,
      },
      'trace-1'
    );
    expect(publishJournalEvent.mock.invocationCallOrder[0]).toBeGreaterThan(
      createWalletTransaction.mock.invocationCallOrder[0]
    );
  });

  it('carries the commission and the service into the invoice', async () => {
    await payApplication(request({}), response(), jest.fn());

    expect(generateOrderInvoiceAttachments).toHaveBeenCalledWith(
      expect.objectContaining({
        paymentType: 'Government Services',
        vendor,
        commissionIncludingGST: 1500,
        planDetails: [{ name: 'GST Registration', amount: 1500, quantity: 1 }],
        commissionMode: 'MARGIN',
      })
    );
  });

  it('does not tell the invoice about any gateway money', async () => {
    await payApplication(request({}), response(), jest.fn());

    expect(generateOrderInvoiceAttachments.mock.calls[0][0]).not.toHaveProperty('pgAmount');
  });

  it('does not touch the journal when the wallet cannot pay', async () => {
    createWalletTransaction.mockResolvedValue({ error: 'INSUFFICIENT WALLET BALANCE' });
    const next = jest.fn();

    await payApplication(request({}), response(), next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(publishJournalEvent).not.toHaveBeenCalled();
    expect(submitApplication).not.toHaveBeenCalled();
  });
});
