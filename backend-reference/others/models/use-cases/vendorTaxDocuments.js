const order = require("../entities/order");
const { istDay } = require("../../utils/istRange");
const serviceOperator = require("../entities/serviceOperator");
const vendor = require("../entities/vendor");
const { REFUND_KEYS, refundRatio, earnsVendorCommission } = require("./vendorLedger");
const { ENTRY_KINDS, ENTRY_TYPES, findEntry } = require("./vendorLedgerEntries");
const { DEFAULT_GST_RATE, loadGstRate, gstPartsOf } = require("./ledgerGst");
const { GST_STATE_CODES, resolveStateCode, getStateName } = require("../../utils/gstStateCodes");
const { PEKO_COMPANY_DETAILS } = require("../../utils/invoiceTemplate");

const INVOICE_TITLE = "Tax Invoice";
const CREDIT_NOTE_TITLE = "Tax Credit Note";
const INVOICE_NUMBER_LABEL = "Invoice Number";
const CREDIT_NOTE_NUMBER_LABEL = "Credit Note Number";

const INVOICE_PREFIX = "INV-";
const CREDIT_NOTE_PREFIX = "CRN-";

const ENTRY_NOUNS = {
    [ENTRY_KINDS.commission]: "Commission",
    [ENTRY_KINDS.creditNote]: "Credit note",
};

const toNumber = value => Number(value) || 0;

const round2 = value => Math.round((toNumber(value) + Number.EPSILON) * 100) / 100;

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

const hasPayload = data =>
    Boolean(data && typeof data === "object" && !Array.isArray(data) && Object.keys(data).length);

const BILLED_TO_FIELDS = ["companyName", "address", "state", "gstin"];

const TAX_CASES = { interState: "IGST", intraState: "CGST+SGST" };

const text = value => (value === undefined || value === null ? "" : String(value).trim());

const canonicalState = value => {
    const code = value ? resolveStateCode({ stateName: value }) : null;
    return code ? getStateName(code) : value;
};

const billedToOf = source => ({
    companyName: text(source && source.companyName),
    address: text(source && source.address),
    state: canonicalState(
        text(source && (source.state !== undefined && source.state !== null ? source.state : source.cityCountry))
    ),
    gstin: text(source && source.gstin),
});

const templateBilledTo = billedTo => ({
    companyName: billedTo.companyName,
    address: billedTo.address,
    cityCountry: billedTo.state,
    gstin: billedTo.gstin,
});

const partyBilledTo = party =>
    billedToOf({
        companyName: party.vendorName,
        address: party.address,
        state: party.state,
        gstin: party.gstNo,
    });

const GST_STATES = Object.entries(GST_STATE_CODES).map(([code, name]) => ({ code, name }));

const taxPlacement = billedTo => {
    const seller = resolveStateCode({ gstNumber: PEKO_COMPANY_DETAILS.gstin });
    const party = resolveStateCode({ gstNumber: billedTo.gstin, stateName: billedTo.state });
    const interState = Boolean(seller && party && seller !== party);
    const code = party || seller;
    return {
        interState,
        stateCode: party || null,
        placeOfSupply: code ? `${getStateName(code)} (${code})` : "",
        taxCase: interState ? TAX_CASES.interState : TAX_CASES.intraState,
    };
};

const taxAmountOf = payload => {
    if (Array.isArray(payload.taxLines) && payload.taxLines.length) {
        return round2(payload.taxLines.reduce((sum, line) => sum + toNumber(line.amount), 0));
    }
    if (payload.taxAmount !== undefined) return round2(payload.taxAmount);
    return round2((payload.items || []).reduce((sum, item) => sum + toNumber(item.vat), 0));
};

const taxCaseOf = payload => {
    const lines = Array.isArray(payload.taxLines) ? payload.taxLines : [];
    if (lines.some(line => /^IGST/i.test(String(line.label || "")))) return TAX_CASES.interState;
    if (lines.length) return TAX_CASES.intraState;
    return taxPlacement(billedToOf(payload.billedTo || {})).taxCase;
};

const gstRateOf = payload => {
    const first = Array.isArray(payload.taxLines) && payload.taxLines[0];
    const label = String((first && first.label) || "");
    const match = /(\d+(?:\.\d+)?)%/.exec(label);
    if (match) {
        const rate = Number(match[1]);
        return /^IGST/i.test(label) ? rate : rate * 2;
    }
    const taxable = toNumber(payload.subtotal);
    return taxable > 0 ? Math.round((taxAmountOf(payload) / taxable) * 100) : DEFAULT_GST_RATE;
};

const pickBilledTo = saved =>
    Object.fromEntries(
        BILLED_TO_FIELDS.filter(field => saved[field] !== undefined && saved[field] !== null).map(
            field => [field, text(saved[field])]
        )
    );

const withBilledToEdits = (payload, edits) => {
    const saved = edits && edits.billedTo;
    if (!hasPayload(saved)) return payload;
    const merged = { ...billedToOf(payload.billedTo || {}), ...pickBilledTo(saved) };
    const placement = taxPlacement(merged);
    const flipped = placement.taxCase !== taxCaseOf(payload);
    return {
        ...payload,
        billedTo: templateBilledTo(merged),
        placeOfSupply: placement.placeOfSupply || payload.placeOfSupply || "",
        taxLines: flipped
            ? taxLinesFor(taxAmountOf(payload), gstRateOf(payload), placement.interState)
            : payload.taxLines,
    };
};

const storedEditsFor = row => {
    const details = parseJson(row && row.pekoInvoiceDetails);
    const edits = details && details.vendor && details.vendor.edits;
    return hasPayload(edits) ? edits : null;
};

const entryEditsFor = entry => {
    const edits = parseJson(entry && entry.documentEdits);
    return hasPayload(edits) ? edits : null;
};


// Only the invoice the gateway actually raised at payment time, never a retroactive one,
// which is the same rule the order journal download already follows.
const storedInvoiceFor = row => {
    const details = parseJson(row && row.pekoInvoiceDetails);
    const data = details && details.vendor && details.vendor.invoiceData;
    return hasPayload(data) ? data : null;
};

// Derived, not minted, so the same refund downloads under the same number every time.
const creditNoteNumberFor = (invoiceNumber, fallback = "") => {
    const source = String(invoiceNumber || "").trim();
    if (!source) return String(fallback || "");
    return source.startsWith(INVOICE_PREFIX)
        ? `${CREDIT_NOTE_PREFIX}${source.slice(INVOICE_PREFIX.length)}`
        : `${CREDIT_NOTE_PREFIX}${source}`;
};

const scaleMoney = (value, factor) => round2(toNumber(value) * factor);

const scaleItem = (item, factor) => ({
    ...item,
    price: scaleMoney(item.price, factor),
    taxableAmount: scaleMoney(item.taxableAmount, factor),
    vat: scaleMoney(item.vat, factor),
    lineTotal: scaleMoney(item.lineTotal, factor),
});

const scalePayload = (payload, factor) => {
    const scaled = {
        ...payload,
        items: (payload.items || []).map(item => scaleItem(item, factor)),
        subtotal: scaleMoney(payload.subtotal, factor),
        taxLines: (payload.taxLines || []).map(line => ({
            ...line,
            amount: scaleMoney(line.amount, factor),
        })),
        total: scaleMoney(payload.total, factor),
    };
    if (payload.taxAmount !== undefined) {
        scaled.taxAmount = scaleMoney(payload.taxAmount, factor);
    }
    return scaled;
};

const asInvoice = payload => ({
    ...payload,
    documentTitle: INVOICE_TITLE,
    numberLabel: INVOICE_NUMBER_LABEL,
    againstInvoiceNumber: "",
});

const asCreditNote = (payload, { ratio = 1, number, againstInvoiceNumber, issuedDate } = {}) => {
    const share = Math.abs(toNumber(ratio));
    const scaled = scalePayload(payload, -share);

    return {
        ...scaled,
        documentTitle: CREDIT_NOTE_TITLE,
        numberLabel: CREDIT_NOTE_NUMBER_LABEL,
        invoiceNumber: number || creditNoteNumberFor(payload.invoiceNumber),
        againstInvoiceNumber: againstInvoiceNumber || "",
        issuedDate: issuedDate ? dayOf(issuedDate) : payload.issuedDate,
    };
};

const taxLinesFor = (taxAmount, gstRate, interState) =>
    interState
        ? [{ label: `IGST (${gstRate}%)`, amount: round2(taxAmount) }]
        : [
              { label: `CGST (${gstRate / 2}%)`, amount: round2(toNumber(taxAmount) / 2) },
              { label: `SGST (${gstRate / 2}%)`, amount: round2(toNumber(taxAmount) / 2) },
          ];

// A commission raises an invoice and its reversal a credit note; a credit note is the
// other way round, so the direction is the kind exclusive-or the reversal.
const isCreditNoteEntry = entry =>
    (entry.kind === ENTRY_KINDS.creditNote) !== (entry.entryType === ENTRY_TYPES.reversal);

const manualDocumentPayload = ({ entry, party, gstRate }) => {
    const parts = gstPartsOf(entry, gstRate);
    const amount = parts.amount;
    const split = { actualAmount: parts.taxableAmount, taxAmount: parts.gstAmount };

    const edits = entryEditsFor(entry);
    const billedTo = {
        ...partyBilledTo(party),
        ...(edits && hasPayload(edits.billedTo) ? pickBilledTo(edits.billedTo) : {}),
    };
    const placement = taxPlacement(billedTo);
    const noun = ENTRY_NOUNS[entry.kind] || ENTRY_NOUNS[ENTRY_KINDS.creditNote];

    return {
        invoiceNumber: entry.entryNumber,
        issuedDate: dayOf(entry.issueDate),
        dueDate: dayOf(entry.issueDate),
        placeOfSupply: placement.placeOfSupply,
        billedTo: templateBilledTo(billedTo),
        items: [
            {
                description: entry.reason ? `${noun} — ${entry.reason}` : noun,
                quantity: 1,
                price: split.actualAmount,
                taxableAmount: split.actualAmount,
                vat: split.taxAmount,
                lineTotal: amount,
            },
        ],
        subtotal: split.actualAmount,
        taxLines: taxLinesFor(split.taxAmount, parts.gstRate, placement.interState),
        total: amount,
    };
};

const manualDocumentNumber = entry => entry.entryNumber;

const manualAgainstNumber = (entry, creditNote, reversed = null) =>
    creditNote && entry.entryType === ENTRY_TYPES.reversal
        ? (reversed && reversed.entryNumber) || entry.reference
        : entry.againstCorporateTxnId || "";

const VENDOR_PARTY_ATTRIBUTES = ["id", "vendorName", "gstNo", "state", "address"];

const findVendorParty = async vendorId =>
    vendor.findOne({ attributes: VENDOR_PARTY_ATTRIBUTES, where: { id: vendorId }, raw: true });

const findVendorOrder = async ({ vendorId, corporateTxnId }) =>
    order.findOne({
        attributes: ["id", "corporateTxnId", "transactionDate", "pekoInvoiceDetails", "journalData"],
        where: { corporateTxnId, "$serviceOperator.vendorId$": vendorId },
        include: [
            { model: serviceOperator, attributes: ["id", "vendorId", "commissionMode"], required: true },
        ],
        order: [["id", "DESC"]],
        subQuery: false,
        raw: true,
        nest: true,
    });

const refundEventDate = (journalData, fallback) => {
    const dates = REFUND_KEYS.map(key => journalData && journalData[key] && journalData[key].journalDate)
        .filter(Boolean)
        .map(dayOf)
        .sort();
    return dates.length ? dates[dates.length - 1] : dayOf(fallback);
};

// The route is addressable on its own, so the rule the tabs apply is applied again here
// rather than relying on the button being hidden.
const orderInvoiceDocument = async ({ vendorId, corporateTxnId, ledgerAccountIds }) => {
    const row = await findVendorOrder({ vendorId, corporateTxnId });
    const stored = storedInvoiceFor(row);
    if (!stored) return null;
    const operatorMode = row.serviceOperator && row.serviceOperator.commissionMode;
    if (!earnsVendorCommission(parseJson(row.journalData), ledgerAccountIds, operatorMode)) {
        return null;
    }

    return {
        payload: asInvoice(withBilledToEdits(stored, storedEditsFor(row))),
        number: stored.invoiceNumber,
    };
};

const orderCreditNoteDocument = async ({ vendorId, corporateTxnId, accountIds }) => {
    const row = await findVendorOrder({ vendorId, corporateTxnId });
    const stored = storedInvoiceFor(row);
    if (!stored) return null;

    const journalData = parseJson(row.journalData);
    const ratio = refundRatio(journalData, accountIds);
    if (!(ratio > 0)) return null;

    const number = creditNoteNumberFor(stored.invoiceNumber, corporateTxnId);

    return {
        payload: asCreditNote(withBilledToEdits(stored, storedEditsFor(row)), {
            ratio,
            number,
            againstInvoiceNumber: stored.invoiceNumber,
            issuedDate: refundEventDate(journalData, row.transactionDate),
        }),
        number,
    };
};

const manualEntryDocument = async ({ vendorId, id, kind }) => {
    const entry = await findEntry({ id, vendorId, kind });
    if (!entry) return null;

    const reversed = entry.reversesId ? await findEntry({ id: entry.reversesId, vendorId }) : null;
    const party = await findVendorParty(vendorId);
    if (!party) return null;

    const gstRate = await loadGstRate();
    const payload = manualDocumentPayload({ entry, party, gstRate });
    const creditNote = isCreditNoteEntry(entry);

    if (!creditNote) {
        return { payload: asInvoice(payload), number: entry.entryNumber };
    }

    const number = manualDocumentNumber(entry);

    return {
        payload: asCreditNote(payload, {
            ratio: 1,
            number,
            againstInvoiceNumber: manualAgainstNumber(entry, creditNote, reversed),
        }),
        number,
    };
};

const documentFileName = (vendorName, payload) => {
    const safe = value => String(value || "").replace(/[/\\:*?"<>|]/g, "-").trim();
    return `${safe(vendorName) || "vendor"} ${safe(payload.documentTitle)} ${safe(
        payload.invoiceNumber
    )}.pdf`;
};

module.exports = {
    INVOICE_TITLE,
    CREDIT_NOTE_TITLE,
    DEFAULT_GST_RATE,
    storedInvoiceFor,
    creditNoteNumberFor,
    scalePayload,
    asInvoice,
    asCreditNote,
    taxLinesFor,
    loadGstRate,
    isCreditNoteEntry,
    manualDocumentPayload,
    manualDocumentNumber,
    manualAgainstNumber,
    findVendorParty,
    findVendorOrder,
    refundEventDate,
    orderInvoiceDocument,
    orderCreditNoteDocument,
    manualEntryDocument,
    documentFileName,
    BILLED_TO_FIELDS,
    TAX_CASES,
    GST_STATES,
    billedToOf,
    templateBilledTo,
    partyBilledTo,
    taxPlacement,
    taxCaseOf,
    gstRateOf,
    withBilledToEdits,
    storedEditsFor,
    entryEditsFor,
};
