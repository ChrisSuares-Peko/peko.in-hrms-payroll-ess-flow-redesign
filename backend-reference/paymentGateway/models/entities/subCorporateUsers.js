const Sequelize = require("sequelize");
const sequelizeConfig = require("../../configs/database/index");
const credential = require("./credential");
// const savedCards = require("./savedCards");
const cart = require('./cart')

const SubCorporateUser = sequelizeConfig.define('subCorporateUser', {
    id: {
        type: Sequelize.BIGINT,
        autoIncrement: true,
        primaryKey: true
    },
    name: Sequelize.STRING,
    email: Sequelize.STRING,
    mobileNo: Sequelize.STRING,
    role: Sequelize.STRING,
    services: {
        type: Sequelize.JSON,
        defaultValue: []
    },
    corporateCredentialID: Sequelize.STRING,
    status: {
        type: Sequelize.ENUM(
            'PENDING',
            'ACTIVE',
            'INACTIVE'
        ),
        defaultValue: 'PENDING'
    },
    isDeleted: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
    }
})

SubCorporateUser.belongsTo(credential);
// SubCorporateUser.hasMany(savedCards)
SubCorporateUser.hasOne(cart)

module.exports = SubCorporateUser