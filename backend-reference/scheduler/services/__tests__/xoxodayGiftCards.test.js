jest.mock('axios', () => jest.fn());
jest.mock('../../utils/cacheDataMethods', () => ({ getValue: jest.fn(), setValue: jest.fn() }));
jest.mock('../../utils/checkAndFetchServiceDetails', () => ({ findServiceOperatorByAccessKey: jest.fn() }));
jest.mock('../../models/entities/giftCard', () => ({ update: jest.fn(), findAll: jest.fn(), create: jest.fn() }));
jest.mock('../../utils/loggerHelper', () => ({ customLog: jest.fn() }));

const axios = require('axios');
const { getValue, setValue } = require('../../utils/cacheDataMethods');
const { xoxodayAccessToken } = require('../xoxodayGiftCards');

const BASE_URL = 'https://xoxoday.example.com/chef/v1/oauth';
const ACCESS_KEY = 'xoxoday';
const ACCESS_TOKEN_KEY = `xoxoday-access-token-${ACCESS_KEY}`;
const REFRESH_TOKEN_KEY = `xoxoday-refresh-token-${ACCESS_KEY}`;
const vendor = { apiUrl: BASE_URL, optional1: 'client-id', optional2: 'client-secret' };

const withCache = (entries) => getValue.mockImplementation(async (key) => entries[key] ?? null);
const connectFailure = () => Object.assign(new AggregateError([], ''), { code: 'ETIMEDOUT' });
const httpError = (status, data = {}) =>
  Object.assign(new Error(`Request failed with status code ${status}`), { response: { status, data } });

describe('xoxodayAccessToken', () => {
  beforeEach(() => {
    axios.mockReset();
    getValue.mockReset();
    setValue.mockReset();
  });

  it('returns the cached token when Xoxoday confirms it', async () => {
    withCache({ [ACCESS_TOKEN_KEY]: 'cached-token', [REFRESH_TOKEN_KEY]: 'refresh-1' });
    axios.mockResolvedValueOnce({ data: { access_token: 'cached-token' } });

    await expect(xoxodayAccessToken(vendor, ACCESS_KEY)).resolves.toBe('cached-token');
    expect(axios).toHaveBeenCalledTimes(1);
    expect(setValue).not.toHaveBeenCalled();
  });

  it('keeps and uses the cached token when the validation call cannot connect', async () => {
    withCache({ [ACCESS_TOKEN_KEY]: 'cached-token', [REFRESH_TOKEN_KEY]: 'refresh-1' });
    axios.mockRejectedValueOnce(connectFailure());

    await expect(xoxodayAccessToken(vendor, ACCESS_KEY)).resolves.toBe('cached-token');
    expect(axios).toHaveBeenCalledTimes(1);
    expect(axios).toHaveBeenCalledWith(
      expect.objectContaining({ method: 'get', url: `${BASE_URL}/token`, timeout: 60000 })
    );
    expect(setValue).not.toHaveBeenCalled();
  });

  it.each([500, 503, 429])('keeps the cached token when validation answers %s', async (status) => {
    withCache({ [ACCESS_TOKEN_KEY]: 'cached-token', [REFRESH_TOKEN_KEY]: 'refresh-1' });
    axios.mockRejectedValueOnce(httpError(status));

    await expect(xoxodayAccessToken(vendor, ACCESS_KEY)).resolves.toBe('cached-token');
    expect(setValue).not.toHaveBeenCalled();
  });

  it('clears the cached token and refreshes when Xoxoday rejects it', async () => {
    withCache({ [ACCESS_TOKEN_KEY]: 'cached-token', [REFRESH_TOKEN_KEY]: 'refresh-1' });
    axios
      .mockRejectedValueOnce(httpError(401, { error: 'invalid_token' }))
      .mockResolvedValueOnce({ data: { access_token: 'new-token', refresh_token: 'refresh-2' } });

    await expect(xoxodayAccessToken(vendor, ACCESS_KEY)).resolves.toBe('new-token');
    expect(setValue).toHaveBeenCalledWith(ACCESS_TOKEN_KEY, 1, '');
    expect(axios).toHaveBeenLastCalledWith(
      expect.objectContaining({ method: 'post', url: `${BASE_URL}/token/user`, timeout: 60000 })
    );
    expect(setValue).toHaveBeenCalledWith(ACCESS_TOKEN_KEY, 14 * 24 * 60 * 60, 'new-token');
    expect(setValue).toHaveBeenCalledWith(REFRESH_TOKEN_KEY, 30 * 24 * 60 * 60, 'refresh-2');
  });

  it('does not store an unverified seed token and refreshes instead', async () => {
    withCache({});
    axios
      .mockRejectedValueOnce(connectFailure())
      .mockResolvedValueOnce({ data: { access_token: 'fresh-token', refresh_token: 'refresh-2' } });

    const seeded = { ...vendor, optional3: 'seed-access', optional4: 'seed-refresh' };

    await expect(xoxodayAccessToken(seeded, ACCESS_KEY)).resolves.toBe('fresh-token');
    expect(setValue).not.toHaveBeenCalledWith(ACCESS_TOKEN_KEY, expect.anything(), 'seed-access');
    expect(setValue).toHaveBeenCalledWith(ACCESS_TOKEN_KEY, 14 * 24 * 60 * 60, 'fresh-token');
  });
});
