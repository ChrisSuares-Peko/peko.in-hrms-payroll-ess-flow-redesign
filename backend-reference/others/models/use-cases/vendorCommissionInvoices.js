const { Op } = require("sequelize");
const sequelizeConfig = require("../../configs/database/index");
const order = require("../entities/order");
const serviceOperator = require("../entities/serviceOperator");
const vendor = require("../entities/vendor");
const vendorLedgerEntries = require("../entities/vendorLedgerEntry");
const configAuditLog = require("../entities/configAuditLog");
const { ENTRY_KINDS, ENTRY_TYPES, findEntry } = require("./vendorLedgerEntries");
const {
    BILLED_TO_FIELDS,
    GST_STATES,
    billedToOf,
    partyBilledTo,
    taxPlacement,
    taxCaseOf,
    withBilledToEdits,
    storedInvoiceFor,
    storedEditsFor,
    entryEditsFor,
    findVendorOrder,
    orderInvoiceDocument,
    manualEntryDocument,
    documentFileName,
} = require("./vendorTaxDocuments");
const { taxInvoiceTemplate } = require("../../utils/invoiceTemplate");
const { renderPdf } = require("../../utils/puppeteerPool");
const { isPdfBuffer } = require("../../utils/pdfHelper");
const emailer = require("../../utils/emailer");
const { vendorInvoiceEmail } = require("../../utils/emailTemplate/vendorInvoice");
const { LEDGER_AUDIT_TYPES } = require("../../utils/auditedModels");
const { currentContext, ACCOUNTING_PORTAL } = require("../../utils/requestContext");
const { istDay } = require("../../utils/istRange");
const { customLog } = require("../../utils/loggerHelper");

const SOURCES = { order: "order", manual: "manual" };

const OUTCOMES = {
    missing: "MISSING",
    unchanged: "UNCHANGED",
    updated: "UPDATED",
    renderFailed: "RENDER_FAILED",
    sendFailed: "SEND_FAILED",
    sent: "SENT",
};

const MAX_MATCHES = 20;
const MAX_SENDS_KEPT = 20;
const SENT_TO_FIELD = "sentTo";
const LABEL_LIMIT = 255;
const EMAIL_SUBJECT = "Tax Invoice on Commission - Peko";

const toNumber = value => Number(value) || 0;

const dayOf = value =>
    value instanceof Date ? istDay(value) : String(value || "").slice(0, 10);

const parseJson = value => {
    if (!value) return null;
    if (typeof value !== "string") return value;
    try {
        return JSON.parse(value);
    } catch {
        return null;
    }
};

const vendorEmailsOf = row => {
    const raw = parseJson(row && row.vendorEmail);
    if (Array.isArray(raw)) return raw.filter(Boolean).map(String);
    if (typeof raw === "string" && raw.trim()) return [raw.trim()];
    return [];
};

const findVendorContact = vendorId =>
    vendor.findOne({
        attributes: ["id", "vendorName", "vendorEmail", "gstNo", "state", "address"],
        where: { id: vendorId },
        raw: true,
    });

const orderMatch = row => {
    const stored = storedInvoiceFor(row);
    if (!stored) return null;
    const operator = row.serviceOperator || {};
    return {
        source: SOURCES.order,
        id: String(row.corporateTxnId),
        vendorId: operator.vendorId,
        vendorName: operator.vendor ? operator.vendor.vendorName : null,
        invoiceNumber: stored.invoiceNumber || null,
        issuedDate: stored.issuedDate ? dayOf(stored.issuedDate) : dayOf(row.transactionDate),
        total: toNumber(stored.total),
    };
};

const entryMatch = row => ({
    source: SOURCES.manual,
    id: String(row.id),
    vendorId: row.vendorId,
    vendorName: row.vendor ? row.vendor.vendorName : null,
    invoiceNumber: row.entryNumber,
    issuedDate: dayOf(row.issueDate),
    total: toNumber(row.amount),
});

// A transaction id names the invoice raised on an order; an entry number, or the reference an
// older entry was typed with, names a commission recorded by hand, which may exist on more
// than one vendor, so every match is returned.
const searchCommissionInvoices = async search => {
    const text = String(search || "").trim();
    if (!text) return [];

    const [orders, entries] = await Promise.all([
        order.findAll({
            attributes: ["id", "corporateTxnId", "transactionDate", "pekoInvoiceDetails"],
            where: { corporateTxnId: text },
            include: [
                {
                    model: serviceOperator,
                    attributes: ["id", "vendorId"],
                    required: true,
                    include: [{ model: vendor, attributes: ["id", "vendorName"], required: true }],
                },
            ],
            order: [["id", "DESC"]],
            limit: MAX_MATCHES,
            raw: true,
            nest: true,
        }),
        vendorLedgerEntries.findAll({
            attributes: ["id", "vendorId", "entryNumber", "issueDate", "amount"],
            where: {
                kind: ENTRY_KINDS.commission,
                entryType: ENTRY_TYPES.entry,
                [Op.or]: [{ entryNumber: text }, { reference: text }],
            },
            include: [{ model: vendor, attributes: ["id", "vendorName"], required: false }],
            order: [["id", "DESC"]],
            limit: MAX_MATCHES,
            raw: true,
            nest: true,
        }),
    ]);

    return [...orders.map(orderMatch).filter(Boolean), ...entries.map(entryMatch)].slice(
        0,
        MAX_MATCHES
    );
};

const documentOf = ({ vendorId, source, id, ledgerAccountIds }) =>
    source === SOURCES.manual
        ? manualEntryDocument({ vendorId, id, kind: ENTRY_KINDS.commission })
        : orderInvoiceDocument({ vendorId, corporateTxnId: id, ledgerAccountIds });

// The row the edits live on, with the billed-to the invoice was generated with and whatever
// the accounts team saved since.
const loadTarget = async ({ vendorId, source, id }) => {
    const contact = await findVendorContact(vendorId);
    if (!contact) return null;

    if (source === SOURCES.manual) {
        const entry = await findEntry({ id, vendorId, kind: ENTRY_KINDS.commission });
        if (!entry) return null;
        return {
            source,
            row: entry,
            table: "vendorLedgerEntries",
            contact,
            invoiceNumber: entry.entryNumber,
            originalBilledTo: billedToOf(partyBilledTo(contact)),
            edits: entryEditsFor(entry),
        };
    }

    const row = await findVendorOrder({ vendorId, corporateTxnId: id });
    const stored = storedInvoiceFor(row);
    if (!stored) return null;
    return {
        source,
        row,
        table: "orders",
        contact,
        invoiceNumber: stored.invoiceNumber || String(id),
        originalBilledTo: billedToOf(stored.billedTo),
        edits: storedEditsFor(row),
    };
};

const sendsOf = edits => (edits && Array.isArray(edits.sends) ? edits.sends : []);

const serializeInvoice = (target, document) => {
    const payload = document.payload;
    return {
        source: target.source,
        id: target.source === SOURCES.manual ? String(target.row.id) : String(target.row.corporateTxnId),
        vendor: {
            id: target.contact.id,
            name: target.contact.vendorName,
            emails: vendorEmailsOf(target.contact),
        },
        documentTitle: payload.documentTitle,
        invoiceNumber: document.number,
        issuedDate: payload.issuedDate || null,
        total: toNumber(payload.total),
        originalBilledTo: target.originalBilledTo,
        billedTo: billedToOf(payload.billedTo),
        placeOfSupply: payload.placeOfSupply || "",
        taxCase: taxCaseOf(payload),
        taxLines: Array.isArray(payload.taxLines) ? payload.taxLines : [],
        states: GST_STATES,
        edited:
            target.edits && target.edits.billedTo
                ? {
                      at: target.edits.editedAt || null,
                      byName: target.edits.editedByName || null,
                  }
                : null,
        sends: sendsOf(target.edits),
        html: taxInvoiceTemplate(payload),
    };
};

const loadCommissionInvoice = async ({ vendorId, source, id, ledgerAccountIds }) => {
    const target = await loadTarget({ vendorId, source, id });
    if (!target) return null;
    const document = await documentOf({ vendorId, source, id, ledgerAccountIds });
    if (!document) return null;
    return serializeInvoice(target, document);
};

// The invoice as it would read with a billed-to not saved yet, for the page's live preview.
const previewCommissionInvoice = async ({ vendorId, source, id, ledgerAccountIds, billedTo }) => {
    const document = await documentOf({ vendorId, source, id, ledgerAccountIds });
    if (!document) return null;
    const payload = billedTo ? withBilledToEdits(document.payload, { billedTo }) : document.payload;
    return {
        html: taxInvoiceTemplate(payload),
        placeOfSupply: payload.placeOfSupply || "",
        taxCase: taxCaseOf(payload),
        taxLines: Array.isArray(payload.taxLines) ? payload.taxLines : [],
    };
};

const auditRowOf = ({ target, actor, changes }) => {
    const context = currentContext() || {};
    const actorId = actor && actor.id != null ? actor.id : context.actorId;
    return {
        actorId: actorId == null ? null : actorId,
        source: context.source || ACCOUNTING_PORTAL,
        configType: LEDGER_AUDIT_TYPES.invoice,
        action: "UPDATE",
        targetTable: target.table,
        targetId: target.row.id,
        targetLabel: `${target.contact.vendorName} › Invoice ${target.invoiceNumber}`.slice(0, LABEL_LIMIT),
        partnerName: null,
        ipAddress: context.ipAddress || null,
        changes,
    };
};

const persistEdits = async (target, edits, transaction) => {
    if (target.source === SOURCES.manual) {
        await vendorLedgerEntries.update(
            { documentEdits: edits },
            { where: { id: target.row.id }, transaction }
        );
        return;
    }
    const details = parseJson(target.row.pekoInvoiceDetails) || {};
    await order.update(
        { pekoInvoiceDetails: { ...details, vendor: { ...(details.vendor || {}), edits } } },
        { where: { id: target.row.id }, transaction }
    );
};

const effectiveBilledTo = target =>
    billedToOf(withBilledToEdits({ billedTo: target.originalBilledTo }, target.edits).billedTo);

const saveBilledTo = async ({ vendorId, source, id, ledgerAccountIds, billedTo, actor }) => {
    const target = await loadTarget({ vendorId, source, id });
    if (!target) return { outcome: OUTCOMES.missing };

    const current = effectiveBilledTo(target);
    const next = billedToOf(billedTo);
    const changes = BILLED_TO_FIELDS.filter(field => current[field] !== next[field]).map(field => ({
        field,
        from: current[field] || null,
        to: next[field] || null,
    }));
    const before = taxPlacement(current);
    const after = taxPlacement(next);
    if (changes.length && before.placeOfSupply !== after.placeOfSupply) {
        changes.push({ field: "placeOfSupply", from: before.placeOfSupply || null, to: after.placeOfSupply || null });
    }
    if (changes.length && before.taxCase !== after.taxCase) {
        changes.push({ field: "taxCase", from: before.taxCase, to: after.taxCase });
    }
    if (!changes.length) {
        return {
            outcome: OUTCOMES.unchanged,
            invoice: await loadCommissionInvoice({ vendorId, source, id, ledgerAccountIds }),
        };
    }

    const edits = {
        ...(target.edits || {}),
        billedTo: next,
        editedAt: new Date().toISOString(),
        editedById: actor && actor.id != null ? actor.id : null,
        editedByName: (actor && actor.name) || null,
    };
    await sequelizeConfig.transaction(async transaction => {
        await persistEdits(target, edits, transaction);
        await configAuditLog.create(auditRowOf({ target, actor, changes }), { transaction });
    });

    return {
        outcome: OUTCOMES.updated,
        invoice: await loadCommissionInvoice({ vendorId, source, id, ledgerAccountIds }),
    };
};

const normaliseRecipients = to =>
    [...new Set((Array.isArray(to) ? to : [to]).map(value => String(value || "").trim().toLowerCase()))].filter(
        Boolean
    );

const emailInvoice = ({ recipients, subject, html, attachment }) =>
    new Promise((resolve, reject) => {
        emailer.emailWithMultipleAttachment(recipients, subject, html, [attachment], (error, info) =>
            error ? reject(error) : resolve(info)
        );
    });

const sendInvoice = async ({ vendorId, source, id, ledgerAccountIds, to, actor }) => {
    const target = await loadTarget({ vendorId, source, id });
    if (!target) return { outcome: OUTCOMES.missing };
    const document = await documentOf({ vendorId, source, id, ledgerAccountIds });
    if (!document) return { outcome: OUTCOMES.missing };

    const pdf = await renderPdf(taxInvoiceTemplate(document.payload));
    if (!isPdfBuffer(pdf)) return { outcome: OUTCOMES.renderFailed };

    const recipients = normaliseRecipients(to);
    try {
        await emailInvoice({
            recipients,
            subject: EMAIL_SUBJECT,
            html: vendorInvoiceEmail({
                vendorName: target.contact.vendorName,
                invoiceNumber: document.number,
                documentTitle: document.payload.documentTitle,
            }),
            attachment: {
                filename: documentFileName(target.contact.vendorName, document.payload),
                content: pdf,
            },
        });
    } catch (error) {
        customLog(null, "error", {
            message: "Commission invoice email failed",
            vendorId,
            source,
            id,
            error: error && error.message,
        });
        return { outcome: OUTCOMES.sendFailed, reason: (error && error.message) || "Email failed" };
    }

    const send = {
        to: recipients,
        at: new Date().toISOString(),
        byId: actor && actor.id != null ? actor.id : null,
        byName: (actor && actor.name) || null,
    };
    const edits = {
        ...(target.edits || {}),
        sends: [send, ...sendsOf(target.edits)].slice(0, MAX_SENDS_KEPT),
    };
    await sequelizeConfig.transaction(async transaction => {
        await persistEdits(target, edits, transaction);
        await configAuditLog.create(
            auditRowOf({
                target,
                actor,
                changes: [{ field: SENT_TO_FIELD, from: null, to: recipients.join(", ") }],
            }),
            { transaction }
        );
    });

    return {
        outcome: OUTCOMES.sent,
        recipients,
        invoice: await loadCommissionInvoice({ vendorId, source, id, ledgerAccountIds }),
    };
};

module.exports = {
    SOURCES,
    OUTCOMES,
    SENT_TO_FIELD,
    EMAIL_SUBJECT,
    MAX_SENDS_KEPT,
    vendorEmailsOf,
    searchCommissionInvoices,
    loadCommissionInvoice,
    previewCommissionInvoice,
    saveBilledTo,
    sendInvoice,
};
