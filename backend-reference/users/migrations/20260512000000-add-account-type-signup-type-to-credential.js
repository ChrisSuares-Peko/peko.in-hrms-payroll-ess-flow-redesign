'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        try {
            const tableDesc = await queryInterface.describeTable('credentials');

            if (!tableDesc.accountType) {
                await queryInterface.addColumn('credentials', 'accountType', {
                    type: Sequelize.ENUM('freelancer', 'corporate'),
                    defaultValue: 'corporate',
                    allowNull: true,
                });
                console.log('[Migration] Added accountType column to credentials');
            } else {
                console.log('[Migration] accountType column already exists, skipping');
            }

            if (!tableDesc.signupType) {
                await queryInterface.addColumn('credentials', 'signupType', {
                    type: Sequelize.ENUM('NEW_COMPANY', 'EXISTING_COMPANY', 'FREELANCER', 'COMPLIANCE_HEALTH'),
                    allowNull: true,
                });
                console.log('[Migration] Added signupType column to credentials');
            } else {
                console.log('[Migration] signupType column already exists, skipping');
            }
        } catch (error) {
            console.error('[Migration] Failed to add columns to credentials:', error.message);
            throw error;
        }
    },

    async down(queryInterface) {
        try {
            const tableDesc = await queryInterface.describeTable('credentials');

            if (tableDesc.signupType) {
                await queryInterface.removeColumn('credentials', 'signupType');
                console.log('[Migration] Removed signupType column from credentials');
            } else {
                console.log('[Migration] signupType column does not exist, skipping rollback');
            }

            if (tableDesc.accountType) {
                await queryInterface.removeColumn('credentials', 'accountType');
                console.log('[Migration] Removed accountType column from credentials');
            } else {
                console.log('[Migration] accountType column does not exist, skipping rollback');
            }
        } catch (error) {
            console.error('[Migration] Failed to remove columns from credentials:', error.message);
            throw error;
        }
    },
};
