const Sequelize = require('sequelize');
const sequelize = require("../../configs/database/index");

const Cart = sequelize.define('cart', {
    id: {
        type: Sequelize.BIGINT,
        primaryKey: true,
        autoIncrement: true
    },
    productDetails: Sequelize.TEXT
});


module.exports = Cart;