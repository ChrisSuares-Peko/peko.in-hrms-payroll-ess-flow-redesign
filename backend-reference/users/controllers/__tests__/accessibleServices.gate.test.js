jest.mock("../../models/use-cases/services", () => ({
    findService: jest.fn(),
    findCashBackService: jest.fn(),
    findServiceOperatorsAccessKeys: jest.fn(),
}));
jest.mock("../../models/use-cases/subCorporateUser", () => ({ findOneSubCorporate: jest.fn() }));
jest.mock("../../models/use-cases/partnerPermission", () => ({
    findOnePartnerPermissionData: jest.fn(),
    findPartnerInitialAccessesibleServices: jest.fn(),
    resolveServicePermissionsForSession: jest.fn(),
    updatePartnerInitialAccessesibleServices: jest.fn(),
}));
jest.mock("../../models/use-cases/subscription", () => ({ findExistingGroupPackage: jest.fn() }));
jest.mock("../../models/use-cases/cashback", () => ({
    findAllUserAccessibleAccessKeys: jest.fn(),
    findAllUserAccessibleServiceOperatorIds: jest.fn(),
}));
jest.mock("../../models/use-cases/user", () => ({ findOneByCredentialId: jest.fn() }));
jest.mock("../../models/use-cases/corporateUser", () => ({ findOneCorporate: jest.fn() }));
jest.mock("../../models/use-cases/serviceMembership", () => ({
    activeServiceLabels: jest.fn(() => []),
    listMemberships: jest.fn(() => []),
}));
jest.mock("../../utils/loggerHelper", () => ({ customLog: jest.fn() }));
jest.mock("../../models/use-cases/disableService", () => ({ findDisableService: jest.fn() }));
jest.mock("../../models/use-cases/serviceApproval", () => ({ loadApprovalGate: jest.fn() }));
jest.mock("../../utils/subscriptionStatusUpdates", () => ({ subscriptionStatusUpdateForCorporate: jest.fn() }));
jest.mock("../../models/use-cases/setting", () => ({ updateInitialServicePermission: jest.fn() }));

const { accessibleServices } = require("../services");
const { findService } = require("../../models/use-cases/services");
const { findOneSubCorporate } = require("../../models/use-cases/subCorporateUser");
const { resolveServicePermissionsForSession } = require("../../models/use-cases/partnerPermission");
const { findExistingGroupPackage } = require("../../models/use-cases/subscription");
const { findAllUserAccessibleAccessKeys } = require("../../models/use-cases/cashback");
const { findDisableService } = require("../../models/use-cases/disableService");
const { loadApprovalGate } = require("../../models/use-cases/serviceApproval");
const { findOneByCredentialId } = require("../../models/use-cases/user");
const { findOneCorporate } = require("../../models/use-cases/corporateUser");
const { activeServiceLabels } = require("../../models/use-cases/serviceMembership");

const tree = () => [
    { label: "Dashboard", hasAccess: true, subServices: [] },
    { label: "Verification Suite", hasAccess: true },
    {
        label: "Utility Payments",
        hasAccess: true,
        subServices: [
            { label: "Electricity Bill", accessKey: "bbps_utility_electricity", hasAccess: true },
            { label: "Water Bill", accessKey: "bbps_utility_water", hasAccess: true },
        ],
    },
    { label: "Need Help", hasAccess: true, subServices: [{ label: "Tickets", hasAccess: true }] },
];

const buildRes = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
};

const request = user => ({ user, headers: {} });

const CORPORATE = { id: 7, role: "CORPORATE", corporateId: 42, registeredBy: null };
const SUB_USER = { id: 8, role: "CORPORATE_SUB_USER", corporateId: 42, subCorporateId: 3, registeredBy: null };

const payloadOf = res => res.json.mock.calls[0][0].data;

const leaf = (nodes, label) => {
    const found = [];
    const walk = list =>
        (list || []).forEach(node => {
            if (node.label === label) found.push(node);
            walk(node.subServices || node.services);
        });
    walk(nodes);
    return found[0];
};

beforeEach(() => {
    jest.clearAllMocks();
    findExistingGroupPackage.mockResolvedValue({ package: { id: 3, packageName: "Growth" } });
    findAllUserAccessibleAccessKeys.mockResolvedValue(["bbps_utility_electricity", "bbps_utility_water", "other_key"]);
    findDisableService.mockResolvedValue([]);
    resolveServicePermissionsForSession.mockResolvedValue({ id: 12, registeredBy: null, permissions: tree(), status: true });
    loadApprovalGate.mockResolvedValue(new Set(["bbps_utility_water"]));
});

describe("the approval gate on a corporate's services", () => {
    it("asks for the tree id and hides every service the gate blocks for that tree", async () => {
        const res = buildRes();

        await accessibleServices(request(CORPORATE), res, jest.fn());

        expect(resolveServicePermissionsForSession).toHaveBeenCalledWith(CORPORATE, ["id", "registeredBy", "permissions", "status"]);
        expect(loadApprovalGate).toHaveBeenCalledWith(12);
        expect(res.status).toHaveBeenCalledWith(200);

        const { data, userAccessibleServices, packageName } = payloadOf(res);
        expect(leaf(data, "Electricity Bill").hasAccess).toBe(true);
        expect(leaf(data, "Water Bill").hasAccess).toBe(false);
        expect(leaf(data, "Verification Suite").hasAccess).toBe(true);
        expect(leaf(data, "Dashboard").hasAccess).toBe(true);
        expect(leaf(data, "Tickets").hasAccess).toBe(true);
        expect(userAccessibleServices).toEqual(["bbps_utility_electricity", "other_key"]);
        expect(packageName).toBe("Growth");
    });

    it("applies the gate after the per-corporate disables, so a disabled service stays off", async () => {
        findDisableService.mockResolvedValue([{ serviceOperatorId: 5, serviceOperator: { accessKey: "bbps_utility_electricity" } }]);
        const res = buildRes();

        await accessibleServices(request(CORPORATE), res, jest.fn());

        expect(leaf(payloadOf(res).data, "Electricity Bill").hasAccess).toBe(false);
    });

    it("serves the list untouched while the gate is off or unavailable", async () => {
        loadApprovalGate.mockResolvedValue(null);
        const res = buildRes();

        await accessibleServices(request(CORPORATE), res, jest.fn());

        const { data, userAccessibleServices } = payloadOf(res);
        expect(leaf(data, "Water Bill").hasAccess).toBe(true);
        expect(userAccessibleServices).toEqual(["bbps_utility_electricity", "bbps_utility_water", "other_key"]);
    });
});

describe("the approval gate on a sub-corporate user's services", () => {
    beforeEach(() => {
        resolveServicePermissionsForSession.mockResolvedValue({ id: 12, permissions: tree() });
        findOneSubCorporate.mockResolvedValue({
            services: [
                { label: "Utility Payments", hasAccess: true },
                { label: "Verification Suite", hasAccess: true },
            ],
            role: "Employee",
        });
    });

    it("drops blocked children before the label intersection and keeps Need Help", async () => {
        const res = buildRes();

        await accessibleServices(request(SUB_USER), res, jest.fn());

        expect(resolveServicePermissionsForSession).toHaveBeenCalledWith(SUB_USER, ["id", "permissions"]);
        expect(loadApprovalGate).toHaveBeenCalledWith(12);

        const { data, userAccessibleServices, subCorporateRole } = payloadOf(res);
        const utilities = data.find(service => service.label === "Utility Payments");
        expect(utilities.subServices.map(service => service.label)).toEqual(["Electricity Bill"]);
        expect(data.find(service => service.label === "Verification Suite").hasAccess).toBe(true);
        expect(data.some(service => service.label === "Need Help")).toBe(true);
        expect(userAccessibleServices).toEqual(["bbps_utility_electricity", "other_key"]);
        expect(subCorporateRole).toBe("Employee");
    });
});

describe("the approval gate on an employee's services", () => {
    const EMPLOYEE = { id: 9, role: "USER", corporateId: 42, registeredBy: null };

    beforeEach(() => {
        findOneCorporate.mockResolvedValue({ credentialId: 500 });
        resolveServicePermissionsForSession.mockResolvedValue({ id: 12, permissions: tree() });
        findOneByCredentialId.mockResolvedValue({ userAccessService: [{ label: "Utility Payments", hasAccess: true, status: "ACTIVE" }] });
        activeServiceLabels.mockReturnValue(["Utility Payments", "Verification Suite"]);
    });

    it("resolves the employer's tree with its id, hides blocked children and filters the keys", async () => {
        const res = buildRes();

        await accessibleServices(request(EMPLOYEE), res, jest.fn());

        expect(resolveServicePermissionsForSession).toHaveBeenCalledWith(
            { registeredBy: null, id: 500 },
            ["id", "permissions"]
        );
        expect(loadApprovalGate).toHaveBeenCalledWith(12);
        expect(findAllUserAccessibleAccessKeys).toHaveBeenCalledWith({ userId: 500, corporateId: 42, currentPackageId: 3 });

        const { data, userAccessibleServices } = payloadOf(res);
        const utilities = data.find(service => service.label === "Utility Payments");
        expect(utilities.subServices.map(service => service.label)).toEqual(["Electricity Bill"]);
        expect(data.find(service => service.label === "Verification Suite").hasAccess).toBe(true);
        expect(userAccessibleServices).toEqual(["bbps_utility_electricity", "other_key"]);
    });
});

describe("a system user's services", () => {
    it("carries whether the role is an administrator beside the permission blob", async () => {
        findService.mockResolvedValue({ roleAndPermission: { permissions: [{ serviceCategory: "Accounting" }], isAdmin: 1 } });
        const res = buildRes();

        await accessibleServices(request({ id: 9, role: "SYSTEM_USER" }), res, jest.fn());

        expect(res.status).toHaveBeenCalledWith(201);
        expect(payloadOf(res)).toEqual({ data: [{ serviceCategory: "Accounting" }], isAdmin: true });
    });

    it("reads a role without the flag as not an administrator", async () => {
        findService.mockResolvedValue({ roleAndPermission: { permissions: null, isAdmin: null } });
        const res = buildRes();

        await accessibleServices(request({ id: 9, role: "SYSTEM_USER" }), res, jest.fn());

        expect(payloadOf(res)).toEqual({ data: [], isAdmin: false });
    });
});
