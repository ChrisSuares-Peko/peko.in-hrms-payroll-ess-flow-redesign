const { findAllHikesAndCount } = require("../../hike");
const hike = require("../../../entities/hike");
const { Op } = require("sequelize");
const { handleSortFields } = require("../../../../utils/sortHandle");

// Mock dependencies
jest.mock("../../../entities/hike");

jest.mock("../../../entities/subCorporateUsers", () => ({
  hasOne: jest.fn(),
  belongsTo: jest.fn(),
}));

jest.mock("../../../../utils/sortHandle", () => ({
  handleSortFields: jest.fn(),
}));

describe("findAllHikesAndCount", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should fetch hikes successfully with default parameters", async () => {
    const mockResult = {
      count: 2,
      rows: [
        { id: 1, name: "Hike 1" },
        { id: 2, name: "Hike 2" },
      ],
    };

    // For default parameters, assume handleSortFields returns a default order.
    handleSortFields.mockReturnValue([["createdAt", "DESC"]]);
    hike.findAndCountAll.mockResolvedValue(mockResult);

    const result = await findAllHikesAndCount({
      itemsPerPage: 10,
      page: 1,
    });

    expect(hike.findAndCountAll).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {},
        include: expect.arrayContaining([
          expect.objectContaining({
            as: "credential",
            attributes: ["id", "name"],
            include: expect.arrayContaining([
              expect.objectContaining({
                as: "registeredByCredential",
                attributes: ["id", "name"],
              }),
            ]),
            required: false,
          }),
        ]),
        order: [["createdAt", "DESC"]],
        offset: 0,
        limit: 10,
      })
    );
    expect(result).toEqual({
      success: true,
      message: "Hikes fetched successfully",
      data: mockResult,
    });
  });

  it("should apply sorting when sortField and sort are provided", async () => {
    handleSortFields.mockReturnValue([["name", "desc"]]);
    hike.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });

    await findAllHikesAndCount({
      sortField: "name",
      sort: "desc",
      itemsPerPage: 10,
      page: 1,
    });

    expect(hike.findAndCountAll).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {},
        include: expect.arrayContaining([
          expect.objectContaining({
            as: "credential",
            attributes: ["id", "name"],
            include: expect.arrayContaining([
              expect.objectContaining({
                as: "registeredByCredential",
                attributes: ["id", "name"],
              }),
            ]),
            required: false,
          }),
        ]),
        order: [["name", "desc"]],
        offset: 0,
        limit: 10,
      })
    );
  });

  it("should apply search filter when searchText is provided", async () => {
    handleSortFields.mockReturnValue([["createdAt", "DESC"]]);
    hike.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });

    await findAllHikesAndCount({
      itemsPerPage: 10,
      page: 1,
      searchText: "test",
    });

    expect(hike.findAndCountAll).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          [Op.or]: [
            { name: { [Op.like]: "%test%" } },
            { amount: { [Op.like]: "%test%" } },
            { salaryAmount: { [Op.like]: "%test%" } },
            { salaryValidation: { [Op.like]: "%test%" } },
            { features: { [Op.like]: "%test%" } },
            { planType: { [Op.like]: "%test%" } },
            { partners: { [Op.like]: "%test%" } },
          ],
        },
        include: expect.arrayContaining([
          expect.objectContaining({
            as: "credential",
            attributes: ["id", "name"],
            include: expect.arrayContaining([
              expect.objectContaining({
                as: "registeredByCredential",
                attributes: ["id", "name"],
              }),
            ]),
            required: false,
          }),
        ]),
        order: [["createdAt", "DESC"]],
        offset: 0,
        limit: 10,
      })
    );
  });

  it("should filter active hikes when isActive is true", async () => {
    handleSortFields.mockReturnValue([["createdAt", "DESC"]]);
    hike.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });

    await findAllHikesAndCount({
      itemsPerPage: 10,
      page: 1,
      isActive: true,
    });

    expect(hike.findAndCountAll).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { status: true },
        include: expect.arrayContaining([
          expect.objectContaining({
            as: "credential",
            attributes: ["id", "name"],
            include: expect.arrayContaining([
              expect.objectContaining({
                as: "registeredByCredential",
                attributes: ["id", "name"],
              }),
            ]),
            required: false,
          }),
        ]),
        order: [["createdAt", "DESC"]],
        offset: 0,
        limit: 10,
      })
    );
  });

  it("should calculate correct offset for pagination", async () => {
    handleSortFields.mockReturnValue([["createdAt", "DESC"]]);
    hike.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });

    await findAllHikesAndCount({
      itemsPerPage: 10,
      page: 3,
    });

    expect(hike.findAndCountAll).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {},
        include: expect.arrayContaining([
          expect.objectContaining({
            as: "credential",
            attributes: ["id", "name"],
            include: expect.arrayContaining([
              expect.objectContaining({
                as: "registeredByCredential",
                attributes: ["id", "name"],
              }),
            ]),
            required: false,
          }),
        ]),
        order: [["createdAt", "DESC"]],
        offset: 20, // (3 - 1) * 10
        limit: 10,
      })
    );
  });

  it("should handle errors and return an appropriate response", async () => {
    const mockError = new Error("Database error");
    hike.findAndCountAll.mockRejectedValue(mockError);

    const result = await findAllHikesAndCount({
      itemsPerPage: 10,
      page: 1,
    });

    expect(result).toEqual({
      success: false,
      message: "An error occurred while fetching hikes",
    });
  });
});
