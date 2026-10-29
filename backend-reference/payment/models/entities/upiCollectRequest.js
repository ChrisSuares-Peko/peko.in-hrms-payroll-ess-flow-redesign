const { DataTypes } = require('sequelize');
const sequelize = require("../../configs/database/index");

const UpiCollectRequest = sequelize.define(
  'UpiCollectRequest',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    payer_upi: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    payer_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    amount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },
    expiry_time: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'in minutes',
    },
    reference_id: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    decentro_txn_id: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'PENDING',
    },
    corporateUser: {
      type: DataTypes.INTEGER,
      allowNull: false,
    }
  },
  {
    tableName: 'upi_collect_requests',
    timestamps: true,
  }
);

module.exports = UpiCollectRequest;