jest.mock('axios', () => ({ get: jest.fn() }));

const axios = require('axios');
const {
    resolveIndianPincode,
    PincodeLookupError,
    resetIndianPincodeLookupCacheForTests,
} = require('../indianPincodeLookup');

const PIN = '600001';

const postalSuccess = {
    data: [{
        Status: 'Success',
        PostOffice: [{
            Name: 'Chennai G.P.O.',
            District: 'Chennai',
            State: 'Tamil Nadu',
        }],
    }],
};

const postalError = {
    data: [{ Status: 'Error', Message: 'No records found', PostOffice: null }],
};

const zippoSuccess = {
    data: {
        places: [{ 'place name': 'Chennai', state: 'Tamil Nadu' }],
    },
};

beforeEach(() => {
    jest.clearAllMocks();
    resetIndianPincodeLookupCacheForTests();
});

describe('resolveIndianPincode', () => {
    it('returns city and state from India Post', async () => {
        axios.get.mockResolvedValueOnce(postalSuccess);

        await expect(resolveIndianPincode(PIN)).resolves.toEqual({
            city: 'Chennai',
            state: 'Tamil Nadu',
        });
        expect(axios.get).toHaveBeenCalledTimes(1);
        expect(axios.get.mock.calls[0][0]).toContain(`/pincode/${PIN}`);
    });

    it('retries India Post then succeeds', async () => {
        axios.get
            .mockRejectedValueOnce(new Error('timeout'))
            .mockRejectedValueOnce(new Error('timeout'))
            .mockResolvedValueOnce(postalSuccess);

        await expect(resolveIndianPincode(PIN)).resolves.toEqual({
            city: 'Chennai',
            state: 'Tamil Nadu',
        });
        expect(axios.get).toHaveBeenCalledTimes(3);
    });

    it('falls back to Zippopotam when India Post keeps timing out', async () => {
        axios.get.mockImplementation((url) => {
            if (url.includes('postalpincode')) return Promise.reject(new Error('timeout'));
            if (url.includes('zippopotam')) return Promise.resolve(zippoSuccess);
            return Promise.reject(new Error(`unexpected ${url}`));
        });

        await expect(resolveIndianPincode(PIN)).resolves.toEqual({
            city: 'Chennai',
            state: 'Tamil Nadu',
        });
        expect(axios.get.mock.calls.some(([url]) => url.includes('zippopotam.us/in/600001'))).toBe(true);
    });

    it('falls back to Zippopotam when India Post returns Error for a valid PIN', async () => {
        axios.get.mockImplementation((url) => {
            if (url.includes('postalpincode')) return Promise.resolve(postalError);
            if (url.includes('zippopotam')) return Promise.resolve(zippoSuccess);
            return Promise.reject(new Error(`unexpected ${url}`));
        });

        await expect(resolveIndianPincode(PIN)).resolves.toEqual({
            city: 'Chennai',
            state: 'Tamil Nadu',
        });
    });

    it('returns empty city/state when every source says the PIN is unknown', async () => {
        const notFound = new Error('not found');
        notFound.response = { status: 404 };
        axios.get.mockImplementation((url) => {
            if (url.includes('postalpincode')) return Promise.resolve(postalError);
            if (url.includes('zippopotam')) return Promise.reject(notFound);
            return Promise.reject(new Error(`unexpected ${url}`));
        });

        await expect(resolveIndianPincode('999999')).resolves.toEqual({ city: '', state: '' });
    });

    it('throws when every upstream is unreachable', async () => {
        axios.get.mockRejectedValue(new Error('ECONNRESET'));

        await expect(resolveIndianPincode(PIN)).rejects.toBeInstanceOf(PincodeLookupError);
    });

    it('serves a later lookup from cache', async () => {
        axios.get.mockResolvedValueOnce(postalSuccess);

        await resolveIndianPincode(PIN);
        await expect(resolveIndianPincode(PIN)).resolves.toEqual({
            city: 'Chennai',
            state: 'Tamil Nadu',
        });
        expect(axios.get).toHaveBeenCalledTimes(1);
    });

    it('returns empty for a value that is not an Indian PIN', async () => {
        await expect(resolveIndianPincode('012345')).resolves.toEqual({ city: '', state: '' });
        expect(axios.get).not.toHaveBeenCalled();
    });
});
