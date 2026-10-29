const { Op } = require("sequelize");
const sequelizeConfig = require("../../../../configs/database/index");
const credential = require("../../../entities/credential");
const { getValue, setValue } = require("../../../../utils/cacheDataMethods");
const {
    KPIS_CACHE_KEY,
    KPIS_CACHE_TTL_SECONDS,
    SORTABLE_FIELDS,
    listSubscribers,
    findSubscriberByCredentialId,
    subscriberDisplayName,
    serializeSubscriber,
    buildSubscriberKpis,
    getSubscriberLedgerSnapshot,
} = require("../../subscriberLedger");

jest.mock("../../../../utils/cacheDataMethods", () => ({ getValue: jest.fn(), setValue: jest.fn() }));
jest.mock("../../../entities/credential", () => ({ findAll: jest.fn() }));
jest.mock("../../../entities/wallet", () => ({ findOne: jest.fn() }));
jest.mock("../../../entities/transaction", () => ({ findAndCountAll: jest.fn() }));

const NOW = new Date("2026-09-18T08:30:00.000Z");

const SUBSCRIBERS = [
    {
        credentialId: 99,
        username: "100001266",
        email: "a@alrams.in",
        registeredBy: "7",
        corporateUserId: 12,
        name: "Al Rams Trading LLP",
        contactPersonName: "Ibrahim",
        kycStatus: "verified",
        isActive: 1,
        planName: "Growth",
        walletBalance: "25000.0000",
    },
    {
        credentialId: 100,
        username: "100001267",
        email: null,
        registeredBy: null,
        corporateUserId: null,
        name: null,
        contactPersonName: "Ravi Kumar",
        kycStatus: null,
        isActive: 1,
        planName: null,
        walletBalance: "0.0000",
    },
];

const mockListQueries = () => {
    sequelizeConfig.query.mockImplementation(sql => {
        if (sql.includes("COUNT(*) AS totalCount")) return Promise.resolve([{ totalCount: "2" }]);
        return Promise.resolve(SUBSCRIBERS);
    });
    credential.findAll.mockResolvedValue([{ id: 7, name: "Gulf Reach" }]);
};

const mockKpiQueries = () => {
    sequelizeConfig.query.mockImplementation(sql => {
        if (sql.includes("COUNT(*) AS totalSubscribers")) {
            return Promise.resolve([
                { totalSubscribers: "3", walletBalancesHeld: "31250.5000", subscribersWithBalance: "2" },
            ]);
        }
        if (sql.includes("FROM transactions")) {
            return Promise.resolve([
                {
                    topUps: "612300.0000",
                    withdrawals: "500.0000",
                    purchases: "560000.0000",
                    refunds: "11879.4000",
                    cashbackEarned: "19000.0000",
                    cashbackReversed: "350.0000",
                    net: "58570.6000",
                },
            ]);
        }
        return Promise.resolve([
            { paidViaGateway: "80000.0000", platformFee: "23480.0000", gmv: "412500.2500" },
        ]);
    });
};

beforeEach(() => jest.clearAllMocks());

describe("listSubscribers", () => {
    beforeEach(mockListQueries);

    it("lists corporate credentials with their wallet, plan and partner", async () => {
        const result = await listSubscribers({ limit: 10, offset: 0, searchText: "", sort: "ASC", sortField: "name" });

        const [dataSql, replacements] = sequelizeConfig.query.mock.calls[0];
        expect(dataSql).toContain("credentials.role = 'CORPORATE'");
        expect(dataSql).toContain("corporateUsers.name, corporateUsers.contactPersonName");
        expect(dataSql).not.toContain("credentials.name");
        expect(dataSql).not.toContain("companyName");
        expect(dataSql).toContain("LEFT JOIN wallets ON wallets.credentialId = credentials.id");
        expect(dataSql).toContain("LEFT JOIN packages ON packages.id = corporateUsers.packageId");
        expect(dataSql).toContain(
            "ORDER BY COALESCE(corporateUsers.name, corporateUsers.contactPersonName, credentials.username) ASC, credentials.id ASC LIMIT :limit OFFSET :offset"
        );
        expect(dataSql).not.toContain("LIKE :searchText");
        expect(replacements.replacements).toMatchObject({ limit: 10, offset: 0 });

        expect(result.count).toBe(2);
        expect(result.rows[0].partnerName).toBe("Gulf Reach");
        expect(result.rows[1].partnerName).toBeNull();
    });

    it("looks partner names up once, by numeric id only", async () => {
        sequelizeConfig.query.mockImplementation(sql =>
            Promise.resolve(
                sql.includes("COUNT(*)")
                    ? [{ totalCount: 3 }]
                    : [...SUBSCRIBERS, { ...SUBSCRIBERS[1], credentialId: 101, registeredBy: "not-an-id" }]
            )
        );

        await listSubscribers({ limit: 10, offset: 0, searchText: "", sort: "ASC", sortField: "name" });

        expect(credential.findAll).toHaveBeenCalledTimes(1);
        expect(credential.findAll.mock.calls[0][0].where.id[Op.in]).toEqual(["7"]);
        expect(credential.findAll.mock.calls[0][0].attributes).toEqual(["id", "name"]);
    });

    it("skips the partner lookup when nobody was registered by a partner", async () => {
        sequelizeConfig.query.mockImplementation(sql =>
            Promise.resolve(sql.includes("COUNT(*)") ? [{ totalCount: 1 }] : [SUBSCRIBERS[1]])
        );

        const result = await listSubscribers({ limit: 10, offset: 0, searchText: "", sort: "ASC", sortField: "name" });

        expect(credential.findAll).not.toHaveBeenCalled();
        expect(result.rows[0].partnerName).toBeNull();
    });

    it("lists every partner's subscribers when no partner is picked", async () => {
        await listSubscribers({ limit: 10, offset: 0, searchText: "", sort: "ASC", sortField: "name" });

        const [dataSql, options] = sequelizeConfig.query.mock.calls[0];
        expect(dataSql).not.toContain("AND credentials.registeredBy");
        expect(dataSql).not.toContain("REGEXP");
        expect(options.replacements).not.toHaveProperty("partnerId");
    });

    it("narrows the list, and its count, to the partner picked", async () => {
        await listSubscribers({ limit: 10, offset: 0, searchText: "", sort: "ASC", sortField: "name", partnerId: 55 });

        sequelizeConfig.query.mock.calls.forEach(([sql, options]) => {
            expect(sql).toContain("AND credentials.registeredBy = :partnerId");
            expect(options.replacements.partnerId).toBe("55");
        });
        expect(sequelizeConfig.query.mock.calls.some(([sql]) => sql.includes("COUNT(*)"))).toBe(true);
    });

    it("lists only the subscribers Peko signed up itself when Default is picked", async () => {
        await listSubscribers({
            limit: 10,
            offset: 0,
            searchText: "",
            sort: "ASC",
            sortField: "name",
            partnerId: "default",
        });

        sequelizeConfig.query.mock.calls.forEach(([sql, options]) => {
            expect(sql).toContain("credentials.registeredBy IS NULL OR credentials.registeredBy NOT REGEXP '^[0-9]+$'");
            expect(sql).not.toContain(":partnerId");
            expect(options.replacements).not.toHaveProperty("partnerId");
        });
    });

    it("keeps the search and the partner together", async () => {
        await listSubscribers({
            limit: 10,
            offset: 0,
            searchText: "rams",
            sort: "ASC",
            sortField: "name",
            partnerId: 55,
        });

        const [dataSql] = sequelizeConfig.query.mock.calls[0];
        expect(dataSql).toContain("corporateUsers.name LIKE :searchText");
        expect(dataSql).toContain("AND credentials.registeredBy = :partnerId");
    });

    it("searches the record name, contact person, account id and email", async () => {
        await listSubscribers({ limit: 10, offset: 20, searchText: "rams", sort: "DESC", sortField: "walletBalance" });

        const [dataSql, options] = sequelizeConfig.query.mock.calls[0];
        expect(dataSql).toContain("corporateUsers.name LIKE :searchText");
        expect(dataSql).toContain("corporateUsers.contactPersonName LIKE :searchText");
        expect(dataSql).toContain("credentials.username LIKE :searchText");
        expect(dataSql).toContain("credentials.email LIKE :searchText");
        expect(dataSql).toContain("ORDER BY walletBalance DESC");
        expect(options.replacements.searchText).toBe("%rams%");
        expect(options.replacements.offset).toBe(20);
    });

    it("falls back to the display name when the sort field is not allowed", async () => {
        await listSubscribers({ limit: 10, offset: 0, searchText: "", sort: "ASC", sortField: "password" });

        expect(sequelizeConfig.query.mock.calls[0][0]).toContain(
            "ORDER BY COALESCE(corporateUsers.name, corporateUsers.contactPersonName, credentials.username) ASC"
        );
        expect(SORTABLE_FIELDS).toEqual(["name", "username", "walletBalance", "isActive", "createdAt"]);
    });
});

describe("findSubscriberByCredentialId", () => {
    it("returns null for an unknown or non corporate id", async () => {
        sequelizeConfig.query.mockResolvedValue([]);

        expect(await findSubscriberByCredentialId(404)).toBeNull();
        expect(sequelizeConfig.query.mock.calls[0][0]).toContain("credentials.id = :credentialId");
        expect(sequelizeConfig.query.mock.calls[0][1].replacements).toEqual({ credentialId: 404 });
    });

    it("returns the row with its partner name", async () => {
        sequelizeConfig.query.mockResolvedValue([SUBSCRIBERS[0]]);
        credential.findAll.mockResolvedValue([{ id: 7, name: "Gulf Reach" }]);

        expect(await findSubscriberByCredentialId(99)).toMatchObject({
            credentialId: 99,
            partnerName: "Gulf Reach",
        });
    });
});

describe("serializeSubscriber", () => {
    it("shapes a list row with the raw record fields", () => {
        expect(serializeSubscriber({ ...SUBSCRIBERS[0], partnerName: "Gulf Reach" })).toEqual({
            id: 99,
            credentialId: 99,
            corporateUserId: 12,
            name: "Al Rams Trading LLP",
            contactPersonName: "Ibrahim",
            username: "100001266",
            email: "a@alrams.in",
            partnerName: "Gulf Reach",
            planName: "Growth",
            kycStatus: "verified",
            isActive: true,
            walletBalance: 25000,
        });
    });

    it("leaves a missing record name null instead of inventing one", () => {
        const row = serializeSubscriber(SUBSCRIBERS[1]);
        expect(row.name).toBeNull();
        expect(row.contactPersonName).toBe("Ravi Kumar");
        expect(row.username).toBe("100001267");
        expect(row).not.toHaveProperty("companyName");
        expect(serializeSubscriber({ ...SUBSCRIBERS[1], contactPersonName: "" }).contactPersonName).toBeNull();
        expect(row.corporateUserId).toBeNull();
    });

    it("resolves a display name through the record name, contact person and account id", () => {
        expect(subscriberDisplayName(SUBSCRIBERS[0])).toBe("Al Rams Trading LLP");
        expect(subscriberDisplayName(SUBSCRIBERS[1])).toBe("Ravi Kumar");
        expect(subscriberDisplayName({ ...SUBSCRIBERS[1], contactPersonName: null })).toBe("100001267");
    });

    it("reads the active flag as a number or a boolean and prefers the summary balance", () => {
        expect(serializeSubscriber({ ...SUBSCRIBERS[0], isActive: 0 }).isActive).toBe(false);
        expect(serializeSubscriber({ ...SUBSCRIBERS[0], isActive: true }).isActive).toBe(true);
        expect(serializeSubscriber(SUBSCRIBERS[0], { walletBalance: 12.5 }).walletBalance).toBe(12.5);
    });
});

describe("buildSubscriberKpis", () => {
    beforeEach(mockKpiQueries);

    it("aggregates the list metrics in IST month to date", async () => {
        const snapshot = await buildSubscriberKpis(NOW);

        expect(snapshot.generatedAt).toBe("2026-09-18T08:30:00.000Z");
        expect(snapshot.kpis).toEqual({
            totalSubscribers: 3,
            walletBalancesHeld: 31250.5,
            subscribersWithBalance: 2,
            gmvThisMonth: 412500.25,
            spentThisMonth: 548120.6,
            platformFeeThisMonth: 23480,
            cashbackThisMonth: 18650,
        });
    });

    it("adds up GMV as what the customer paid plus the coupon, falling back to the amount charged", async () => {
        await buildSubscriberKpis(NOW);

        const [orderSql] = sequelizeConfig.query.mock.calls.find(([sql]) => sql.includes("FROM orders"));
        expect(orderSql).toContain("'$.paymentThroughGateway'");
        expect(orderSql).toContain("'$.paymentThroughWallet'");
        expect(orderSql).toContain("'$.couponTotalDiscount'");
        expect(orderSql).toContain("ELSE orders.amountInINR END), 0) AS gmv");
        expect(orderSql).not.toContain("totalTransactionAmount");
    });

    it("restricts every month figure to corporate wallets so admin mirror rows never count", async () => {
        await buildSubscriberKpis(NOW);

        const monthCalls = sequelizeConfig.query.mock.calls.filter(([sql]) => sql.includes("BETWEEN :from AND :to"));
        expect(monthCalls).toHaveLength(2);
        monthCalls.forEach(([sql, options]) => {
            expect(sql).toContain("INNER JOIN credentials ON credentials.id");
            expect(sql).toContain("credentials.role = 'CORPORATE'");
            expect(options.replacements).toEqual({
                from: "2026-09-01 00:00:00",
                to: "2026-09-18 23:59:59",
                accountingFloor: "9999-12-31",
            });
        });
    });

    it("floors the order figure at go-live and leaves the wallet figures whole", async () => {
        await buildSubscriberKpis(NOW);

        const [orderSql] = sequelizeConfig.query.mock.calls.find(([sql]) => sql.includes("FROM orders"));
        const [walletSql] = sequelizeConfig.query.mock.calls.find(([sql]) =>
            sql.includes("FROM transactions")
        );

        expect(orderSql).toContain("DATE(orders.transactionDate) > :accountingFloor");
        expect(walletSql).not.toContain(":accountingFloor");
    });

    it("counts platform fee and gateway share on successful orders, fee falling back to the surcharge", async () => {
        await buildSubscriberKpis(NOW);

        const [orderSql] = sequelizeConfig.query.mock.calls.find(([sql]) => sql.includes("FROM orders"));
        expect(orderSql).toContain("orders.status = 'SUCCESS'");
        expect(orderSql).not.toContain("orders.journalData IS NOT NULL");
        expect(orderSql).toContain("'$.platformFeeIncludingGST'");
        expect(orderSql).toContain(", orders.surcharge)");
    });
});

describe("getSubscriberLedgerSnapshot", () => {
    beforeEach(() => {
        mockKpiQueries();
        getValue.mockResolvedValue(null);
        setValue.mockResolvedValue(undefined);
    });

    it("serves the cached figures without touching the database", async () => {
        getValue.mockResolvedValue(JSON.stringify({ generatedAt: "x", kpis: { totalSubscribers: 1 } }));

        const result = await getSubscriberLedgerSnapshot({});

        expect(result).toEqual({ generatedAt: "x", kpis: { totalSubscribers: 1 }, cached: true });
        expect(sequelizeConfig.query).not.toHaveBeenCalled();
    });

    it("computes and caches for five minutes when empty", async () => {
        const result = await getSubscriberLedgerSnapshot();

        expect(result.cached).toBe(false);
        expect(result.kpis.totalSubscribers).toBe(3);
        expect(setValue).toHaveBeenCalledWith(KPIS_CACHE_KEY, KPIS_CACHE_TTL_SECONDS, expect.any(String));
        expect(KPIS_CACHE_KEY).toBe("accounting:subscriber-balances:v2");
        expect(KPIS_CACHE_TTL_SECONDS).toBe(300);
    });

    it("bypasses the cache on refresh and survives a redis outage", async () => {
        getValue.mockRejectedValue(new Error("redis down"));
        setValue.mockRejectedValue(new Error("redis down"));

        expect((await getSubscriberLedgerSnapshot({ refresh: true })).cached).toBe(false);
        expect(getValue).not.toHaveBeenCalled();
        expect((await getSubscriberLedgerSnapshot({})).cached).toBe(false);
    });
});
