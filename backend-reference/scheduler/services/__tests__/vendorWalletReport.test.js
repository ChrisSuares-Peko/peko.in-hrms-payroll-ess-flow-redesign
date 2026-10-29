jest.mock('axios', () => jest.fn());
jest.mock('../../utils/emailer', () => ({ email: jest.fn() }));
jest.mock('../../models/use-cases/setting', () => ({ getASetting: jest.fn() }));
jest.mock('../../utils/checkAndFetchServiceDetails', () => ({ findServiceOperatorByAccessKey: jest.fn() }));
jest.mock('../xoxodayGiftCards', () => ({ xoxodayAccessToken: jest.fn() }));
jest.mock('../../utils/loggerHelper', () => ({ customLog: jest.fn() }));

const axios = require('axios');
const emailer = require('../../utils/emailer');
const { getASetting } = require('../../models/use-cases/setting');
const { findServiceOperatorByAccessKey } = require('../../utils/checkAndFetchServiceDetails');
const { sendVendorWalletReport } = require('../vendorWalletReport');

const jriVendor = { apiUrl: 'https://jri.example.com', optional2: 'password', optional3: 'corporate-number' };

const tlsDisconnect = () =>
  Object.assign(new Error('Client network socket disconnected before secure TLS connection was established'), {
    code: 'ECONNRESET',
  });

const runReport = async () => {
  const pending = sendVendorWalletReport();
  await jest.runAllTimersAsync();
  await pending;
};

const jriBalanceCell = () => {
  const body = emailer.email.mock.calls[0][2];
  return body.match(/<td[^>]*>JRI<\/td>\s*<td[^>]*>([^<]*)<\/td>/)[1];
};

describe('sendVendorWalletReport — JRI balance', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    axios.mockReset();
    emailer.email.mockReset();
    getASetting.mockImplementation(async (key) => (key === 'pekoWebsite' ? { emails: ['ops@peko.one'] } : { balance: 500 }));
    findServiceOperatorByAccessKey.mockImplementation(async (accessKey) =>
      accessKey === 'JRI_prepaid' ? { vendor: jriVendor } : { error: 'Service is disabled' }
    );
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('retries a connection failure and reports the balance from the retry', async () => {
    axios.mockRejectedValueOnce(tlsDisconnect()).mockResolvedValueOnce({ data: { Balance: '1234.5' } });

    await runReport();

    expect(axios).toHaveBeenCalledTimes(2);
    expect(axios).toHaveBeenLastCalledWith(expect.objectContaining({ url: 'https://jri.example.com/api/Balance' }));
    expect(jriBalanceCell()).toBe('&#8377;1,234.50');
  });

  it('does not retry when the vendor answers with a client error', async () => {
    axios.mockRejectedValueOnce(
      Object.assign(new Error('Request failed with status code 400'), { response: { status: 400, data: { Message: 'Invalid' } } })
    );

    await runReport();

    expect(axios).toHaveBeenCalledTimes(1);
    expect(jriBalanceCell()).toBe('N/A');
  });

  it('shows N/A after three failed connection attempts and still sends the report', async () => {
    axios.mockRejectedValue(tlsDisconnect());

    await runReport();

    expect(axios).toHaveBeenCalledTimes(3);
    expect(emailer.email).toHaveBeenCalledTimes(1);
    expect(jriBalanceCell()).toBe('N/A');
  });
});
