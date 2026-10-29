const axios = require("axios");
const { findServiceOperatorByAccessKey } = require("../../../utils/checkAndFetchServiceDetails");
const { createCollectRequest } = require("../../nupayGateway");

jest.mock("axios", () => jest.fn());
jest.mock("../../../utils/checkAndFetchServiceDetails", () => ({
  findServiceOperatorByAccessKey: jest.fn(),
}));
jest.mock("../../../utils/nupayCollectionsVault", () => ({
  decryptCred: jest.fn(),
  encryptCred: jest.fn(),
  tryFetchNupayCredentials: jest.fn(),
}));

const VENDOR = {
  vendor: { apiUrl: "https://api-uat.nupaybiz.com", optional1: "ak", optional2: "as", optional3: "prov" },
};

// axios is called twice: once for the access token, once for the transaction.
const wireAxios = (initiate) => {
  axios.mockImplementation((config) => {
    if (String(config.url).includes("accesstoken")) {
      return Promise.resolve({ status: 200, data: { token: "tok" } });
    }
    return typeof initiate === "function" ? initiate(config) : Promise.resolve(initiate);
  });
};

const initiateCall = () => axios.mock.calls.find(([c]) => String(c.url).includes("initiate_transaction"))?.[0];

describe("createCollectRequest", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    findServiceOperatorByAccessKey.mockResolvedValue(VENDOR);
  });

  it("rejects a non-positive / non-finite amount", async () => {
    await expect(createCollectRequest({ amount: 0, payer_mobile_no: "9876543210" })).rejects.toThrow(
      "Valid amount is required"
    );
    await expect(createCollectRequest({ amount: "abc", payer_mobile_no: "9876543210" })).rejects.toThrow(
      "Valid amount is required"
    );
  });

  it("rejects an amount above the UPI cap", async () => {
    await expect(
      createCollectRequest({ amount: 100001, payer_mobile_no: "9876543210" })
    ).rejects.toThrow("Valid amount is required");
  });

  it("rejects a mobile number not starting 6-9", async () => {
    await expect(createCollectRequest({ amount: 500, payer_mobile_no: "1234567890" })).rejects.toThrow(
      "valid 10-digit mobile number"
    );
    await expect(createCollectRequest({ amount: 500, payer_mobile_no: "0000000000" })).rejects.toThrow(
      "valid 10-digit mobile number"
    );
  });

  it("builds the payload and maps a successful response", async () => {
    wireAxios({
      status: 200,
      data: {
        code: "NP2000",
        response_data: {
          transaction_id: "T1",
          payment_link: "https://pay/x",
          request_amount: "500.00",
          expires_at: "2026-08-05T06:00:00Z",
        },
      },
    });

    const result = await createCollectRequest({
      amount: 500,
      payer_mobile_no: "9876543210",
      payer_name: "Acme",
      purpose_message: "  invoice  ",
    });

    const sent = initiateCall();
    expect(sent.data.request_amount).toBe("500.00");
    expect(sent.data.payer_mobile_no).toBe("9876543210");
    expect(sent.data.payer_name).toBe("Acme");
    expect(sent.data.transaction_remarks).toBe("invoice"); // trimmed
    expect(sent.data.client_reference_id).toMatch(/^[a-z0-9]{12}$/);

    expect(result.reference_id).toMatch(/^[a-z0-9]{12}$/);
    expect(result.nupayTxnId).toBe("T1");
    expect(result.paymentLink).toBe("https://pay/x");
    expect(result.expiresAt).toBe("2026-08-05T06:00:00Z");
    expect(result.transactionStatus).toBe("SUCCESS");
  });

  it("surfaces the vendor error message on API failure", async () => {
    wireAxios(() => Promise.reject({ response: { data: { message: "provider down" } } }));
    await expect(
      createCollectRequest({ amount: 500, payer_mobile_no: "9876543210" })
    ).rejects.toThrow("provider down");
  });
});
