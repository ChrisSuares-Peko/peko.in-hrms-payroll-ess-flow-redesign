jest.mock('../../models/use-cases/setting', () => ({ getGstDetails: jest.fn() }));
jest.mock('../checkAndFetchServiceDetails', () => ({
  calculateSurchargeWithTax: jest.fn(),
}));
jest.mock('../partnerLogos', () => ({ partnerLogos: jest.fn() }));
jest.mock('../loggerHelper', () => ({ customLog: jest.fn() }));

const { getGstDetails } = require('../../models/use-cases/setting');
const { calculateSurchargeWithTax } = require('../checkAndFetchServiceDetails');
const { partnerLogos } = require('../partnerLogos');
const { computeJournalData } = require('../computeJournalData');

const journal = (extra) =>
  computeJournalData({
    serviceDetails: { surcharge: 0, vendor: { state: 'Kerala' }, recordJournalEntry: true },
    amount: 1000,
    partnerDetails: { sharePercentage: 10, state: 'Kerala', gatewayCharge: { percentage: 2, fixed: 5 } },
    corporateState: 'Kerala',
    planDetails: [{ commissionType: 'PERCENTAGE', commission: 10, amount: 1000, quantity: 1 }],
    ...extra,
  });

beforeEach(() => {
  jest.clearAllMocks();
  getGstDetails.mockResolvedValue({ details: { gst: 18 } });
  calculateSurchargeWithTax.mockResolvedValue({ surchargeWithoutTax: 0, surcharge: 0 });
  partnerLogos.mockResolvedValue({ state: 'Kerala' });
});

describe('the journal data of a wallet payment', () => {
  it('has no gateway part and keeps WALLET as its gateway name', async () => {
    const { journalData } = await journal({ paymentMethod: 'WALLET', paymentGatewayName: 'WALLET' });

    expect(journalData.paymentGatewayName).toBe('WALLET');
    expect(journalData.paymentThroughGateway).toBe(0);
    expect(journalData.paymentThroughWallet).toBe(1000);
  });

  it('comes out the same as a gateway-less payment under the default gateway name', async () => {
    const wallet = await journal({ paymentGatewayName: 'WALLET' });
    const standard = await journal({});

    expect({ ...wallet.journalData, paymentGatewayName: undefined }).toEqual({
      ...standard.journalData,
      paymentGatewayName: undefined,
    });
  });
});

describe('the gateway charge of a wallet payment', () => {
  it('carries no gateway charge for a liable partner when nothing went through the gateway', async () => {
    const { journalData } = await journal({ paymentMethod: 'WALLET', paymentGatewayName: 'WALLET' });

    expect(journalData.gatewayCharge).toBe(0);
    expect(journalData.partnerShipFee).toBe(10);
  });
});
