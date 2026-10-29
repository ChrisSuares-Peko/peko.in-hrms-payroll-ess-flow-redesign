const systemUser = require("../../models/entities/systemUser");
const roleAndPermissions = require("../../models/entities/roleAndPermissions");
const { requireCategoryAccess, FORBIDDEN } = require("../requirePermission");

jest.mock("../../models/entities/systemUser", () => ({ findOne: jest.fn() }));
jest.mock("../../models/entities/roleAndPermissions", () => ({ findOne: jest.fn() }));
jest.mock("../../utils/loggerHelper", () => ({ customLog: jest.fn() }));

const permissions = ({ accounting = true, settings = true } = {}) => [
    { serviceCategory: "Accounting", hasAccess: accounting, services: [] },
    { serviceCategory: "Settings", hasAccess: settings, services: [] },
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

const guard = requireCategoryAccess("Accounting");

beforeEach(() => jest.clearAllMocks());

describe("requireCategoryAccess", () => {
    it("lets a role through when the category is switched on", async () => {
        mockRole({ roleName: "Accounts", permissions: permissions(), isAdmin: false });

        const { next, res } = await run(guard);

        expect(next).toHaveBeenCalledWith();
        expect(res.status).not.toHaveBeenCalled();
    });

    it("refuses a role whose category is switched off, even with other categories on", async () => {
        mockRole({ roleName: "Partner", permissions: permissions({ accounting: false }), isAdmin: false });

        const { next, res } = await run(guard);

        expect(next).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json.mock.calls[0][0]).toEqual({ status: false, message: FORBIDDEN, data: {}, responseCode: "001" });
    });

    it("refuses a role that has no entry for the category at all", async () => {
        mockRole({ roleName: "Support", permissions: [{ serviceCategory: "Settings", hasAccess: true }], isAdmin: false });

        expect((await run(guard)).res.status).toHaveBeenCalledWith(403);
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
