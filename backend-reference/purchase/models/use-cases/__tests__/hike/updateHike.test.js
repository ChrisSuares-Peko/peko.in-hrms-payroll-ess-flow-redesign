const { updateHike } = require("../../hike");
const hike = require("../../../entities/hike");

jest.mock("../../../entities/hike"); 

// Properly mock `subCorporateUsers`
jest.mock("../../../entities/subCorporateUsers", () => ({
    hasOne: jest.fn(), // Mock `hasOne` method
    belongsTo: jest.fn(),
}));

describe("updateHike", () => {
    const mockId = 1;
    const mockUpdateData = {
        name: "Updated Hike",
        salaryAmount: 5000,
    };

    afterEach(() => {
        jest.clearAllMocks();
    });

    it("should update hike successfully", async () => {
        const mockUpdatedHike = { id: mockId, ...mockUpdateData };
        hike.update.mockResolvedValue([1, [mockUpdatedHike]]);

        const result = await updateHike(mockId, mockUpdateData);

        expect(hike.update).toHaveBeenCalledWith(mockUpdateData, {
            where: { id: mockId },
            returning: true,
        });
        expect(result).toEqual({
            success: true,
            message: "Hike updated successfully",
            data: mockUpdatedHike,
        });
    });

    it("should return failure when hike is not found or no changes were made", async () => {
        hike.update.mockResolvedValue([0, []]);

        const consoleLogSpy = jest.spyOn(console, "log").mockImplementation();

        const result = await updateHike(mockId, mockUpdateData);

        expect(hike.update).toHaveBeenCalledWith(mockUpdateData, {
            where: { id: mockId },
            returning: true,
        });
        expect(consoleLogSpy).toHaveBeenCalledWith({
            success: false,
            message: "Hike not found or no changes were made",
        });
        expect(result).toEqual({
            success: false,
            message: "Hike not found or no changes were made",
        });

        consoleLogSpy.mockRestore();
    });

    it("should handle errors and return appropriate response", async () => {
        const mockError = new Error("Database error");
        hike.update.mockRejectedValue(mockError);

        const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();

        const result = await updateHike(mockId, mockUpdateData);

        expect(hike.update).toHaveBeenCalledWith(mockUpdateData, {
            where: { id: mockId },
            returning: true,
        });
        expect(consoleErrorSpy).toHaveBeenCalledWith("Error updating hike:", mockError);
        expect(result).toEqual({
            success: false,
            message: "An error occurred while updating the hike",
        });

        consoleErrorSpy.mockRestore();
    });
});
