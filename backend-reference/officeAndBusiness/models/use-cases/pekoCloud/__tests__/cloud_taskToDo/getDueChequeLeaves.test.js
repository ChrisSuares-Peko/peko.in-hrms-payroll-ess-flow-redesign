const { getDueChequeLeaves } = require("../../cloud_taskToDo");
const cloud_chequeLeaves = require("../../../../entities/pekoCloud/cloud_chequeLeaves");

jest.mock("../../../../entities/pekoCloud/cloud_chequeLeaves", () => ({
  findAll: jest.fn(),
}));
jest.mock("../../../../../utils/dateUtils", () => ({
  humanReadableDate: jest
    .fn()
    .mockImplementation((date) => new Date(date).toLocaleDateString()),
}));

describe("getDueChequeLeaves", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return a list of due cheque leaves", async () => {
    const credentialId = 1;
    const today = new Date();
    const pastDueDate = new Date(today);
    pastDueDate.setDate(today.getDate() - 10); // 10 days ago

    const formattedDate = pastDueDate.toLocaleDateString();

    const chequeLeaves = [
      {
        payeeName: "John Doe",
        chequeNumber: "123456",
        type: "Payment",
        dueDate: pastDueDate.toISOString(),
        status: "Issued",
      },
      {
        payeeName: "Jane Smith",
        chequeNumber: "654321",
        type: "Refund",
        dueDate: pastDueDate.toISOString(),
        status: "Issued",
      },
    ];

    cloud_chequeLeaves.findAll.mockResolvedValue(chequeLeaves);

    const result = await getDueChequeLeaves(credentialId);

    expect(cloud_chequeLeaves.findAll).toHaveBeenCalledWith({
      where: { credentialId },
    });
    expect(result).toEqual([
      {
        payeeName: "John Doe",
        chequeNumber: "123456",
        type: "Payment",
        dueDate: formattedDate,
        details: JSON.stringify(chequeLeaves[0]),
      },
      {
        payeeName: "Jane Smith",
        chequeNumber: "654321",
        type: "Refund",
        dueDate: formattedDate,
        details: JSON.stringify(chequeLeaves[1]),
      },
    ]);
  });

  it("should exclude cheque leaves that are not yet due", async () => {
    const credentialId = 1;
    const today = new Date();
    const futureDueDate = new Date(today);
    futureDueDate.setDate(today.getDate() + 10); // 10 days in the future

    const chequeLeaves = [
      {
        payeeName: "John Doe",
        chequeNumber: "123456",
        type: "Payment",
        dueDate: futureDueDate.toISOString(),
        status: "Issued",
      },
    ];

    cloud_chequeLeaves.findAll.mockResolvedValue(chequeLeaves);

    const result = await getDueChequeLeaves(credentialId);

    expect(cloud_chequeLeaves.findAll).toHaveBeenCalledWith({
      where: { credentialId },
    });
    expect(result).toEqual([]);
  });

  it("should exclude cheque leaves that are not issued", async () => {
    const credentialId = 1;
    const today = new Date();
    const pastDueDate = new Date(today);
    pastDueDate.setDate(today.getDate() - 10); // 10 days ago

    const chequeLeaves = [
      {
        payeeName: "John Doe",
        chequeNumber: "123456",
        type: "Payment",
        dueDate: pastDueDate.toISOString(),
        status: "Pending",
      },
    ];

    cloud_chequeLeaves.findAll.mockResolvedValue(chequeLeaves);

    const result = await getDueChequeLeaves(credentialId);

    expect(cloud_chequeLeaves.findAll).toHaveBeenCalledWith({
      where: { credentialId },
    });
    expect(result).toEqual([]);
  });

  it("should handle cheque leaves with no due date", async () => {
    const credentialId = 1;
    
    const chequeLeaves = [
      {
        payeeName: "John Doe",
        chequeNumber: "123456",
        type: "Payment",
        dueDate: null,
        status: "Issued",
      },
    ];

    cloud_chequeLeaves.findAll.mockResolvedValue(chequeLeaves);

    const result = await getDueChequeLeaves(credentialId);

    expect(cloud_chequeLeaves.findAll).toHaveBeenCalledWith({
      where: { credentialId },
    });
    expect(result).toEqual([]);
  });

  it("should return an empty array if there are no cheque leaves for the given credentialId", async () => {
    const credentialId = 1;

    cloud_chequeLeaves.findAll.mockResolvedValue([]);

    const result = await getDueChequeLeaves(credentialId);

    expect(cloud_chequeLeaves.findAll).toHaveBeenCalledWith({
      where: { credentialId },
    });
    expect(result).toEqual([]);
  });

  it("should handle errors during the findAll operation", async () => {
    const credentialId = 1;
    const dbError = new Error("Database error");

    cloud_chequeLeaves.findAll.mockRejectedValue(dbError);

    const result = await getDueChequeLeaves(credentialId);

    expect(result).toEqual(dbError);
  });

  it("should handle unexpected errors", async () => {
    const credentialId = 1;
    const unexpectedError = new Error("Unexpected error");

    cloud_chequeLeaves.findAll.mockRejectedValue(unexpectedError);

    const result = await getDueChequeLeaves(credentialId);

    expect(result).toEqual(unexpectedError);
  });
});
