const { garage_document: GarageDocument, garage_fleet: GarageFleet } = require("../../../../entities/garage");
const { getDocumentExpiryAlertsList } = require("../../garage_document");

jest.mock("../../../../entities/garage", () => ({
    garage_fleet: { findAll: jest.fn(), belongsTo: jest.fn() },
    garage_driver: { belongsTo: jest.fn() },
    garage_assignment: { belongsTo: jest.fn() },
    garage_document: { findOne: jest.fn(), findByPk: jest.fn(), create: jest.fn(), findAll: jest.fn(), findAndCountAll: jest.fn(), associate: jest.fn(), belongsTo: jest.fn() },
}));
jest.mock("../../../../../utils/commonUploadFile", () => ({ uploadFile: jest.fn() }));

describe("getDocumentExpiryAlertsList", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        GarageFleet.findAll.mockResolvedValue([]);
    });

    it("should return expiring and expired documents", async () => {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const in10Days = new Date();
        in10Days.setDate(in10Days.getDate() + 10);

        GarageDocument.findAll.mockResolvedValue([
            { type: "Insurance", expiryDate: yesterday, vehicle: { vehicleNumber: "MH01" }, driver: null },
            { type: "PUC", expiryDate: in10Days, vehicle: null, driver: { dlNumber: "DL123" } },
        ]);

        const result = await getDocumentExpiryAlertsList({ credentialId: 100 });

        expect(result.success).toBe(true);
        expect(result.data.length).toBe(2);
        expect(result.data[0].status).toBe("Expired");
    });

    it("should filter out documents expiring beyond 30 days", async () => {
        const in60Days = new Date();
        in60Days.setDate(in60Days.getDate() + 60);

        GarageDocument.findAll.mockResolvedValue([
            { type: "Insurance", expiryDate: in60Days, vehicle: null, driver: null },
        ]);

        const result = await getDocumentExpiryAlertsList({ credentialId: 100 });

        expect(result.success).toBe(true);
        expect(result.data.length).toBe(0);
    });

    it("should alert on fleet insurance/PUC expiry when no document is uploaded", async () => {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const in60Days = new Date();
        in60Days.setDate(in60Days.getDate() + 60);

        GarageDocument.findAll.mockResolvedValue([]);
        GarageFleet.findAll.mockResolvedValue([
            { id: 1, vehicleNumber: "HJ01ME5678", insuranceExpiry: in60Days, pucValidUpto: yesterday },
        ]);

        const result = await getDocumentExpiryAlertsList({ credentialId: 100 });

        expect(result.success).toBe(true);
        expect(result.data).toEqual([
            { type: "PUC", vehicleOrDlNumber: "HJ01ME5678", status: "Expired" },
        ]);
    });

    it("should not duplicate a fleet alert when an uploaded document covers the vehicle", async () => {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const nextYear = new Date();
        nextYear.setDate(nextYear.getDate() + 365);

        // Renewed PUC document uploaded (not expiring), fleet row still holds the old date.
        GarageDocument.findAll.mockResolvedValue([
            { type: "PUC", expiryDate: nextYear, vehicleId: 1, vehicle: { vehicleNumber: "HJ01ME5678" }, driver: null },
        ]);
        GarageFleet.findAll.mockResolvedValue([
            { id: 1, vehicleNumber: "HJ01ME5678", insuranceExpiry: null, pucValidUpto: yesterday },
        ]);

        const result = await getDocumentExpiryAlertsList({ credentialId: 100 });

        expect(result.success).toBe(true);
        expect(result.data.length).toBe(0);
    });

    it("should return error on exception", async () => {
        GarageDocument.findAll.mockRejectedValue(new Error("DB error"));

        const result = await getDocumentExpiryAlertsList({ credentialId: 100 });

        expect(result.success).toBe(false);
    });
});
