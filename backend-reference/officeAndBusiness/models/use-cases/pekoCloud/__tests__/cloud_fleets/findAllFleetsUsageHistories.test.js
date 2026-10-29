const { Op } = require("sequelize");
const cloud_usageHistories = require("../../../../entities/pekoCloud/cloud_usageHistories");
const cloud_employees = require("../../../../entities/pekoCloud/cloud_employees");
const cloud_fleets = require("../../../../entities/pekoCloud/cloud_fleets");
const { findAllFleetsUsageHistories } = require("../../cloud_fleets");
const ErrorResponse = require("../../../../../utils/error-response");

jest.mock("../../../../entities/pekoCloud/cloud_usageHistories", () => ({
  belongsTo: jest.fn(),
  findAndCountAll: jest.fn(),
}));
jest.mock("../../../../entities/pekoCloud/cloud_employees", () => ({
  belongsTo: jest.fn(),
}));
jest.mock("../../../../entities/pekoCloud/cloud_fleets", () => ({
  belongsTo: jest.fn(),
}));

describe("findAllFleetsUsageHistories Use-Case", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should successfully retrieve usage histories with pagination, sorting, search text, and filters", async () => {
    const page = 1;
    const itemsPerPage = 2;
    const sortField = "employeeName";
    const sort = "ASC";
    const searchText = "John";
    const credentialId = 1;
    const subCorporateUserId = null;
    const category = "FLEET";

    const offset = (page - 1) * itemsPerPage;
    const usageHistoriesData = {
      count: 2,
      rows: [
        {
          id: 1,
          usageCategory: "FLEET",
          cloud_employee: {
            id: 1,
            employeeName: "John Doe",
            employeeEmail: "john.doe@example.com",
            department: "Engineering",
            joiningDate: new Date(),
            employeeID: "E123",
          },
          cloud_fleet: {
            id: 1,
            vehicleName: "Vehicle 1",
            vehicleType: "Truck",
            vehicleNumber: "12345",
            purchasedDate: new Date(),
            dateOfRenewal: new Date(),
            amount: 10000,
            modelYear: "2020",
          },
        },
        {
          id: 2,
          usageCategory: "FLEET",
          cloud_employee: {
            id: 2,
            employeeName: "Jane Smith",
            employeeEmail: "jane.smith@example.com",
            department: "HR",
            joiningDate: new Date(),
            employeeID: "E124",
          },
          cloud_fleet: {
            id: 2,
            vehicleName: "Vehicle 2",
            vehicleType: "Van",
            vehicleNumber: "67890",
            purchasedDate: new Date(),
            dateOfRenewal: new Date(),
            amount: 12000,
            modelYear: "2021",
          },
        },
      ],
    };

    cloud_usageHistories.findAndCountAll.mockResolvedValue(usageHistoriesData);

    const result = await findAllFleetsUsageHistories(
      page,
      itemsPerPage,
      sortField,
      sort,
      searchText,
      credentialId,
      subCorporateUserId,
      category
    );

    expect(cloud_usageHistories.findAndCountAll).toHaveBeenCalledWith({
      include: [
        {
          model: cloud_employees,
          attributes: [
            "id",
            "employeeName",
            "employeeEmail",
            "department",
            "joiningDate",
            "employeeID",
          ],
        },
        {
          model: cloud_fleets,
          attributes: [
            "id",
            "vehicleName",
            "vehicleType",
            "vehicleNumber",
            "purchasedDate",
            "dateOfRenewal",
            "amount",
            "modelYear",
          ],
        },
      ],
      limit: itemsPerPage,
      offset: offset,
      order: [[sortField, sort]],
      where: {
        [Op.or]: [
          { "$cloud_employee.employeeName$": { [Op.like]: `%${searchText}%` } },
          {
            "$cloud_employee.employeeEmail$": { [Op.like]: `%${searchText}%` },
          },
          { "$cloud_employee.department$": { [Op.like]: `%${searchText}%` } },
        ],
        usageCategory: category,
        credentialId: credentialId,
      },
    });

    expect(result).toEqual({ success: true, data: usageHistoriesData });
  });

  it("should successfully retrieve usage histories with pagination and sorting only", async () => {
    const page = 1;
    const itemsPerPage = 2;
    const sortField = "employeeName";
    const sort = "DESC";
    const searchText = "";
    const credentialId = null;
    const subCorporateUserId = null;
    const category = "FLEET";

    const offset = (page - 1) * itemsPerPage;
    const usageHistoriesData = {
      count: 3,
      rows: [
        {
          id: 3,
          usageCategory: "Repair",
          cloud_employee: {
            id: 3,
            employeeName: "Jim Doe",
            employeeEmail: "jim.doe@example.com",
            department: "Finance",
            joiningDate: new Date(),
            employeeID: "E125",
          },
          cloud_fleet: {
            id: 3,
            vehicleName: "Vehicle 3",
            vehicleType: "SUV",
            vehicleNumber: "11223",
            purchasedDate: new Date(),
            dateOfRenewal: new Date(),
            amount: 15000,
            modelYear: "2022",
          },
        },
        {
          id: 4,
          usageCategory: "Repair",
          cloud_employee: {
            id: 4,
            employeeName: "Alice Smith",
            employeeEmail: "alice.smith@example.com",
            department: "Marketing",
            joiningDate: new Date(),
            employeeID: "E126",
          },
          cloud_fleet: {
            id: 4,
            vehicleName: "Vehicle 4",
            vehicleType: "Sedan",
            vehicleNumber: "33445",
            purchasedDate: new Date(),
            dateOfRenewal: new Date(),
            amount: 20000,
            modelYear: "2023",
          },
        },
      ],
    };

    cloud_usageHistories.findAndCountAll.mockResolvedValue(usageHistoriesData);

    const result = await findAllFleetsUsageHistories(
      page,
      itemsPerPage,
      sortField,
      sort,
      searchText,
      credentialId,
      subCorporateUserId,
      category
    );

    expect(cloud_usageHistories.findAndCountAll).toHaveBeenCalledWith({
      include: [
        {
          model: cloud_employees,
          attributes: [
            "id",
            "employeeName",
            "employeeEmail",
            "department",
            "joiningDate",
            "employeeID",
          ],
        },
        {
          model: cloud_fleets,
          attributes: [
            "id",
            "vehicleName",
            "vehicleType",
            "vehicleNumber",
            "purchasedDate",
            "dateOfRenewal",
            "amount",
            "modelYear",
          ],
        },
      ],
      limit: itemsPerPage,
      offset: offset,
      order: [[sortField, sort]],
      where: {usageCategory: category},
    });

    expect(result).toEqual({ success: true, data: usageHistoriesData });
  });

  it("should successfully retrieve usage histories with filters only", async () => {
    const page = 1;
    const itemsPerPage = 2;
    const sortField = "employeeEmail";
    const sort = "ASC";
    const searchText = "";
    const credentialId = 2;
    const subCorporateUserId = null;
    const category = "FLEET";

    const offset = (page - 1) * itemsPerPage;
    const usageHistoriesData = {
      count: 2,
      rows: [
        {
          id: 5,
          usageCategory: "Repair",
          cloud_employee: {
            id: 5,
            employeeName: "Bob Brown",
            employeeEmail: "bob.brown@example.com",
            department: "Sales",
            joiningDate: new Date(),
            employeeID: "E127",
          },
          cloud_fleet: {
            id: 5,
            vehicleName: "Vehicle 5",
            vehicleType: "Truck",
            vehicleNumber: "55667",
            purchasedDate: new Date(),
            dateOfRenewal: new Date(),
            amount: 17000,
            modelYear: "2024",
          },
        },
        {
          id: 6,
          usageCategory: "Repair",
          cloud_employee: {
            id: 6,
            employeeName: "Charlie Black",
            employeeEmail: "charlie.black@example.com",
            department: "Operations",
            joiningDate: new Date(),
            employeeID: "E128",
          },
          cloud_fleet: {
            id: 6,
            vehicleName: "Vehicle 6",
            vehicleType: "Van",
            vehicleNumber: "66778",
            purchasedDate: new Date(),
            dateOfRenewal: new Date(),
            amount: 18000,
            modelYear: "2025",
          },
        },
      ],
    };

    cloud_usageHistories.findAndCountAll.mockResolvedValue(usageHistoriesData);

    const result = await findAllFleetsUsageHistories(
      page,
      itemsPerPage,
      sortField,
      sort,
      searchText,
      credentialId,
      subCorporateUserId,
      category
    );

    expect(cloud_usageHistories.findAndCountAll).toHaveBeenCalledWith({
      include: [
        {
          model: cloud_employees,
          attributes: [
            "id",
            "employeeName",
            "employeeEmail",
            "department",
            "joiningDate",
            "employeeID",
          ],
        },
        {
          model: cloud_fleets,
          attributes: [
            "id",
            "vehicleName",
            "vehicleType",
            "vehicleNumber",
            "purchasedDate",
            "dateOfRenewal",
            "amount",
            "modelYear",
          ],
        },
      ],
      limit: itemsPerPage,
      offset: offset,
      order: [[sortField, sort]],
      where: {
        usageCategory: category,
        credentialId: credentialId,
      },
    });

    expect(result).toEqual({ success: true, data: usageHistoriesData });
  });

  it("should successfully retrieve usage histories with no filters applied", async () => {
    const page = 1;
    const itemsPerPage = 2;
    const sortField = "vehicleName";
    const sort = "DESC";
    const searchText = "";
    const credentialId = null;
    const subCorporateUserId = null;
    const category = "FLEET";

    const offset = (page - 1) * itemsPerPage;
    const usageHistoriesData = {
      count: 1,
      rows: [
        {
          id: 7,
          usageCategory: "FLEET",
          cloud_employee: {
            id: 7,
            employeeName: "Lucas White",
            employeeEmail: "lucas.white@example.com",
            department: "Support",
            joiningDate: new Date(),
            employeeID: "E129",
          },
          cloud_fleet: {
            id: 7,
            vehicleName: "Vehicle 7",
            vehicleType: "Sedan",
            vehicleNumber: "77889",
            purchasedDate: new Date(),
            dateOfRenewal: new Date(),
            amount: 19000,
            modelYear: "2026",
          },
        },
      ],
    };

    cloud_usageHistories.findAndCountAll.mockResolvedValue(usageHistoriesData);

    const result = await findAllFleetsUsageHistories(
      page,
      itemsPerPage,
      sortField,
      sort,
      searchText,
      credentialId,
      subCorporateUserId,
      category
    );

    expect(cloud_usageHistories.findAndCountAll).toHaveBeenCalledWith({
      include: [
        {
          model: cloud_employees,
          attributes: [
            "id",
            "employeeName",
            "employeeEmail",
            "department",
            "joiningDate",
            "employeeID",
          ],
        },
        {
          model: cloud_fleets,
          attributes: [
            "id",
            "vehicleName",
            "vehicleType",
            "vehicleNumber",
            "purchasedDate",
            "dateOfRenewal",
            "amount",
            "modelYear",
          ],
        },
      ],
      limit: itemsPerPage,
      offset: offset,
      order: [[sortField, sort]],
      where: { usageCategory: category },
    });

    expect(result).toEqual({ success: true, data: usageHistoriesData });
  });

  it("should return an error when the database query fails", async () => {
    const page = 1;
    const itemsPerPage = 2;
    const sortField = "employeeName";
    const sort = "ASC";
    const searchText = "John";
    const credentialId = 1;
    const subCorporateUserId = null;
    const category = "FLEET";

    const error = new Error("Database error");
    cloud_usageHistories.findAndCountAll.mockRejectedValue(error);

    const result = await findAllFleetsUsageHistories(
      page,
      itemsPerPage,
      sortField,
      sort,
      searchText,
      credentialId,
      subCorporateUserId,
      category
    );

    expect(result).toEqual(
      new ErrorResponse("Something went wrong, please try again later.", 500)
    );
  });
});
