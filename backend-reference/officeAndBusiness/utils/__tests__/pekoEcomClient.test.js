const crypto = require("crypto");
const axios = require("axios");
const { sign, postTenantApi, postWebhook } = require("../pekoEcomClient");

jest.mock("axios", () => ({ post: jest.fn() }));

const expectedSignature = (rawBody, secret) =>
  `sha256=${crypto.createHmac("sha256", secret).update(rawBody, "utf8").digest("hex")}`;

describe("pekoEcomClient", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    axios.post.mockResolvedValue({ status: 200, data: {} });
  });

  it("sign produces a sha256= prefixed HMAC hex digest", () => {
    expect(sign('{"a":1}', "secret")).toBe(expectedSignature('{"a":1}', "secret"));
  });

  it("postTenantApi posts the exact stringified body signed with X-Peko-Api-Signature", async () => {
    const payload = { pekoUserId: "42", storeName: "My Store" };
    const rawBody = JSON.stringify(payload);

    await postTenantApi({ apiUrl: "https://vendor.test", secret: "REDACTED", path: "/peko-api/tenant", payload });

    expect(axios.post).toHaveBeenCalledTimes(1);
    const [url, body, config] = axios.post.mock.calls[0];
    expect(url).toBe("https://vendor.test/peko-api/tenant");
    expect(body).toBe(rawBody);
    expect(config.headers["X-Peko-Api-Signature"]).toBe(expectedSignature(rawBody, "api-secret"));
    expect(config.headers["Content-Type"]).toBe("application/json");
    expect(config.transformRequest[0](rawBody)).toBe(rawBody);
  });

  it("postWebhook posts to the subscription webhook path signed with X-Peko-Signature", async () => {
    const payload = { eventType: "subscription.canceled" };
    const rawBody = JSON.stringify(payload);

    await postWebhook({ apiUrl: "https://vendor.test", secret: "REDACTED", payload });

    const [url, body, config] = axios.post.mock.calls[0];
    expect(url).toBe("https://vendor.test/peko/webhooks/subscription");
    expect(body).toBe(rawBody);
    expect(config.headers["X-Peko-Signature"]).toBe(expectedSignature(rawBody, "hook-secret"));
  });
});
