process.env.ZOHO_COA_ORGANIZATION_ID = "ORG";

jest.mock("axios", () => ({ post: jest.fn(), put: jest.fn(), get: jest.fn() }));
jest.mock("../auth", () => ({ getZohoAccessToken: jest.fn(), DOMAIN: ".in" }));
jest.mock("../rateLimitRetry", () => ({ callWithZohoRateLimitRetry: jest.fn(fn => fn()) }));

const axios = require("axios");
const { getZohoAccessToken } = require("../auth");
const { recordJournal, getJournal } = require("../journal");

const PAYLOAD = {
    journalDate: "2026-09-10",
    referenceNumber: "TXN-1",
    notes: "Journal entry for corporate transaction TXN-1",
    lineItems: [
        { accountId: "A1", direction: "debit", amount: "100.00", description: "TXN-1" },
        { accountId: "A2", direction: "credit", amount: 100, description: "TXN-1" },
    ],
};

const ZOHO_LINES = [
    { account_id: "A1", debit_or_credit: "debit", amount: 100, description: "TXN-1" },
    { account_id: "A2", debit_or_credit: "credit", amount: 100, description: "TXN-1" },
];

beforeEach(() => {
    jest.clearAllMocks();
    getZohoAccessToken.mockResolvedValue("token");
});

describe("recordJournal", () => {
    it("posts the mapped journal and returns Zoho's id", async () => {
        axios.post.mockResolvedValue({ data: { code: 0, journal: { journal_id: "Z-1" } } });

        const result = await recordJournal(PAYLOAD);

        expect(axios.post).toHaveBeenCalledWith(
            "https://www.zohoapis.in/books/v3/journals?organization_id=ORG",
            { journal_date: "2026-09-10", reference_number: "TXN-1", notes: PAYLOAD.notes, line_items: ZOHO_LINES },
            expect.objectContaining({ headers: expect.objectContaining({ Authorization: "Zoho-oauthtoken token" }) })
        );
        expect(result).toMatchObject({ success: true, providerJournalId: "Z-1" });
    });

    it("hands back Zoho's own message when it refuses, and never throws", async () => {
        axios.post.mockResolvedValue({ data: { code: 5, message: "Account is inactive" } });
        expect(await recordJournal(PAYLOAD)).toMatchObject({ success: false, providerJournalId: null, error: "Account is inactive" });

        axios.post.mockRejectedValue({ response: { status: 400, data: { message: "Transaction is locked" } } });
        expect(await recordJournal(PAYLOAD)).toMatchObject({ success: false, error: "Transaction is locked", httpStatus: 400 });

        getZohoAccessToken.mockResolvedValue(null);
        expect(await recordJournal(PAYLOAD)).toMatchObject({ success: false, error: "Unable to fetch Zoho access token" });
    });
});

describe("getJournal", () => {
    it("returns the journal, and found false on a 404", async () => {
        axios.get.mockResolvedValue({ data: { code: 0, journal: { journal_id: "Z-1", total: 100 } } });
        expect(await getJournal("Z-1")).toMatchObject({ success: true, found: true, journal: { journal_id: "Z-1" } });

        axios.get.mockRejectedValue({ response: { status: 404, data: { message: "not found" } } });
        expect(await getJournal("Z-1")).toMatchObject({ success: true, found: false, journal: null });
    });
});

