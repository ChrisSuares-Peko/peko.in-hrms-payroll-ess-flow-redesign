'use strict';

const VIEW_NAME = 'transactionreportview';

// Trimmed definition — same as ORIGINAL_VIEW_SQL below, minus the columns dropped in
// 20260704000002-drop-vat-pgcharge-vendorcost-columns-from-orders.js (vat, pgCharge,
// vendorCost, VATP, amountSurplus, partnerShare, actualEarnings). `amountReceivable`
// is also dropped since its formula depended on the now-removed `pgCharge` column.
// Also fixes a pre-existing bug: JSON_EXTRACT errors (code 3141) when orderResponse is
// an empty string rather than NULL/valid JSON — NULLIF(..., '') normalises '' to NULL first.
const NEW_VIEW_SQL = `
CREATE VIEW ${VIEW_NAME} AS
SELECT
    o.id AS id,
    o.transactionDate AS transactionDate,
    c.name AS customerName,
    CASE
        WHEN o.optional IS NOT NULL
             AND COALESCE(JSON_UNQUOTE(JSON_EXTRACT(NULLIF(o.orderResponse, ''), '$.serviceName')), NULL) IS NULL
        THEN NULL
        ELSE COALESCE(JSON_UNQUOTE(JSON_EXTRACT(NULLIF(o.orderResponse, ''), '$.serviceName')), CONVERT(so.serviceProvider USING utf8mb4))
    END AS service,
    CASE
        WHEN o.optional IS NOT NULL
        THEN CONCAT(UPPER(SUBSTR(CONVERT(o.optional USING utf8mb4), 1, 1)), LOWER(SUBSTR(CONVERT(o.optional USING utf8mb4), 2)))
        ELSE CONVERT(so.serviceCategory USING utf8mb4)
    END AS serviceCategory,
    o.amountInINR AS Amount,
    o.amountInINR AS totalAmount,
    o.paymentMode AS paymentMode,
    v.vendorName AS vendorName,
    credential_registeredby.name AS partner,
    credential_registeredby.id AS partnerId,
    c.username AS corporateId
FROM orders o
LEFT JOIN credentials c ON (c.id = o.credentialId)
LEFT JOIN credentials credential_registeredby ON (c.registeredBy = credential_registeredby.id)
LEFT JOIN serviceOperators so ON (so.id = o.serviceOperatorId)
LEFT JOIN vendors v ON (so.vendorId = v.id)
`;

// Original definition, captured via SHOW CREATE VIEW before this migration — restored on down().
const ORIGINAL_VIEW_SQL = `
CREATE VIEW ${VIEW_NAME} AS
SELECT
    o.id AS id,
    o.transactionDate AS transactionDate,
    c.name AS customerName,
    CASE
        WHEN o.optional IS NOT NULL
             AND COALESCE(JSON_UNQUOTE(JSON_EXTRACT(o.orderResponse, '$.serviceName')), NULL) IS NULL
        THEN NULL
        ELSE COALESCE(JSON_UNQUOTE(JSON_EXTRACT(o.orderResponse, '$.serviceName')), CONVERT(so.serviceProvider USING utf8mb4))
    END AS service,
    CASE
        WHEN o.optional IS NOT NULL
        THEN CONCAT(UPPER(SUBSTR(CONVERT(o.optional USING utf8mb4), 1, 1)), LOWER(SUBSTR(CONVERT(o.optional USING utf8mb4), 2)))
        ELSE CONVERT(so.serviceCategory USING utf8mb4)
    END AS serviceCategory,
    o.amountInINR AS Amount,
    o.vat AS VAT,
    o.amountInINR AS totalAmount,
    o.paymentMode AS paymentMode,
    o.pgCharge AS paymentGatewayCost,
    (o.amountInINR - COALESCE(o.pgCharge, 0)) AS amountReceivable,
    v.vendorName AS vendorName,
    credential_registeredby.name AS partner,
    credential_registeredby.id AS partnerId,
    c.username AS corporateId,
    o.vendorCost AS vendorCost,
    o.VATP AS VATP,
    o.amountSurplus AS amountSurplus,
    o.partnerShare AS partnerShare,
    o.actualEarnings AS actualEarnings
FROM orders o
LEFT JOIN credentials c ON (c.id = o.credentialId)
LEFT JOIN credentials credential_registeredby ON (c.registeredBy = credential_registeredby.id)
LEFT JOIN serviceOperators so ON (so.id = o.serviceOperatorId)
LEFT JOIN vendors v ON (so.vendorId = v.id)
`;

module.exports = {
    async up(queryInterface) {
        await queryInterface.sequelize.query(`DROP VIEW IF EXISTS ${VIEW_NAME}`);
        await queryInterface.sequelize.query(NEW_VIEW_SQL);
    },

    async down(queryInterface) {
        await queryInterface.sequelize.query(`DROP VIEW IF EXISTS ${VIEW_NAME}`);
        await queryInterface.sequelize.query(ORIGINAL_VIEW_SQL);
    },
};
