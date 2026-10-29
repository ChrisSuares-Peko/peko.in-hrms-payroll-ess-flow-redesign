const { gmvOfOrder, netGmvOfOrder, discountOfOrder } = require("../journalPosting");

const figure = field => `COALESCE(CAST(JSON_UNQUOTE(JSON_EXTRACT(orders.journalData, '$.${field}')) AS DECIMAL(16, 4)), 0)`;
const HAS_ENTRY = "JSON_EXTRACT(orders.journalData, '$.paymentThroughGateway') IS NOT NULL";
const PAID = `${figure("paymentThroughGateway")} + ${figure("paymentThroughWallet")}`;

describe("the three faces of an order's value", () => {
    it("reads GMV as what was paid plus the discount Peko bore, from the entry, else the amount charged", () => {
        expect(gmvOfOrder("orders")).toBe(
            `CASE WHEN ${HAS_ENTRY} THEN ${PAID} + ${figure("couponTotalDiscount")} ELSE orders.amountInINR END`
        );
    });

    it("reads net GMV as what was paid alone, with the same fallback", () => {
        expect(netGmvOfOrder("orders")).toBe(`CASE WHEN ${HAS_ENTRY} THEN ${PAID} ELSE orders.amountInINR END`);
    });

    it("reads the discount only off an entry, and nothing where there is none", () => {
        expect(discountOfOrder("orders")).toBe(
            `CASE WHEN ${HAS_ENTRY} THEN ${figure("couponTotalDiscount")} ELSE 0 END`
        );
    });

    it("works on the bare columns when no table is named", () => {
        expect(gmvOfOrder()).toContain("JSON_EXTRACT(journalData, '$.paymentThroughGateway') IS NOT NULL");
        expect(gmvOfOrder()).toContain("ELSE amountInINR END");
        expect(gmvOfOrder()).not.toContain("orders.");
    });
});
