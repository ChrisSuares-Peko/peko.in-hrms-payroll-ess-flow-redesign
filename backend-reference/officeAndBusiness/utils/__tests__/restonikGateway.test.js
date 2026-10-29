const axios = require("axios");

const {
    configFromVendor,
    buildAdminSsoUrl,
    mapVendorError,
    createRestaurant,
    findRestaurantByExternalId,
} = require("../restonikGateway");

jest.mock("axios");
jest.mock("../checkAndFetchServiceDetails", () => ({
    findServiceOperatorByAccessKey: jest.fn(),
}));
jest.mock("../loggerHelper", () => ({ customLog: jest.fn() }));

// Trimmed from a real POST /restaurants response.
const LIVE_RESTAURANT = {
    id: "6ab3d57936d198c1a8811320",
    externalId: "store-123",
    name: "Spice Hub",
    slug: "spice-hub-1790170489569",
    email: "owner@spicehub.com",
    phone: "+91 98765 43210",
    address: "",
    logo: "",
    brandColor: "#004655",
    status: "active",
    isActive: true,
    plan: { id: "6a2d92d7514603f6311abba0", name: "Free Plan" },
    subscriptionExpiresAt: "2027-02-20T13:34:49.570Z",
    createdAt: "2026-09-23T13:34:49.572Z",
};

const VENDOR = {
    apiUrl: "https://pos.example.com/api/partner/v1",
    optional1: "rk_live_secret",
    optional2: "https://pos.example.com/api/auth/oidc/initiate",
    optional3: "/admin/orders",
    optional4: "https://inapi.peko.one",
};

describe("configFromVendor", () => {
    beforeEach(() => jest.clearAllMocks());

    it("maps the vendor slots onto the config", () => {
        const cfg = configFromVendor(VENDOR, 42);

        expect(cfg).toEqual({
            baseUrl: VENDOR.apiUrl,
            apiKey: VENDOR.optional1,
            oidcInitiateUrl: VENDOR.optional2,
            defaultTargetLinkUri: "/admin/orders",
            issuer: VENDOR.optional4,
            serviceOperatorId: 42,
        });
    });

    it("errors when the base url or api key is missing", () => {
        expect(configFromVendor({ apiUrl: VENDOR.apiUrl }, 1)).toEqual({
            error: "Vendor configuration missing",
        });
        expect(configFromVendor({ optional1: "k" }, 1)).toEqual({
            error: "Vendor configuration missing",
        });
    });

    it("falls back to IDP_ISSUER when the vendor carries no issuer override", () => {
        const previous = process.env.IDP_ISSUER;
        process.env.IDP_ISSUER = "https://env-issuer.example.com";

        const cfg = configFromVendor({ ...VENDOR, optional4: null }, 1);
        expect(cfg.issuer).toBe("https://env-issuer.example.com");

        process.env.IDP_ISSUER = previous;
    });
});

describe("buildAdminSsoUrl", () => {
    it("url-encodes the issuer and carries the optional hints", () => {
        const url = new URL(
            buildAdminSsoUrl(configFromVendor(VENDOR, 1), {
                loginHint: "owner@example.com",
                targetLinkUri: "/admin/menu",
            })
        );

        expect(url.origin + url.pathname).toBe(
            "https://pos.example.com/api/auth/oidc/initiate"
        );
        expect(url.searchParams.get("iss")).toBe("https://inapi.peko.one");
        expect(url.searchParams.get("login_hint")).toBe("owner@example.com");
        expect(url.searchParams.get("target_link_uri")).toBe("/admin/menu");
        // The raw query must carry the escaped issuer, not a bare URL.
        expect(url.search).toContain("iss=https%3A%2F%2Finapi.peko.one");
    });

    it("uses the vendor default target when none is supplied", () => {
        const url = new URL(buildAdminSsoUrl(configFromVendor(VENDOR, 1)));
        expect(url.searchParams.get("target_link_uri")).toBe("/admin/orders");
        expect(url.searchParams.has("login_hint")).toBe(false);
    });

    it("returns null when the initiate url or issuer is not configured", () => {
        expect(buildAdminSsoUrl(configFromVendor({ ...VENDOR, optional2: null }, 1))).toBeNull();
        const noIssuer = configFromVendor({ ...VENDOR, optional4: null }, 1);
        noIssuer.issuer = undefined;
        expect(buildAdminSsoUrl(noIssuer)).toBeNull();
    });
});

describe("mapVendorError", () => {
    it.each([
        [400, 400],
        [401, 502],
        [403, 502],
        [404, 404],
        [409, 409],
        [429, 503],
        [500, 500],
    ])("maps vendor %i to %i", (vendorStatus, expected) => {
        expect(mapVendorError({ response: { status: vendorStatus } }).httpStatus).toBe(expected);
    });

    it("falls back to 500 for a transport error with no response", () => {
        expect(mapVendorError(new Error("socket hang up")).httpStatus).toBe(500);
    });
});

describe("createRestaurant", () => {
    const cfg = configFromVendor(VENDOR, 1);

    beforeEach(() => jest.clearAllMocks());

    it("sends the api key header and reports a fresh create", async () => {
        axios.mockResolvedValue({
            status: 201,
            data: { success: true, created: true, data: { ...LIVE_RESTAURANT } },
        });

        const result = await createRestaurant(cfg, { externalId: "store-123" }, "trace");

        expect(axios).toHaveBeenCalledWith(
            expect.objectContaining({
                method: "POST",
                url: "https://pos.example.com/api/partner/v1/restaurants",
                headers: expect.objectContaining({ "X-API-Key": "rk_live_secret" }),
            })
        );
        expect(result).toEqual(
            expect.objectContaining({
                created: true,
                id: "6ab3d57936d198c1a8811320",
                status: "active",
            })
        );
    });

    // POST /restaurants is idempotent on externalId: a repeat call is a success,
    // not a failure, and must not be treated as a provisioning error. The vendor
    // signals it with a TOP-LEVEL created flag and HTTP 200.
    it("treats a repeat call (200, created:false) as success", async () => {
        axios.mockResolvedValue({
            status: 200,
            data: { success: true, created: false, data: { ...LIVE_RESTAURANT } },
        });

        const result = await createRestaurant(cfg, { externalId: "store-123" }, "trace");

        expect(result.created).toBe(false);
        expect(result.id).toBe("6ab3d57936d198c1a8811320");
        expect(result.status).toBe("active");
    });

    it("keeps the full vendor record so the dashboard can read plan and slug", async () => {
        axios.mockResolvedValue({
            status: 201,
            data: { success: true, created: true, data: { ...LIVE_RESTAURANT } },
        });

        const { raw } = await createRestaurant(cfg, {}, "trace");

        expect(raw.slug).toBe("spice-hub-1790170489569");
        expect(raw.plan).toEqual({ id: "6a2d92d7514603f6311abba0", name: "Free Plan" });
        expect(raw.subscriptionExpiresAt).toBe("2027-02-20T13:34:49.570Z");
        // address and logo come back as plain strings, empty when unset.
        expect(raw.address).toBe("");
        expect(raw.logo).toBe("");
    });

    // The vendor field is `data.id` — there is no `restaurantId` anywhere in the
    // response. `restaurantId` is only our own key on serviceSubscriptions.vendorResponse.
    it("reads the id from data.id on the verbatim vendor response", async () => {
        axios.mockResolvedValue({
            status: 200,
            data: {
                success: true,
                created: false,
                data: {
                    id: "6ab3d57936d198c1a8811320",
                    externalId: "store-123",
                    name: "Spice Hub",
                    slug: "spice-hub-1790170489569",
                    email: "owner@spicehub.com",
                    phone: "+91 98765 43210",
                    address: "",
                    logo: "",
                    brandColor: "#004655",
                    status: "active",
                    isActive: true,
                    plan: { id: "6a2d92d7514603f6311abba0", name: "Free Plan" },
                    subscriptionExpiresAt: "2027-02-20T13:34:49.570Z",
                    createdAt: "2026-09-23T13:34:49.572Z",
                    owner: {
                        id: "6ab3d57936d198c1a8811328",
                        externalUserId: "user-42",
                        name: "Asha Rao",
                        email: "asha@spicehub.com",
                        role: "admin",
                        isActive: true,
                    },
                },
            },
        });

        const result = await createRestaurant(cfg, { externalId: "store-123" }, "trace");

        expect(result.id).toBe("6ab3d57936d198c1a8811320");
        expect(result.raw).not.toHaveProperty("restaurantId");
        // The owner id is the vendor's own user record, never the restaurant id.
        expect(result.id).not.toBe(result.raw.owner.id);
    });

    it("propagates a vendor 400 so the caller can refund", async () => {
        axios.mockRejectedValue({ response: { status: 400, data: { message: "bad phone" } } });

        await expect(createRestaurant(cfg, {}, "trace")).rejects.toEqual(
            expect.objectContaining({ response: expect.objectContaining({ status: 400 }) })
        );
        // 4xx is not retried — one attempt only.
        expect(axios).toHaveBeenCalledTimes(1);
    });
});

describe("findRestaurantByExternalId", () => {
    const cfg = configFromVendor(VENDOR, 1);

    beforeEach(() => jest.clearAllMocks());

    it("reads a bare array envelope", async () => {
        axios.mockResolvedValue({ status: 200, data: { data: [{ id: "rst_1" }] } });
        await expect(findRestaurantByExternalId(cfg, "peko_7")).resolves.toEqual({ id: "rst_1" });
    });

    it("reads a paginated items envelope", async () => {
        axios.mockResolvedValue({ status: 200, data: { data: { items: [{ id: "rst_2" }] } } });
        await expect(findRestaurantByExternalId(cfg, "peko_7")).resolves.toEqual({ id: "rst_2" });
    });

    it("returns null when nothing matches", async () => {
        axios.mockResolvedValue({ status: 200, data: { data: [] } });
        await expect(findRestaurantByExternalId(cfg, "peko_7")).resolves.toBeNull();
    });
});
