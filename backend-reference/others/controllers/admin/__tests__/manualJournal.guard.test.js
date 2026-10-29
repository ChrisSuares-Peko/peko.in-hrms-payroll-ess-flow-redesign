const systemUser = require("../../../models/entities/systemUser");
const roleAndPermissions = require("../../../models/entities/roleAndPermissions");
const { requirePermission } = require("../../../middlewares/requirePermission");

jest.mock("../../../models/entities/systemUser", () => ({ findOne: jest.fn() }));
jest.mock("../../../models/entities/roleAndPermissions", () => ({ findOne: jest.fn() }));
jest.mock("../../../utils/loggerHelper", () => ({ customLog: jest.fn() }));

const manualOperationsWrite = requirePermission({
    category: "Accounting",
    group: "Others",
    service: "Manual Operations",
    action: "update",
});

const permissionsWith = manual => [
    {
        serviceCategory: "Accounting",
        hasAccess: true,
        services: [
            {
                category: "Others",
                hasAccess: true,
                services: [
                    { service: "Approvals", hasAccess: true, view: true, write: false, update: true },
                    { service: "Manual Operations", hasAccess: true, view: true, write: false, update: false, ...manual },
                    { service: "FAQ", hasAccess: true, view: true },
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

beforeEach(() => jest.clearAllMocks());

describe("posting or correcting a journal by hand", () => {
    it("is open to a role holding update on Manual Operations", async () => {
        mockRole({ roleName: "Accounts", permissions: permissionsWith({ update: true }), isAdmin: false });

        const { next, res } = await run(manualOperationsWrite);

        expect(next).toHaveBeenCalledWith();
        expect(res.status).not.toHaveBeenCalled();
    });

    it("is refused to a role that can only view it, even with update on Approvals", async () => {
        mockRole({ roleName: "Viewer", permissions: permissionsWith({ update: false }), isAdmin: false });

        const { next, res } = await run(manualOperationsWrite);

        expect(next).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(403);
    });

    it("is refused to a role whose blob predates the leaf", async () => {
        const stale = permissionsWith({});
        stale[0].services[0].services.splice(1, 1);
        mockRole({ roleName: "Old", permissions: stale, isAdmin: false });

        const { res } = await run(manualOperationsWrite);

        expect(res.status).toHaveBeenCalledWith(403);
    });

    it("is open to an administrator whatever the blob says", async () => {
        mockRole({ roleName: "Admin", permissions: [], isAdmin: true });

        const { next } = await run(manualOperationsWrite);

        expect(next).toHaveBeenCalledWith();
    });
});
