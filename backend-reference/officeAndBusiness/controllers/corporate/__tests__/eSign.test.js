jest.mock('../../../services/eSign', () => ({
    fetchVendorDetails: jest.fn(),
    updateSignerDetails: jest.fn(),
    getAuthBridgeAccessToken: jest.fn(),
    uploadDocumentAuthBridge: jest.fn(),
    composeEPakAuthBridge: jest.fn(),
    getEasySignLinks: jest.fn(),
    downloadDocumentAuthBridge: jest.fn(),
    getEpakDetails: jest.fn(),
    sendIndividualReminder: jest.fn(),
}));

jest.mock('../../../models/use-cases/eSign', () => ({
    createESignDoc: jest.fn(),
    findAllESignDocs: jest.fn(),
    findESignDocById: jest.fn(),
    findDocToUpdate: jest.fn(),
    countESignDocs: jest.fn(),
    countESignDocsInBillingCycle: jest.fn(),
}));

jest.mock('../../../models/use-cases/subscription', () => ({
    findMaximumUsageLimit: jest.fn(),
    findMaximumUsageLimitForAccessKey: jest.fn(),
    findUserSubscriptionsByService: jest.fn(),
}));

jest.mock('../../../models/use-cases/agreement', () => ({
    updateAgreement: jest.fn(),
    pushAgreementTimeline: jest.fn(),
}));

jest.mock('../../../models/use-cases/legalDocument', () => ({
    updateById: jest.fn(),
}));

jest.mock('../../../utils/loggerHelper', () => ({
    customLog: jest.fn(),
}));

// Mimics real Redis SET NX semantics with a synchronous check-and-set, so a
// Promise.all of two "concurrent" handler calls races the same way it would
// against a real Redis server.
jest.mock('../../../utils/cacheDataMethods', () => {
    const store = new Map();
    return {
        client: {
            set: jest.fn((key, val, opts) => {
                if (opts && opts.NX && store.has(key)) {
                    return Promise.resolve(null);
                }
                store.set(key, val);
                return Promise.resolve('OK');
            }),
        },
        deleteValue: jest.fn((key) => {
            store.delete(key);
            return Promise.resolve();
        }),
        getValue: jest.fn(),
        setValue: jest.fn(),
    };
});

const { eSignRequest } = require('../eSign');
const {
    fetchVendorDetails,
    getAuthBridgeAccessToken,
    uploadDocumentAuthBridge,
    composeEPakAuthBridge,
    getEasySignLinks,
} = require('../../../services/eSign');
const { createESignDoc, countESignDocsInBillingCycle } = require('../../../models/use-cases/eSign');
const {
    findMaximumUsageLimitForAccessKey,
    findUserSubscriptionsByService,
} = require('../../../models/use-cases/subscription');
const { deleteValue } = require('../../../utils/cacheDataMethods');

function buildReq({ user = {}, body = {} } = {}) {
    return {
        user: { id: 1, corporateId: 1, role: 'CORPORATE', registeredBy: 1, ...user },
        body: {
            documentBase64: 'BASE64DATA',
            docket_title: 'Payslip',
            signers_info: [
                { signer_email: 'a@example.com', signer_name: 'A' },
                { signer_email: 'b@example.com', signer_name: 'B' },
            ],
            sequentialSignature: false,
            expiry_date: '',
            initiator_name: 'Initiator',
            initiator_email: 'init@example.com',
            termsofUse: true,
            ...body,
        },
        LogTraceId: 'trace-1',
    };
}

function buildRes() {
    const res = {};
    res.status = jest.fn(() => res);
    res.json = jest.fn(() => res);
    return res;
}

describe('eSignRequest - duplicate submission guard', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        findUserSubscriptionsByService.mockResolvedValue({ billingType: 'MONTHLY' });
        countESignDocsInBillingCycle.mockResolvedValue({ count: 0 });
        findMaximumUsageLimitForAccessKey.mockResolvedValue(10);
        fetchVendorDetails.mockResolvedValue({
            apiUrl: 'https://vendor.test',
            optional1: 'client-id',
            optional2: 'client-secret',
            optional3: 'username',
            optional4: 'password',
            optional5: 'tenant-id',
        });
        getAuthBridgeAccessToken.mockResolvedValue('msb-token');
        uploadDocumentAuthBridge.mockResolvedValue('doc-123');
        composeEPakAuthBridge.mockResolvedValue('epak-123');
        getEasySignLinks.mockResolvedValue([]);
        createESignDoc.mockResolvedValue({ status: true, data: { id: 99 } });
    });

    it('blocks a concurrent duplicate submission of the same document and only creates one record', async () => {
        const req1 = buildReq({ user: { id: 42, corporateId: 42 } });
        const req2 = buildReq({ user: { id: 42, corporateId: 42 } });
        const res1 = buildRes();
        const res2 = buildRes();
        const next1 = jest.fn();
        const next2 = jest.fn();

        await Promise.all([
            eSignRequest(req1, res1, next1),
            eSignRequest(req2, res2, next2),
        ]);

        // Exactly one of the two identical concurrent requests actually creates a document.
        expect(createESignDoc).toHaveBeenCalledTimes(1);
        expect(composeEPakAuthBridge).toHaveBeenCalledTimes(1);

        const blockedNext = next1.mock.calls.length ? next1 : next2;
        const succeededRes = next1.mock.calls.length ? res2 : res1;

        expect(blockedNext).toHaveBeenCalledTimes(1);
        const err = blockedNext.mock.calls[0][0];
        expect(err.status_code).toBe(429);
        expect(succeededRes.status).toHaveBeenCalledWith(200);
    });

    it('allows two different documents from the same user submitted at the same time', async () => {
        const req1 = buildReq({ user: { id: 43, corporateId: 43 }, body: { docket_title: 'Payslip A' } });
        const req2 = buildReq({ user: { id: 43, corporateId: 43 }, body: { docket_title: 'Payslip B' } });
        const res1 = buildRes();
        const res2 = buildRes();
        const next1 = jest.fn();
        const next2 = jest.fn();

        await Promise.all([
            eSignRequest(req1, res1, next1),
            eSignRequest(req2, res2, next2),
        ]);

        expect(createESignDoc).toHaveBeenCalledTimes(2);
        expect(next1).not.toHaveBeenCalled();
        expect(next2).not.toHaveBeenCalled();
    });

    it('releases the lock on a genuine failure so a real retry can still succeed', async () => {
        const req = buildReq({ user: { id: 44, corporateId: 44 } });
        const res = buildRes();
        const next = jest.fn();

        composeEPakAuthBridge.mockRejectedValueOnce(new Error('vendor down'));
        await eSignRequest(req, res, next);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(deleteValue).toHaveBeenCalledTimes(1);

        const req2 = buildReq({ user: { id: 44, corporateId: 44 } });
        const res2 = buildRes();
        const next2 = jest.fn();
        await eSignRequest(req2, res2, next2);

        expect(next2).not.toHaveBeenCalled();
        expect(res2.status).toHaveBeenCalledWith(200);
        expect(createESignDoc).toHaveBeenCalledTimes(1);
    });
});
