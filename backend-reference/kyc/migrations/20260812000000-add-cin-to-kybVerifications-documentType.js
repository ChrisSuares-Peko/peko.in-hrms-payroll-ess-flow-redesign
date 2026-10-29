'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.changeColumn('kybVerifications', 'documentType', {
            type: Sequelize.ENUM('gst', 'pan', 'cin'),
            allowNull: false,
        });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.changeColumn('kybVerifications', 'documentType', {
            type: Sequelize.ENUM('gst', 'pan'),
            allowNull: false,
        });
    },
};
