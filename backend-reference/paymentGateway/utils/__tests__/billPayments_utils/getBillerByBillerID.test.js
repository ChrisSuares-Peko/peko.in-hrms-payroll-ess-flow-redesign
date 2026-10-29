const axios = require('axios');
const { encrypt, getBillerByBillerID } = require('../../billPayments_utils');
const {
    findRecordByBillerId,
    findByBillerCategory,
    findByBillerId,
    upsertBillers,
} = require('../../../models/use-cases/billerMDM');

jest.mock('axios');
jest.mock('../../../models/use-cases/billerMDM', () => ({
    findRecordByBillerId: jest.fn(),
    findByBillerCategory: jest.fn(),
    findByBillerId: jest.fn(),
    upsertBillers: jest.fn(),
}));

const mockXmlParse = jest.fn();
jest.mock('fast-xml-parser', () => ({
    XMLParser: jest.fn().mockImplementation(() => ({ parse: mockXmlParse })),
    XMLBuilder: jest.fn().mockImplementation(() => ({
        build: jest.fn().mockReturnValue('<billerInfoRequest></billerInfoRequest>'),
    })),
}));

const ENCRYPTION_KEY = 'REDACTED';
const VALID_XML = '<billerInfoResponse><responseCode>000</responseCode></billerInfoResponse>';

const mockConfig = {
    apiUrl: 'https://api.example.com/',
    optional1: 'INST001',
    optional2: 'v2',
    optional3: 'ACCESS123',
    optional4: ENCRYPTION_KEY,
};

describe('getBillerByBillerID', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        // Return a validly-encrypted XML so decrypt() succeeds inside fetchBillerInfo
        axios.mockResolvedValue({ data: encrypt(VALID_XML, ENCRYPTION_KEY) });
        mockXmlParse.mockReturnValue({
            billerInfoResponse: { responseCode: '000', biller: [{ billerId: 'B001' }] },
        });
        upsertBillers.mockResolvedValue(undefined);
        findByBillerId.mockResolvedValue({ billerId: 'B001', detail: 'fetched' });
    });

    it('should return record.data directly when it already has data', async () => {
        const existingData = { billerName: 'Electricity', interchangeFeeCCF1: {} };
        findRecordByBillerId.mockResolvedValue({
            billerId: 'B001',
            billerCategory: 'Electricity',
            data: existingData,
        });
        const result = await getBillerByBillerID('B001', mockConfig);
        expect(result).toEqual(existingData);
        expect(axios).not.toHaveBeenCalled();
    });

    it('should fetch by category when record has empty data and category is known', async () => {
        findRecordByBillerId.mockResolvedValue({
            billerId: 'B001',
            billerCategory: 'Electricity',
            data: {},
        });
        findByBillerCategory.mockResolvedValue([{ billerId: 'B001' }, { billerId: 'B002' }]);
        const result = await getBillerByBillerID('B001', mockConfig);
        expect(findByBillerCategory).toHaveBeenCalledWith('Electricity');
        expect(upsertBillers).toHaveBeenCalled();
        expect(findByBillerId).toHaveBeenCalledWith('B001');
        expect(result).toEqual({ billerId: 'B001', detail: 'fetched' });
    });

    it('should include the requested billerId in category fetch when not already present', async () => {
        findRecordByBillerId.mockResolvedValue({
            billerId: 'B001',
            billerCategory: 'Gas',
            data: {},
        });
        findByBillerCategory.mockResolvedValue([{ billerId: 'B002' }]);
        await getBillerByBillerID('B001', mockConfig);
        expect(findByBillerCategory).toHaveBeenCalledWith('Gas');
        expect(upsertBillers).toHaveBeenCalled();
    });

    it('should fall back to single biller fetch when record has no category', async () => {
        findRecordByBillerId.mockResolvedValue({ billerId: 'B001', billerCategory: null, data: {} });
        const result = await getBillerByBillerID('B001', mockConfig);
        expect(findByBillerCategory).not.toHaveBeenCalled();
        expect(upsertBillers).toHaveBeenCalled();
        expect(findByBillerId).toHaveBeenCalledWith('B001');
        expect(result).toEqual({ billerId: 'B001', detail: 'fetched' });
    });

    it('should fall back to single biller fetch when no DB record exists', async () => {
        findRecordByBillerId.mockResolvedValue(null);
        await getBillerByBillerID('B001', mockConfig);
        expect(findByBillerCategory).not.toHaveBeenCalled();
        expect(upsertBillers).toHaveBeenCalled();
        expect(findByBillerId).toHaveBeenCalledWith('B001');
    });

    it('should not upsert when vendor API returns non-success responseCode', async () => {
        findRecordByBillerId.mockResolvedValue(null);
        mockXmlParse.mockReturnValue({ billerInfoResponse: { responseCode: '999' } });
        await getBillerByBillerID('B001', mockConfig);
        expect(upsertBillers).not.toHaveBeenCalled();
        expect(findByBillerId).toHaveBeenCalledWith('B001');
    });

    it('should still call findByBillerId when axios throws', async () => {
        findRecordByBillerId.mockResolvedValue(null);
        axios.mockRejectedValue(new Error('Network error'));
        await getBillerByBillerID('B001', mockConfig);
        expect(upsertBillers).not.toHaveBeenCalled();
        expect(findByBillerId).toHaveBeenCalledWith('B001');
    });
});
