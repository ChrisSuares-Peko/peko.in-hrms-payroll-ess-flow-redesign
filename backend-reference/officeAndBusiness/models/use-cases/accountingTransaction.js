const { Op } = require("sequelize");
const Sequelize = require("sequelize");
const asyncHandler = require("../../middlewares/async");
const accountingTransaction = require("../entities/accountingTransaction");
const transactionLink = require("../entities/transactionLink");
const transactionDocument = require("../entities/transactionDocument");
const invoicingV2 = require("../entities/invoicingV2");

// "matched" = the transaction has at least one link. Backed by the UNIQUE index
// on transactionLinks(accountingTransactionId,...), so the correlated EXISTS is
// an index seek — cheap enough to use inside the counts aggregate too.
const MATCHED_EXISTS =
    "EXISTS (SELECT 1 FROM `transactionLinks` AS `tl` WHERE `tl`.`accountingTransactionId` = `accountingTransactions`.`id`)";
const matchedLiteral = Sequelize.literal(MATCHED_EXISTS);

/**
 * Build the WHERE shared by the row listing and the tab-count aggregate.
 *  - Non-tab filters (search, type, category, status, source, date range) always apply.
 *  - `withTab` additionally applies the active top-tab predicate; the counts query
 *    omits it because it computes every tab in one pass.
 * All inputs are parameterised by Sequelize; only column names are interpolated.
 */
const buildWhere = (p, withTab) => {
    const where = { corporateUserId: p.corporateUserId };
    const and = [];

    if (p.subCorporateUserId) where.subCorporateUserId = p.subCorporateUserId;
    if (p.type) where.type = p.type; // 'Income' | 'Expense'
    if (p.categories && p.categories.length) where.category = { [Op.in]: p.categories };
    if (p.sources && p.sources.length) where.account = { [Op.in]: p.sources }; // Bank | Upload | Manual
    if (p.bankAccountIds && p.bankAccountIds.length) {
        where.bankAccountId = { [Op.in]: p.bankAccountIds }; // which financial account
    }

    if (p.from && p.to) where.txnDate = { [Op.between]: [p.from, p.to] };
    else if (p.from) where.txnDate = { [Op.gte]: p.from };
    else if (p.to) where.txnDate = { [Op.lte]: p.to };

    // Free-text search across the most useful text columns. For very large
    // datasets, back `description` with a FULLTEXT index and switch to MATCH().
    if (p.searchText) {
        and.push({
            [Op.or]: [
                { description: { [Op.like]: `%${p.searchText}%` } },
                { category: { [Op.like]: `%${p.searchText}%` } },
            ],
        });
    }

    // Drawer "Status" radio — independent of the top tabs.
    if (p.status === "needs_review") {
        where.reviewedAt = null;
    } else if (p.status === "categorized" && !(p.categories && p.categories.length)) {
        and.push({ category: { [Op.ne]: null } }, { category: { [Op.ne]: "" } });
    }

    if (withTab) {
        switch (p.tab) {
            case "hidden":
                where.isHidden = true;
                break;
            case "needs_review":
                where.isHidden = false;
                where.reviewedAt = null;
                break;
            case "recurring":
                where.isHidden = false;
                where.isRecurring = true;
                break;
            case "matched":
                where.isHidden = false;
                and.push(matchedLiteral);
                break;
            case "all":
            default:
                where.isHidden = false;
        }
    }

    if (and.length) where[Op.and] = and;
    return where;
};

const TAB_COUNT_KEY = {
    all: "all",
    needs_review: "needs_review",
    matched: "matched",
    recurring: "recurring",
    hidden: "hidden",
};

exports.createAccountingTransaction = asyncHandler(async (data) =>
    accountingTransaction.create(data)
);

exports.bulkCreateAccountingTransactions = asyncHandler(async (rows) =>
    accountingTransaction.bulkCreate(rows)
);

exports.deleteAccountingTransactionsByBatch = asyncHandler(async (importBatchId, corporateUserId) =>
    accountingTransaction.destroy({ where: { importBatchId, corporateUserId } })
);

exports.findAccountingTransaction = asyncHandler(async (where) =>
    accountingTransaction.findOne({ where })
);

exports.findAccountingTransactionById = asyncHandler(async (id, corporateUserId) =>
    accountingTransaction.findOne({
        where: { id, corporateUserId },
        include: [
            { model: transactionLink, as: "links" },
            { model: transactionDocument, as: "documents" },
        ],
    })
);

/**
 * Paginated listing + per-tab counts.
 * Optimised to TWO concurrent queries:
 *   1. the page rows (findAll, indexed by corporateUserId+txnDate; hasMany loaded
 *      via `separate` so limit/offset stay correct and rows don't multiply),
 *   2. a single conditional-aggregation query that returns all five tab badge
 *      counts in one pass over the filtered base set.
 * `recordsTotal` for the active tab is read straight from those counts, so no
 * extra COUNT query is issued.
 */
exports.findAllAccountingTransactionsAndCount = asyncHandler(async (params) => {
    const listWhere = buildWhere(params, true);
    const baseWhere = buildWhere(params, false);
    const num = (v) => Number(v) || 0;

    const [rows, countRow] = await Promise.all([
        accountingTransaction.findAll({
            where: listWhere,
            include: [
                { model: transactionLink, as: "links", separate: true },
                { model: transactionDocument, as: "documents", separate: true },
            ],
            order: [
                [params.sortField || "txnDate", params.sort === "ASC" ? "ASC" : "DESC"],
                ["id", "DESC"],
            ],
            limit: params.limit,
            offset: params.offset,
        }),
        accountingTransaction.findOne({
            where: baseWhere,
            attributes: [
                [Sequelize.literal("SUM(CASE WHEN `isHidden` = 0 THEN 1 ELSE 0 END)"), "all"],
                [
                    Sequelize.literal(
                        "SUM(CASE WHEN `isHidden` = 0 AND `reviewedAt` IS NULL THEN 1 ELSE 0 END)"
                    ),
                    "needs_review",
                ],
                [
                    Sequelize.literal(
                        `SUM(CASE WHEN \`isHidden\` = 0 AND ${MATCHED_EXISTS} THEN 1 ELSE 0 END)`
                    ),
                    "matched",
                ],
                [
                    Sequelize.literal(
                        "SUM(CASE WHEN `isHidden` = 0 AND `isRecurring` = 1 THEN 1 ELSE 0 END)"
                    ),
                    "recurring",
                ],
                [Sequelize.literal("SUM(CASE WHEN `isHidden` = 1 THEN 1 ELSE 0 END)"), "hidden"],
            ],
            raw: true,
        }),
    ]);

    const counts = {
        all: num(countRow && countRow.all),
        needs_review: num(countRow && countRow.needs_review),
        matched: num(countRow && countRow.matched),
        recurring: num(countRow && countRow.recurring),
        hidden: num(countRow && countRow.hidden),
    };

    return {
        rows,
        recordsTotal: counts[TAB_COUNT_KEY[params.tab] || "all"],
        counts,
    };
});

// All rows matching the same filters as the listing (no pagination), flattened for
// export. `isMatched` is derived via the same correlated EXISTS as the tabs/counts.
// Capped so a runaway export can't pull an unbounded result set.
exports.findAccountingTransactionsForExport = asyncHandler(async (params) =>
    accountingTransaction.findAll({
        where: buildWhere(params, true),
        attributes: { include: [[Sequelize.literal(MATCHED_EXISTS), "isMatched"]] },
        order: [
            [params.sortField || "txnDate", params.sort === "ASC" ? "ASC" : "DESC"],
            ["id", "DESC"],
        ],
        limit: 5000,
        raw: true,
    })
);

// Selected rows for export, by id, scoped to the corporate (+ optional sub-user) so a
// user can only export their own transactions. `isMatched` derived like the filtered
// export. Capped to the same 5000-row ceiling.
exports.findAccountingTransactionsByIdsForExport = asyncHandler(
    async ({ corporateUserId, subCorporateUserId, ids }) => {
        const where = { corporateUserId, id: { [Op.in]: ids } };
        if (subCorporateUserId) where.subCorporateUserId = subCorporateUserId;
        return accountingTransaction.findAll({
            where,
            attributes: { include: [[Sequelize.literal(MATCHED_EXISTS), "isMatched"]] },
            order: [
                ["txnDate", "DESC"],
                ["id", "DESC"],
            ],
            limit: 5000,
            raw: true,
        });
    }
);

exports.updateAccountingTransaction = asyncHandler(async (where, data) => {
    const doc = await accountingTransaction.findOne({ where });
    if (!doc) return null;
    return doc.update(data);
});

exports.deleteAccountingTransaction = asyncHandler(async (id, corporateUserId) => {
    const doc = await accountingTransaction.findOne({ where: { id, corporateUserId } });
    if (!doc) return null;
    await doc.destroy(); // soft-delete (paranoid)
    return true;
});

// --- Invoice linking helpers (linkable list + ownership check) ---
exports.findLinkableInvoices = asyncHandler(async ({ corporateUserId, searchText, limit, offset }) => {
    const where = {
        corporateUserId,
        documentType: "INVOICE",
        status: { [Op.ne]: "CANCELLED" },
    };
    if (searchText) {
        const like = `%${searchText}%`;
        where[Op.or] = [
            { invoiceNumber: { [Op.like]: like } },
            { name: { [Op.like]: like } },
            // Match the full reference id shown to users (prefix + invoiceNumber, e.g. "INV-238").
            Sequelize.where(
                Sequelize.fn("CONCAT", Sequelize.fn("COALESCE", Sequelize.col("prefix"), ""), Sequelize.col("invoiceNumber")),
                { [Op.like]: like }
            ),
        ];
    }
    const result = await invoicingV2.findAndCountAll({
        where,
        attributes: ["id", "prefix", "invoiceNumber", "name", "invoiceDate", "dueDate", "totalAmount", "status"],
        order: [["id", "DESC"]],
        limit,
        offset,
    });
    return { rows: result.rows, recordsTotal: result.count };
});

exports.countOwnedInvoices = asyncHandler(async (corporateUserId, ids) =>
    invoicingV2.count({ where: { corporateUserId, id: { [Op.in]: ids } } })
);
