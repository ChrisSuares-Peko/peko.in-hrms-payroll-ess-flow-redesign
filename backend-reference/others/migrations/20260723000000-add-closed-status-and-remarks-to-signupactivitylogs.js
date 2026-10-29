'use strict';

// Brings the shared `signUpActivityLogs` table up to the admin Pending Sign-ups
// feature's needs: a 'CLOSED' status the admin edit can set, and a `remarks`
// column. The table is otherwise sync-managed (sequelize.sync({force:false})),
// so this migration is idempotent and tolerant of both orderings (migrate-first
// on a fresh DB, or sync-first with the table already present).

const TABLE = 'signUpActivityLogs';
const REMARKS_LENGTH = 2000;

module.exports = {
    async up(queryInterface, Sequelize) {
        const sequelize = queryInterface.sequelize;

        let description = null;
        try {
            description = await queryInterface.describeTable(TABLE);
        } catch (err) {
            description = null; // table not created yet
        }

        // Fresh DB, migrate ran before the service could sync — create it whole.
        if (!description) {
            await queryInterface.createTable(TABLE, {
                id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
                contactPersonName: Sequelize.STRING,
                companyName: Sequelize.STRING,
                email: Sequelize.STRING,
                mobileNo: Sequelize.STRING,
                referralCode: Sequelize.STRING,
                isPasswordCreated: { type: Sequelize.BOOLEAN, defaultValue: false },
                isEmailOTPValidated: { type: Sequelize.BOOLEAN, defaultValue: false },
                isMobileOTPValidated: { type: Sequelize.BOOLEAN, defaultValue: false },
                status: {
                    type: Sequelize.ENUM('PENDING', 'COMPLETED', 'CLOSED'),
                    defaultValue: 'PENDING',
                },
                remarks: Sequelize.STRING(REMARKS_LENGTH),
                partnerId: Sequelize.STRING,
                createdAt: {
                    type: Sequelize.DATE,
                    allowNull: false,
                    defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
                },
                updatedAt: {
                    type: Sequelize.DATE,
                    allowNull: false,
                    defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
                },
            });
            return;
        }

        // Table already exists — widen the ENUM (MODIFY is a no-op if already wide)
        // and add `remarks` only when missing.
        await sequelize.query(
            "ALTER TABLE `signUpActivityLogs` MODIFY COLUMN `status` " +
                "ENUM('PENDING','COMPLETED','CLOSED') DEFAULT 'PENDING'"
        );

        if (!description.remarks) {
            await queryInterface.addColumn(TABLE, 'remarks', {
                type: Sequelize.STRING(REMARKS_LENGTH),
                allowNull: true,
            });
        }
    },

    async down(queryInterface) {
        const sequelize = queryInterface.sequelize;

        let description = null;
        try {
            description = await queryInterface.describeTable(TABLE);
        } catch (err) {
            return; // nothing to roll back
        }

        if (description.remarks) {
            await queryInterface.removeColumn(TABLE, 'remarks');
        }

        // Collapse CLOSED rows first so narrowing the ENUM can't fail on data.
        await sequelize.query(
            "UPDATE `signUpActivityLogs` SET `status` = 'PENDING' WHERE `status` = 'CLOSED'"
        );
        await sequelize.query(
            "ALTER TABLE `signUpActivityLogs` MODIFY COLUMN `status` " +
                "ENUM('PENDING','COMPLETED') DEFAULT 'PENDING'"
        );
    },
};
