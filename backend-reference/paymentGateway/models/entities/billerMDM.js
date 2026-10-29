const Sequelize = require("sequelize");
const sequelizeConfig = require("../../configs/database/index");

const billerMDM = sequelizeConfig.define("billerMDM", {
  id: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  billerId: {
    type: Sequelize.STRING,
    allowNull: false,
    unique: true,
  },
  billerName: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  billerCategory: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  billerCoverage: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  status: {
    type: Sequelize.ENUM('active', 'disabled'),
    allowNull: false,
    defaultValue: 'active',
  },
  data: {
    type: Sequelize.JSON,
    allowNull: false,
    defaultValue: {},
  },
}, {
  indexes: [{ fields: ["billerId"] }, { fields: ["billerCategory"] }],
});

module.exports = billerMDM;
