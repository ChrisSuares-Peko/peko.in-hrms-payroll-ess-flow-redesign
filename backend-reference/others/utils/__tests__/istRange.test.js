const { istDayRange, istMonthToDateRange, dayBoundedRange, istDayLabel } = require("../istRange");

describe("istDayRange", () => {
    it("covers the IST calendar day for a mid-day instant", () => {
        expect(istDayRange(new Date("2026-09-16T08:30:00.000Z"))).toEqual({
            from: "2026-09-16 00:00:00",
            to: "2026-09-16 23:59:59",
        });
    });

    it("rolls to the next IST day while UTC is still the previous evening", () => {
        expect(istDayRange(new Date("2026-09-16T19:00:00.000Z"))).toEqual({
            from: "2026-09-17 00:00:00",
            to: "2026-09-17 23:59:59",
        });
    });

    it("stays on the current IST day one second before IST midnight", () => {
        expect(istDayRange(new Date("2026-09-16T18:29:59.000Z")).to).toBe("2026-09-16 23:59:59");
    });

    it("defaults to the current instant", () => {
        expect(istDayRange().from).toMatch(/^\d{4}-\d{2}-\d{2} 00:00:00$/);
    });
});

describe("istMonthToDateRange", () => {
    it("starts on the first of the IST month and ends today", () => {
        expect(istMonthToDateRange(new Date("2026-09-16T08:30:00.000Z"))).toEqual({
            from: "2026-09-01 00:00:00",
            to: "2026-09-16 23:59:59",
        });
    });

    it("crosses the year boundary in IST", () => {
        expect(istMonthToDateRange(new Date("2025-12-31T20:00:00.000Z"))).toEqual({
            from: "2026-01-01 00:00:00",
            to: "2026-01-01 23:59:59",
        });
    });

    it("pads single-digit months and days", () => {
        expect(istMonthToDateRange(new Date("2026-03-05T02:00:00.000Z"))).toEqual({
            from: "2026-03-01 00:00:00",
            to: "2026-03-05 23:59:59",
        });
    });
});

describe("dayBoundedRange", () => {
    it("covers both days end to end for plain date strings", () => {
        expect(dayBoundedRange("2026-08-19", "2026-09-19")).toEqual({
            from: "2026-08-19 00:00:00",
            to: "2026-09-19 23:59:59",
        });
    });

    it("keeps a single day range a full day", () => {
        expect(dayBoundedRange("2026-09-19", "2026-09-19")).toEqual({
            from: "2026-09-19 00:00:00",
            to: "2026-09-19 23:59:59",
        });
    });

    it("takes the calendar day out of a parsed date", () => {
        expect(
            dayBoundedRange(new Date("2026-08-19T00:00:00.000Z"), new Date("2026-09-19T00:00:00.000Z"))
        ).toEqual({ from: "2026-08-19 00:00:00", to: "2026-09-19 23:59:59" });
    });
});

describe("istDayLabel", () => {
    it("reads a timestamp as the IST day it falls on", () => {
        expect(istDayLabel(new Date("2026-09-24T19:00:00.000Z"))).toBe("25 Sep 2026");
        expect(istDayLabel("2026-09-24T19:00:00.000Z")).toBe("25 Sep 2026");
    });

    it("reads a plain date as the day it names, whatever the timezone", () => {
        expect(istDayLabel("2026-09-25")).toBe("25 Sep 2026");
    });

    it("is blank when there is no date", () => {
        expect(istDayLabel(null)).toBe("");
        expect(istDayLabel(undefined)).toBe("");
    });
});
