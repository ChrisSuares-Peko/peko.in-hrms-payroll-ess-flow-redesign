'use strict'
const Sequelize = require('sequelize')
const sequelizeConfig = require('../../configs/database/index')

const corporateCardAdminApplication = sequelizeConfig.define(
    'corporateCardAdminApplication',
    {
        id: { type: Sequelize.BIGINT, primaryKey: true, autoIncrement: true },
        corporateId: { type: Sequelize.INTEGER, allowNull: false, unique: true },
        kybStatus: { type: Sequelize.STRING, allowNull: true },
        kybReference: { type: Sequelize.STRING, allowNull: true },
        businessType: { type: Sequelize.STRING, allowNull: true },
        agreementSignMethod: { type: Sequelize.STRING, allowNull: true },
        esignStatus: { type: Sequelize.STRING, allowNull: true },
        esignReference: { type: Sequelize.STRING, allowNull: true },
        esignSigningLink: { type: Sequelize.STRING(1000), allowNull: true },
        esignSentAt: { type: Sequelize.DATE, allowNull: true },
        esignSignedAt: { type: Sequelize.DATE, allowNull: true },
        esignFailureReason: { type: Sequelize.STRING(500), allowNull: true },
        vendorEmailStatus: { type: Sequelize.BOOLEAN, allowNull: true },
        vendorEmailSentAt: { type: Sequelize.DATE, allowNull: true },
        cardSchemeId: { type: Sequelize.INTEGER, allowNull: true },
        svcCardNumber: { type: Sequelize.STRING(19), allowNull: true, unique: true },
        virtualAccount: { type: Sequelize.JSON, allowNull: true },
        metadata: { type: Sequelize.JSON, allowNull: true },
        notificationControls: { type: Sequelize.JSON, allowNull: true },
        createdByCredentialId: { type: Sequelize.INTEGER, allowNull: true },
        isDeleted: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
    },
    { tableName: 'corporateCardAdminApplications' }
)

module.exports = corporateCardAdminApplication
