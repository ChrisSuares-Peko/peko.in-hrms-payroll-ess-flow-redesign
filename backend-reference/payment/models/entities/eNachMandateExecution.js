const { DataTypes } = require('sequelize');
const sequelize = require('../../configs/database/index');
const Credential = require('./credential');
const EnachMandate = require('./eNachMandate');

const EnachMandateExecution = sequelize.define(
  'enachMandateExecution',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    execution_reference_id: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    mandate_reference_id: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    enach_mandate_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: EnachMandate,
        key: 'id',
      },
    },
    corporateUser: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Credential,
        key: 'id',
      },
    },
    decentro_mandate_id: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    decentro_txn_id: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    transaction_reference: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    payment_date: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    amount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'INITIATED',
    },
    processed_or_failed_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    successOrFailDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    settledDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    provider_response: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: {},
    },
    transactionId: {
      type: DataTypes.STRING,
      allowNull: true,
    }
  }
);

EnachMandateExecution.addHook('beforeCreate', async (record) => {
  const count = await EnachMandateExecution.count();
  const next = count + 1;
  record.transactionId = `PYTEN_TXN${String(next).padStart(4, '0')}`;
});
EnachMandateExecution.belongsTo(Credential, {
  foreignKey: 'corporateUser',
  as: 'corporate_credential',
});
EnachMandateExecution.belongsTo(EnachMandate, {
  foreignKey: 'enach_mandate_id',
  as: 'mandate',
});

module.exports = EnachMandateExecution;
