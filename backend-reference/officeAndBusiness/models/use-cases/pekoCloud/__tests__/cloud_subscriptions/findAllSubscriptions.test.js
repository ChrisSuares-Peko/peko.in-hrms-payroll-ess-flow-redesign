const { findAllSubscriptions } = require("../../cloud_subscriptions");
const cloud_subscriptions = require("../../../../entities/pekoCloud/cloud_subscriptions");
const cloud_softwares = require("../../../../entities/pekoCloud/cloud_softwares");
const ErrorResponse = require("../../../../../utils/error-response");
const { Op } = require("sequelize");

jest.mock("../../../../entities/pekoCloud/cloud_subscriptions", () => ({
  findAndCountAll: jest.fn(),
}));

jest.mock("../../../../entities/pekoCloud/cloud_softwares", () => ({
    belongsTo: jest.fn(),
}));

describe("findAllSubscriptions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should successfully retrieve subscriptions with pagination, sorting, and filtering", async () => {
    const page = 1;
    const itemsPerPage = 10;
    const sortField = "amount";
    const sort = "DESC";
    const searchText = "Basic";
    const credentialId = 1;
    const subCorporateUserId = null;
    
    const mockData = {
      count: 2,
      rows: [
        { id: 1, subscriptionName: "Basic Plan", amount: 100 },
        { id: 2, subscriptionName: "Advanced Plan", amount: 200 }
      ]
    };

    cloud_subscriptions.findAndCountAll.mockResolvedValue(mockData);

    const result = await findAllSubscriptions(page, itemsPerPage, sortField, sort, searchText, credentialId, subCorporateUserId);

    expect(cloud_subscriptions.findAndCountAll).toHaveBeenCalledWith({
      include: [
        {
          model: cloud_softwares,
          attributes: ["id", "name", "image", "status"],
        },
      ],
      limit: itemsPerPage,
      offset: (page - 1) * itemsPerPage,
      order: [[sortField, sort]],
      where: {
        [Op.or]: [
          { subscriptionName: { [Op.like]: `%${searchText}%` } },
          { planDetails: { [Op.like]: `%${searchText}%` } },
          { billingCycle: { [Op.like]: `%${searchText}%` } },
          { amount: { [Op.like]: `%${searchText}%` } },
        ],
        credentialId: credentialId,
      },
    });
    expect(result).toEqual({ success: true, data: mockData });
  });

  it("should handle filtering by subCorporateUserId and clear credentialId filter", async () => {
    const page = 1;
    const itemsPerPage = 10;
    const sortField = "amount";
    const sort = "ASC";
    const searchText = "";
    const credentialId = null;
    const subCorporateUserId = 2;
    
    const mockData = {
      count: 1,
      rows: [
        { id: 1, subscriptionName: "Enterprise Plan", amount: 300 }
      ]
    };

    cloud_subscriptions.findAndCountAll.mockResolvedValue(mockData);

    const result = await findAllSubscriptions(page, itemsPerPage, sortField, sort, searchText, credentialId, subCorporateUserId);

    expect(cloud_subscriptions.findAndCountAll).toHaveBeenCalledWith({
      include: [
        {
          model: cloud_softwares,
          attributes: ["id", "name", "image", "status"],
        },
      ],
      limit: itemsPerPage,
      offset: (page - 1) * itemsPerPage,
      order: [[sortField, sort]],
      where: {
        subCorporateUserId: subCorporateUserId,
      },
    });
    expect(result).toEqual({ success: true, data: mockData });
  });

  it("should handle cases where no filters or search text are provided", async () => {
    const page = 2;
    const itemsPerPage = 5;
    const sortField = "billingCycle";
    const sort = "ASC";
    const searchText = "";
    const credentialId = null;
    const subCorporateUserId = null;
    
    const mockData = {
      count: 3,
      rows: [
        { id: 1, subscriptionName: "Plan A", amount: 150 },
        { id: 2, subscriptionName: "Plan B", amount: 250 },
        { id: 3, subscriptionName: "Plan C", amount: 350 }
      ]
    };

    cloud_subscriptions.findAndCountAll.mockResolvedValue(mockData);

    const result = await findAllSubscriptions(page, itemsPerPage, sortField, sort, searchText, credentialId, subCorporateUserId);

    expect(cloud_subscriptions.findAndCountAll).toHaveBeenCalledWith({
      include: [
        {
          model: cloud_softwares,
          attributes: ["id", "name", "image", "status"],
        },
      ],
      limit: itemsPerPage,
      offset: (page - 1) * itemsPerPage,
      order: [[sortField, sort]],
      where: {},
    });
    expect(result).toEqual({ success: true, data: mockData });
  });

  it("should handle cases where only search text is provided", async () => {
    const page = 1;
    const itemsPerPage = 10;
    const sortField = "subscriptionName";
    const sort = "DESC";
    const searchText = "Plan";
    const credentialId = null;
    const subCorporateUserId = null;
    
    const mockData = {
      count: 2,
      rows: [
        { id: 1, subscriptionName: "Basic Plan", amount: 100 },
        { id: 2, subscriptionName: "Advanced Plan", amount: 200 }
      ]
    };

    cloud_subscriptions.findAndCountAll.mockResolvedValue(mockData);

    const result = await findAllSubscriptions(page, itemsPerPage, sortField, sort, searchText, credentialId, subCorporateUserId);

    expect(cloud_subscriptions.findAndCountAll).toHaveBeenCalledWith({
      include: [
        {
          model: cloud_softwares,
          attributes: ["id", "name", "image", "status"],
        },
      ],
      limit: itemsPerPage,
      offset: (page - 1) * itemsPerPage,
      order: [[sortField, sort]],
      where: {
        [Op.or]: [
          { subscriptionName: { [Op.like]: `%${searchText}%` } },
          { planDetails: { [Op.like]: `%${searchText}%` } },
          { billingCycle: { [Op.like]: `%${searchText}%` } },
          { amount: { [Op.like]: `%${searchText}%` } },
        ],
      },
    });
    expect(result).toEqual({ success: true, data: mockData });
  });

  it("should handle database errors", async () => {
    const page = 1;
    const itemsPerPage = 10;
    const sortField = "amount";
    const sort = "DESC";
    const searchText = "";
    const credentialId = null;
    const subCorporateUserId = null;
    
    const error = new Error("Database error");

    cloud_subscriptions.findAndCountAll.mockRejectedValue(error);

    const result = await findAllSubscriptions(page, itemsPerPage, sortField, sort, searchText, credentialId, subCorporateUserId);

    expect(result).toEqual(new ErrorResponse("Something went wrong, please try again later.", 500));
  });

  it("should handle unexpected errors", async () => {
    const page = 1;
    const itemsPerPage = 10;
    const sortField = "amount";
    const sort = "ASC";
    const searchText = "";
    const credentialId = null;
    const subCorporateUserId = null;
    
    const unexpectedError = new Error("Unexpected error");

    cloud_subscriptions.findAndCountAll.mockRejectedValue(unexpectedError);

    const result = await findAllSubscriptions(page, itemsPerPage, sortField, sort, searchText, credentialId, subCorporateUserId);

    expect(result).toEqual(new ErrorResponse("Something went wrong, please try again later.", 500));
  });
});
