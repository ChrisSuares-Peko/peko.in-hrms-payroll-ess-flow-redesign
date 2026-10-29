const Sequelize = require('sequelize');
const sequelizeConfig = require('../../configs/database/index');

const businessRegistrationCatalog = sequelizeConfig.define('businessRegistrationCatalog', {
    id: {
        type: Sequelize.BIGINT,
        primaryKey: true,
        autoIncrement: true,
    },
    vendorCatalogId: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
    },
    serviceId: {
        type: Sequelize.INTEGER,
        allowNull: true,
    },
    serviceName: {
        type: Sequelize.STRING,
        allowNull: true,
    },
    variantName: {
        type: Sequelize.STRING,
        allowNull: true,
    },
    vendorPrice: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
    },
    amount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
    },
    status: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
    },
    sortOrder: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
    },
    commissionMode: {
        type: Sequelize.ENUM('MARGIN', 'AGENT_MARKUP', 'PRINCIPAL_MARKUP'),
        defaultValue: 'MARGIN',
    },
    commissionType: {
        type: Sequelize.ENUM('PERCENTAGE', 'FLAT'),
        defaultValue: 'PERCENTAGE',
    },
    commission: {
        type: Sequelize.DECIMAL(10, 4),
        defaultValue: 0,
    },
    fixedCommissionPerTransaction: {
        type: Sequelize.DECIMAL(10, 4),
        defaultValue: 0,
    },
    isCommissionInclGST: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
    },
    isCommissionConfigured: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false,
    },
}, {
    charset: 'utf8mb4',
    collate: 'utf8mb4_unicode_ci',
});

module.exports = businessRegistrationCatalog;
