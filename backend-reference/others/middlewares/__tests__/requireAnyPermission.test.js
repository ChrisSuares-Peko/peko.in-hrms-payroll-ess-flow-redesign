const systemUser = require("../../models/entities/systemUser");
const roleAndPermissions = require("../../models/entities/roleAndPermissions");
const { requireAnyPermission, requirePermission, FORBIDDEN } = require("../requirePermission");

jest.mock("../../models/entities/systemUser", () => ({ findOne: jest.fn() }));
jest.mock("../../models/entities/roleAndPermissions", () => ({ findOne: jest.fn() }));
jest.mock("../../utils/loggerHelper", () => ({ customLog: jest.fn() }));

const APPROVALS_READ = [
    { category: "Accounting", group: "Others", service: "Approvals", action: "view" },
    { category: "Settings", group: "Services", service: "Accounting Approvals", action: "view" },
];

const permissions = ({ portal = {}, settings = {} } = {}) => [
    {
        serviceCategory: "Accounting",
        hasAccess: true,
        services: [
            {
                category: "Others",
                hasAccess: true,
                services: [{ service: "Approvals", hasAccess: false, view: false, write: false, update: false, ...portal }],
            },
        ],
    },
    {
        serviceCategory: "Settings",
        hasAccess: true,
        services: [
            {
                category: "Services",
                hasAccess: true,
                services: [
                    { service: "Accounting Approvals", hasAccess: false, view: false, write: false, update: false, ...settings },
                ],
            },
        ],
    },
];

const run = async middleware => {
    const req = { user: { id: 7 } };
    const res = { status: jest.fn(() => res), json: jest.fn(() => res) };
    const next = jest.fn();
    await middleware(req, res, next);
    return { res, next };
};

const mockRole = role => {
    systemUser.findOne.mockResolvedValue({ id: 3, roleAndPermissionId: 9 });
    roleAndPermissions.findOne.mockResolvedValue(role);
};

const guard = requireAnyPermission(APPROVALS_READ);

beforeEach(() => jest.clearAllMocks());

describe("requireAnyPermission", () => {
    it("lets a role through when the portal leaf is granted, whatever the stored view flag says", async () => {
        mockRole({ roleName: "Accounts", permissions: permissions({ portal: { hasAccess: true } }), isAdmin: false });

        expect((await run(guard)).next).toHaveBeenCalledWith();
    });

    it("lets a role through when only the Settings leaf is granted", async () => {
        mockRole({ roleName: "Viewer", permissions: permissions({ settings: { hasAccess: true } }), isAdmin: false });

        expect((await run(guard)).next).toHaveBeenCalledWith();
    });

    it("refuses when neither leaf is granted", async () => {
        mockRole({ roleName: "Partner", permissions: permissions(), isAdmin: false });

        const { next, res } = await run(guard);

        expect(next).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json.mock.calls[0][0]).toEqual({ status: false, message: FORBIDDEN, data: {}, responseCode: "001" });
    });

    it("refuses a leaf that is switched off even if its old view flag is still true", async () => {
        mockRole({ roleName: "Partner", permissions: permissions({ settings: { view: true, hasAccess: false } }), isAdmin: false });

        expect((await run(guard)).res.status).toHaveBeenCalledWith(403);
    });

    it("still needs the real flag for an action other than view", async () => {
        const update = requireAnyPermission([{ ...APPROVALS_READ[0], action: "update" }]);

        mockRole({ roleName: "Accounts", permissions: permissions({ portal: { hasAccess: true } }), isAdmin: false });
        expect((await run(update)).res.status).toHaveBeenCalledWith(403);

        mockRole({ roleName: "Accounts", permissions: permissions({ portal: { hasAccess: true, update: true } }), isAdmin: false });
        expect((await run(update)).next).toHaveBeenCalledWith();
    });

    it("always lets an administrator through and never a disabled or missing role", async () => {
        mockRole({ roleName: "Admin", permissions: [], isAdmin: true });
        expect((await run(guard)).next).toHaveBeenCalledWith();

        mockRole({ roleName: "Admin", permissions: [], isAdmin: true, status: false });
        expect((await run(guard)).res.status).toHaveBeenCalledWith(403);

        systemUser.findOne.mockResolvedValue(null);
        expect((await run(guard)).res.status).toHaveBeenCalledWith(403);
    });
});

describe("requirePermission with the view action", () => {
    it("reads view as the leaf being granted, the way the Roles screen saves it", async () => {
        const view = requirePermission(APPROVALS_READ[0]);

        mockRole({ roleName: "Accounts", permissions: permissions({ portal: { hasAccess: true, view: false } }), isAdmin: false });
        expect((await run(view)).next).toHaveBeenCalledWith();

        mockRole({ roleName: "Accounts", permissions: permissions(), isAdmin: false });
        expect((await run(view)).res.status).toHaveBeenCalledWith(403);
    });
});
