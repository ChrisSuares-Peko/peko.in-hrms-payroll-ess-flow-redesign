const sequelizeConfig = require("../../../configs/database/index");
const PaymentLinkOnboarding = require("../../entities/paymentLinkOnboarding");
const { getASetting, upsertSetting } = require("../setting");
const { auditSettingChange } = require("../../../utils/auditHooks");
const { PAYMENT_LINK_CHARGE_AUDIT } = require("../../../utils/auditedModels");
const {
    DEFAULT_CHARGE_SETTING,
    CHARGE_SCOPES,
    buildListQuery,
    buildCountQuery,
    effectiveOf,
    serializeCharge,
    serializeCorporate,
    getDefaultCharge,
    setDefaultCharge,
    setCorporateCharge,
    removeCorporateCharge,
    listPaymentLinkCorporates,
} = require("../paymentLinkCharges");

jest.mock("../setting", () => ({ getASetting: jest.fn(), upsertSetting: jest.fn() }));
jest.mock("../../../utils/auditHooks", () => ({ auditSettingChange: jest.fn() }));

const STORED_DEFAULT = { percentage: 1.5, fixed: 3, setBy: "Asha", setById: 5, setAt: "2026-10-28T06:00:00.000Z" };

const DEFAULT_CHARGE = { percentage: 1.5, fixed: 3, updatedAt: "2026-10-28T06:00:00.000Z", recordedByName: "Asha" };

const CUSTOM_STORED = { percentage: 0.9, fixed: 0, setBy: "Ravi", setById: 6, setAt: "2026-10-27T10:00:00.000Z" };

const CORPORATE_ROW = {
    credentialId: "99",
    name: "Acme Traders",
    username: "acme",
    registeredBy: "100002226",
    onboardingStatus: "active",
    provider: "nupay",
    activatedAt: "2026-09-01T00:00:00.000Z",
    accountingCharge: JSON.stringify(CUSTOM_STORED),
};

const DEFAULT_ONLY_ROW = {
    ...CORPORATE_ROW,
    credentialId: "100",
    name: "Beta Stores",
    username: "beta",
    onboardingStatus: "approval-pending",
    provider: "decentro",
    activatedAt: null,
    accountingCharge: null,
};

const ACTOR = { id: 5, name: "Asha" };

describe("payment link charge queries", () => {
    it("lists the latest onboarding of every corporate, custom charges first", () => {
        const sql = buildListQuery({ scope: CHARGE_SCOPES.all, searchText: "", sort: "ASC", sortField: "corporate", limit: 10 });

        expect(sql).toContain("FROM paymentLinkOnboardings onboarding INNER JOIN credentials ON credentials.id = onboarding.credentialId");
        expect(sql).toContain("WHERE onboarding.id IN (SELECT MAX(id) FROM paymentLinkOnboardings GROUP BY credentialId)");
        expect(sql).toContain("onboarding.accountingCharge AS accountingCharge");
        expect(sql).toContain(
            "ORDER BY (onboarding.accountingCharge IS NULL) ASC, credentials.name ASC, credentials.id ASC LIMIT :limit OFFSET :offset"
        );
        expect(sql).not.toContain("IS NOT NULL");
    });

    it("keeps only the corporates with a custom charge when asked, and searches name or login", () => {
        const sql = buildListQuery({ scope: CHARGE_SCOPES.custom, searchText: "acme", sort: "DESC", sortField: "updatedAt" });

        expect(sql).toContain(
            "AND onboarding.accountingCharge IS NOT NULL AND (credentials.name LIKE :searchText OR credentials.username LIKE :searchText)"
        );
        expect(sql).toContain("JSON_UNQUOTE(JSON_EXTRACT(onboarding.accountingCharge, '$.setAt')) DESC");
        expect(sql).not.toContain("LIMIT :limit");
    });

    it("falls back to the corporate name for an unknown sort field", () => {
        expect(buildListQuery({ scope: CHARGE_SCOPES.all, searchText: "", sort: "ASC", sortField: "nope" })).toContain(
            "credentials.name ASC"
        );
    });

    it("counts the rows listed and how many carry a custom charge", () => {
        const sql = buildCountQuery({ scope: CHARGE_SCOPES.all, searchText: "" });

        expect(sql).toContain(
            "SELECT COUNT(*) AS total, SUM(CASE WHEN onboarding.accountingCharge IS NULL THEN 0 ELSE 1 END) AS customTotal"
        );
        expect(sql).toContain("WHERE onboarding.id IN (SELECT MAX(id) FROM paymentLinkOnboardings GROUP BY credentialId)");
    });
});

describe("serializers", () => {
    it("reads a stored charge, as text or as an object, with who set it", () => {
        expect(serializeCharge(STORED_DEFAULT)).toEqual(DEFAULT_CHARGE);
        expect(serializeCharge(JSON.stringify(STORED_DEFAULT))).toEqual(DEFAULT_CHARGE);
        expect(serializeCharge(null)).toBeNull();
        expect(serializeCharge("{broken")).toBeNull();
        expect(serializeCharge({ setBy: "x" })).toBeNull();
    });

    it("applies the corporate's own charge before the default, and says when neither exists", () => {
        const custom = serializeCharge(CUSTOM_STORED);

        expect(effectiveOf(custom, DEFAULT_CHARGE)).toEqual({ percentage: 0.9, fixed: 0, source: "custom" });
        expect(effectiveOf(null, DEFAULT_CHARGE)).toEqual({ percentage: 1.5, fixed: 3, source: "default" });
        expect(effectiveOf(null, null)).toEqual({ percentage: null, fixed: null, source: "none" });
    });

    it("shapes a corporate row with its onboarding and charge", () => {
        expect(serializeCorporate(CORPORATE_ROW, DEFAULT_CHARGE)).toEqual({
            credentialId: 99,
            corporate: { name: "Acme Traders", username: "acme", partnerId: "100002226" },
            onboarding: { status: "active", provider: "nupay", activatedAt: "2026-09-01T00:00:00.000Z" },
            charge: { percentage: 0.9, fixed: 0, updatedAt: "2026-10-27T10:00:00.000Z", recordedByName: "Ravi" },
            effective: { percentage: 0.9, fixed: 0, source: "custom" },
        });
        expect(serializeCorporate(DEFAULT_ONLY_ROW, null)).toEqual(
            expect.objectContaining({
                onboarding: { status: "approval-pending", provider: "decentro", activatedAt: null },
                charge: null,
                effective: { percentage: null, fixed: null, source: "none" },
            })
        );
    });
});

describe("writes", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        PaymentLinkOnboarding.findOne.mockReset();
        PaymentLinkOnboarding.update.mockReset();
        sequelizeConfig.query.mockReset();
        getASetting.mockReset();
        upsertSetting.mockReset();
    });

    it("reads the default charge off its settings row", async () => {
        getASetting.mockResolvedValue(STORED_DEFAULT);

        expect(await getDefaultCharge()).toEqual(DEFAULT_CHARGE);
        expect(getASetting).toHaveBeenCalledWith(DEFAULT_CHARGE_SETTING);

        getASetting.mockResolvedValue(false);
        expect(await getDefaultCharge()).toBeNull();
    });

    it("saves the default charge on its settings row, names who set it and audits the change", async () => {
        getASetting.mockResolvedValue({ percentage: 1, fixed: 2, setBy: "Ravi" });
        upsertSetting.mockImplementation(async (name, details) => details);
        sequelizeConfig.query.mockResolvedValue([{ id: 41 }]);

        const saved = await setDefaultCharge({ percentage: "1.50004", fixed: "3.004" }, ACTOR);

        expect(upsertSetting).toHaveBeenCalledWith(
            DEFAULT_CHARGE_SETTING,
            expect.objectContaining({ percentage: 1.5, fixed: 3, setBy: "Asha", setById: 5, setAt: expect.any(String) })
        );
        expect(auditSettingChange).toHaveBeenCalledWith({
            sequelize: sequelizeConfig,
            spec: PAYMENT_LINK_CHARGE_AUDIT,
            id: 41,
            accessKey: null,
            name: "Default payment link charge",
            before: { percentage: 1, fixed: 2 },
            after: { percentage: 1.5, fixed: 3 },
        });
        expect(saved).toEqual(expect.objectContaining({ percentage: 1.5, fixed: 3, recordedByName: "Asha" }));
    });

    it("answers null when the settings row could not be written", async () => {
        getASetting.mockResolvedValue(false);
        upsertSetting.mockResolvedValue(false);

        expect(await setDefaultCharge({ percentage: 1, fixed: 0 }, ACTOR)).toBeNull();
        expect(auditSettingChange).not.toHaveBeenCalled();
    });

    it("records a corporate's own charge on its latest onboarding row only", async () => {
        PaymentLinkOnboarding.findOne.mockResolvedValueOnce(null);

        expect(await setCorporateCharge(99, { percentage: 0.9, fixed: 0 }, ACTOR)).toBeNull();
        expect(PaymentLinkOnboarding.findOne).toHaveBeenCalledWith({
            where: { credentialId: 99 },
            order: [["id", "DESC"]],
            raw: true,
        });
        expect(PaymentLinkOnboarding.update).not.toHaveBeenCalled();

        PaymentLinkOnboarding.findOne.mockResolvedValueOnce({ id: 12, credentialId: 99, accountingCharge: null });
        sequelizeConfig.query.mockResolvedValueOnce([{ id: 99, name: "Acme Traders", username: "acme", registeredBy: null }]);

        const saved = await setCorporateCharge(99, { percentage: 0.9, fixed: 0 }, ACTOR);

        expect(PaymentLinkOnboarding.update).toHaveBeenCalledWith(
            {
                accountingCharge: expect.objectContaining({
                    percentage: 0.9,
                    fixed: 0,
                    setBy: "Asha",
                    setById: 5,
                    setAt: expect.any(String),
                }),
            },
            { where: { id: 12 } }
        );
        expect(sequelizeConfig.query.mock.calls[0][0]).toContain("FROM credentials WHERE id = :credentialId LIMIT 1");
        expect(saved).toEqual({
            credentialId: 99,
            corporate: { name: "Acme Traders", username: "acme", partnerId: null },
            charge: expect.objectContaining({ percentage: 0.9, fixed: 0, recordedByName: "Asha" }),
        });
    });

    it("clears a corporate's own charge, and says when there was none", async () => {
        PaymentLinkOnboarding.findOne
            .mockResolvedValueOnce({ id: 12, credentialId: 99, accountingCharge: JSON.stringify(CUSTOM_STORED) })
            .mockResolvedValueOnce({ id: 13, credentialId: 100, accountingCharge: null })
            .mockResolvedValueOnce(null);

        expect(await removeCorporateCharge(99)).toBe(true);
        expect(PaymentLinkOnboarding.update).toHaveBeenCalledWith({ accountingCharge: null }, { where: { id: 12 } });

        expect(await removeCorporateCharge(100)).toBe(false);
        expect(await removeCorporateCharge(101)).toBe(false);
        expect(PaymentLinkOnboarding.update).toHaveBeenCalledTimes(1);
    });

    it("lists the corporates with the default charge and the counts beside them", async () => {
        getASetting.mockResolvedValue(STORED_DEFAULT);
        sequelizeConfig.query
            .mockResolvedValueOnce([CORPORATE_ROW, DEFAULT_ONLY_ROW])
            .mockResolvedValueOnce([{ total: "2", customTotal: "1" }]);

        const result = await listPaymentLinkCorporates({
            scope: CHARGE_SCOPES.all,
            searchText: "a",
            sort: "ASC",
            sortField: "corporate",
            limit: 10,
            offset: 10,
        });

        const [listSql, listOptions] = sequelizeConfig.query.mock.calls[0];
        expect(listSql).toContain("LIMIT :limit OFFSET :offset");
        expect(listOptions.replacements).toEqual({ searchText: "%a%", limit: 10, offset: 10 });
        const [countSql, countOptions] = sequelizeConfig.query.mock.calls[1];
        expect(countSql).toContain("COUNT(*) AS total");
        expect(countOptions.replacements).toEqual({ searchText: "%a%" });

        expect(result.defaultCharge).toEqual(DEFAULT_CHARGE);
        expect(result.count).toBe(2);
        expect(result.customCount).toBe(1);
        expect(result.rows.map(row => row.effective.source)).toEqual(["custom", "default"]);
    });
});
