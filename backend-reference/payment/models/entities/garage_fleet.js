const Sequelize = require('sequelize');
const sequelizeConfig = require('../../configs/database/index');

// Read view of the garage_fleet table (owned by the officeAndBusiness service, shared DB).
// Used by the traffic-challan fleet flow to read a corporate's vehicle registration numbers.
// Model name matches officeAndBusiness so Sequelize maps to the same `garage_fleets` table.
const garage_fleet = sequelizeConfig.define('garage_fleet', {
    id: {
        type: Sequelize.BIGINT,
        autoIncrement: true,
        primaryKey: true,
    },
    vehicleNumber: {
        type: Sequelize.STRING,
    },
    credentialId: {
        type: Sequelize.BIGINT,
    },
    subCorporateUserId: {
        type: Sequelize.BIGINT,
    },
    isDeleted: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
    },
});

module.exports = garage_fleet;
