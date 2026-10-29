const {
    MARKUP_MODES,
    commissionModeSql,
    sellingModeSql,
    principalShareSql,
    journalEvidenceMode,
    commissionModeOfJournal,
    sellingModeOf,
    principalShareOf,
} = require("../sellingMode");

describe("the mode an order was sold under, in SQL", () => {
    const sql = commissionModeSql("serviceOperators");

    it("reads the journal's own mode first, then its breakdown, then the operator, then the default", () => {
        expect(sql.startsWith("COALESCE(JSON_UNQUOTE(JSON_EXTRACT(orders.journalData, '$.commissionMode')), CASE WHEN")).toBe(true);
        expect(sql).toContain("'$.principalSalesPayable')) AS DECIMAL(16, 4)), 0)");
        expect(sql).toContain("THEN 'PRINCIPAL_MARKUP' WHEN");
        expect(sql).toContain("THEN 'MARGIN' WHEN");
        expect(sql).toContain("THEN 'MIXED' END, CONVERT(serviceOperators.commissionMode USING utf8mb4), 'MARGIN')");
    });

    it("names the operator by whichever alias the query joined it under", () => {
        expect(commissionModeSql("so")).toContain("CONVERT(so.commissionMode USING utf8mb4)");
    });

    it("gives a mixed order its principal share, a principal markup the whole and a margin sale nothing", () => {
        const share = principalShareSql("serviceOperators");
        expect(share.startsWith("CASE COALESCE(JSON_UNQUOTE(JSON_EXTRACT(orders.journalData, '$.commissionMode'))")).toBe(true);
        expect(share).toContain("WHEN 'MIXED' THEN COALESCE(LEAST(1, GREATEST(0, (");
        expect(share).toContain("'$.outputGSTonPrincipalCommission')) AS DECIMAL(16, 4)), 0)) / NULLIF((COALESCE(");
        expect(share).toContain("orders.amountInINR) - COALESCE(");
        expect(share).toContain("'$.platformFeeIncludingGST')) AS DECIMAL(16, 4)), 0)), 0))), 0) WHEN 'PRINCIPAL_MARKUP' THEN 1 ELSE 0 END");
    });
});

describe("the mode the vendor profile shows, with agent markup told apart", () => {
    it("reads a margin-shaped order of a service set to agent markup as an agent markup, and leaves every other reading alone", () => {
        const sql = sellingModeSql("serviceOperators");
        expect(sql.startsWith("CASE WHEN COALESCE(JSON_UNQUOTE(JSON_EXTRACT(orders.journalData, '$.commissionMode')), CASE WHEN")).toBe(true);
        expect(sql).toContain("= 'MARGIN' AND CONVERT(serviceOperators.commissionMode USING utf8mb4) = 'AGENT_MARKUP' THEN 'AGENT_MARKUP' ELSE COALESCE(");
        expect(sql.endsWith("'MARGIN') END")).toBe(true);
        expect(MARKUP_MODES).toEqual(["AGENT_MARKUP", "PRINCIPAL_MARKUP"]);
    });

    it("does the same off a journal in hand", () => {
        const margin = { vendorPayable: 900, commissionIncludingGST: 118 };
        expect(sellingModeOf(margin, "AGENT_MARKUP")).toBe("AGENT_MARKUP");
        expect(sellingModeOf(margin, "MARGIN")).toBe("MARGIN");
        expect(sellingModeOf(margin, "PRINCIPAL_MARKUP")).toBe("MARGIN");
        expect(sellingModeOf({ ...margin, commissionMode: "MARGIN" }, "AGENT_MARKUP")).toBe("AGENT_MARKUP");
        expect(sellingModeOf({ principalSalesPayable: 882 }, "AGENT_MARKUP")).toBe("PRINCIPAL_MARKUP");
        expect(sellingModeOf({}, "AGENT_MARKUP")).toBe("AGENT_MARKUP");
        expect(sellingModeOf(null, null)).toBe("MARGIN");
    });
});

describe("the same reading off a journal in hand", () => {
    it("takes a principal figure alone as a sale on Peko's own account, a commission or vendor payable alone as a margin sale, and both as mixed", () => {
        expect(journalEvidenceMode({ principalSalesPayable: 900, principalCommissionExcludingGST: 100 })).toBe("PRINCIPAL_MARKUP");
        expect(journalEvidenceMode({ principalCommissionExcludingGST: 100, vendorPayable: 0, commissionIncludingGST: 0 })).toBe("PRINCIPAL_MARKUP");
        expect(journalEvidenceMode({ vendorPayable: 900 })).toBe("MARGIN");
        expect(journalEvidenceMode({ commissionIncludingGST: 118, principalSalesPayable: 500 })).toBe("MIXED");
    });

    it("says nothing when the breakdown carries no such figure", () => {
        expect(journalEvidenceMode({ platformFeeIncludingGST: 59 })).toBeNull();
        expect(journalEvidenceMode(null)).toBeNull();
        expect(journalEvidenceMode("text")).toBeNull();
    });

    it("lets a recorded mode win, then the breakdown, then the operator, then the default", () => {
        expect(commissionModeOfJournal({ commissionMode: "MARGIN", principalSalesPayable: 900 })).toBe("MARGIN");
        expect(commissionModeOfJournal({ principalSalesPayable: 900 }, "MARGIN")).toBe("PRINCIPAL_MARKUP");
        expect(commissionModeOfJournal({}, "PRINCIPAL_MARKUP")).toBe("PRINCIPAL_MARKUP");
        expect(commissionModeOfJournal(null)).toBe("MARGIN");
    });
});

describe("how much of an order is Peko's own sale", () => {
    // 1000 of goods under a 59 platform fee: 570 of it principal (payable 452 + commission 100
    // excl GST + 18 GST), with a 50 coupon that Peko pays in full.
    const MIXED = {
        totalTransactionAmount: 1059,
        platformFeeIncludingGST: 59,
        principalSalesPayable: 452,
        principalCommissionExcludingGST: 100,
        outputGSTonPrincipalCommission: 18,
        vendorPayable: 300,
        commissionIncludingGST: 59,
        couponTotalDiscount: 50,
    };

    it("is the principal items' share of what was bought, whatever coupon came off it", () => {
        expect(principalShareOf(MIXED)).toBe(0.57);
        expect(principalShareOf({ ...MIXED, principalSalesPayable: 482 })).toBe(0.6);
    });

    it("is the whole of a principal markup and none of a margin sale, whatever the operator says", () => {
        expect(principalShareOf({ principalSalesPayable: 900 }, "MARGIN")).toBe(1);
        expect(principalShareOf({ vendorPayable: 900 }, "PRINCIPAL_MARKUP")).toBe(0);
        expect(principalShareOf({}, "PRINCIPAL_MARKUP")).toBe(1);
        expect(principalShareOf(null)).toBe(0);
    });

    it("never goes past the whole order, and reports nothing when there is nothing to divide by", () => {
        expect(principalShareOf({ ...MIXED, principalSalesPayable: 5000 })).toBe(1);
        expect(principalShareOf({ ...MIXED, totalTransactionAmount: 59 })).toBe(0);
    });
});
