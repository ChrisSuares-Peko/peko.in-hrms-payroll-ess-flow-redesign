'use strict'
const Sequelize = require('sequelize')
const sequelizeConfig = require('../../configs/database/index')

const corporateCardLedgerEntry = sequelizeConfig.define(
    'corporateCardLedgerEntry',
    {
        id: { type: Sequelize.BIGINT, primaryKey: true, autoIncrement: true },
        corporateId: { type: Sequelize.INTEGER, allowNull: false },
        entryType: { type: Sequelize.STRING, allowNull: false },
        direction: { type: Sequelize.STRING, allowNull: false },
        amount: { type: Sequelize.DECIMAL(14, 2), allowNull: false },
        description: { type: Sequelize.STRING, allowNull: true },
        reference: { type: Sequelize.STRING, allowNull: true },
        refType: { type: Sequelize.STRING, allowNull: true },
        refId: { type: Sequelize.STRING, allowNull: true },
        occurredAt: { type: Sequelize.DATE, allowNull: false },
        createdByCredentialId: { type: Sequelize.INTEGER, allowNull: true },
        metadata: { type: Sequelize.JSON, allowNull: true },
    },
    { tableName: 'corporateCardLedgerEntries' }
)

module.exports = corporateCardLedgerEntry
