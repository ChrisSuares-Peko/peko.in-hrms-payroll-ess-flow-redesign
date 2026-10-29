jest.mock("../../models/use-cases/services", () => ({
    findService: jest.fn(),
    findCashBackService: jest.fn(),
    findServiceOperatorsAccessKeys: jest.fn(),
}));
jest.mock("../../models/use-cases/subCorporateUser", () => ({ findOneSubCorporate: jest.fn() }));
jest.mock("../../models/use-cases/user", () => ({ findOneByCredentialId: jest.fn() }));
jest.mock("../../models/use-cases/serviceMembership", () => ({ activeServiceLabels: jest.fn(), listMemberships: jest.fn(() => []) }));
jest.mock("../../models/use-cases/corporateUser", () => ({ findOneCorporate: jest.fn() }));
jest.mock("../../models/use-cases/partnerPermission", () => ({
    findOnePartnerPermissionData: jest.fn(),
    findPartnerInitialAccessesibleServices: jest.fn(),
    resolveServicePermissionsForSession: jest.fn(),
    updatePartnerInitialAccessesibleServices: jest.fn(),
}));
jest.mock("../../models/use-cases/subscription", () => ({ findExistingGroupPackage: jest.fn() }));
jest.mock("../../models/use-cases/cashback", () => ({ findAllUserAccessibleAccessKeys: jest.fn() }));
jest.mock("../../models/use-cases/disableService", () => ({ findDisableService: jest.fn() }));
jest.mock("../../models/use-cases/serviceApproval", () => ({ loadApprovalGate: jest.fn() }));
jest.mock("../../utils/subscriptionStatusUpdates", () => ({ subscriptionStatusUpdateForCorporate: jest.fn() }));
jest.mock("../../models/use-cases/setting", () => ({ updateInitialServicePermission: jest.fn() }));

const { accessibleServices } = require("../services");
const { findOneByCredentialId } = require("../../models/use-cases/user");
const { activeServiceLabels } = require("../../models/use-cases/serviceMembership");
const { findOneCorporate } = require("../../models/use-cases/corporateUser");
const { resolveServicePermissionsForSession } = require("../../models/use-cases/partnerPermission");
const { findExistingGroupPackage } = require("../../models/use-cases/subscription");
const { findAllUserAccessibleAccessKeys } = require("../../models/use-cases/cashback");
const { loadApprovalGate } = require("../../models/use-cases/serviceApproval");

const tree = () => [
    { label: "Dashboard", hasAccess: true, subServices: [] },
    {
        label: "Utility Payments",
        hasAccess: true,
        subServices: [
            { label: "Electricity Bill", accessKey: "bbps_utility_electricity", hasAccess: true },
            { label: "Water Bill", accessKey: "bbps_utility_water", hasAccess: true },
        ],
    },
    { label: "Logistics", accessKey: "shipment_services", hasAccess: true, enableMoreService: true, alias: "Shipping" },
    { label: "Need Help", hasAccess: true, subServices: [{ label: "Tickets", hasAccess: true }] },
];

const buildRes = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
};

const EMPLOYEE = { id: 9, role: "USER", corporateId: 42, registeredBy: "77" };

const payloadOf = res => res.json.mock.calls[0][0].data;

beforeEach(() => {
    jest.clearAllMocks();
    findOneCorporate.mockResolvedValue({ credentialId: 70 });
    resolveServicePermissionsForSession.mockResolvedValue({ id: 12, permissions: tree() });
    findOneByCredentialId.mockResolvedValue({ userAccessService: [{ label: "Utility Payments" }, { label: "Logistics" }] });
    activeServiceLabels.mockReturnValue(["Utility Payments", "Logistics"]);
    findExistingGroupPackage.mockResolvedValue({ package: { id: 3, packageName: "Growth" } });
    findAllUserAccessibleAccessKeys.mockResolvedValue(["bbps_utility_electricity", "bbps_utility_water", "shipment_services"]);
    loadApprovalGate.mockResolvedValue(new Set(["bbps_utility_water", "shipment_services"]));
});

describe("the approval gate on an employee's services", () => {
    it("asks for the employer's tree id and hides what the gate blocks before the grant is applied", async () => {
        const res = buildRes();

        await accessibleServices({ user: EMPLOYEE, headers: {} }, res, jest.fn());

        expect(resolveServicePermissionsForSession).toHaveBeenCalledWith({ registeredBy: "77", id: 70 }, ["id", "permissions"]);
        expect(loadApprovalGate).toHaveBeenCalledWith(12);
        expect(res.status).toHaveBeenCalledWith(200);

        const { data, userAccessibleServices } = payloadOf(res);
        const utilities = data.find(service => service.label === "Utility Payments");
        expect(utilities.subServices.map(service => service.label)).toEqual(["Electricity Bill"]);
        const logistics = data.find(service => service.label === "Logistics");
        expect(logistics).toMatchObject({ hasAccess: false, alias: "Shipping", enableMoreService: true });
        expect(data.some(service => service.label === "Need Help")).toBe(true);
        expect(userAccessibleServices).toEqual(["bbps_utility_electricity"]);
    });

    it("serves the employee untouched while the gate is off or unavailable", async () => {
        loadApprovalGate.mockResolvedValue(null);
        const res = buildRes();

        await accessibleServices({ user: EMPLOYEE, headers: {} }, res, jest.fn());

        const { data, userAccessibleServices } = payloadOf(res);
        expect(data.find(service => service.label === "Utility Payments").subServices).toHaveLength(2);
        expect(data.find(service => service.label === "Logistics").hasAccess).toBe(true);
        expect(userAccessibleServices).toEqual(["bbps_utility_electricity", "bbps_utility_water", "shipment_services"]);
    });
});
