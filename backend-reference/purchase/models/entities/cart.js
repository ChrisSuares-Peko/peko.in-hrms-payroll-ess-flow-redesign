const Sequelize = require('sequelize');
const sequelize = require("../../configs/database/index");

const Cart = sequelize.define('cart', {
    id: {
        type: Sequelize.BIGINT,
        primaryKey: true,
        autoIncrement: true
    },
    productDetails: Sequelize.TEXT,
    // Cart owner (one of the two). These columns have always existed on the
    // table and every use-case filters by them — without them on the model,
    // Cart.create() silently drops the owner id and the cart becomes orphaned.
    corporateUserId: {
        type: Sequelize.INTEGER,
        allowNull: true
    },
    subCorporateUserId: {
        type: Sequelize.INTEGER,
        allowNull: true
    }
});


module.exports = Cart;