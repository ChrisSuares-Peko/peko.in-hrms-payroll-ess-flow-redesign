const { AUDITED_TABLES, CONFIG_TYPES } = require("../../../utils/auditedModels");
const {
    CONFIG_TYPE_LABELS,
    FIELD_LABELS,
    configAuditLogExportColumns,
} = require("../configAuditLogExport");

const row = (overrides = {}) => ({
    createdAt: "2026-10-08T05:21:00.000Z",
    actorName: "Asha Menon",
    source: "ACCOUNTING_PORTAL",
    configType: "PLATFORM_FEE",
    action: "UPDATE",
    targetLabel: "Xoxoday › Basic",
    partnerName: "Cent Saarthi",
    changes: [
        { field: "surcharge", from: 20, to: 0 },
        { field: "isSurchargeConfigured", from: false, to: true },
    ],
    ...overrides,
});

const cellsOf = entry =>
    Object.fromEntries(configAuditLogExportColumns().map(column => [column.header, column.value(entry)]));

describe("the Audit Trail export columns", () => {
    it("follow the table's columns, in the table's order", () => {
        expect(configAuditLogExportColumns().map(column => column.header)).toEqual([
            "When",
            "Who",
            "IP address",
            "Changed from",
            "Configuration",
            "For",
            "Partner",
            "What changed",
        ]);
    });

    it("read each row the way the screen does, with the time in Indian time", () => {
        expect(cellsOf(row())).toEqual({
            When: "08 Oct 2026, 10:51 AM",
            Who: "Asha Menon",
            "Changed from": "Accounting Portal",
            Configuration: "Platform fee",
            For: "Xoxoday › Basic",
            Partner: "Cent Saarthi",
            "What changed": "Platform fee: 20 → 0; Platform fee marked configured: No → Yes",
        });
    });

    it("name a created or deleted row, and list the values it held", () => {
        const created = cellsOf(
            row({
                action: "CREATE",
                configType: "CASHBACK",
                changes: [{ field: "cashback", from: null, to: 3 }],
            })
        );
        const deleted = cellsOf(
            row({
                action: "DELETE",
                configType: "CASHBACK",
                changes: [{ field: "cashback", from: 3, to: null }],
            })
        );

        expect([created.Configuration, created["What changed"]]).toEqual(["Cashback (Created)", "Cashback: 3"]);
        expect([deleted.Configuration, deleted["What changed"]]).toEqual(["Cashback (Deleted)", "Cashback: 3"]);
    });

    it("write empty values, lists and prices in words", () => {
        const text = cellsOf(
            row({
                configType: "SUBSCRIPTION_PRICING",
                changes: [
                    { field: "packagePrices", from: { monthly: 299, annually: 3599 }, to: { monthly: 399, annually: 3499 } },
                    { field: "vendorEmail", from: null, to: ["a@x.com", "b@x.com"] },
                    { field: "isCommissionInclGST", from: true, to: false },
                    { field: "surcharge", from: 2.50004, to: "" },
                ],
            })
        )["What changed"];

        expect(text).toBe(
            "Prices: monthly: 299, annually: 3599 → monthly: 399, annually: 3499; Vendor email: — → a@x.com, b@x.com; GST included in commission: Yes → No; Platform fee: 2.5 → —"
        );
    });

    it("leave the partner empty when the setting is not a partner's, and keep an unknown name as it is", () => {
        const cells = cellsOf(
            row({
                partnerName: null,
                source: "MOBILE",
                configType: "SOMETHING_NEW",
                changes: [{ field: "someNewField", from: 1, to: 2 }],
            })
        );

        expect(cells.Partner).toBeNull();
        expect(cells["Changed from"]).toBe("MOBILE");
        expect(cells.Configuration).toBe("SOMETHING_NEW");
        expect(cells["What changed"]).toBe("someNewField: 1 → 2");
    });
});

describe("the export's wording", () => {
    it("has a name for every kind of configuration the audit records", () => {
        expect(Object.keys(CONFIG_TYPE_LABELS).sort()).toEqual([...CONFIG_TYPES].sort());
    });

    it("has a name for every column the audit tracks", () => {
        const tracked = new Set(Object.values(AUDITED_TABLES).flatMap(spec => spec.tracked));

        expect([...tracked].filter(field => !FIELD_LABELS[field])).toEqual([]);
    });
});
