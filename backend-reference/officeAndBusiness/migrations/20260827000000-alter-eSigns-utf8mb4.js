'use strict';

module.exports = {
    async up(queryInterface) {
        // Case-insensitive check: showAllTables() can return a different case than the model's
        // table name depending on the MySQL server's lower_case_table_names setting, which
        // previously made this guard silently skip the ALTER on some environments.
        const tables = await queryInterface.showAllTables();
        if (!tables.some((t) => t.toLowerCase() === 'esigns')) return;
        // A column added via a later migration without an explicit charset inherited a mismatched
        // default collation (armscii8_general_ci), causing every eSign.create() insert that touches
        // it to fail with "Conversion from collation utf8mb4_unicode_ci into armscii8_general_ci
        // impossible for parameter". Converting the whole table normalizes every text column (and
        // any added in the future) to the collation the rest of the app expects.
        await queryInterface.sequelize.query(
            'ALTER TABLE eSigns CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;'
        );
    },

    async down(queryInterface) {
        const tables = await queryInterface.showAllTables();
        if (!tables.some((t) => t.toLowerCase() === 'esigns')) return;
        await queryInterface.sequelize.query(
            'ALTER TABLE eSigns CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;'
        );
    },
};
