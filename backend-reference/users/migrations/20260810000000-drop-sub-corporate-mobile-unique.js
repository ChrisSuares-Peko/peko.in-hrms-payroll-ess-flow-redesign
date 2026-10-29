'use strict';

/**
 * Drops the `subCorporateUsers.mobileNo` unique index.
 *
 * That index was added on the premise that a mobile number identifies one cardholder, because corporateCard's
 * `cardholderKyc` is unique on `mobileNumber` and looked up by mobile alone. The product decision is that
 * duplicates ARE allowed — one person may hold more than one cardholder row (commonly the account owner, who
 * is also a member) — so the constraint is wrong and blocks a legitimate write.
 *
 * The consequence is deliberate and worth knowing: with two rows sharing a number, whichever completes KYC
 * first owns the `cardholderKyc` record that both resolve to.
 *
 * Guarded both ways, because the index may never have been created: the migration that added it skipped
 * itself whenever duplicates already existed.
 */
const INDEX_NAME = 'subCorporateUsers_mobileNo_unique';

module.exports = {
    up: async (queryInterface) => {
        const [existing] = await queryInterface.sequelize.query(
            `SHOW INDEX FROM \`subCorporateUsers\` WHERE Key_name = '${INDEX_NAME}'`
        );
        if (!existing.length) return;
        await queryInterface.removeIndex('subCorporateUsers', INDEX_NAME);
    },

    // Not reinstated: duplicates are permitted by design now, so recreating it would fail on live data.
    down: async () => {},
};
