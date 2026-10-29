const crypto = require('crypto');

jest.mock('../checkAndFetchServiceDetails', () => ({ findServiceOperatorByAccessKey: jest.fn() }));

const { findServiceOperatorByAccessKey } = require('../checkAndFetchServiceDetails');
const { CtrlPayConfigError, getCtrlPayConfig } = require('../ctrlPay/config');

const { publicKey } = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
const PEM = publicKey.export({ type: 'spki', format: 'pem' });
const ORIGINAL_ENV = { ...process.env };

const VENDOR = {
    apiUrl: 'https://uat.ctrlpay.example/',
    optional1: 'peko-client',
    optional2: 'https://auth.uat.ctrlpay.example',
    optional3: PEM,
    optional4: 'https://app.peko.example/ctrlpay/callback',
    optional5: 'PEKO01',
    optional6: null,
};

const withVendor = (overrides = {}) =>
    findServiceOperatorByAccessKey.mockResolvedValue({ accessKey: 'ctrl_pay', vendor: { ...VENDOR, ...overrides } });

const otherKey = (type, options) => crypto.generateKeyPairSync(type, options).publicKey.export({ type: 'spki', format: 'pem' });

beforeEach(() => {
    jest.clearAllMocks();
    process.env.CTRLPAY_TOKEN_ENCRYPTION_KEY = 'ab'.repeat(32);
    withVendor();
});

afterAll(() => {
    process.env = { ...ORIGINAL_ENV };
});

describe('CTRLPay configuration', () => {
    it('reads the ctrl_pay vendor row and parses the public key', async () => {
        const config = await getCtrlPayConfig();

        expect(findServiceOperatorByAccessKey).toHaveBeenCalledWith('ctrl_pay');
        expect(config).toMatchObject({
            baseUrl: 'https://uat.ctrlpay.example',
            authDomain: 'https://auth.uat.ctrlpay.example',
            clientId: 'peko-client',
            redirectUri: 'https://app.peko.example/ctrlpay/callback',
            partnerCode: 'PEKO01',
        });
        expect(config.publicKey.asymmetricKeyType).toBe('rsa');
        expect(config.tokenKey).toHaveLength(32);
    });

    it('fails closed when no service operator exists for the access key', async () => {
        findServiceOperatorByAccessKey.mockResolvedValue({ error: 'Service is disabled' });

        await expect(getCtrlPayConfig()).rejects.toThrow(CtrlPayConfigError);
    });

    it('names every vendor column that is empty', async () => {
        withVendor({ optional1: ' ', optional3: null });

        await expect(getCtrlPayConfig()).rejects.toThrow(
            'CTRLPay vendor is missing optional1 (clientId), optional3 (publicKey)'
        );
    });

    it.each([
        ['a multi-line PEM', PEM],
        ['a PEM with escaped newlines', PEM.replace(/\n/g, '\\n')],
        ['a PEM pasted into a single-line input', PEM.replace(/\n/g, '')],
        ['bare base64', PEM.replace(/-----[A-Z ]+-----|\s/g, '')],
        ['a PKCS#1 PEM', publicKey.export({ type: 'pkcs1', format: 'pem' })],
    ])('accepts the public key as %s', async (_, optional3) => {
        withVendor({ optional3 });

        expect((await getCtrlPayConfig()).publicKey.asymmetricKeyDetails.modulusLength).toBe(2048);
    });

    it('rejects a malformed, non-RSA or short public key', async () => {
        withVendor({ optional3: 'not a key' });
        await expect(getCtrlPayConfig()).rejects.toThrow('optional3 (publicKey) is not a valid public key');

        withVendor({ optional3: otherKey('ec', { namedCurve: 'P-256' }) });
        await expect(getCtrlPayConfig()).rejects.toThrow('must be an RSA key of at least 2048 bits');

        withVendor({ optional3: otherKey('rsa', { modulusLength: 1024 }) });
        await expect(getCtrlPayConfig()).rejects.toThrow('must be an RSA key of at least 2048 bits');
    });

    it('requires the token encryption key from the environment', async () => {
        delete process.env.CTRLPAY_TOKEN_ENCRYPTION_KEY;
        await expect(getCtrlPayConfig()).rejects.toThrow('Missing CTRLPAY_TOKEN_ENCRYPTION_KEY');

        process.env.CTRLPAY_TOKEN_ENCRYPTION_KEY = 'abc';
        await expect(getCtrlPayConfig()).rejects.toThrow('CTRLPAY_TOKEN_ENCRYPTION_KEY must be 64 hex characters');
    });

    it('insists on https, allowing plain http only for a localhost redirect', async () => {
        withVendor({ apiUrl: 'http://uat.ctrlpay.example' });
        await expect(getCtrlPayConfig()).rejects.toThrow('apiUrl (baseUrl) must use https');

        withVendor({ optional4: 'http://localhost:5173/ctrlpay/callback' });
        expect((await getCtrlPayConfig()).redirectUri).toBe('http://localhost:5173/ctrlpay/callback');

        withVendor({ optional4: 'http://app.peko.example/ctrlpay/callback' });
        await expect(getCtrlPayConfig()).rejects.toThrow('optional4 (redirectUri) must use https');
    });
});
