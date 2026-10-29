jest.mock('axios', () => jest.fn());
jest.mock('../../../../utils/checkAndFetchServiceDetails', () => ({
  fetchServiceDetails: jest.fn(),
  calculateSurchargeWithTax: jest.fn(),
}));
jest.mock('../../../../models/use-cases/notification', () => ({ createNotification: jest.fn() }));
jest.mock('../../../../utils/walletTransaction', () => ({
  createWalletTransaction: jest.fn(),
  updateWalletTransaction: jest.fn(),
  refundWalletTransaction: jest.fn(),
}));
jest.mock('../../../../utils/pamentGatewayTransaction', () => ({
  createPGTransaction: jest.fn(),
  createPaytmTransaction: jest.fn(),
}));
jest.mock('../../../../models/entities/wallet', () => ({ findOne: jest.fn() }));
jest.mock('../../../../utils/emailer', () => ({ emailWithMultipleAttachment: jest.fn(), email: jest.fn() }));
jest.mock('../../../../services/invoiceAndReceipt', () => ({ generateOrderInvoiceAttachments: jest.fn() }));
jest.mock('../../../../models/use-cases/transaction', () => ({ getOneTransaction: jest.fn() }));
jest.mock('../../../../utils/jwtToken', () => ({ findUserDetails: jest.fn() }));
jest.mock('../../pluralGateway', () => ({ refundGatewayTransaction: jest.fn() }));
jest.mock('../../../../utils/encryptionUtils', () => ({ queryStringIntoBase64: jest.fn() }));
jest.mock('../../../../utils/emailTemplate/billpayments', () => ({
  generateMobilePaymentSuccessEmailBill: jest.fn(() => 'success'),
  commonFailedTemplateforBillPayments: jest.fn(() => 'failed'),
}));
jest.mock('../../../../models/use-cases/systemUser', () => ({ fetchPartnerDetails: jest.fn() }));
jest.mock('../../../../utils/cacheDataMethods', () => ({ setValue: jest.fn(), getValue: jest.fn() }));
jest.mock('../../../../utils/computeJournalData', () => ({ computeJournalData: jest.fn() }));
jest.mock('../../../../utils/bull/queue/accountingEventsQueue', () => ({ publishJournalEvent: jest.fn() }));
jest.mock('../../../../models/use-cases/mobileRechargeProvider', () => ({ findByProviderName: jest.fn() }));

const vendorWith = (optionals) => ({
  vendor: { optional1: 'CORP-1', optional6: 'MD5-SECRET', optionals },
});

const loadFor = (nodeEnv, optionals = { MNP_URL: 'https://mnp.example.test' }) => {
  const previous = process.env.NODE_ENV;
  process.env.NODE_ENV = nodeEnv;
  let loaded;
  jest.isolateModules(() => {
    loaded = {
      getconnectiondetails: require('../prepaid').getconnectiondetails,
      axios: require('axios'),
      fetchServiceDetails: require('../../../../utils/checkAndFetchServiceDetails').fetchServiceDetails,
      cache: require('../../../../utils/cacheDataMethods'),
    };
  });
  process.env.NODE_ENV = previous;

  loaded.fetchServiceDetails.mockResolvedValue(vendorWith(optionals));
  loaded.cache.getValue.mockResolvedValue(null);
  loaded.cache.setValue.mockResolvedValue();
  return loaded;
};

const lookUp = async (getconnectiondetails, number = '9495416698') => {
  const req = { query: { number }, user: { id: 7, corporateId: 7, packageId: 3 }, LogTraceId: 'trace' };
  const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
  const next = jest.fn();
  await getconnectiondetails(req, res, next);
  return { res, next, body: res.json.mock.calls[0]?.[0] };
};

describe('getconnectiondetails', () => {
  describe('on staging', () => {
    it('answers with the canned operator lookup for the requested number without calling the vendor', async () => {
      const { getconnectiondetails, axios } = loadFor('staging');

      const { res, body } = await lookUp(getconnectiondetails, '9495416698');

      expect(axios).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(body).toEqual({
        status: true,
        data: {
          MobileNo: '9495416698',
          SystemReferenceNo: expect.stringMatching(/^\d+$/),
          CorpRefNo: 'AMNP0716731115',
          CurrentOperator: 'Airtel',
          CurrentLocation: 'All',
          PreviousOperator: '',
          PreviousLocation: '',
          Ported: null,
          Charged: '0.0800',
          Error: '',
        },
        message: 'Connection details fetched successfully',
        responseCode: '000',
      });
    });

    it('echoes whichever number was asked for', async () => {
      const { getconnectiondetails } = loadFor('staging');

      const { body } = await lookUp(getconnectiondetails, '8820490416');

      expect(body.data.MobileNo).toBe('8820490416');
    });

    it('works even when the lookup URL is not configured', async () => {
      const { getconnectiondetails, axios } = loadFor('staging', {});

      const { res, next } = await lookUp(getconnectiondetails);

      expect(next).not.toHaveBeenCalled();
      expect(axios).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('outside staging', () => {
    it('asks the vendor and returns its answer', async () => {
      const { getconnectiondetails, axios } = loadFor('production');
      const vendorAnswer = { MobileNo: '9495416698', CurrentOperator: 'Airtel', CurrentLocation: 'Mumbai', Error: '' };
      axios.mockResolvedValue({ data: vendorAnswer });

      const { body } = await lookUp(getconnectiondetails);

      expect(axios).toHaveBeenCalledWith(expect.objectContaining({ url: 'https://mnp.example.test' }));
      expect(body.data).toEqual(vendorAnswer);
    });

    it('still refuses when the lookup URL is not configured', async () => {
      const { getconnectiondetails, axios } = loadFor('production', {});

      const { next } = await lookUp(getconnectiondetails);

      expect(axios).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ message: 'Service configuration error.' }));
    });
  });
});
