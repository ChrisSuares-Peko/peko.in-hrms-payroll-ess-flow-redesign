// Credit notes and the statement are merged in memory from several sources, so their search
// and filters are applied to the merged lines rather than in SQL.

const lower = value => String(value === null || value === undefined ? "" : value).toLowerCase();

const matches = (searchText, fields) => {
    const needle = lower(searchText);
    return fields.some(field => lower(field).includes(needle));
};

// What the Status pill reads on a credit note: a reversal first, then a voided one, and
// anything else is active.
const creditNoteStatusOf = entry => {
    if (entry.deleted || entry.deletedAt) return "deleted";
    if (entry.entryType === "REVERSAL") return "reversal";
    return entry.status === "VOIDED" ? "reversed" : "active";
};

const CREDIT_NOTE_STATUSES = ["active", "reversal", "reversed", "deleted"];

// A status the tab does not know narrows nothing, as on the other tabs.
const filterCreditNotes = (entries, { searchText, status } = {}) =>
    entries.filter(
        entry =>
            (!CREDIT_NOTE_STATUSES.includes(status) || creditNoteStatusOf(entry) === status) &&
            (!searchText || matches(searchText, [entry.entryNumber, entry.reference, entry.againstCorporateTxnId, entry.reason]))
    );

const STATEMENT_SIDES = { debit: "Debit", credit: "Credit" };

// A statement line sits on one side: the other column is empty.
const filterStatementRows = (rows, { searchText, side } = {}) =>
    rows.filter(row => {
        const onSide =
            !Object.hasOwn(STATEMENT_SIDES, side) || (row[side] !== null && row[side] !== undefined);
        const found =
            !searchText || matches(searchText, [row.particulars, row.reference, row.entryNumber, row.type]);
        return onSide && found;
    });

// What a filtered statement says about itself, for the file it is exported to.
const statementFilterLabel = ({ searchText, side } = {}) =>
    [
        Object.hasOwn(STATEMENT_SIDES, side) ? `${STATEMENT_SIDES[side]} only` : null,
        searchText ? `Search: "${searchText}"` : null,
    ]
        .filter(Boolean)
        .join("  ·  ");

module.exports = {
    STATEMENT_SIDES,
    creditNoteStatusOf,
    filterCreditNotes,
    filterStatementRows,
    statementFilterLabel,
};
