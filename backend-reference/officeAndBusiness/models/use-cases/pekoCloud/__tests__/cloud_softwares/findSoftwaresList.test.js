const { findSoftwaresList } = require("../../cloud_softwares");
const cloud_softwares = require("../../../../entities/pekoCloud/cloud_softwares");
const ErrorResponse = require("../../../../../utils/error-response");

jest.mock("../../../../entities/pekoCloud/cloud_softwares", () => ({
  findAndCountAll: jest.fn(),
}));

describe("findSoftwaresList", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should successfully retrieve a list of software entries", async () => {
    const mockData = {
      count: 2,
      rows: [
        { id: 1, name: "Software 1", image: "https://example.com/image1.png", status: true },
        { id: 2, name: "Software 2", image: "https://example.com/image2.png", status: true }
      ]
    };

    cloud_softwares.findAndCountAll.mockResolvedValue(mockData);

    const result = await findSoftwaresList();

    expect(cloud_softwares.findAndCountAll).toHaveBeenCalled();
    expect(result).toEqual({ success: true, data: mockData });
  });

  it("should return an empty list when no software entries are found", async () => {
    const mockData = {
      count: 0,
      rows: []
    };

    cloud_softwares.findAndCountAll.mockResolvedValue(mockData);

    const result = await findSoftwaresList();

    expect(cloud_softwares.findAndCountAll).toHaveBeenCalled();
    expect(result).toEqual({ success: true, data: mockData });
  });

  it("should handle database errors", async () => {
    const error = new Error("Database error");

    cloud_softwares.findAndCountAll.mockRejectedValue(error);

    const result = await findSoftwaresList();

    expect(cloud_softwares.findAndCountAll).toHaveBeenCalled();
    expect(result).toEqual(new ErrorResponse("Something went wrong, please try again later.", 500));
  });

  it("should handle unexpected errors", async () => {

    const unexpectedError = new Error("Unexpected error");

    cloud_softwares.findAndCountAll.mockRejectedValue(unexpectedError);

    const result = await findSoftwaresList();

    expect(result).toEqual(new ErrorResponse("Something went wrong, please try again later.", 500));

  });
});
