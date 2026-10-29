const systemUser = require("../../../models/entities/systemUser");
const roleAndPermissions = require("../../../models/entities/roleAndPermissions");
const { requirePermission, requireAdminRole } = require("../../../middlewares/requirePermission");

jest.mock("../../../models/entities/systemUser", () => ({ findOne: jest.fn() }));
jest.mock("../../../models/entities/roleAndPermissions", () => ({ findOne: jest.fn() }));
jest.mock("../../../utils/loggerHelper", () => ({ customLog: jest.fn() }));

const approvalsWrite = requirePermission({
    category: "Accounting",
    group: "Others",
    service: "Approvals",
    action: "update",
});

const permissionsWith = approvals => [
    {
        serviceCategory: "Accounting",
        hasAccess: true,
        services: [
            {
                category: "Others",
                hasAccess: true,
                services: [
                    { service: "Approvals", hasAccess: true, view: true, write: false, update: false, ...approvals },
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

describe("deciding approvals", () => {
    it("is open to a role holding update on Approvals", async () => {
        mockRole({ roleName: "Accounts", permissions: permissionsWith({ update: true }), isAdmin: false });

        const { next, res } = await run(approvalsWrite);

        expect(next).toHaveBeenCalledWith();
        expect(res.status).not.toHaveBeenCalled();
    });

    it("is refused to a role that can only view them", async () => {
        mockRole({ roleName: "Viewer", permissions: permissionsWith({ update: false }), isAdmin: false });

        const { next, res } = await run(approvalsWrite);

        expect(next).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(403);
    });

    it("is open to an administrator whatever the blob says", async () => {
        mockRole({ roleName: "Admin", permissions: [], isAdmin: true });

        const { next } = await run(approvalsWrite);

        expect(next).toHaveBeenCalledWith();
    });
});

describe("switching the gate", () => {
    it("is refused to anyone who is not an administrator, even with Approvals update", async () => {
        mockRole({ roleName: "Accounts", permissions: permissionsWith({ update: true }), isAdmin: false });

        const { next, res } = await run(requireAdminRole);

        expect(next).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(403);
    });

    it("is open to an administrator", async () => {
        mockRole({ roleName: "Admin", permissions: [], isAdmin: true });

        const { next } = await run(requireAdminRole);

        expect(next).toHaveBeenCalledWith();
    });
});
