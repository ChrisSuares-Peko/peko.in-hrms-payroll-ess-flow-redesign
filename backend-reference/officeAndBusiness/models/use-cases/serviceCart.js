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

const isSameItem = (a, b) => {
    if (a.productId !== b.productId) return false;
    if ((a.planId || null) !== (b.planId || null)) return false;
    // For domain items, the actual domain name must also match
    if (a.itemType === 'domain' || b.itemType === 'domain') {
        return (a.productName || null) === (b.productName || null);
    }
    return true;
};

const addNewProductInCart = async (params, { corporateUserId, subCorporateUserId }) => {
    params.productQuantity = parseInt(params.productQuantity);

    const whereClause = buildWhereClause({ corporateUserId, subCorporateUserId });

    const existingCart = await ServiceCart.findOne({
        where: whereClause,
        attributes: ['productDetails']
    });

    let productsArray = [];
    let isDuplicate = false;

    if (existingCart) {
        productsArray = JSON.parse(existingCart.productDetails || '[]');

        for (let i = 0; i < productsArray.length; i++) {
            if (isSameItem(productsArray[i], params)) {
                productsArray[i].productQuantity += params.productQuantity;
                productsArray[i].totalPrice = parseFloat((productsArray[i].totalPrice + params.totalPrice).toFixed(2));
                isDuplicate = true;
                break;
            }
        }

        if (!isDuplicate) {
            productsArray.push(params);
        }

        await ServiceCart.update(
            { productDetails: JSON.stringify(productsArray) },
            { where: whereClause }
        );

        return isDuplicate ? 'duplicate' : true;
    }

    productsArray = [params];
    const newCart = await ServiceCart.create({
        ...whereClause,
        productDetails: JSON.stringify(productsArray)
    });

    return newCart ? true : false;
};

const updateExistingProductInCart = async (params, unitPrice, unitVat) => {
    try {
        const { productId, planId = null, operation, corporateUserId, subCorporateUserId, productQuantity } = params;
        const whereClause = buildWhereClause({ corporateUserId, subCorporateUserId });

        const cartRecord = await ServiceCart.findOne({
            where: whereClause,
            attributes: ['productDetails']
        });

        if (!cartRecord) return -2;

        let productsArray = JSON.parse(cartRecord.productDetails || '[]');
        const itemIndex = productsArray.findIndex(i => isSameItem(i, { productId, planId }));
        if (itemIndex === -1) return -2;

        const item = productsArray[itemIndex];
        const newQty = operation === 'increase'
            ? parseInt(item.productQuantity) + parseInt(productQuantity)
            : parseInt(item.productQuantity) - parseInt(productQuantity);

        const newPrice = operation === 'increase'
            ? parseFloat(item.totalPrice) + parseFloat(unitPrice)
            : parseFloat(item.totalPrice) - parseFloat(unitPrice);

        const newVat = operation === 'increase'
            ? parseFloat(item.totalVat) + parseFloat(unitVat)
            : parseFloat(item.totalVat) - parseFloat(unitVat);

        if (newQty <= 0) {
            productsArray.splice(itemIndex, 1);
        } else {
            productsArray[itemIndex].productQuantity = newQty;
            productsArray[itemIndex].totalPrice = parseFloat(newPrice.toFixed(2));
            productsArray[itemIndex].totalVat = parseFloat(newVat.toFixed(2));
        }

        if (productsArray.length === 0) {
            await ServiceCart.destroy({ where: whereClause });
            return -1;
        }

        const updated = await ServiceCart.update(
            { productDetails: JSON.stringify(productsArray) },
            { where: whereClause }
        );

        return updated ? { newQuantity: newQty <= 0 ? 0 : newQty } : false;
    } catch (error) {
        throw new Error(error.message || 'Something went wrong while updating the service cart');
    }
};

const patchCartItem = async ({ productId, planId = null, productName = null }, patches, { corporateUserId, subCorporateUserId }) => {
    const whereClause = buildWhereClause({ corporateUserId, subCorporateUserId });

    const cartRecord = await ServiceCart.findOne({ where: whereClause, attributes: ['productDetails'] });
    if (!cartRecord) return -2;

    let productsArray = JSON.parse(cartRecord.productDetails || '[]');
    const itemIndex = productsArray.findIndex(i => isSameItem(i, { productId, planId, productName, itemType: productName ? 'domain' : undefined }));
    if (itemIndex === -1) return -2;

    productsArray[itemIndex] = { ...productsArray[itemIndex], ...patches };

    const updated = await ServiceCart.update(
        { productDetails: JSON.stringify(productsArray) },
        { where: whereClause }
    );

    return updated ? productsArray[itemIndex] : false;
};

const deleteExistingProductInCart = async ({ productId, planId = null, productName = null }, { corporateUserId, subCorporateUserId }) => {
    const whereClause = buildWhereClause({ corporateUserId, subCorporateUserId });

    const cartRecord = await ServiceCart.findOne({
        where: whereClause,
        attributes: ['productDetails']
    });

    if (!cartRecord) return -2;

    let productsArray = JSON.parse(cartRecord.productDetails || '[]');
    const itemIndex = productsArray.findIndex(i =>
        isSameItem(i, { productId, planId, productName, itemType: productName ? 'domain' : undefined })
    );
    if (itemIndex === -1) return -2;

    const removedQty = parseInt(productsArray[itemIndex].productQuantity);
    productsArray.splice(itemIndex, 1);

    if (productsArray.length === 0) {
        await ServiceCart.destroy({ where: whereClause });
        return -1;
    }

    const updated = await ServiceCart.update(
        { productDetails: JSON.stringify(productsArray) },
        { where: whereClause }
    );

    return updated ? removedQty : false;
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

module.exports = {
    addNewProductInCart,
    updateExistingProductInCart,
    patchCartItem,
    deleteExistingProductInCart,
    getAllProductsInMyCart,
    clearCart
};
