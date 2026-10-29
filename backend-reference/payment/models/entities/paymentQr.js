"use strict";
const Sequelize = require("sequelize");
const sequelizeConfig = require("../../configs/database/index");
const credential = require("./credential");

const paymentQrs = sequelizeConfig.define(
  "paymentQrs",
  {
    id: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    credentialId: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    reference_id: {
      type: Sequelize.STRING,
      allowNull: false,
      unique: true,
    },
    decentro_txn_id: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    amount: {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: false,
    },
    purpose_message: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    status: {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: "PENDING",
    },
    dynamic_qr_image: {
      type: Sequelize.TEXT,
      allowNull: true,
    },
    expireDate: {
      type: Sequelize.DATE,
      allowNull: true,
    },
    successOrFailDate: {
      type: Sequelize.DATE,
      allowNull: true,
    },
    settledDate: {
      type: Sequelize.DATE,
      allowNull: true,
    },
    transactionId: {
      type: Sequelize.STRING,
      allowNull: true,
    }
  },
  {
    tableName: "paymentQrs",
  }
);
paymentQrs.addHook('beforeCreate', async (record) => {
  const count = await paymentQrs.count();
  const next = count + 1;
  record.transactionId = `PYTQR_TXN${String(next).padStart(4, '0')}`;
});
paymentQrs.belongsTo(credential, { foreignKey: "credentialId" });

module.exports = paymentQrs;
