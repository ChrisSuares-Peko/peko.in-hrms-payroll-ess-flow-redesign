'use strict'

const TABLE = 'users'
const CARD_SERVICE_LABEL = 'Corporate Cards'
const STATUS_INDEX = 'users_corporateUserId_cardStatus_idx'

module.exports = {
    async up(queryInterface, Sequelize) {
        const desc = await queryInterface.describeTable(TABLE)

        // Folds whatever the dedicated columns held into one membership entry, so a row granted Corporate
        // Cards before this keeps exactly the role and status it had.
        if (desc.cardRole) {
            await queryInterface.sequelize.query(
                'UPDATE `' + TABLE + '` SET `userAccessService` = JSON_SET('
                + " COALESCE(`userAccessService`, JSON_OBJECT('permission', JSON_ARRAY())),"
                + " '$.permission', JSON_ARRAY_APPEND("
                + "   COALESCE(JSON_EXTRACT(`userAccessService`, '$.permission'), JSON_ARRAY()), '$',"
                + "   JSON_OBJECT('label', :label, 'hasAccess', IF(`cardStatus` = 'INACTIVE', false, true),"
                + "     'role', `cardRole`, 'status', COALESCE(`cardStatus`, 'ACTIVE'), 'ref', NULL)))"
                + ' WHERE `cardRole` IS NOT NULL'
                + " AND NOT JSON_CONTAINS(COALESCE(JSON_EXTRACT(`userAccessService`, '$.permission'), JSON_ARRAY()),"
                + '   JSON_OBJECT(\'label\', :label), \'$\')',
                { replacements: { label: CARD_SERVICE_LABEL }, type: Sequelize.QueryTypes.UPDATE }
            )
        }

        const indexes = await queryInterface.showIndex(TABLE)
        if (indexes.some((index) => index.name === STATUS_INDEX)) {
            await queryInterface.removeIndex(TABLE, STATUS_INDEX)
        }
        if (desc.cardStatus) await queryInterface.removeColumn(TABLE, 'cardStatus')
        if (desc.cardRole) await queryInterface.removeColumn(TABLE, 'cardRole')
        if (desc.services) await queryInterface.removeColumn(TABLE, 'services')
    },

    async down(queryInterface, Sequelize) {
        const desc = await queryInterface.describeTable(TABLE)
        if (!desc.cardRole) {
            await queryInterface.addColumn(TABLE, 'cardRole', { type: Sequelize.STRING, allowNull: true })
        }
        if (!desc.cardStatus) {
            await queryInterface.addColumn(TABLE, 'cardStatus', {
                type: Sequelize.ENUM('PENDING', 'ACTIVE', 'INACTIVE'),
                allowNull: true,
            })
        }
        if (!desc.services) {
            await queryInterface.addColumn(TABLE, 'services', { type: Sequelize.JSON, allowNull: true })
        }

        await queryInterface.sequelize.query(
            'UPDATE `' + TABLE + '` u'
            + ' JOIN JSON_TABLE(COALESCE(JSON_EXTRACT(u.`userAccessService`, \'$.permission\'), JSON_ARRAY()),'
            + "   '$[*]' COLUMNS (label VARCHAR(191) PATH '$.label', role VARCHAR(50) PATH '$.role',"
            + "     status VARCHAR(20) PATH '$.status')) m ON m.label = :label"
            + ' SET u.`cardRole` = m.role, u.`cardStatus` = m.status',
            { replacements: { label: CARD_SERVICE_LABEL }, type: Sequelize.QueryTypes.UPDATE }
        )

        const indexes = await queryInterface.showIndex(TABLE)
        if (!indexes.some((index) => index.name === STATUS_INDEX)) {
            await queryInterface.addIndex(TABLE, ['corporateUserId', 'cardStatus'], { name: STATUS_INDEX })
        }
    },
}
