const Sequelize = require("sequelize");
const sequelizeConfig = require("../../configs/database/index");

const credential = require("./credential");

const shipmentOrders = sequelizeConfig.define("shipmentOrders", {
  id: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  status: Sequelize.STRING,
  senderAddress: Sequelize.JSON,
  receiverAddress: Sequelize.JSON,
  shipmentDetails: Sequelize.JSON,
  amount: {
    type: Sequelize.FLOAT,
    allowNull: false,
  },
  weight: Sequelize.FLOAT,
  items: Sequelize.JSON,
  trackingDetails: Sequelize.JSON,
  corporateTxnId: Sequelize.STRING,
  vendorOrderId: Sequelize.STRING,
  shipmentId: Sequelize.STRING,
  trackingNo: Sequelize.STRING,
  shipmentType: Sequelize.STRING,
  returnDetails: Sequelize.JSON,
  trackingUrl: Sequelize.STRING,
  consentAgreed: Sequelize.BOOLEAN,
  consentAt: Sequelize.DATE,
  businessPanUrl: Sequelize.STRING,
});

shipmentOrders.belongsTo(credential)


module.exports = shipmentOrders;
