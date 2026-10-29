'use strict';

/**
 * Normalise `subCorporateUsers.role` to the two values it is now allowed to hold.
 *
 * The column was a free-text job title ('Accountant', 'Finance Manager', ''), and corporate-cards now resolves
 * it to a permission preset where exactly 'Admin' means corporate-wide card authority. Two problems follow
 * from leaving the legacy values in place:
 *
 *   1. Anything that is not exactly 'Admin' already resolves to Employee server-side, so the stored value and
 *      the effective one disagree — every listing, export and audit line shows a role the system does not act
 *      on, and an admin editing that member sees a value they cannot re-save.
 *   2. A row whose title happens to be exactly 'Admin' is PROMOTED by the deploy itself. That is the case this
 *      migration must be run for, and it is why it cannot wait.
 *
 * Deliberately conservative: only an exact case-insensitive 'admin' becomes 'Admin'. A row reading
 * 'Admin Assistant' or 'Administrator' is a job title, not a grant, and becomes Employee like everything else.
 *
 * Irreversible by design — `down` is a no-op. The original free-text titles are not recoverable from the two
 * canonical values, and restoring them would re-open the promotion the `up` closes.
 */
module.exports = {
    up: async (queryInterface) => {
        const [rows] = await queryInterface.sequelize.query(
            "SHOW TABLES LIKE 'subCorporateUsers'"
        );
        if (!rows.length) return;

        // Exact case-insensitive 'admin' (allowing stray whitespace) is the only value treated as a grant.
        await queryInterface.sequelize.query(
            "UPDATE `subCorporateUsers` SET `role` = 'Admin' WHERE LOWER(TRIM(`role`)) = 'admin'"
        );

        // Everything else — legacy titles, empty strings, NULL — becomes the default role.
        await queryInterface.sequelize.query(
            "UPDATE `subCorporateUsers` SET `role` = 'Employee' WHERE `role` IS NULL OR `role` <> 'Admin'"
        );
    },

    down: async () => {},
};
