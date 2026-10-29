const { getAllAssignments } = require("../../../garage/garage_assignment");
const GarageAssignment = require("../../../../entities/garage/garage_assignment");

jest.mock("../../../../entities/garage/garage_assignment", () => ({
  findAll: jest.fn(),
}));


describe("getAllAssignments", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ---------------------------------------------------------------------------
  // 1. Should call DB with correct basic params
  // ---------------------------------------------------------------------------
  it("should fetch assignments with correct pagination & sorting", async () => {
    GarageAssignment.findAll.mockResolvedValue([{ id: 1 }]);

    await getAllAssignments(2, 10, "id", "DESC");

    expect(GarageAssignment.findAll).toHaveBeenCalledWith({
      limit: 10,
      offset: 10, // (page=2 → skip 10)
      order: [["id", "DESC"]],
      where: {},
    });
  });

  // ---------------------------------------------------------------------------
  // 2. Should include vehicleId filter
  // ---------------------------------------------------------------------------
  it("should include vehicleId in where clause", async () => {
    GarageAssignment.findAll.mockResolvedValue([]);

    await getAllAssignments(1, 5, "id", "ASC", 77);

    expect(GarageAssignment.findAll).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          vehicleId: 77,
        }),
      })
    );
  });

  // ---------------------------------------------------------------------------
  // 3. Should include driverId filter
  // ---------------------------------------------------------------------------
  it("should include driverId in where clause", async () => {
    GarageAssignment.findAll.mockResolvedValue([]);

    await getAllAssignments(1, 5, "id", "ASC", null, 88);

    expect(GarageAssignment.findAll).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          driverId: 88,
        }),
      })
    );
  });

  // ---------------------------------------------------------------------------
  // 4. Should include credentialId filter
  // ---------------------------------------------------------------------------
  it("should include credentialId in where clause", async () => {
    GarageAssignment.findAll.mockResolvedValue([]);

    await getAllAssignments(1, 5, "id", "ASC", null, null, 55);

    expect(GarageAssignment.findAll).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          credentialId: 55,
        }),
      })
    );
  });

  // ---------------------------------------------------------------------------
  // 5. Should include subCorporateUserId filter
  // ---------------------------------------------------------------------------
  it("should include subCorporateUserId", async () => {
    GarageAssignment.findAll.mockResolvedValue([]);

    await getAllAssignments(1, 5, "id", "ASC", null, null, null, 999);

    expect(GarageAssignment.findAll).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          subCorporateUserId: 999,
        }),
      })
    );
  });

  // ---------------------------------------------------------------------------
  // 6. Should return data on success
  // ---------------------------------------------------------------------------
  it("should return success with data", async () => {
    GarageAssignment.findAll.mockResolvedValue([{ id: 10 }]);

    const result = await getAllAssignments(1, 5);

    expect(result).toEqual({
      success: true,
      data: [{ id: 10 }],
    });
  });

  // ---------------------------------------------------------------------------
  // 7. Should return failure on DB error
  // ---------------------------------------------------------------------------
  it("should return failure if DB throws error", async () => {
    GarageAssignment.findAll.mockRejectedValue(new Error("DB exploded"));

    const result = await getAllAssignments(1, 5);

    expect(result.success).toBe(false);
    expect(result.message).toBe("Unable to fetch assignments");
    expect(result.error).toBeDefined();
  });
});
