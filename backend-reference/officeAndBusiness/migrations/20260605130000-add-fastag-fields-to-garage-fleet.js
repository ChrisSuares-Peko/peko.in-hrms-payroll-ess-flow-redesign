'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        let table;
        try {
            table = await queryInterface.describeTable('garage_fleets');
        } catch (err) {
            return;
        }
        const columns = {
            fastagProvider: { type: Sequelize.STRING, allowNull: true, defaultValue: null },
            fastagBillerId: { type: Sequelize.STRING, allowNull: true, defaultValue: null },
            fastagRegistration: { type: Sequelize.STRING, allowNull: true, defaultValue: null },
            fastagParamName: { type: Sequelize.STRING, allowNull: true, defaultValue: null },
        };
        for (const [name, def] of Object.entries(columns)) {
            if (!table[name]) {
                await queryInterface.addColumn('garage_fleets', name, def);
            }
        }
    },

    async down(queryInterface) {
        let table;
        try {
            table = await queryInterface.describeTable('garage_fleets');
        } catch (err) {
            return;
        }
        for (const name of ['fastagProvider', 'fastagBillerId', 'fastagRegistration', 'fastagParamName']) {
            if (table[name]) {
                await queryInterface.removeColumn('garage_fleets', name);
            }
        }
    },
};
