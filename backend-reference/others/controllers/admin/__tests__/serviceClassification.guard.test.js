const systemUser = require("../../../models/entities/systemUser");
const roleAndPermissions = require("../../../models/entities/roleAndPermissions");
const { requirePermission } = require("../../../middlewares/requirePermission");

jest.mock("../../../models/entities/systemUser", () => ({ findOne: jest.fn() }));
jest.mock("../../../models/entities/roleAndPermissions", () => ({ findOne: jest.fn() }));
jest.mock("../../../utils/loggerHelper", () => ({ customLog: jest.fn() }));

const classificationWrite = requirePermission({
    category: "Settings",
    group: "Services",
    service: "Service Classification",
    action: "update",
});

const permissionsWith = flags => [
    {
        serviceCategory: "Settings",
        hasAccess: true,
        services: [
            {
                category: "Services",
                hasAccess: true,
                services: [
                    { service: "Service Operators", hasAccess: true, view: true, write: true, update: true },
                    { service: "Service Classification", hasAccess: true, view: true, write: false, update: false, ...flags },
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

describe("classifying services", () => {
    it("is open to a role holding update on Service Classification", async () => {
        mockRole({ roleName: "Ops", permissions: permissionsWith({ update: true }), isAdmin: false });

        const { next, res } = await run(classificationWrite);

        expect(next).toHaveBeenCalledWith();
        expect(res.status).not.toHaveBeenCalled();
    });

    it("is refused to a role that can only view the page, even with update elsewhere in Settings", async () => {
        mockRole({ roleName: "Viewer", permissions: permissionsWith({ update: false }), isAdmin: false });

        const { next, res } = await run(classificationWrite);

        expect(next).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(403);
    });

    it("is open to an administrator whatever the blob says", async () => {
        mockRole({ roleName: "Admin", permissions: [], isAdmin: true });

        const { next } = await run(classificationWrite);

        expect(next).toHaveBeenCalledWith();
    });
});
