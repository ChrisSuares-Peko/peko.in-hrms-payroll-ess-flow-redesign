const {
    ACCOUNTING_PORTAL,
    ADMIN_PANEL,
    sourceOf,
    bindRequestContext,
    currentContext,
} = require("../requestContext");

const request = (overrides = {}) => ({
    headers: {},
    originalUrl: "/api/v1/system_user/5/others/cashback/12",
    user: { id: 5, name: "Asha", username: "asha@peko.one" },
    ...overrides,
});

describe("sourceOf", () => {
    it("is the Accounting Portal when its header says so", () => {
        expect(sourceOf(request({ headers: { "x-app-source": "accounting-portal" } }))).toBe(ACCOUNTING_PORTAL);
        expect(sourceOf(request({ headers: { "x-app-source": " Accounting-Portal " } }))).toBe(ACCOUNTING_PORTAL);
    });

    it("is the Accounting Portal for an accounting endpoint, with no header", () => {
        const originalUrl = "/api/v1/system_user/5/others/accounting/services/commission/3?x=1";

        expect(sourceOf(request({ originalUrl }))).toBe(ACCOUNTING_PORTAL);
        expect(sourceOf(request({ originalUrl: "/api/v1/system_user/5/others/accounting" }))).toBe(ACCOUNTING_PORTAL);
    });

    it("is the Accounting Portal when both say so", () => {
        const both = request({
            headers: { "x-app-source": "accounting-portal" },
            originalUrl: "/api/v1/system_user/5/others/accounting/cashbacks/bulk",
        });

        expect(sourceOf(both)).toBe(ACCOUNTING_PORTAL);
    });

    it("is the Admin Panel for anything else", () => {
        expect(sourceOf(request())).toBe(ADMIN_PANEL);
        expect(sourceOf(request({ headers: { "x-app-source": "mobile" } }))).toBe(ADMIN_PANEL);
        expect(sourceOf(request({ originalUrl: "/api/v1/system_user/5/others/accountingX/list" }))).toBe(ADMIN_PANEL);
        expect(sourceOf(request({ originalUrl: "/api/v1/system_user/5/others/cashback?q=/others/accounting/" }))).toBe(
            ADMIN_PANEL
        );
    });

    it("copes with a request that has no headers or url", () => {
        expect(sourceOf({})).toBe(ADMIN_PANEL);
    });
});

describe("bindRequestContext", () => {
    it("gives the rest of the request the user and the source", () => {
        let seen;

        bindRequestContext(request(), {}, () => {
            seen = currentContext();
        });

        expect(seen).toEqual({ actorId: 5, source: ADMIN_PANEL, ipAddress: null });
    });

    it("records the client address: the gateway's x-client-ip, else the socket, and never x-forwarded-for", () => {
        const seen = [];
        const capture = () => seen.push(currentContext().ipAddress);

        bindRequestContext(request({ headers: { "x-client-ip": "203.0.113.7", "x-forwarded-for": "9.9.9.9" } }), {}, capture);
        bindRequestContext(
            request({ headers: { "x-forwarded-for": "9.9.9.9" }, socket: { remoteAddress: "::ffff:192.168.1.5" } }),
            {},
            capture
        );
        bindRequestContext(request({ socket: { remoteAddress: "::1" } }), {}, capture);

        expect(seen).toEqual(["203.0.113.7", "192.168.1.5", "127.0.0.1"]);
    });

    it("has no user for a request without one", () => {
        const seen = [];
        const capture = () => seen.push(currentContext());

        bindRequestContext(request({ user: { id: 7 } }), {}, capture);
        bindRequestContext(request({ user: undefined }), {}, capture);

        expect(seen[0]).toMatchObject({ actorId: 7 });
        expect(seen[1]).toMatchObject({ actorId: null });
    });

    it("carries the context through async work and keeps requests apart", async () => {
        const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
        const handle = (user, delay) =>
            new Promise(resolve => {
                bindRequestContext(request({ user }), {}, async () => {
                    await wait(delay);
                    resolve(currentContext());
                });
            });

        const [first, second] = await Promise.all([handle({ id: 1, name: "One" }, 15), handle({ id: 2, name: "Two" }, 1)]);

        expect(first).toMatchObject({ actorId: 1 });
        expect(second).toMatchObject({ actorId: 2 });
    });

    it("leaves no context behind once the request is done", () => {
        bindRequestContext(request(), {}, () => {});

        expect(currentContext()).toBeUndefined();
    });
});
