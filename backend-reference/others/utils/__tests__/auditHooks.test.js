const express = require("express");
const { Sequelize, DataTypes } = require("sequelize");

jest.mock("../../models/use-cases/configAuditLog", () => ({ saveAuditEntries: jest.fn() }));

const logger = require("../logger");
const { saveAuditEntries } = require("../../models/use-cases/configAuditLog");
const { registerAuditHooks, auditRawUpdate } = require("../auditHooks");
const { bindRequestContext } = require("../requestContext");
const { AUDITED_TABLES } = require("../auditedModels");

const sequelize = new Sequelize("db", "user", "pass", { dialect: "mysql", logging: false });
registerAuditHooks(sequelize);

const Cashback = sequelize.define("cashback", {
    serviceOperatorId: DataTypes.BIGINT,
    packageId: DataTypes.BIGINT,
    surchargeType: DataTypes.STRING,
    surcharge: DataTypes.DECIMAL(10, 2),
    isSurchargeConfigured: DataTypes.BOOLEAN,
    cashbackType: DataTypes.STRING,
    cashback: DataTypes.STRING,
    serviceStatus: DataTypes.BOOLEAN,
    unitPrice: DataTypes.DECIMAL(10, 2),
    baseLimit: DataTypes.DECIMAL(10, 2),
});
const Other = sequelize.define("other", { name: DataTypes.STRING });
const Package = sequelize.define("package", { packageName: DataTypes.STRING, status: DataTypes.BOOLEAN });

const cashbackRow = (id, overrides = {}) => ({
    id,
    surchargeType: "FLAT",
    surcharge: "2.00",
    isSurchargeConfigured: 0,
    cashbackType: "PERCENTAGE",
    cashback: "1",
    serviceStatus: 1,
    unitPrice: null,
    baseLimit: null,
    ...overrides,
});

const described = (id, name = "Basic", parent = "Peko Go", partner = null) => ({ id, name, parent, partner });

let selects;
let describes;

const textOf = sql => (typeof sql === "string" ? sql : sql.query);

sequelize.query = jest.fn(async (sql, options = {}) => {
    const text = textOf(sql);
    if (/^UPDATE/i.test(text)) return options.instance ? [options.instance, 1] : 1;
    if (/^DELETE/i.test(text)) return 1;
    if (/^INSERT/i.test(text)) {
        options.instance.dataValues.id = 55;
        return [options.instance, 1];
    }
    if (options.replacements && options.replacements.ids) return describes;
    const rows = selects.shift();
    if (rows instanceof Error) throw rows;
    return options.model && !options.raw ? options.model.bulkBuild(rows, { isNewRecord: false, raw: true }) : rows;
});

const verbs = () => sequelize.query.mock.calls.map(([sql]) => textOf(sql).split(" ")[0]);

const inRequest = callback =>
    bindRequestContext(
        { headers: { "x-app-source": "accounting-portal", "x-client-ip": "203.0.113.7" }, user: { id: 9 } },
        {},
        callback
    );

beforeEach(() => {
    jest.clearAllMocks();
    saveAuditEntries.mockResolvedValue();
    selects = [];
    describes = [];
});

afterAll(() => sequelize.close());

describe("the audited table names match what Sequelize derives from the models", () => {
    it.each([
        ["serviceOperators", "serviceOperators"],
        ["vendors", "vendors"],
        ["cashback", "cashbacks"],
        ["package", "packages"],
        ["mobileRechargeProviders", "mobileRechargeProviders"],
        ["plans", "plans"],
        ["systemUser", "systemUsers"],
    ])("model %s is audited as table %s", (modelName, table) => {
        const naming = new Sequelize("db", "user", "pass", { dialect: "mysql", logging: false });

        expect(naming.define(modelName, { name: DataTypes.STRING }).tableName).toBe(table);
        expect(AUDITED_TABLES[table]).toBeDefined();
    });
});

describe("a bulk update of an audited table", () => {
    it("saves one entry per changed group, naming who, what and where from", async () => {
        selects = [[cashbackRow(7)], [cashbackRow(7, { surcharge: "5.00", isSurchargeConfigured: 1 })]];
        describes = [described(7)];

        await inRequest(() => Cashback.update({ surcharge: 5, isSurchargeConfigured: true }, { where: { id: 7 } }));

        expect(verbs()).toEqual(["SELECT", "UPDATE", "SELECT", "SELECT"]);
        expect(sequelize.query.mock.calls[0][0]).toMatch(/FROM `cashbacks`/);
        expect(sequelize.query.mock.calls[0][0]).toMatch(/`id` = 7/);
        expect(saveAuditEntries).toHaveBeenCalledTimes(1);
        expect(saveAuditEntries.mock.calls[0][0]).toEqual([
            {
                actorId: 9,
                source: "ACCOUNTING_PORTAL",
                configType: "PLATFORM_FEE",
                action: "UPDATE",
                targetTable: "cashbacks",
                targetId: 7,
                targetLabel: "Peko Go › Basic",
                partnerName: null,
                ipAddress: "203.0.113.7",
                changes: [
                    { field: "surcharge", from: 2, to: 5 },
                    { field: "isSurchargeConfigured", from: false, to: true },
                ],
            },
        ]);
    });

    it("names the partner a setting belongs to", async () => {
        selects = [[cashbackRow(7)], [cashbackRow(7, { surcharge: "5.00" })]];
        describes = [described(7, "Basic", "Peko Go", "Cent Saarthi")];

        await inRequest(() => Cashback.update({ surcharge: 5 }, { where: { id: 7 } }));

        expect(saveAuditEntries.mock.calls[0][0][0]).toMatchObject({
            targetLabel: "Peko Go › Basic",
            partnerName: "Cent Saarthi",
        });
    });

    it("splits one save across the groups it touched", async () => {
        selects = [
            [cashbackRow(7)],
            [cashbackRow(7, { surcharge: "3.00", cashback: "4", unitPrice: "9.00" })],
        ];
        describes = [described(7)];

        await inRequest(() => Cashback.update({ surcharge: 3, cashback: "4", unitPrice: 9 }, { where: { id: 7 } }));

        const entries = saveAuditEntries.mock.calls[0][0];
        expect(entries.map(entry => entry.configType)).toEqual(["PLATFORM_FEE", "CASHBACK", "SUBSCRIPTION_ADDON"]);
    });

    it("writes one entry for each changed row of a bulk save and none for an unchanged one", async () => {
        selects = [
            [cashbackRow(1), cashbackRow(2), cashbackRow(3, { surcharge: "5.00" })],
            [cashbackRow(1, { surcharge: "5.00" }), cashbackRow(2, { surcharge: "5.00" }), cashbackRow(3, { surcharge: "5.00" })],
        ];
        describes = [described(1), described(2, "Plus")];

        await inRequest(() => Cashback.update({ surcharge: 5 }, { where: { id: [1, 2, 3] } }));

        const entries = saveAuditEntries.mock.calls[0][0];
        expect(entries.map(entry => entry.targetId)).toEqual([1, 2]);
        expect(entries.map(entry => entry.targetLabel)).toEqual(["Peko Go › Basic", "Peko Go › Plus"]);
    });

    it("records an update made one row at a time once, not twice", async () => {
        selects = [[cashbackRow(7)], [cashbackRow(7)], [cashbackRow(7, { surcharge: "5.00" })]];
        describes = [described(7)];

        await inRequest(() => Cashback.update({ surcharge: 5 }, { where: { id: 7 }, individualHooks: true }));

        expect(saveAuditEntries).toHaveBeenCalledTimes(1);
        expect(saveAuditEntries.mock.calls[0][0]).toEqual([
            expect.objectContaining({ configType: "PLATFORM_FEE", targetId: 7, changes: [{ field: "surcharge", from: 2, to: 5 }] }),
        ]);
    });

    it("saves nothing when the values are the same, though written in another form", async () => {
        selects = [[cashbackRow(7)], [cashbackRow(7, { surcharge: "2.0000", isSurchargeConfigured: false })]];

        await inRequest(() => Cashback.update({ surcharge: 2 }, { where: { id: 7 } }));

        expect(saveAuditEntries).not.toHaveBeenCalled();
        expect(verbs()).toEqual(["SELECT", "UPDATE", "SELECT"]);
    });

    it("reads nothing when the update touches no tracked column", async () => {
        await inRequest(() => Cashback.update({ packageId: 3 }, { where: { id: 7 } }));

        expect(verbs()).toEqual(["UPDATE"]);
        expect(saveAuditEntries).not.toHaveBeenCalled();
    });

    it("leaves other models alone", async () => {
        await inRequest(() => Other.update({ name: "x" }, { where: { id: 1 } }));

        expect(verbs()).toEqual(["UPDATE"]);
    });

    it("logs nothing outside a request, such as a script or a queue job", async () => {
        await Cashback.update({ surcharge: 5 }, { where: { id: 7 } });

        expect(verbs()).toEqual(["UPDATE"]);
        expect(saveAuditEntries).not.toHaveBeenCalled();
    });

    it("keeps the change when the entry cannot be saved", async () => {
        selects = [[cashbackRow(7)], [cashbackRow(7, { surcharge: "5.00" })]];
        describes = [described(7)];
        saveAuditEntries.mockRejectedValue(new Error("db down"));

        const result = await inRequest(() => Cashback.update({ surcharge: 5 }, { where: { id: 7 } }));

        expect(result).toEqual([1]);
        expect(logger.error).toHaveBeenCalledWith(
            "Configuration audit entries could not be saved",
            expect.objectContaining({ count: 1 })
        );
    });

    it("keeps the change when the rows cannot be read first", async () => {
        selects = [new Error("read failed")];

        const result = await inRequest(() => Cashback.update({ surcharge: 5 }, { where: { id: 7 } }));

        expect(result).toEqual([1]);
        expect(verbs()).toEqual(["SELECT", "UPDATE"]);
        expect(saveAuditEntries).not.toHaveBeenCalled();
        expect(logger.error).toHaveBeenCalled();
    });

    it("falls back to the table and id when the rows cannot be named", async () => {
        selects = [[cashbackRow(7)], [cashbackRow(7, { surcharge: "5.00" })]];
        describes = [];

        await inRequest(() => Cashback.update({ surcharge: 5 }, { where: { id: 7 } }));

        expect(saveAuditEntries.mock.calls[0][0][0]).toMatchObject({ targetLabel: "cashbacks #7" });
    });

    describe("inside a transaction", () => {
        // A class instance, as Sequelize's own transaction is, so the options clone keeps the reference.
        class FakeTransaction {
            constructor() {
                this.callbacks = [];
                this.afterCommit = jest.fn(callback => this.callbacks.push(callback));
            }

            async commit() {
                await Promise.all(this.callbacks.map(callback => callback()));
            }
        }

        const transactionWithHooks = () => new FakeTransaction();

        it("reads and saves with the transaction, and only once it commits", async () => {
            selects = [[cashbackRow(7)], [cashbackRow(7, { surcharge: "5.00" })]];
            describes = [described(7)];
            const transaction = transactionWithHooks();

            await inRequest(() => Cashback.update({ surcharge: 5 }, { where: { id: 7 }, transaction }));

            expect(sequelize.query.mock.calls[0][1].transaction).toBe(transaction);
            expect(saveAuditEntries).not.toHaveBeenCalled();

            await transaction.commit();

            expect(saveAuditEntries).toHaveBeenCalledTimes(1);
        });

        it("leaves no entry when the transaction never commits", async () => {
            selects = [[cashbackRow(7)], [cashbackRow(7, { surcharge: "5.00" })]];
            describes = [described(7)];
            const transaction = transactionWithHooks();

            await inRequest(() => Cashback.update({ surcharge: 5 }, { where: { id: 7 }, transaction }));

            expect(transaction.afterCommit).toHaveBeenCalledTimes(1);
            expect(saveAuditEntries).not.toHaveBeenCalled();
        });
    });
});

describe("creating a row", () => {
    it("records a created cashback as one entry listing the values it holds", async () => {
        describes = [described(55)];

        await inRequest(() =>
            Cashback.create({ serviceOperatorId: 4, surchargeType: "FLAT", surcharge: 6, isSurchargeConfigured: true })
        );

        const [entry] = saveAuditEntries.mock.calls[0][0];
        expect(entry).toMatchObject({ configType: "CASHBACK", action: "CREATE", targetId: 55, targetLabel: "Peko Go › Basic" });
        expect(entry.changes).toEqual(
            expect.arrayContaining([
                { field: "surcharge", from: null, to: 6 },
                { field: "isSurchargeConfigured", from: null, to: true },
            ])
        );
        expect(entry.changes.map(change => change.field)).not.toContain("unitPrice");
    });

    it("does not record the creation of a table that is only audited for updates", async () => {
        await inRequest(() => Other.create({ name: "x" }));

        expect(saveAuditEntries).not.toHaveBeenCalled();
    });
});

describe("deleting an audited row", () => {
    it("names the row before it is gone and records the values it held", async () => {
        selects = [[cashbackRow(7, { surcharge: "5.00" })]];
        describes = [described(7)];

        await inRequest(() => Cashback.destroy({ where: { id: 7 } }));

        expect(verbs()).toEqual(["SELECT", "SELECT", "DELETE"]);
        const [entry] = saveAuditEntries.mock.calls[0][0];
        expect(entry).toMatchObject({ configType: "CASHBACK", action: "DELETE", targetId: 7, targetLabel: "Peko Go › Basic" });
        expect(entry.changes).toContainEqual({ field: "surcharge", from: 5, to: null });
    });

    it("saves nothing when no row matched", async () => {
        selects = [[]];

        await inRequest(() => Cashback.destroy({ where: { id: 7 } }));

        expect(saveAuditEntries).not.toHaveBeenCalled();
    });
});

describe("a subscription switched on or off", () => {
    it("records the change on its own, with the partner it belongs to", async () => {
        selects = [[{ id: 11, status: 1 }], [{ id: 11, status: 0 }]];
        describes = [described(11, "Turbo", null, "Cent Saarthi")];

        await inRequest(() => Package.update({ status: false }, { where: { id: 11 } }));

        expect(saveAuditEntries.mock.calls[0][0]).toEqual([
            expect.objectContaining({
                configType: "SUBSCRIPTION_STATUS",
                targetTable: "packages",
                targetLabel: "Turbo",
                partnerName: "Cent Saarthi",
                changes: [{ field: "status", from: true, to: false }],
            }),
        ]);
    });
});

describe("through an express request", () => {
    let server;
    let baseUrl;

    const save = async (req, res) => {
        await new Promise(resolve => setTimeout(resolve, 5));
        await Cashback.update({ surcharge: 5 }, { where: { id: Number(req.params.id) } });
        res.json({ ok: true });
    };

    beforeAll(() => {
        const app = express();
        app.use((req, res, next) => {
            req.user = { id: 9, name: "Asha" };
            next();
        });
        app.use(bindRequestContext);
        app.put("/api/v1/system_user/9/others/accounting/cashbacks/:id", save);
        app.put("/api/v1/system_user/9/others/cashback/:id", save);
        return new Promise(resolve => {
            server = app.listen(0, () => {
                baseUrl = `http://127.0.0.1:${server.address().port}`;
                resolve();
            });
        });
    });

    afterAll(
        () =>
            new Promise(resolve => {
                server.closeAllConnections();
                server.close(resolve);
            })
    );

    const put = (path, headers = {}) => {
        selects = [[cashbackRow(7)], [cashbackRow(7, { surcharge: "5.00" })]];
        describes = [described(7)];
        return fetch(`${baseUrl}${path}`, { method: "PUT", headers });
    };

    it("records the logged-in user and the Accounting Portal for an accounting endpoint", async () => {
        await put("/api/v1/system_user/9/others/accounting/cashbacks/7");

        expect(saveAuditEntries.mock.calls[0][0][0]).toMatchObject({
            actorId: 9,
            source: "ACCOUNTING_PORTAL",
        });
    });

    it("records the Accounting Portal when a shared endpoint is called with its header", async () => {
        await put("/api/v1/system_user/9/others/cashback/7", { "x-app-source": "accounting-portal" });

        expect(saveAuditEntries.mock.calls[0][0][0]).toMatchObject({ source: "ACCOUNTING_PORTAL" });
    });

    it("records the Admin Panel for a shared endpoint called without it", async () => {
        await put("/api/v1/system_user/9/others/cashback/7");

        expect(saveAuditEntries.mock.calls[0][0][0]).toMatchObject({ actorId: 9, source: "ADMIN_PANEL" });
    });
});

describe("registerAuditHooks", () => {
    it("does nothing for a database object without hooks, such as the test double", () => {
        expect(() => registerAuditHooks({})).not.toThrow();
        expect(() => registerAuditHooks(undefined)).not.toThrow();
    });
});

describe("auditRawUpdate", () => {
    const raw = { query: jest.fn() };

    const planRow = (overrides = {}) => ({
        id: 5,
        commissionMode: "MARGIN",
        commissionType: "PERCENTAGE",
        commission: "1.0000",
        fixedCommissionPerTransaction: "0.0000",
        isCommissionInclGST: 1,
        isCommissionConfigured: 0,
        ...overrides,
    });

    const run = jest.fn();

    beforeEach(() => {
        raw.query.mockReset();
        run.mockReset();
        run.mockResolvedValue("done");
    });

    it("reads the rows around the write and records what it changed", async () => {
        raw.query
            .mockResolvedValueOnce([planRow()])
            .mockResolvedValueOnce([planRow({ commission: "2.5000", isCommissionConfigured: 1 })])
            .mockResolvedValueOnce([{ id: 5, name: "Basic", parent: "eSIM Tunz" }]);

        const result = await inRequest(() =>
            auditRawUpdate({ sequelize: raw, table: "esimPlans", ids: [5], accessKey: "esim_tunz", run })
        );

        expect(result).toBe("done");
        expect(raw.query.mock.calls[0][0]).toMatch(/^SELECT id, .* FROM esimPlans WHERE id IN \(:ids\)$/);
        expect(saveAuditEntries.mock.calls[0][0]).toEqual([
            expect.objectContaining({
                source: "ACCOUNTING_PORTAL",
                configType: "PLAN_COMMISSION",
                targetTable: "esimPlans",
                targetId: 5,
                targetLabel: "eSIM Tunz › Basic",
                changes: [
                    { field: "commission", from: 1, to: 2.5 },
                    { field: "isCommissionConfigured", from: false, to: true },
                ],
            }),
        ]);
    });

    it("only runs the write outside a request", async () => {
        const result = await auditRawUpdate({ sequelize: raw, table: "esimPlans", ids: [5], run });

        expect(result).toBe("done");
        expect(raw.query).not.toHaveBeenCalled();
        expect(saveAuditEntries).not.toHaveBeenCalled();
    });

    it("only runs the write for a table that is not audited", async () => {
        await inRequest(() => auditRawUpdate({ sequelize: raw, table: "orders", ids: [5], run }));

        expect(run).toHaveBeenCalledTimes(1);
        expect(raw.query).not.toHaveBeenCalled();
    });

    it("still runs the write when the rows cannot be read first", async () => {
        raw.query.mockRejectedValueOnce(new Error("read failed"));

        const result = await inRequest(() => auditRawUpdate({ sequelize: raw, table: "esimPlans", ids: [5], run }));

        expect(result).toBe("done");
        expect(run).toHaveBeenCalledTimes(1);
        expect(saveAuditEntries).not.toHaveBeenCalled();
    });

    it("still returns the write's result when the rows cannot be read after", async () => {
        raw.query.mockResolvedValueOnce([planRow()]).mockRejectedValueOnce(new Error("read failed"));

        const result = await inRequest(() => auditRawUpdate({ sequelize: raw, table: "esimPlans", ids: [5], run }));

        expect(result).toBe("done");
        expect(saveAuditEntries).not.toHaveBeenCalled();
    });

    it("saves nothing when the write changed nothing", async () => {
        raw.query.mockResolvedValueOnce([planRow()]).mockResolvedValueOnce([planRow()]);

        await inRequest(() => auditRawUpdate({ sequelize: raw, table: "esimPlans", ids: [5], run }));

        expect(saveAuditEntries).not.toHaveBeenCalled();
        expect(raw.query).toHaveBeenCalledTimes(2);
    });

    it("compares numbers, booleans and JSON by meaning, not by how they are written", async () => {
        raw.query
            .mockResolvedValueOnce([{ id: 5, commission: "2.5000", isCommissionInclGST: 1, planCommissions: { a: 1, b: 2 } }])
            .mockResolvedValueOnce([{ id: 5, commission: 2.5, isCommissionInclGST: true, planCommissions: { b: 2, a: 1 } }]);

        await inRequest(() => auditRawUpdate({ sequelize: raw, table: "packages", ids: [5], run }));

        expect(saveAuditEntries).not.toHaveBeenCalled();
    });

    it("lists a flag turning back to false next to the values that changed it", async () => {
        raw.query
            .mockResolvedValueOnce([{ id: 1, providerCommission: "1.0000", isCommissionConfigured: 1 }])
            .mockResolvedValueOnce([{ id: 1, providerCommission: "2.0000", isCommissionConfigured: 0 }])
            .mockResolvedValueOnce([{ id: 1, name: "Water", parent: null }]);

        await inRequest(() => auditRawUpdate({ sequelize: raw, table: "serviceOperators", ids: [1], run }));

        expect(saveAuditEntries.mock.calls[0][0]).toEqual([
            expect.objectContaining({
                configType: "SERVICE_COMMISSION",
                targetLabel: "Water",
                changes: [
                    { field: "providerCommission", from: 1, to: 2 },
                    { field: "isCommissionConfigured", from: true, to: false },
                ],
            }),
        ]);
    });

    it("skips a row that was not there before", async () => {
        raw.query.mockResolvedValueOnce([]).mockResolvedValueOnce([planRow()]);

        await inRequest(() => auditRawUpdate({ sequelize: raw, table: "esimPlans", ids: [5], run }));

        expect(saveAuditEntries).not.toHaveBeenCalled();
        expect(raw.query).toHaveBeenCalledTimes(2);
    });

    it("keeps a long name within the column", async () => {
        raw.query
            .mockResolvedValueOnce([planRow()])
            .mockResolvedValueOnce([planRow({ commission: "2.5000" })])
            .mockResolvedValueOnce([{ id: 5, name: "x".repeat(300), parent: "Service" }]);

        await inRequest(() => auditRawUpdate({ sequelize: raw, table: "esimPlans", ids: [5], run }));

        const [entry] = saveAuditEntries.mock.calls[0][0];
        expect(entry.targetLabel).toHaveLength(255);
        expect(entry.targetLabel.startsWith("Service › xxx")).toBe(true);
    });
});
