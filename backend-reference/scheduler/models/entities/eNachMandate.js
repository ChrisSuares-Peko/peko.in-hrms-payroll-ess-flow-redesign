const { DataTypes } = require('sequelize');
const sequelize = require("../../configs/database/index");
const Credential = require("./credential");

const EnachMandate = sequelize.define(
  'enachMandate',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    customer_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    customer_phone: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    customer_email: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    account_number: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    account_type: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    bank_code: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    authentication_mode: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    amount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },
    frequency: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'E.g. ONETIME, MONTHLY, etc.',
    },
    start_date: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    end_date: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    amount_rule: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "FIXED",
      comment: 'Amount Rule, e.g., FIXED, MAX',
    },
    category_code: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "OTH",
      comment: 'Mandate Category Code',
    },
    reference_id: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      comment: "Request reference id (our system)",
    },
    decentro_txn_id: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: "Transaction id from provider",
    },
    decentro_mandate_id: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: "Mandate id from provider",
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'PENDING',
    },
    uistreams: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: true,
      comment: 'Whether UISTREAMS is enabled',
    },
    corporateUser: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'FK to credential table',
      references: {
        model: Credential,
        key: 'id'
      }
    },
    mandate_link: {
      type: DataTypes.STRING,
      allowNull: true,
    }
  }
);

// Setup association for the foreign key
EnachMandate.belongsTo(Credential, { foreignKey: 'corporateUser', as: 'corporate_credential' });

module.exports = EnachMandate;
