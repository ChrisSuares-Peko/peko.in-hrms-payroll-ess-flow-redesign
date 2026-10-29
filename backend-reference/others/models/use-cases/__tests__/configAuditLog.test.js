const { Op } = require("sequelize");
const configAuditLog = require("../../entities/configAuditLog");
const credential = require("../../entities/credential");
const { saveAuditEntries, listAuditLogs, serializeAuditLog } = require("../configAuditLog");

beforeEach(() => {
    jest.clearAllMocks();
});

describe("saveAuditEntries", () => {
    it("saves the entries in one insert", async () => {
        const entries = [{ configType: "PLATFORM_FEE" }, { configType: "CASHBACK" }];
        configAuditLog.bulkCreate.mockResolvedValue(entries);

        await expect(saveAuditEntries(entries)).resolves.toBe(entries);
        expect(configAuditLog.bulkCreate).toHaveBeenCalledWith(entries);
    });
});

describe("listAuditLogs", () => {
    const page = { limit: 10, offset: 20 };

    beforeEach(() => {
        configAuditLog.findAndCountAll.mockResolvedValue({ rows: [], count: 0 });
    });

    it("lists the newest first, a page at a time, with no filter by default", async () => {
        await listAuditLogs(page);

        expect(configAuditLog.findAndCountAll).toHaveBeenCalledWith({
            where: {},
            include: [{ model: credential, as: "actor", attributes: ["id", "name"], required: false }],
            order: [
                ["createdAt", "DESC"],
                ["id", "DESC"],
            ],
            limit: 10,
            offset: 20,
        });
    });

    it("narrows by every filter that is given", async () => {
        const range = { from: "2026-10-01 00:00:00", to: "2026-10-07 23:59:59" };

        await listAuditLogs({
            ...page,
            configType: "PLATFORM_FEE",
            source: "ACCOUNTING_PORTAL",
            partnerName: "Cent Saarthi",
            range,
        });

        expect(configAuditLog.findAndCountAll.mock.calls[0][0].where).toEqual({
            configType: "PLATFORM_FEE",
            source: "ACCOUNTING_PORTAL",
            partnerName: "Cent Saarthi",
            createdAt: { [Op.between]: [range.from, range.to] },
        });
    });

    it.each([
        ["actorName", "ASC", [[{ model: credential, as: "actor" }, "name", "ASC"], ["createdAt", "DESC"], ["id", "DESC"]]],
        ["partnerName", "DESC", [["partnerName", "DESC"], ["createdAt", "DESC"], ["id", "DESC"]]],
        ["configType", "ASC", [["configType", "ASC"], ["createdAt", "DESC"], ["id", "DESC"]]],
        ["createdAt", "ASC", [["createdAt", "ASC"], ["id", "ASC"]]],
        ["password", "ASC", [["createdAt", "ASC"], ["id", "ASC"]]],
    ])("sorts by %s %s, and falls back to the newest first for a column it does not know", async (sortField, sort, order) => {
        await listAuditLogs({ ...page, sortField, sort });

        expect(configAuditLog.findAndCountAll.mock.calls[0][0].order).toEqual(order);
    });

    it("searches the person's name and the name of what was changed", async () => {
        await listAuditLogs({ ...page, searchText: "peko" });

        const like = { [Op.like]: "%peko%" };
        expect(configAuditLog.findAndCountAll.mock.calls[0][0].where).toEqual({
            [Op.or]: [{ "$actor.name$": like }, { targetLabel: like }],
        });
    });
});

describe("serializeAuditLog", () => {
    const row = {
        id: 1,
        createdAt: "2026-10-07T10:00:00.000Z",
        actorId: 9,
        actor: { id: 9, name: "Asha" },
        source: "ADMIN_PANEL",
        configType: "CASHBACK",
        action: "UPDATE",
        targetTable: "cashbacks",
        targetId: 7,
        targetLabel: "Peko Go › Basic",
        partnerName: "Cent Saarthi",
        ipAddress: "203.0.113.7",
        changes: [{ field: "cashback", from: 1, to: 2 }],
        password: "REDACTED",
    };

    it("returns the fields the history page shows, and no others", () => {
        const shown = { ...row, actorName: "Asha" };
        delete shown.password;
        delete shown.actor;

        expect(serializeAuditLog(row)).toEqual(shown);
    });

    it("has no name for a person whose user record is gone", () => {
        expect(serializeAuditLog({ ...row, actor: null }).actorName).toBeNull();
    });

    it("reads a model instance through its plain form", () => {
        expect(serializeAuditLog({ toJSON: () => row }).targetLabel).toBe("Peko Go › Basic");
    });

});
