const Sequelize = require('sequelize');
const sequelizeConfig = require("../../configs/database/index");
const corporateUser = require("./corporateUser")

const invoiceSupplier = sequelizeConfig.define('invoiceSuppliers', {
    id: {
        type: Sequelize.BIGINT,
        primaryKey: true,
        autoIncrement: true
    },
    supplierEmail: Sequelize.STRING,
    kybStatus: {
        type: Sequelize.ENUM('IN PROGRESS', 'APPROVED', 'REJECTED', 'PENDING','UNDER REVIEW'), 
        allowNull: true,
        defaultValue: 'PENDING',
    },
    businessType: {
        type: Sequelize.ENUM('COMPANY', 'INDIVIDUAL'),
        allowNull: true,
        defaultValue: null
    },
    eSignStatus: {
        type: Sequelize.ENUM('E-SIGN PENDING', 'COMPLETED', 'REJECTED'),
        defaultValue: 'E-SIGN PENDING'
    },
    rejectReason: Sequelize.STRING,
    agreementDetails: {
        type: Sequelize.JSON,
        allowNull: true
    }
})

invoiceSupplier.belongsTo(corporateUser)

module.exports = invoiceSupplier

