const sequelizeConfig = require("../../../configs/database/index");
const {
    JOURNAL_COMMISSION,
    PARTNER_CORPORATES,
    dayKey,
    buildCommissionQuery,
    commissionReplacements,
    getCommissionTotal,
    getCommissionByDay,
    networkShareOf,
} = require("../dashboardCommission");

const TODAY = { from: "2026-10-03 00:00:00", to: "2026-10-03 23:59:59" };

const placeholdersOf = sql => [...new Set((sql.match(/:[A-Za-z]+/g) || []).map(name => name.slice(1)))].sort();

beforeEach(() => {
    jest.clearAllMocks();
    sequelizeConfig.query.mockResolvedValue([]);
});

describe("buildCommissionQuery", () => {
    it("adds up each order once, taking the journal commission excluding GST over the stored amount", () => {
        expect(buildCommissionQuery()).toBe(
            `SELECT COALESCE(SUM(COALESCE(${JOURNAL_COMMISSION}, r.storedCommission)), 0) AS commission ` +
                "FROM (SELECT corporateTxnId, SUM(totalCashback) AS storedCommission FROM reportAll " +
                "WHERE status NOT IN ('REFUND', 'REFUNDED') GROUP BY corporateTxnId) AS r " +
                "LEFT JOIN orders AS o ON o.corporateTxnId = r.corporateTxnId"
        );
    });

    it("reads the journal figure safely and only on the excluding GST basis", () => {
        expect(JOURNAL_COMMISSION).toBe(
            "CAST(NULLIF(JSON_UNQUOTE(JSON_EXTRACT(o.journalData, '$.commissionExcludingGST')), 'null') AS DECIMAL(14, 4))"
        );
        expect(buildCommissionQuery()).not.toContain("commissionIncludingGST");
    });

    it("filters the rows before grouping them per order", () => {
        const sql = buildCommissionQuery({ range: TODAY, scope: { credentialIds: [7, 8] } });

        expect(sql).toContain(
            "FROM reportAll WHERE status NOT IN ('REFUND', 'REFUNDED') AND transactionDate BETWEEN :from AND :to " +
                "AND credentialId IN (:credentialIds) GROUP BY corporateTxnId) AS r"
        );
    });

    it("dates each order by its first row and adds up per day", () => {
        const sql = buildCommissionQuery({ range: TODAY, byDay: true });

        expect(sql).toContain("SELECT corporateTxnId, DATE_FORMAT(MIN(transactionDate), '%Y-%m-%d') AS orderDate, SUM(totalCashback)");
        expect(sql.startsWith("SELECT r.orderDate AS day, COALESCE(SUM(")).toBe(true);
        expect(sql.endsWith("GROUP BY r.orderDate ORDER BY r.orderDate")).toBe(true);
    });

    it("scopes a partner by its corporates without relying on view columns", () => {
        const sql = buildCommissionQuery({ scope: { partner: { registeredBy: "77", subPartnerId: null } } });

        expect(sql).toContain(`AND ${PARTNER_CORPORATES} GROUP BY corporateTxnId`);
        expect(PARTNER_CORPORATES).toBe(
            "credentialId IN (SELECT id FROM credentials WHERE registeredBy <=> :registeredBy AND subPartnerId <=> :subPartnerId)"
        );
    });

    it("hands over exactly the values each query asks for", () => {
        const cases = [
            {},
            { range: TODAY },
            { scope: { credentialIds: [1] } },
            { range: TODAY, scope: { credentialIds: [1] } },
            { range: TODAY, scope: { partner: { registeredBy: "77" } } },
        ];
        cases.forEach(options => {
            [false, true].forEach(byDay => {
                const sql = buildCommissionQuery({ ...options, byDay });
                expect(placeholdersOf(sql)).toEqual(Object.keys(commissionReplacements(options)).sort());
            });
        });
    });

    it("turns a missing partner or sub-partner into NULL so the comparison still matches", () => {
        expect(commissionReplacements({ scope: { partner: { registeredBy: undefined } } })).toEqual({
            registeredBy: null,
            subPartnerId: null,
        });
    });
});

describe("getCommissionTotal", () => {
    it("returns the total as a number rounded to paise", async () => {
        sequelizeConfig.query.mockResolvedValue([{ commission: "1234.5678" }]);

        expect(await getCommissionTotal({ range: TODAY })).toBe(1234.57);
        expect(sequelizeConfig.query).toHaveBeenCalledWith(buildCommissionQuery({ range: TODAY }), {
            type: "SELECT",
            replacements: { from: TODAY.from, to: TODAY.to },
        });
    });

    it("reads nothing for a partner with no corporates", async () => {
        expect(await getCommissionTotal({ scope: { credentialIds: [] } })).toBe(0);
        expect(sequelizeConfig.query).not.toHaveBeenCalled();
    });

    it("reads an empty result as zero", async () => {
        expect(await getCommissionTotal()).toBe(0);
    });
});

describe("getCommissionByDay", () => {
    it("keys each day's commission by its date", async () => {
        sequelizeConfig.query.mockResolvedValue([
            { day: "2026-10-02", commission: "10.5000" },
            { day: "2026-10-03", commission: "0.0000" },
        ]);

        expect(await getCommissionByDay({ range: TODAY })).toEqual({ "2026-10-02": 10.5, "2026-10-03": 0 });
    });

    it("reads nothing for a partner with no corporates", async () => {
        expect(await getCommissionByDay({ scope: { credentialIds: [] } })).toEqual({});
        expect(sequelizeConfig.query).not.toHaveBeenCalled();
    });
});

describe("dayKey", () => {
    it("matches the date the statistics rows carry", () => {
        expect(dayKey("2026-10-03")).toBe("2026-10-03");
        expect(dayKey("2026-10-03 00:00:00")).toBe("2026-10-03");
        expect(dayKey(new Date("2026-10-03T00:00:00.000Z"))).toBe("2026-10-03");
    });
});

describe("networkShareOf", () => {
    it("takes the partner's share of the commission", () => {
        expect(networkShareOf(250, "20.0000")).toBe(50);
        expect(networkShareOf("123.45", 12.5)).toBe(15.43);
    });

    it("gives nothing when no share is set or no commission was earned", () => {
        expect(networkShareOf(250, null)).toBe(0);
        expect(networkShareOf(250, undefined)).toBe(0);
        expect(networkShareOf(null, 20)).toBe(0);
    });
});
