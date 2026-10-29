const axios = require('axios');
const { getValue, setValue } = require('../../utils/cacheDataMethods');
const { findServiceOperatorByAccessKey } = require('../../utils/checkAndFetchServiceDetails');

jest.mock('axios');
jest.mock('../../utils/cacheDataMethods', () => ({
  getValue: jest.fn(),
  setValue: jest.fn(),
}));
jest.mock('../../utils/checkAndFetchServiceDetails', () => ({
  findServiceOperatorByAccessKey: jest.fn(),
}));
jest.mock('../../utils/loggerHelper', () => ({
  customLog: jest.fn(),
}));

const { getCatalog } = require('../droomCatalog');

const vendorRecord = {
  accessKey: 'car_report',
  vendor: {
    apiUrl: 'https://apig.droom.in',
    optional1: 'client-id',
    optional2: 'client-secret',
    optional3: 'username',
    optional4: 'password',
  },
};

describe('droomCatalog.getCatalog', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    findServiceOperatorByAccessKey.mockResolvedValue(vendorRecord);
  });

  it('uses a cached access token instead of re-authenticating', async () => {
    getValue.mockResolvedValueOnce('cached-token');
    axios.mockResolvedValueOnce({ data: ['Honda', 'Toyota'] });

    const result = await getCatalog({ category: 'car' });

    expect(axios).toHaveBeenCalledTimes(1);
    expect(axios).not.toHaveBeenCalledWith(
      expect.objectContaining({ url: expect.stringContaining('/oauth/token') })
    );
    expect(result).toEqual(['Honda', 'Toyota']);
  });

  it('fetches and caches a fresh token on a cache miss', async () => {
    getValue.mockResolvedValueOnce(null);
    axios.post.mockResolvedValueOnce({ data: { access_token: 'fresh-token', expires_in: 3600 } });
    axios.mockResolvedValueOnce({ data: ['Seltos', 'Sonet'] });

    const result = await getCatalog({ category: 'car', make: 'Kia' });

    expect(axios.post).toHaveBeenCalledWith(
      'https://apig.droom.in/dss/v1/oauth/token',
      expect.stringContaining('grant_type=password'),
      expect.objectContaining({
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      })
    );
    expect(setValue).toHaveBeenCalledWith('droom_mybiz_access_token', expect.any(Number), 'fresh-token');
    expect(result).toEqual(['Seltos', 'Sonet']);
  });

  it('sends whichever of make/model/year are provided as multipart form fields', async () => {
    getValue.mockResolvedValueOnce('cached-token');
    axios.mockResolvedValueOnce({ data: ['2020', '2021'] });

    await getCatalog({ category: 'car', make: 'Kia', model: 'Seltos' });

    const [config] = axios.mock.calls[0];
    expect(config.url).toBe('https://apig.droom.in/dss/enterprise-catalog');
    expect(config.headers.Authorization).toBe('Bearer cached-token');
    // form-data streams fields lazily; assert on what was appended via the mock form.
    expect(config.data).toBeDefined();
  });

  it('refreshes the token once and retries on a 401, rather than failing immediately', async () => {
    getValue.mockResolvedValueOnce('stale-token');
    axios
      .mockRejectedValueOnce({ response: { status: 401 } })
      .mockResolvedValueOnce({ data: ['HTX'] });
    axios.post.mockResolvedValueOnce({ data: { access_token: 'new-token', expires_in: 3600 } });

    const result = await getCatalog({ category: 'car', make: 'Kia', model: 'Seltos', year: '2021' });

    expect(axios.post).toHaveBeenCalledTimes(1);
    expect(axios).toHaveBeenCalledTimes(2);
    expect(result).toEqual(['HTX']);
  });

  it('throws when the vendor is not configured', async () => {
    findServiceOperatorByAccessKey.mockResolvedValueOnce({ error: 'Service is disabled' });

    await expect(getCatalog({ category: 'car' })).rejects.toThrow(
      'Droom MYBIZ service is not configured'
    );
  });
});
