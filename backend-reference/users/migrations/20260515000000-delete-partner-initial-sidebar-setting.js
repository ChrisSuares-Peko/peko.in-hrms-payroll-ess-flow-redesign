'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface) {
        try {
            const [result] = await queryInterface.sequelize.query(
                "DELETE FROM settings WHERE name = 'partnerInitialAccessesibleServices'"
            );
            console.log('[Migration] Deleted partnerInitialAccessesibleServices setting row');
            return result;
        } catch (error) {
            console.error('[Migration] Failed to delete partnerInitialAccessesibleServices setting:', error.message);
            throw error;
        }
    },

    async down() {
        console.log('[Migration] No-op rollback — partnerInitialAccessesibleServices is no longer read at runtime; sidebar is served from code constant.');
    },
};
