const { Op } = require("sequelize");
const vendorDeposits = require("../../entities/vendorDeposit");
const vendorLedgerEntries = require("../../entities/vendorLedgerEntry");
const partnerPayouts = require("../../entities/partnerPayout");
const partnerLedgerEntries = require("../../entities/partnerLedgerEntry");
const paymentGatewaySettlements = require("../../entities/paymentGatewaySettlement");
const chartOfAccount = require("../../entities/chartOfAccount");
const { countEntriesNotInBooks, listEntriesNotInBooks } = require("../ledgerBooks");

jest.mock("../../entities/vendorDeposit", () => ({ count: jest.fn(), findAll: jest.fn() }));
jest.mock("../../entities/vendorLedgerEntry", () => ({ count: jest.fn(), findAll: jest.fn() }));
jest.mock("../../entities/partnerPayout", () => ({ count: jest.fn(), findAll: jest.fn() }));
jest.mock("../../entities/partnerLedgerEntry", () => ({ count: jest.fn(), findAll: jest.fn() }));
jest.mock("../../entities/paymentGatewaySettlement", () => ({ count: jest.fn(), findAll: jest.fn() }));
jest.mock("../../entities/vendor", () => ({}));
jest.mock("../../entities/credential", () => ({}));
jest.mock("../../entities/chartOfAccount", () => ({ findAll: jest.fn() }));

const counting = (notSynced, deleted) =>
    jest.fn(async ({ where }) => (where.deletedAt ? deleted : notSynced));

beforeEach(() => {
    jest.clearAllMocks();
});

describe("entries not in the books yet", () => {
    it("counts every entry not marked, deleted ones included, ledger by ledger", async () => {
        vendorDeposits.count.mockImplementation(counting(3, 1));
        vendorLedgerEntries.count.mockImplementation(counting(2, 0));
        partnerPayouts.count.mockImplementation(counting(1, 1));
        partnerLedgerEntries.count.mockImplementation(counting(0, 0));
        paymentGatewaySettlements.count.mockImplementation(counting("4", "2"));

        expect(await countEntriesNotInBooks()).toEqual({ vendors: 5, partners: 1, gateways: 4, deleted: 4, total: 10 });
        expect(vendorDeposits.count).toHaveBeenCalledWith({ where: { booksSynced: false }, paranoid: false });
        expect(vendorDeposits.count).toHaveBeenCalledWith({
            where: { booksSynced: false, deletedAt: { [Op.ne]: null } },
            paranoid: false,
        });
    });
});

describe("listing the entries not in the books yet", () => {
    it("names each entry, whom it belongs to and where it is listed, newest first", async () => {
        vendorDeposits.findAll.mockResolvedValue([
            { id: 5, amount: "1000.0000", depositDate: "2026-10-01", entryType: "DEPOSIT", deletedAt: null, vendorId: 3, vendor: { id: 3, vendorName: "Paytm" } },
            { id: 1, amount: "50", depositDate: "2026-09-01", entryType: "OPENING", deletedAt: null, vendorId: 3, vendor: { id: 3, vendorName: "Paytm" } },
        ]);
        vendorLedgerEntries.findAll.mockResolvedValue([
            { id: 11, kind: "COST_OF_SALES", amount: "15", issueDate: "2026-10-05", deletedAt: null, vendorId: 4, vendor: { id: 4, vendorName: "Cleartrip" } },
            { id: 12, kind: "DEBIT_NOTE", amount: "20", issueDate: "2026-10-06", deletedAt: null, vendorId: 4, vendor: { id: 4, vendorName: "Cleartrip" } },
            { id: 7, kind: "COMMISSION", amount: "20", issueDate: new Date("2026-10-02T00:00:00.000Z"), deletedAt: "2026-10-03", vendorId: 4, vendor: { id: 4, vendorName: "Cleartrip" } },
        ]);
        partnerPayouts.findAll.mockResolvedValue([
            { id: 2, amount: "250", payoutDate: "2026-09-30", entryKind: "PAYOUT", deletedAt: null, partnerCredentialId: 100002226, credential: { id: 100002226, name: "Gulf Reach" } },
        ]);
        partnerLedgerEntries.findAll.mockResolvedValue([
            { id: 8, kind: "DEBIT_NOTE", amount: "99", issueDate: "2026-10-02", deletedAt: null, partnerCredentialId: 100002226, credential: { id: 100002226, name: null } },
        ]);
        paymentGatewaySettlements.findAll.mockResolvedValue([
            { id: 9, amount: "12", entryDate: "2026-10-04", entryKind: "FEE", deletedAt: null, gatewayAccountId: "4521" },
        ]);
        chartOfAccount.findAll.mockResolvedValue([{ provider_account_id: "4521", account_name: "Razorpay" }]);

        const entries = await listEntriesNotInBooks(10);

        expect(entries).toEqual([
            { id: 12, ledger: "vendors", deleted: false, entryKind: "debit_note", profileId: 4, profileName: "Cleartrip", amount: 20, date: "2026-10-06" },
            { id: 11, ledger: "vendors", deleted: false, entryKind: "cost_of_sales", profileId: 4, profileName: "Cleartrip", amount: 15, date: "2026-10-05" },
            { id: 9, ledger: "gateways", deleted: false, entryKind: "fee", profileId: "4521", profileName: "Razorpay", amount: 12, date: "2026-10-04" },
            { id: 8, ledger: "partners", deleted: false, entryKind: "debit_note", profileId: 100002226, profileName: null, amount: 99, date: "2026-10-02" },
            { id: 7, ledger: "vendors", deleted: true, entryKind: "commission", profileId: 4, profileName: "Cleartrip", amount: 20, date: "2026-10-02" },
            { id: 5, ledger: "vendors", deleted: false, entryKind: "deposit", profileId: 3, profileName: "Paytm", amount: 1000, date: "2026-10-01" },
            { id: 2, ledger: "partners", deleted: false, entryKind: "payout", profileId: 100002226, profileName: "Gulf Reach", amount: 250, date: "2026-09-30" },
            { id: 1, ledger: "vendors", deleted: false, entryKind: "opening", profileId: 3, profileName: "Paytm", amount: 50, date: "2026-09-01" },
        ]);
        expect(vendorDeposits.findAll.mock.calls[0][0]).toMatchObject({
            where: { booksSynced: false },
            paranoid: false,
            limit: 10,
            order: [["id", "DESC"]],
        });
        expect(chartOfAccount.findAll.mock.calls[0][0].where).toEqual({ provider_account_id: { [Op.in]: ["4521"] } });
    });

    it("keeps to the limit across every ledger and skips the gateway lookup when none is listed", async () => {
        vendorDeposits.findAll.mockResolvedValue(
            Array.from({ length: 3 }, (_, index) => ({ id: 10 + index, amount: "1", depositDate: "2026-10-01", entryType: "DEPOSIT", vendorId: 1 }))
        );
        vendorLedgerEntries.findAll.mockResolvedValue([]);
        partnerPayouts.findAll.mockResolvedValue([]);
        partnerLedgerEntries.findAll.mockResolvedValue([]);
        paymentGatewaySettlements.findAll.mockResolvedValue(undefined);

        const entries = await listEntriesNotInBooks(2);

        expect(entries.map(entry => entry.id)).toEqual([12, 11]);
        expect(chartOfAccount.findAll).not.toHaveBeenCalled();
    });
});
