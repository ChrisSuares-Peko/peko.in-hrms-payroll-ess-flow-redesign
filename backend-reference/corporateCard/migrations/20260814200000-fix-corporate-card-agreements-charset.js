'use strict'

// corporateCardAgreements is the one table created without charset options, so it inherited the server
// default. Staging's default is armscii8, where a non-ASCII entity name or address fails to INSERT.
module.exports = {
    async up(queryInterface) {
        await queryInterface.sequelize.query(
            'ALTER TABLE `corporateCardAgreements` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci'
        )
    },

    async down() {
        // Converting back would risk truncating anything outside the previous character set.
    },
}
