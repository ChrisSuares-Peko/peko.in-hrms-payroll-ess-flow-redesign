const systemUser = require("../../models/entities/systemUser");
const roleAndPermissions = require("../../models/entities/roleAndPermissions");
const {
    requirePermission,
    requireAdminRole,
    findServiceNode,
    FORBIDDEN,
} = require("../requirePermission");

jest.mock("../../models/entities/systemUser", () => ({ findOne: jest.fn() }));
jest.mock("../../models/entities/roleAndPermissions", () => ({ findOne: jest.fn() }));
jest.mock("../../utils/loggerHelper", () => ({ customLog: jest.fn() }));

const VENDOR_LEDGER = {
    category: "Accounting",
    group: "Ledgers",
    service: "Vendors",
    action: "update",
};

const permissionsWith = overrides => [
    {
        serviceCategory: "Accounting",
        hasAccess: true,
        services: [
            {
                category: "Ledgers",
                hasAccess: true,
                services: [
                    { service: "Vendors", hasAccess: true, view: true, write: false, update: false, ...overrides },
                    { service: "Subscribers", hasAccess: true, view: true, write: true, update: true },
                ],
            },
        ],
    },
];

const run = async (middleware, credentialId = 7) => {
    const req = { user: { id: credentialId } };
    const res = { status: jest.fn(() => res), json: jest.fn(() => res) };
    const next = jest.fn();
    await middleware(req, res, next);
    return { res, next };
};

const mockRole = role => {
    systemUser.findOne.mockResolvedValue({ id: 3, roleAndPermissionId: 9 });
    roleAndPermissions.findOne.mockResolvedValue(role);
};

const guard = requirePermission(VENDOR_LEDGER);

beforeEach(() => jest.clearAllMocks());

describe("requirePermission", () => {
    it("lets a role through when the service grants the action", async () => {
        mockRole({ roleName: "Finance", permissions: permissionsWith({ update: true }), isAdmin: false });

        const { next, res } = await run(guard);

        expect(next).toHaveBeenCalledWith();
        expect(res.status).not.toHaveBeenCalled();
        expect(systemUser.findOne.mock.calls[0][0].where).toEqual({ credentialId: 7 });
    });

    it("refuses a role that can see vendors but not change them", async () => {
        mockRole({ roleName: "Viewer", permissions: permissionsWith({ update: false }), isAdmin: false });

        const { next, res } = await run(guard);

        expect(next).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json.mock.calls[0][0]).toEqual({
            status: false,
            message: FORBIDDEN,
            data: {},
            responseCode: "001",
        });
    });

    it("refuses when the vendors service itself is not granted", async () => {
        mockRole({
            roleName: "Support",
            permissions: permissionsWith({ hasAccess: false, update: true }),
            isAdmin: false,
        });

        expect((await run(guard)).res.status).toHaveBeenCalledWith(403);
    });

    it("refuses when the Ledgers group or the Accounting category is closed", async () => {
        const closedGroup = permissionsWith({ update: true });
        closedGroup[0].services[0].hasAccess = false;
        mockRole({ roleName: "Support", permissions: closedGroup, isAdmin: false });
        expect((await run(guard)).res.status).toHaveBeenCalledWith(403);

        const closedCategory = permissionsWith({ update: true });
        closedCategory[0].hasAccess = false;
        mockRole({ roleName: "Support", permissions: closedCategory, isAdmin: false });
        expect((await run(guard)).res.status).toHaveBeenCalledWith(403);
    });

    it("always lets an admin role through", async () => {
        mockRole({ roleName: "Super Admin", permissions: [], isAdmin: true });

        expect((await run(guard)).next).toHaveBeenCalledWith();
    });

    it("refuses a disabled role even when it is an admin", async () => {
        mockRole({ roleName: "Retired Admin", permissions: [], isAdmin: true, status: false });

        expect((await run(guard)).res.status).toHaveBeenCalledWith(403);
    });

    it("refuses when the acting user has no system user row or no role", async () => {
        systemUser.findOne.mockResolvedValue(null);
        expect((await run(guard)).res.status).toHaveBeenCalledWith(403);

        systemUser.findOne.mockResolvedValue({ id: 3, roleAndPermissionId: null });
        expect((await run(guard)).res.status).toHaveBeenCalledWith(403);
        expect(roleAndPermissions.findOne).not.toHaveBeenCalled();
    });

    it("refuses rather than throwing on a malformed permission blob", async () => {
        const cases = [null, [], [{ serviceCategory: "Accounting", hasAccess: true }], "not an array"];

        for (const permissions of cases) {
            mockRole({ roleName: "Odd", permissions, isAdmin: false });
            // eslint-disable-next-line no-await-in-loop
            expect((await run(guard)).res.status).toHaveBeenCalledWith(403);
        }
    });
});

describe("requireAdminRole", () => {
    it("lets an administrator through", async () => {
        mockRole({ roleName: "Super Admin", isAdmin: true, permissions: [] });

        const { next } = await run(requireAdminRole);

        expect(next).toHaveBeenCalledWith();
    });

    it("refuses a role that is granted the whole of Accounting but is not an administrator", async () => {
        mockRole({
            roleName: "Accounts",
            isAdmin: false,
            permissions: permissionsWith({ update: true }),
        });

        const { res, next } = await run(requireAdminRole);

        expect(next).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json.mock.calls[0][0].message).toBe(FORBIDDEN);
    });

    it("refuses a disabled role and a user with no role at all", async () => {
        mockRole({ roleName: "Accounts", isAdmin: true, status: false, permissions: [] });
        expect((await run(requireAdminRole)).res.status).toHaveBeenCalledWith(403);

        systemUser.findOne.mockResolvedValue(null);
        expect((await run(requireAdminRole)).res.status).toHaveBeenCalledWith(403);
    });
});

describe("findServiceNode", () => {
    it("picks the named service out of the named group", () => {
        const node = findServiceNode(permissionsWith({ update: true }), VENDOR_LEDGER);

        expect(node).toMatchObject({ service: "Vendors", update: true });
    });

    it("does not confuse one service with its sibling", () => {
        const node = findServiceNode(permissionsWith({ update: false }), {
            ...VENDOR_LEDGER,
            service: "Subscribers",
        });

        expect(node).toMatchObject({ service: "Subscribers", update: true });
    });
});
