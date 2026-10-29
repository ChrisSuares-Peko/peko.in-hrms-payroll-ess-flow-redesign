'use strict';

const INDEXES = [
    { table: 'cardIssuances', name: 'cardIssuances_corp_type_status_idx', fields: ['corporateId', 'cardType', 'status'] },
    { table: 'cardRequests', name: 'cardRequests_card_type_status_idx', fields: ['cardIssuanceId', 'requestType', 'status'] },
];

const hasIndex = async (queryInterface, table, name) => {
    const existing = await queryInterface.showIndex(table);
    return existing.some((index) => index.name === name);
};

module.exports = {
    up: async (queryInterface) => {
        for (const { table, name, fields } of INDEXES) {
            if (await hasIndex(queryInterface, table, name)) continue;
            await queryInterface.addIndex(table, fields, { name });
        }
    },

    down: async (queryInterface) => {
        for (const { table, name } of INDEXES) {
            if (!await hasIndex(queryInterface, table, name)) continue;
            await queryInterface.removeIndex(table, name);
        }
    },
};
