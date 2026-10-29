const settings = require("../setting");
const { DEFAULT_GST_RATE, loadGstRate, splitEntryAmount, gstPartsOf, gstFieldsOf } = require("../ledgerGst");

jest.mock("../setting", () => ({ getASetting: jest.fn() }));

describe("the gst rate an entry is recorded under", () => {
    it("comes from the tax rate setting, else the standard rate", async () => {
        settings.getASetting.mockResolvedValue({ gst: 12 });
        expect(await loadGstRate()).toBe(12);

        settings.getASetting.mockResolvedValue(false);
        expect(await loadGstRate()).toBe(DEFAULT_GST_RATE);

        settings.getASetting.mockResolvedValue({ gst: "abc" });
        expect(await loadGstRate()).toBe(18);
    });
});

describe("splitting the amount typed on an entry", () => {
    it("carves GST out of an inclusive figure, so the total is what was typed", () => {
        expect(splitEntryAmount({ amount: 236, gstInclusive: true, gstRate: 18 })).toEqual({
            amount: 236,
            taxableAmount: 200,
            gstAmount: 36,
            gstRate: 18,
            gstInclusive: true,
        });
    });

    it("adds GST on top of an exclusive figure, so the taxable value is what was typed", () => {
        expect(splitEntryAmount({ amount: 200, gstInclusive: false, gstRate: 18 })).toEqual({
            amount: 236,
            taxableAmount: 200,
            gstAmount: 36,
            gstRate: 18,
            gstInclusive: false,
        });
    });

    it("treats anything but an explicit no as inclusive, and keeps every figure to the paisa", () => {
        expect(splitEntryAmount({ amount: 1500, gstRate: 18 })).toMatchObject({
            gstInclusive: true,
            taxableAmount: 1271.19,
            gstAmount: 228.81,
        });
        expect(splitEntryAmount({ amount: 1500, gstInclusive: "false", gstRate: 18 })).toMatchObject({
            gstInclusive: false,
            amount: 1770,
        });
        expect(splitEntryAmount({ amount: "99.99", gstInclusive: 0, gstRate: 5 })).toEqual({
            amount: 104.99,
            taxableAmount: 99.99,
            gstAmount: 5,
            gstRate: 5,
            gstInclusive: false,
        });
    });
});

describe("reading the split back off a row", () => {
    it("uses the figures kept on the entry, at the rate it was recorded under", () => {
        expect(
            gstPartsOf(
                { amount: "224.0000", taxableAmount: "200.0000", gstAmount: "24.0000", gstRate: "12.00", gstInclusive: 0 },
                18
            )
        ).toEqual({ amount: 224, taxableAmount: 200, gstAmount: 24, gstRate: 12, gstInclusive: false, stored: true });
    });

    it("splits an older entry as inclusive at the rate given", () => {
        expect(gstPartsOf({ amount: "-236.0000" }, 18)).toEqual({
            amount: 236,
            taxableAmount: 200,
            gstAmount: 36,
            gstRate: 18,
            gstInclusive: true,
            stored: false,
        });
    });

    it("hands the screen numbers, or nothing where the split was never kept", () => {
        expect(
            gstFieldsOf({ gstInclusive: 1, gstRate: "18.00", taxableAmount: "200.0000", gstAmount: "36.0000" })
        ).toEqual({ gstInclusive: true, gstRate: 18, taxableAmount: 200, gstAmount: 36 });
        expect(gstFieldsOf({ amount: "236.0000" })).toEqual({
            gstInclusive: true,
            gstRate: null,
            taxableAmount: null,
            gstAmount: null,
        });
    });
});
