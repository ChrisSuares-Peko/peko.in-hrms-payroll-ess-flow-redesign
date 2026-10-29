'use strict';
const ServiceCart = require('../entities/serviceCart');

const CART_ITEM_TYPE = 'domainAndHosting';

const buildWhereClause = ({ corporateUserId, subCorporateUserId }) => {
    const whereClause = { itemType: CART_ITEM_TYPE };
    if (subCorporateUserId) {
        whereClause.subCorporateUserId = subCorporateUserId;
    } else {
        whereClause.corporateUserId = corporateUserId;
    }
    return whereClause;
};

const getAllProductsInMyCart = async ({ corporateUserId, subCorporateUserId }) => {
    const whereClause = buildWhereClause({ corporateUserId, subCorporateUserId });
    const cartRecord = await ServiceCart.findOne({
        where: whereClause,
        attributes: [['id', 'cartId'], 'itemType', 'productDetails'],
        raw: true
    });
    if (!cartRecord) return -1;
    return {
        cartId: cartRecord.cartId,
        itemType: cartRecord.itemType,
        productsArray: JSON.parse(cartRecord.productDetails || '[]')
    };
};

const clearCart = async ({ corporateUserId, subCorporateUserId }) => {
    const whereClause = buildWhereClause({ corporateUserId, subCorporateUserId });
    await ServiceCart.destroy({ where: whereClause });
    return true;
};

module.exports = { getAllProductsInMyCart, clearCart };
