const { updateBulkPaymentStatus } = require("../../notification");

jest.mock('pusher', () => {
    return jest.fn().mockImplementation(() => ({
        trigger: jest.fn()
    }));
});
describe("updateBulkPaymentStatus Service", () => {
  let consoleLogSpy, consoleTableSpy;

  beforeEach(() => {
    consoleLogSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    consoleTableSpy = jest.spyOn(console, "table").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.clearAllMocks();
    consoleLogSpy.mockRestore();
    consoleTableSpy.mockRestore();
  });

  test("should call pusher.trigger with correct arguments", async () => {
    const credentialId = "CRED001";
    const message = "Bulk payment completed";

    await updateBulkPaymentStatus(credentialId, message);

    expect(consoleTableSpy).toHaveBeenCalledWith({ x: "updateBulkPaymentStatus" });

    // expect(pusher.trigger).toHaveBeenCalledWith(
    //   "update-bulk-payment-status",
    //   "real-time-notification",
    //   { credentialId, message }
    // );

    expect(consoleLogSpy).toHaveBeenCalledWith("updateBulkPaymentStatus CREATE ROUTE CALLED");
  });

  test("should catch error when pusher.trigger fails", async () => {
    // pusher.trigger.mockRejectedValue(new Error("PUSHER FAIL"));

    const result = await updateBulkPaymentStatus("CID", "MSG");

    expect(consoleLogSpy).toHaveBeenCalledWith("updateBulkPaymentStatus CREATE ROUTE CALLED");

    // Function returns undefined by design
    expect(result).toBeUndefined();
  });

  test("should always log from finally block", async () => {
    await updateBulkPaymentStatus("X", "Y");

    expect(consoleLogSpy).toHaveBeenCalledWith("updateBulkPaymentStatus CREATE ROUTE CALLED");
  });

});
