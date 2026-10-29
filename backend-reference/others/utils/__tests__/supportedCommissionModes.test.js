const { SUPPORTED_COMMISSION_MODES: SUPPORTED, getSupportedCommissionModes } = require("../supportedCommissionModes");

const ALL_MODES = ["MARGIN", "AGENT_MARKUP", "PRINCIPAL_MARKUP"];

describe("getSupportedCommissionModes", () => {
    it("gives every mode, as stored in the database, to a service that supports markup", () => {
        expect(getSupportedCommissionModes("whatsApp_for_busines")).toEqual(ALL_MODES);
        expect(getSupportedCommissionModes("tbo_airline")).toEqual(ALL_MODES);
    });

    it("gives Margin only to a service that is not listed", () => {
        expect(getSupportedCommissionModes("bus_tickets")).toEqual(["MARGIN"]);
        expect(getSupportedCommissionModes("xoxoday")).toEqual(["MARGIN"]);
    });

    it("gives Margin only when there is no access key, or one that only exists on every object", () => {
        expect(getSupportedCommissionModes(undefined)).toEqual(["MARGIN"]);
        expect(getSupportedCommissionModes("")).toEqual(["MARGIN"]);
        expect(getSupportedCommissionModes("constructor")).toEqual(["MARGIN"]);
        expect(getSupportedCommissionModes("__proto__")).toEqual(["MARGIN"]);
    });

    it("hands out a copy, so a caller cannot change the list", () => {
        getSupportedCommissionModes("esim_tunz").push("OTHER");
        getSupportedCommissionModes("bus_tickets").push("OTHER");

        expect(getSupportedCommissionModes("esim_tunz")).toEqual(ALL_MODES);
        expect(getSupportedCommissionModes("bus_tickets")).toEqual(["MARGIN"]);
    });
});

describe("the list of services that support markup", () => {
    it("keeps only services that support all three modes, in the case the database stores", () => {
        Object.entries(SUPPORTED).forEach(([, modes]) => expect(modes).toEqual(ALL_MODES));
    });

    it("lists each service once and never an empty access key", () => {
        const keys = Object.keys(SUPPORTED);
        expect(keys.every(key => key.trim() === key && key.length > 0)).toBe(true);
        expect(new Set(keys).size).toBe(keys.length);
    });
});
