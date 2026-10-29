const { getInternalAccounts } = require("../setting");
const {
    ACCOUNT_SCOPES,
    ACCOUNT_SCOPE_IDS,
    accountScopeOf,
    loadInternalAccountIds,
    resolveAccountIds,
    accountScopeClause,
    withAccountScope,
    accountScopeLabel,
} = require("../internalAccounts");

jest.mock("../setting", () => ({ getInternalAccounts: jest.fn() }));

beforeEach(() => {
    jest.clearAllMocks();
});

describe("the internal purchase account scope", () => {
    it("knows only all and internal, and reads anything else as all", () => {
        expect(ACCOUNT_SCOPES).toEqual({ all: "all", internal: "internal" });
        expect(accountScopeOf("internal")).toBe("internal");
        expect(accountScopeOf(" internal ")).toBe("internal");
        expect(accountScopeOf("all")).toBe("all");
        expect(accountScopeOf("bogus")).toBe("all");
        expect(accountScopeOf(undefined)).toBe("all");
    });

    it("reads the internal accounts off the setting as unique positive ids", async () => {
        getInternalAccounts.mockResolvedValue(["12", 15, 15, "x", 0, -3, null]);

        expect(await loadInternalAccountIds()).toEqual([12, 15]);
    });

    it("reads an unset or malformed setting as no internal accounts", async () => {
        getInternalAccounts.mockResolvedValue(null);
        expect(await loadInternalAccountIds()).toEqual([]);

        getInternalAccounts.mockResolvedValue("12,15");
        expect(await loadInternalAccountIds()).toEqual([]);
    });

    it("resolves the ids only for the internal scope", async () => {
        getInternalAccounts.mockResolvedValue([12]);

        expect(await resolveAccountIds("internal")).toEqual([12]);
        expect(await resolveAccountIds("all")).toBeNull();
        expect(await resolveAccountIds(undefined)).toBeNull();
        expect(getInternalAccounts).toHaveBeenCalledTimes(1);
    });

    it("narrows a query to the ids, and to nothing at all when none is configured", () => {
        expect(accountScopeClause("orders.credentialId", [12, 15])).toBe(`orders.credentialId IN (:${ACCOUNT_SCOPE_IDS})`);
        expect(accountScopeClause("orders.credentialId", [])).toBe("1 = 0");
    });

    it("binds the ids only when there are some to bind", () => {
        expect(withAccountScope({ from: "a" }, [12, 15])).toEqual({ from: "a", [ACCOUNT_SCOPE_IDS]: [12, 15] });
        expect(withAccountScope({ from: "a" }, [])).toEqual({ from: "a" });
        expect(withAccountScope({ from: "a" }, null)).toEqual({ from: "a" });
    });

    it("names the scope on an export only when one is applied", () => {
        expect(accountScopeLabel([12])).toBe("Accounts: Internal purchase accounts");
        expect(accountScopeLabel([])).toBe("Accounts: Internal purchase accounts");
        expect(accountScopeLabel(null)).toBeNull();
    });
});
