const crypto = require("crypto");
const asyncHandler = require("../../middlewares/async");
const ErrorResponse = require("../../utils/error-response");
const { customLog } = require("../../utils/loggerHelper");
const { uploadFile, deleteFile } = require("../../utils/commonUploadFile");
const { extractStatement } = require("../../utils/statementExtract");
const { reconcile } = require("../../utils/statementReconcile");
const { processPdf } = require("../../utils/pdfPassword");
const {
    createBankStatementImport,
    findBankStatementImport,
    updateBankStatementImport,
} = require("../../models/use-cases/bankStatementImport");
const {
    createAccountingTransaction,
    bulkCreateAccountingTransactions,
    deleteAccountingTransactionsByBatch,
    findAccountingTransaction,
    findAccountingTransactionById,
    findAllAccountingTransactionsAndCount,
    findAccountingTransactionsForExport,
    findAccountingTransactionsByIdsForExport,
    updateAccountingTransaction,
    deleteAccountingTransaction,
    findLinkableInvoices,
    countOwnedInvoices,
} = require("../../models/use-cases/accountingTransaction");
const { generateExcelBufferAndType } = require("../../utils/generateExcelBufferAndType");
const { findFinancialAccount } = require("../../models/use-cases/financialAccount");
const { createLinks, deleteLink } = require("../../models/use-cases/transactionLink");
const {
    createTransactionDocument,
    findTransactionDocument,
    deleteTransactionDocument,
} = require("../../models/use-cases/transactionDocument");
const { fyDateRange } = require("../../utils/fyRange");

const DOC_FORMATS = ["pdf", "jpg", "jpeg", "png", "xls", "xlsx"];

// Resolve the effective date range for list/export: when `fy` is supplied it drives
// from/to via the shared FY mapping (optionally narrowed by `quarter` or `month`);
// otherwise the explicit `from`/`to` are used as-is.
const resolveRange = (q) =>
    q.fy ? fyDateRange(q.fy, q.quarter, q.month) : { from: q.from || null, to: q.to || null };

// Compose the API shape (incl. derived statuses[]) from a model instance.
const serializeTransaction = (t) => {
    const links = t.links || [];
    const documents = t.documents || [];
    const statuses = [];
    if (!t.reviewedAt) statuses.push("needs-review");
    if (links.length > 0) statuses.push("matched");
    if (t.isRecurring) statuses.push("recurring");
    if (t.isHidden) statuses.push("hidden");

    return {
        id: t.id,
        account: t.account,
        bankAccountId: t.bankAccountId != null ? t.bankAccountId : null,
        date: t.txnDate,
        description: t.description,
        amount: t.amount != null ? Number(t.amount) : 0,
        type: t.type,
        currency: t.currency,
        category: t.category,
        recurring: t.isRecurring,
        hidden: t.isHidden,
        note: t.note,
        reviewedAt: t.reviewedAt,
        statuses,
        links: links.map((l) => ({
            id: l.id,
            targetType: l.targetType,
            targetId: l.targetId,
            amountApplied: l.amountApplied != null ? Number(l.amountApplied) : null,
        })),
        documents: documents.map((d) => ({
            id: d.id,
            name: d.documentName,
            url: d.documentUrl,
            mimeType: d.mimeType,
            fileSize: d.fileSize,
        })),
    };
};

const subUserId = (req) =>
    req.user.role === "CORPORATE_SUB_USER" && req.user.subCorporateId
        ? req.user.subCorporateId
        : null;

// Flatten a transaction row into the export spreadsheet shape (shared by both exports).
const toExportRow = (r) => ({
    Date: r.txnDate,
    Description: r.description,
    Category: r.category || "",
    Type: r.type,
    Amount: r.amount != null ? Number(r.amount) : 0,
    Account: r.account,
    Recurring: r.isRecurring ? "Yes" : "No",
    Hidden: r.isHidden ? "Yes" : "No",
    Reviewed: r.reviewedAt ? "Yes" : "No",
    Matched: r.isMatched ? "Yes" : "No",
    Note: r.note || "",
});

// GET /accounting-transactions
exports.getAllTransactions = asyncHandler(async (req, res, next) => {
    try {
        const corporateUserId = req.user.corporateId;
        let { tab, searchText, page, itemsPerPage, sort, sortField, type, status } = req.query;
        // `fy` (+ optional quarter/month) drives from/to; else explicit from/to.
        const { from, to } = resolveRange(req.query);
        // Multi-select filters arrive as comma-separated values.
        const toList = (v) =>
            v ? String(v).split(",").map((s) => s.trim()).filter(Boolean) : [];
        const categories = toList(req.query.category);
        const sources = toList(req.query.source); // account: Bank | Upload | Manual
        // `bankAccount` carries financialAccount ids (CSV) to filter by.
        const bankAccountIds = toList(req.query.bankAccount)
            .map((v) => parseInt(v, 10))
            .filter((v) => !Number.isNaN(v));

        page = page ? parseInt(page) : 1;
        itemsPerPage = itemsPerPage ? parseInt(itemsPerPage) : 20;
        const limit = itemsPerPage;
        const offset = (page - 1) * itemsPerPage;

        const result = await findAllAccountingTransactionsAndCount({
            corporateUserId,
            subCorporateUserId: subUserId(req),
            tab: tab || "all",
            searchText: searchText || null,
            type: type || null,
            categories,
            sources,
            bankAccountIds,
            status: status || null,
            from: from || null,
            to: to || null,
            limit,
            offset,
            sort: sort === "ASC" ? "ASC" : "DESC",
            sortField: sortField || "txnDate",
        });

        return res.status(200).json({
            status: true,
            message: "Transactions fetched successfully",
            data: {
                transactions: result.rows.map(serializeTransaction),
                recordsTotal: result.recordsTotal,
                counts: result.counts,
            },
            responseCode: "000",
        });
    } catch (error) {
        customLog(req?.LogTraceId, "error", { message: error?.message });
        next(new ErrorResponse(error.message, 500));
    }
});

// GET /accounting-transactions/export/:format  (excel | csv) — same filters as the list
exports.exportTransactions = asyncHandler(async (req, res, next) => {
    try {
        const corporateUserId = req.user.corporateId;
        const format = req.params.format === "csv" ? "csv" : "excel";
        const { tab, searchText, type, status } = req.query;
        // `fy` (+ optional quarter/month) drives from/to; else explicit from/to.
        const { from, to } = resolveRange(req.query);
        const toList = (v) =>
            v ? String(v).split(",").map((s) => s.trim()).filter(Boolean) : [];

        const rows = await findAccountingTransactionsForExport({
            corporateUserId,
            subCorporateUserId: subUserId(req),
            tab: tab || "all",
            searchText: searchText || null,
            type: type || null,
            categories: toList(req.query.category),
            sources: toList(req.query.source),
            bankAccountIds: toList(req.query.bankAccount)
                .map((v) => parseInt(v, 10))
                .filter((v) => !Number.isNaN(v)),
            status: status || null,
            from: from || null,
            to: to || null,
            sort: req.query.sort === "ASC" ? "ASC" : "DESC",
            sortField: req.query.sortField || "txnDate",
        });

        if (!rows || rows.length === 0) {
            return next(new ErrorResponse("No data available for download.", 404));
        }

        const data = rows.map(toExportRow);
        const { buffer, fileType } = await generateExcelBufferAndType(data, format);
        return res.status(200).json({
            status: true,
            message: "Transactions exported successfully",
            data: { buffer, fileType },
            responseCode: "000",
        });
    } catch (error) {
        customLog(req?.LogTraceId, "error", { message: error?.message });
        next(new ErrorResponse(error.message, 500));
    }
});

// POST /accounting/transactions/export/:format  (excel | csv) — export SELECTED rows by id.
// Body: { ids: [<transactionId>, ...] }. Scoped to the corporate, so only the caller's own
// transactions are exported (unknown/foreign ids are silently ignored).
exports.exportSelectedTransactions = asyncHandler(async (req, res, next) => {
    try {
        const corporateUserId = req.user.corporateId;
        const format = req.params.format === "csv" ? "csv" : "excel";
        const ids = Array.isArray(req.body.ids) ? req.body.ids : [];

        const rows = await findAccountingTransactionsByIdsForExport({
            corporateUserId,
            subCorporateUserId: subUserId(req),
            ids,
        });

        if (!rows || rows.length === 0) {
            return next(new ErrorResponse("No data available for download.", 404));
        }

        const data = rows.map(toExportRow);
        const { buffer, fileType } = await generateExcelBufferAndType(data, format);
        return res.status(200).json({
            status: true,
            message: "Transactions exported successfully",
            data: { buffer, fileType },
            responseCode: "000",
        });
    } catch (error) {
        customLog(req?.LogTraceId, "error", { message: error?.message });
        next(new ErrorResponse(error.message, 500));
    }
});

// GET /accounting-transactions/:id
exports.getTransactionById = asyncHandler(async (req, res, next) => {
    try {
        const corporateUserId = req.user.corporateId;
        const result = await findAccountingTransactionById(req.params.id, corporateUserId);
        if (!result) {
            return next(new ErrorResponse("Transaction not found", 404));
        }
        return res.status(200).json({
            status: true,
            message: "Transaction fetched successfully",
            data: serializeTransaction(result),
            responseCode: "000",
        });
    } catch (error) {
        customLog(req?.LogTraceId, "error", { message: error?.message });
        next(new ErrorResponse(error.message, 500));
    }
});

// POST /accounting-transactions  (manual entry)
exports.createTransaction = asyncHandler(async (req, res, next) => {
    try {
        const corporateUserId = req.user.corporateId;
        const { txnDate, description, amount, type, account, category, note, bankAccountId } =
            req.body;

        // Guard against assigning a transaction to another corporate's account (IDOR).
        if (bankAccountId) {
            const owned = await findFinancialAccount({ id: bankAccountId, corporateUserId });
            if (!owned) {
                return next(new ErrorResponse("Invalid bank account", 400));
            }
        }

        const data = {
            corporateUserId,
            subCorporateUserId: subUserId(req),
            account: account || "Manual",
            txnDate,
            description,
            amount,
            type,
            category: category || null,
            note: note || null,
            bankAccountId: bankAccountId || null,
        };

        const result = await createAccountingTransaction(data);
        return res.status(200).json({
            status: true,
            message: "Transaction created successfully",
            data: serializeTransaction(result),
            responseCode: "000",
        });
    } catch (error) {
        customLog(req?.LogTraceId, "error", { message: error?.message });
        next(new ErrorResponse(error.message, 500));
    }
});

const applyUpdate = async (req, res, next, patch) => {
    const corporateUserId = req.user.corporateId;
    const updated = await updateAccountingTransaction({ id: req.params.id, corporateUserId }, patch);
    if (!updated) {
        return next(new ErrorResponse("Transaction not found", 404));
    }
    return res.status(200).json({
        status: true,
        message: "Transaction updated successfully",
        data: serializeTransaction(updated),
        responseCode: "000",
    });
};

// PATCH /accounting-transactions/:id
exports.updateTransaction = asyncHandler(async (req, res, next) => {
    try {
        const { note, category, account, type, isRecurring, isHidden, reviewed } = req.body;
        const patch = {};
        if (note !== undefined) patch.note = note;
        if (category !== undefined) patch.category = category;
        if (account !== undefined) patch.account = account;
        if (type !== undefined) patch.type = type;
        if (isRecurring !== undefined) patch.isRecurring = isRecurring;
        if (isHidden !== undefined) patch.isHidden = isHidden;
        if (reviewed !== undefined) patch.reviewedAt = reviewed ? new Date() : null;

        if (Object.keys(patch).length === 0) {
            return next(new ErrorResponse("No valid fields to update", 400));
        }
        return await applyUpdate(req, res, next, patch);
    } catch (error) {
        customLog(req?.LogTraceId, "error", { message: error?.message });
        next(new ErrorResponse(error.message, 500));
    }
});

// PATCH /accounting-transactions/:id/recurring
exports.toggleRecurring = asyncHandler(async (req, res, next) => {
    try {
        return await applyUpdate(req, res, next, { isRecurring: !!req.body.isRecurring });
    } catch (error) {
        customLog(req?.LogTraceId, "error", { message: error?.message });
        next(new ErrorResponse(error.message, 500));
    }
});

// PATCH /accounting-transactions/:id/hidden
exports.toggleHidden = asyncHandler(async (req, res, next) => {
    try {
        return await applyUpdate(req, res, next, { isHidden: !!req.body.isHidden });
    } catch (error) {
        customLog(req?.LogTraceId, "error", { message: error?.message });
        next(new ErrorResponse(error.message, 500));
    }
});

// PATCH /accounting-transactions/:id/note  (add/update/clear the single note)
exports.updateNote = asyncHandler(async (req, res, next) => {
    try {
        const note = req.body.note != null ? String(req.body.note).trim() : "";
        return await applyUpdate(req, res, next, { note: note || null });
    } catch (error) {
        customLog(req?.LogTraceId, "error", { message: error?.message });
        next(new ErrorResponse(error.message, 500));
    }
});

// PATCH /accounting-transactions/:id/category
// Sets the category; `reviewed` is optional (accepting a suggestion also clears Needs Review).
exports.updateCategory = asyncHandler(async (req, res, next) => {
    try {
        const category = req.body.category != null ? String(req.body.category).trim() : "";
        const patch = { category: category || null };
        if (req.body.reviewed !== undefined) {
            patch.reviewedAt = req.body.reviewed ? new Date() : null;
        }
        return await applyUpdate(req, res, next, patch);
    } catch (error) {
        customLog(req?.LogTraceId, "error", { message: error?.message });
        next(new ErrorResponse(error.message, 500));
    }
});

// PATCH /accounting-transactions/:id/account  (the entry method: Bank | Upload | Manual)
exports.updateAccount = asyncHandler(async (req, res, next) => {
    try {
        return await applyUpdate(req, res, next, { account: req.body.account });
    } catch (error) {
        customLog(req?.LogTraceId, "error", { message: error?.message });
        next(new ErrorResponse(error.message, 500));
    }
});

// DELETE /accounting-transactions/:id
exports.deleteTransaction = asyncHandler(async (req, res, next) => {
    try {
        const result = await deleteAccountingTransaction(req.params.id, req.user.corporateId);
        if (!result) {
            return next(new ErrorResponse("Transaction not found", 404));
        }
        return res.status(200).json({
            status: true,
            message: "Transaction deleted successfully",
            data: {},
            responseCode: "000",
        });
    } catch (error) {
        customLog(req?.LogTraceId, "error", { message: error?.message });
        next(new ErrorResponse(error.message, 500));
    }
});

// GET /accounting-transactions/linkable/invoices
exports.getLinkableInvoices = asyncHandler(async (req, res, next) => {
    try {
        const corporateUserId = req.user.corporateId;
        let { searchText, page, itemsPerPage } = req.query;
        page = page ? parseInt(page) : 1;
        itemsPerPage = itemsPerPage ? parseInt(itemsPerPage) : 20;

        const result = await findLinkableInvoices({
            corporateUserId,
            searchText: searchText || null,
            limit: itemsPerPage,
            offset: (page - 1) * itemsPerPage,
        });

        const invoices = result.rows.map((inv) => ({
            id: inv.id,
            targetType: "INVOICING",
            reference: `${inv.prefix || ""}${inv.invoiceNumber}`,
            party: inv.name,
            date: inv.invoiceDate,
            amount: inv.totalAmount != null ? Number(inv.totalAmount) : null,
            status: inv.status,
        }));

        return res.status(200).json({
            status: true,
            message: "Linkable invoices fetched successfully",
            data: { invoices, recordsTotal: result.recordsTotal },
            responseCode: "000",
        });
    } catch (error) {
        customLog(req?.LogTraceId, "error", { message: error?.message });
        next(new ErrorResponse(error.message, 500));
    }
});

// POST /accounting-transactions/:id/links
exports.createTransactionLinks = asyncHandler(async (req, res, next) => {
    try {
        const corporateUserId = req.user.corporateId;
        const { id } = req.params;
        const { links } = req.body;

        const txn = await findAccountingTransaction({ id, corporateUserId });
        if (!txn) {
            return next(new ErrorResponse("Transaction not found", 404));
        }

        // v1 supports INVOICING targets only — verify every target is owned.
        const otherTargets = links.filter((l) => l.targetType !== "INVOICING");
        if (otherTargets.length > 0) {
            return next(new ErrorResponse("Only invoice links are supported", 400));
        }
        const uniqueIds = [...new Set(links.map((l) => l.targetId))];
        const ownedCount = await countOwnedInvoices(corporateUserId, uniqueIds);
        if (ownedCount !== uniqueIds.length) {
            return next(new ErrorResponse("One or more invoices are not accessible", 403));
        }

        const rows = links.map((l) => ({
            corporateUserId,
            accountingTransactionId: id,
            targetType: l.targetType,
            targetId: l.targetId,
            amountApplied: l.amountApplied != null ? l.amountApplied : null,
            linkedBy: req.user.id || null,
        }));
        await createLinks(rows);

        const updated = await findAccountingTransactionById(id, corporateUserId);
        return res.status(200).json({
            status: true,
            message: "Invoices linked successfully",
            data: serializeTransaction(updated),
            responseCode: "000",
        });
    } catch (error) {
        customLog(req?.LogTraceId, "error", { message: error?.message });
        next(new ErrorResponse(error.message, 500));
    }
});

// DELETE /accounting-transactions/:id/links/:linkId
exports.deleteTransactionLink = asyncHandler(async (req, res, next) => {
    try {
        const corporateUserId = req.user.corporateId;
        const { id, linkId } = req.params;
        const result = await deleteLink({ id: linkId, accountingTransactionId: id, corporateUserId });
        if (!result) {
            return next(new ErrorResponse("Link not found", 404));
        }
        return res.status(200).json({
            status: true,
            message: "Link removed successfully",
            data: {},
            responseCode: "000",
        });
    } catch (error) {
        customLog(req?.LogTraceId, "error", { message: error?.message });
        next(new ErrorResponse(error.message, 500));
    }
});

// POST /accounting-transactions/import/parse
exports.parseBankStatement = asyncHandler(async (req, res, next) => {
    try {
        const corporateUserId = req.user.corporateId;
        const { fileBase64, fileName, format, bankAccountId } = req.body;

        if (!fileBase64 || !fileName) {
            return next(new ErrorResponse("A statement file is required", 400));
        }
        if (String(format || "").toLowerCase() !== "pdf") {
            return next(new ErrorResponse("Currently only PDF statements are supported", 400));
        }
        if (bankAccountId) {
            const owned = await findFinancialAccount({ id: bankAccountId, corporateUserId });
            if (!owned) return next(new ErrorResponse("Invalid bank account", 400));
        }

        const base64 = String(fileBase64).replace(/^data:[^;]+;base64,/, "");
        const buffer = Buffer.from(base64, "base64");

        // Detect + (if needed) decrypt password-protected PDFs before extraction.
        const prepared = await processPdf(buffer, req.body.password);
        if (prepared.locked) {
            return res.status(200).json({
                status: true,
                message: prepared.invalidPassword
                    ? "Incorrect password"
                    : "Statement is password protected",
                data: prepared.invalidPassword
                    ? { locked: true, invalidPassword: true }
                    : { locked: true },
                responseCode: "000",
            });
        }
        const pdfBuffer = prepared.buffer;

        const fileHash = crypto.createHash("sha256").update(buffer).digest("hex");

        const duplicate = await findBankStatementImport({
            corporateUserId,
            fileHash,
            status: "imported",
        });
        if (duplicate) {
            return next(new ErrorResponse("This statement has already been imported", 409));
        }

        const parsed = await extractStatement(pdfBuffer);
        const { results, qualityScore, needsReview, reconciled } = reconcile(
            parsed.openingBalance,
            parsed.transactions
        );
        if (!results.length) {
            return next(new ErrorResponse("No transactions could be read from this file", 422));
        }

        const dates = results.map((t) => t.txnDate).filter(Boolean).sort();
        const importRow = await createBankStatementImport({
            corporateUserId,
            subCorporateUserId: subUserId(req),
            fileName,
            mimeType: req.body.mimeType || "application/pdf",
            fileHash,
            statementStartDate: dates[0] || null,
            statementEndDate: dates[dates.length - 1] || null,
            totalRows: results.length,
            qualityScore,
            status: "draft",
            uploadedBy: req.user.id || null,
            financialAccountId: bankAccountId || null,
        });

        const now = new Date();
        const rows = results.map((t) => ({
            corporateUserId,
            subCorporateUserId: subUserId(req),
            account: "Bank",
            importBatchId: importRow.id,
            rawHash: crypto
                .createHash("sha256")
                .update(`${t.txnDate}|${t.description}|${t.amount}|${t.balance}`)
                .digest("hex"),
            txnDate: t.txnDate,
            description: String(t.description || "").slice(0, 512),
            amount: t.amount,
            type: t.type === "Income" ? "Income" : "Expense",
            currency: "INR",
            category: t.category || null,
            reviewedAt: t.reconciled ? now : null,
            bankAccountId: bankAccountId || null,
        }));
        const created = await bulkCreateAccountingTransactions(rows);

        const credits = results.filter((t) => t.type === "Income");
        const debits = results.filter((t) => t.type !== "Income");
        const sum = (arr) => arr.reduce((s, t) => s + t.amount, 0);
        const categorized = results.filter((t) => t.category).length;

        return res.status(200).json({
            status: true,
            message: "Statement parsed successfully",
            data: {
                batchId: importRow.id,
                transactions: created.map(serializeTransaction),
                quality: {
                    score: qualityScore,
                    total: results.length,
                    reconciled,
                    needsReview,
                    categorized,
                },
                summary: {
                    totalImported: results.length,
                    credits: { count: credits.length, amount: sum(credits) },
                    debits: { count: debits.length, amount: sum(debits) },
                    categorizedPercent: results.length
                        ? Math.round((categorized / results.length) * 100)
                        : 0,
                    statementStart: dates[0] || null,
                    statementEnd: dates[dates.length - 1] || null,
                },
            },
            responseCode: "000",
        });
    } catch (error) {
        customLog(req?.LogTraceId, "error", { message: error?.message });
        next(new ErrorResponse(error.message, 500));
    }
});

// POST /accounting-transactions/import/:batchId/confirm  (finalise a draft import)
exports.confirmBankStatement = asyncHandler(async (req, res, next) => {
    try {
        const corporateUserId = req.user.corporateId;
        const updated = await updateBankStatementImport(
            { id: req.params.batchId, corporateUserId },
            { status: "imported" }
        );
        if (!updated) {
            return next(new ErrorResponse("Import batch not found", 404));
        }
        return res.status(200).json({
            status: true,
            message: "Import confirmed",
            data: { batchId: updated.id, status: updated.status },
            responseCode: "000",
        });
    } catch (error) {
        customLog(req?.LogTraceId, "error", { message: error?.message });
        next(new ErrorResponse(error.message, 500));
    }
});

// DELETE /accounting-transactions/import/:batchId  (discard a draft import + its rows)
exports.discardBankStatement = asyncHandler(async (req, res, next) => {
    try {
        const corporateUserId = req.user.corporateId;
        const batch = await findBankStatementImport({
            id: req.params.batchId,
            corporateUserId,
            status: "draft",
        });
        if (!batch) {
            return next(new ErrorResponse("Draft import not found", 404));
        }
        await deleteAccountingTransactionsByBatch(batch.id, corporateUserId);
        await updateBankStatementImport({ id: batch.id, corporateUserId }, { status: "rejected" });
        return res.status(200).json({
            status: true,
            message: "Import discarded",
            data: {},
            responseCode: "000",
        });
    } catch (error) {
        customLog(req?.LogTraceId, "error", { message: error?.message });
        next(new ErrorResponse(error.message, 500));
    }
});

// POST /accounting-transactions/:id/documents
exports.uploadTransactionDocument = asyncHandler(async (req, res, next) => {
    try {
        const corporateUserId = req.user.corporateId;
        const { id } = req.params;
        const { documentBase64, fileName, format } = req.body;

        if (!DOC_FORMATS.includes(String(format).toLowerCase())) {
            return next(new ErrorResponse("Unsupported file format", 400));
        }

        const txn = await findAccountingTransaction({ id, corporateUserId });
        if (!txn) {
            return next(new ErrorResponse("Transaction not found", 404));
        }

        const base64String = documentBase64.replace(/^data:[^;]+;base64,/, "");
        const user = req.user;
        const filePath = `${user?.role ? user.role.toLowerCase() : "unknown-role"}/${
            user?.username ? user.username : "unknown-user"
        }/accountingTransactionDocs`;

        const documentUrl = await uploadFile(base64String, filePath, format.toLowerCase(), 10);

        const doc = await createTransactionDocument({
            corporateUserId,
            accountingTransactionId: id,
            documentName: fileName,
            documentUrl,
            mimeType: req.body.mimeType || null,
            uploadedBy: req.user.id || null,
        });

        return res.status(200).json({
            status: true,
            message: "Document uploaded successfully",
            data: { id: doc.id, name: doc.documentName, url: doc.documentUrl },
            responseCode: "000",
        });
    } catch (error) {
        customLog(req?.LogTraceId, "error", { message: error?.message });
        next(new ErrorResponse(error.message, 500));
    }
});

// DELETE /accounting-transactions/:id/documents/:docId
exports.deleteTransactionDocument = asyncHandler(async (req, res, next) => {
    try {
        const corporateUserId = req.user.corporateId;
        const { id, docId } = req.params;

        const doc = await findTransactionDocument({
            id: docId,
            accountingTransactionId: id,
            corporateUserId,
        });
        if (!doc) {
            return next(new ErrorResponse("Document not found", 404));
        }

        await deleteFile(doc.documentUrl);
        await deleteTransactionDocument({ id: docId, accountingTransactionId: id, corporateUserId });

        return res.status(200).json({
            status: true,
            message: "Document deleted successfully",
            data: {},
            responseCode: "000",
        });
    } catch (error) {
        customLog(req?.LogTraceId, "error", { message: error?.message });
        next(new ErrorResponse(error.message, 500));
    }
});
