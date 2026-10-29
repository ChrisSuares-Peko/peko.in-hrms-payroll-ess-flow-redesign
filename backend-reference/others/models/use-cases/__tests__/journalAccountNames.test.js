const orders = require("../../entities/order");
const { findAllByProviderAccountIds } = require("../chartOfAccount");
const { findOneCredential } = require("../credential");
const { findServiceOperatorById } = require("../serviceOperator");
const { journalAccountNames, withAccountNames } = require("../journalAccountNames");

jest.mock("../chartOfAccount", () => ({ findAllByProviderAccountIds: jest.fn() }));
jest.mock("../credential", () => ({ findOneCredential: jest.fn() }));
jest.mock("../serviceOperator", () => ({ findServiceOperatorById: jest.fn() }));
jest.mock("../../../utils/cacheDataMethods", () => ({ getValue: jest.fn(), setValue: jest.fn(), deleteKey: jest.fn() }));

const ACCOUNTS = [
    { provider_account_id: "C1", account_name: "Commission", vendorId: null, partnerId: null, corporateUserId: null },
    { provider_account_id: "VD", account_name: "Vendor Deposits", vendorId: null, partnerId: null, corporateUserId: null },
    { provider_account_id: "SW", account_name: "Subscribers Wallet", vendorId: null, partnerId: null, corporateUserId: null },
    { provider_account_id: "PP", account_name: "Partnership Fee Payable", vendorId: null, partnerId: null, corporateUserId: null },
];

beforeEach(() => {
    jest.clearAllMocks();
    findAllByProviderAccountIds.mockImplementation(async ids => ACCOUNTS.filter(account => ids.includes(account.provider_account_id)));
    orders.findOne.mockResolvedValue({ credentialId: 900, serviceOperatorId: 3 });
    findOneCredential.mockImplementation(async ({ id }) =>
        id === 900 ? { id: 900, username: "100000900", registeredBy: "55" } : { id: 55, name: "Gulf Reach" }
    );
    findServiceOperatorById.mockResolvedValue({ vendor: { vendorName: "Acme" } });
});

describe("journalAccountNames", () => {
    it("names the shared accounts after the order's vendor, subscriber and partner", async () => {
        expect(await journalAccountNames(["C1", "VD", "SW", "PP", "VD"], "TXN-1")).toEqual({
            C1: "Commission",
            VD: "Deposit - Acme",
            SW: "Subscribers Wallet - 100000900",
            PP: "Partnership Fees Payable - Gulf Reach",
        });
        expect(findAllByProviderAccountIds).toHaveBeenCalledWith(["C1", "VD", "SW", "PP"]);
    });

    it("falls back to the stored name without an order to individualise it", async () => {
        expect(await journalAccountNames(["VD"])).toEqual({ VD: "Vendor Deposits" });
        expect(orders.findOne).not.toHaveBeenCalled();

        orders.findOne.mockResolvedValue(null);
        expect(await journalAccountNames(["VD"], "GONE")).toEqual({ VD: "Vendor Deposits" });
    });

    it("answers an empty map for no ids and leaves unknown ids out", async () => {
        expect(await journalAccountNames([])).toEqual({});
        expect(await journalAccountNames([null, undefined])).toEqual({});
        expect(await journalAccountNames(["C1", "ZZZ"])).toEqual({ C1: "Commission" });
    });

    it("decorates line items with their names", async () => {
        expect(
            await withAccountNames([{ accountId: "C1", direction: "credit", amount: 10 }, { accountId: "ZZZ", direction: "debit", amount: 10 }], "TXN-1")
        ).toEqual([
            { accountId: "C1", direction: "credit", amount: 10, accountName: "Commission" },
            { accountId: "ZZZ", direction: "debit", amount: 10, accountName: null },
        ]);
    });
});
