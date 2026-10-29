const operatorsData = require("../../utils/operatorsData.json");

const ONE_TIME_ITEM_KEYS = [operatorsData.corporateCards.accessKey];

const isOneTimeItemOperator = (column = "serviceOperators.accessKey") =>
    `(COALESCE(${column}, '') IN (:oneTimeItemKeys))`;

const isOneTimeItemOrder = (column = "orders.serviceOperatorId") =>
    `COALESCE(${column} IN (SELECT id FROM serviceOperators WHERE accessKey IN (:oneTimeItemKeys)), false)`;

const withOneTimeItemKeys = (replacements = {}) => ({
    ...replacements,
    oneTimeItemKeys: [...ONE_TIME_ITEM_KEYS],
});

module.exports = { ONE_TIME_ITEM_KEYS, isOneTimeItemOperator, isOneTimeItemOrder, withOneTimeItemKeys };
