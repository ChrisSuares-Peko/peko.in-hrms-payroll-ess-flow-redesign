const { ledgerStatementTemplate, escapeHtml } = require("./ledgerStatementTemplate");

const VENDOR_STATEMENT_CONVENTION =
    "A debit raises the balance held with the vendor and a credit consumes it. Deposits and commissions are debits, order values and credit notes are credits. A sale Peko made as principal is credited at the vendor's price, without Peko's markup.";

const vendorStatementTemplate = ({ vendorName, range, statement, filterLabel }) =>
    ledgerStatementTemplate({
        partyName: vendorName,
        range,
        statement,
        convention: VENDOR_STATEMENT_CONVENTION,
        filterLabel,
    });

module.exports = { vendorStatementTemplate, escapeHtml };
