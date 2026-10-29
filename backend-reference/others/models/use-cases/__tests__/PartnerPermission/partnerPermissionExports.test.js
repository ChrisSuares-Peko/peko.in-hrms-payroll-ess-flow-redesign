const { partnerPermissionExports } = require("../../../use-cases/partnerPermission");
const  partnerPermission  = require("../../../entities/partnerPermission");
const credential = require("../../../entities/credential");
const { handleSortFields } = require("../../../../utils/sortHandle");

jest.mock("../../../entities/partnerPermission", () => ({
   
        findAndCountAll: jest.fn(),
    
}));



jest.mock("../../../entities/credential", () => ({
  
    findAll: jest.fn(),
  
}));

jest.mock("../../../../utils/sortHandle", () => ({
  handleSortFields: jest.fn(),
}));

jest.mock("../../../../utils/formatter", () => ({
  formattedDateTime: jest.fn(),
}));

describe("partnerPermissionExports", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  

  test("should return empty result if no data is found", async () => {
    partnerPermission.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });
    credential.findAll.mockResolvedValue([]);

    const params = {
      searchText: "",
      from: "",
      to: "",
      sort: "DESC",
      sortField: "createdAt",
    };

    handleSortFields.mockReturnValue([["createdAt", "DESC"]]);

    const result = await partnerPermissionExports(params);

    expect(result).toEqual([]);
  });


});
