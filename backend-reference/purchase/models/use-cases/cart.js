const Products = require('../entities/products')
const Carts = require('../entities/cart')
// const Category = require('./../entities/categories')
const asyncHandler = require('../../middlewares/async')
// const Op = Sequelize.Op;
// const fs = require('fs');
// const moment = require('moment')
const sequelizeConfig = require("../../configs/database");
const { ondcQuantityBounds } = require("../../utils/ondcQuantityBounds");

//here is this function it reject if the product is already added
// eslint-disable-next-line no-unused-vars
const addNewProductInCartOLD = asyncHandler(async function (params, corporateId) {
    let {
        productId
    } = params
    let isDuplicate = ''

    params.productQuantity = parseInt(params.productQuantity)
    let data = {
        productDetails: JSON.stringify([params]),
        corporateUserId: corporateId
    }

    const customerExists = await Carts.findOne({
        where: {
            corporateUserId: corporateId,
        },
        attributes: ['productDetails']
    })
    if (customerExists) {
        let products_array = JSON.parse(customerExists.productDetails);
        let newUpdatedProductsArray = []
        for (let index = 0; index < products_array.length; index++) {
            const newEl = products_array[index];
            if (parseInt(newEl.productId) === parseInt(productId)) {
                isDuplicate = 'yes'
                break;
            } else {
                isDuplicate = 'no'
            }
        }
        if (isDuplicate === 'yes') {
            return 'duplicate'
        }
        for (let index = 0; index < products_array.length; index++) {
            const newEl = products_array[index];
            newUpdatedProductsArray.push(newEl)
            if (index == products_array.length - 1) {
                newUpdatedProductsArray.push(params)
            }
        }
        newUpdatedProductsArray.productQuantity = parseInt(newUpdatedProductsArray.productQuantity)
        let data = {
            productDetails: JSON.stringify(newUpdatedProductsArray)
        }

        return await Carts.update(data, {
            where: {
                corporateUserId: corporateId
            }
        })
    }
    const newCart = await Carts.create(data)
    if (!newCart)
        return false
    else
        return newCart
})

//function add product to cart if it is already added
const addNewProductInCart = asyncHandler(async function (params, { corporateId, subCorporateId } ) {
    let {
        productId
    } = params;
    let isDuplicate = '';
    params.productQuantity = parseInt(params.productQuantity);

    let whereClause = {};
    if (corporateId) {
        whereClause.corporateUserId = corporateId;
    } else if (subCorporateId) {
        whereClause.subCorporateUserId = subCorporateId
    }

    const customerCart = await Carts.findOne({
        where: whereClause,
        attributes: ['productDetails']
    });

    if (customerCart) {
        let productsArray = JSON.parse(customerCart.productDetails);
        let updated = false;

        for (let index = 0; index < productsArray.length; index++) {
            const product = productsArray[index];

            if (parseInt(product.productId) === parseInt(productId)) {
                isDuplicate = 'yes';
                product.productQuantity += params.productQuantity;
                product.totalPrice += params.totalPrice;
                product.totalGst +=  params.totalGst;
                updated = true;
                break;
            }
        }

        if (!updated) {
            // If not updated, it's a new product, so add it to the array
            productsArray.push(params);
        }

        let data = {
            productDetails: JSON.stringify(productsArray)
        };

        await Carts.update(data, {
            where: whereClause
        });

        if (isDuplicate === 'yes') {
            return 'duplicate'
        }
    } else {
        // Cart doesn't exist for this corporateUserId, create a new one
        let data = {
            productDetails: JSON.stringify([params]),
        };

        if (corporateId) {
            data.corporateUserId = corporateId;
        } else if (subCorporateId) {
            data.subCorporateUserId = subCorporateId
        }

        const newCart = await Carts.create(data);
        if (!newCart) {
            return false;
        }
    }
    return true; // Return true to indicate success
});

// Add an ONDC office-supply product to the shared cart. ONDC items live in the
// same productDetails JSON but carry `source: 'OFFICE_SUPPLIES'` and are deduped
// by ONDC identity (ondcProductId + bppUri + ondcVendorId) instead of productId.
const addOndcProductInCart = asyncHandler(async function (item, { corporateId, subCorporateId }) {
    item.productQuantity = parseInt(item.productQuantity);

    let whereClause = {};
    if (corporateId) {
        whereClause.corporateUserId = corporateId;
    } else if (subCorporateId) {
        whereClause.subCorporateUserId = subCorporateId;
    }

    const sameOndcItem = (p) =>
        p.source === 'OFFICE_SUPPLIES' &&
        p.ondcProductId === item.ondcProductId &&
        p.bppUri === item.bppUri &&
        p.ondcVendorId === item.ondcVendorId;

    const customerCart = await Carts.findOne({
        where: whereClause,
        attributes: ['productDetails']
    });

    if (customerCart) {
        let productsArray = JSON.parse(customerCart.productDetails);
        const existing = productsArray.find(sameOndcItem);

        if (existing) {
            existing.productQuantity += item.productQuantity;
            existing.totalPrice += item.totalPrice;
            // Refresh the delivery estimate to the latest add's value (only when
            // the new add carries one — don't clobber a good saved estimate with
            // a null from a failed/skipped fetch).
            if (item.expectedDeliveryDate) existing.expectedDeliveryDate = item.expectedDeliveryDate;
            if (item.deliveryTat) existing.deliveryTat = item.deliveryTat;
        } else {
            productsArray.push(item);
        }

        await Carts.update(
            { productDetails: JSON.stringify(productsArray) },
            { where: whereClause }
        );

        return existing ? 'duplicate' : true;
    }

    // No cart yet for this user — create one with this ONDC item.
    let data = { productDetails: JSON.stringify([item]) };
    if (corporateId) {
        data.corporateUserId = corporateId;
    } else if (subCorporateId) {
        data.subCorporateUserId = subCorporateId;
    }
    const newCart = await Carts.create(data);
    return newCart ? true : false;
});

/**
 * Remove one or more ONDC OFFICE_SUPPLIES products from a user's cart.
 * Takes an array of cart items (must contain at least productId, ondcProductId, bppUri, ondcVendorId),
 * plus a user identity ({ corporateId, subCorporateId }).
 * Returns true if any products were removed, false otherwise.
 */
const removeOndcProductsFromCart = asyncHandler(async function (cartItems, userData = {}) {
    if (!Array.isArray(cartItems) || cartItems.length === 0) {
        return false;
    }

    const { corporateId, subCorporateId } = userData;
    let whereClause = {};
    if (corporateId) {
        whereClause.corporateUserId = corporateId;
    } else if (subCorporateId) {
        whereClause.subCorporateUserId = subCorporateId;
    } else {
        // No user found
        return false;
    }

    const customerCart = await Carts.findOne({
        where: whereClause,
        attributes: ['productDetails'],
    });

    if (!customerCart) {
        return false;
    }

    let productsArray = JSON.parse(customerCart.productDetails);

    // Remove items that match any of the cartItems criteria (ondcItem)
    const isOndcMatch = (cartProduct, target) =>
        cartProduct.source === 'OFFICE_SUPPLIES' &&
        cartProduct.ondcProductId === target.ondcProductId &&
        cartProduct.bppUri === target.bppUri &&
        cartProduct.ondcVendorId === target.ondcVendorId;

    let removedCount = 0;
    for (const removeItem of cartItems) {
        const beforeLength = productsArray.length;
        productsArray = productsArray.filter(
            (p) => !isOndcMatch(p, removeItem)
        );
        if (productsArray.length < beforeLength) {
            removedCount += beforeLength - productsArray.length;
        }
    }

    await Carts.update(
        { productDetails: JSON.stringify(productsArray) },
        { where: whereClause }
    );

    return removedCount > 0;
});


const updateExistingProductInCart = asyncHandler(async function (params, unitPrice,unitGst) {
    let productsData = [],
        quantity = 0,
        sum,gst, newCount = 0
    let {
        productId,
        operation,
        corporateId,
        subCorporateId
    } = params

    let whereClause = {};
    if (corporateId) {
        whereClause.corporateUserId = corporateId;
    } else if (subCorporateId) {
        whereClause.subCorporateUserId = subCorporateId
    }
    const productDetailInCart = await Carts.findOne({
        where: whereClause,
        attributes: ['productDetails']
    })
    let isAvailable = 0
    if (productDetailInCart) {
        let products_array = JSON.parse(productDetailInCart.productDetails);
        for (let index = 0; index < products_array.length; index++) {
            let newEl = products_array[index];
            if (parseInt(newEl.productId) != parseInt(productId)) {
                continue;
            }
            isAvailable = 1
        }
        if (!isAvailable)
            return -2
        for (let index = 0; index < products_array.length; index++) {
            let newEl = products_array[index];
            if (newEl.productId == productId) {
                quantity = operation === 'increase' ? parseInt(newEl.productQuantity) + parseInt(params.productQuantity) : parseInt(newEl.productQuantity) - parseInt(params.productQuantity)
                sum = operation === 'increase' ? parseFloat(newEl.totalPrice) + parseFloat(unitPrice) : parseFloat(newEl.totalPrice) - parseFloat(unitPrice)
                gst = operation === 'increase' ? parseFloat(newEl.totalGst) + parseFloat(unitGst) : parseFloat(newEl.totalGst) - parseFloat(unitGst)
                if (quantity == 0) {
                    // eslint-disable-next-line no-delete-var
                    // delete newEl;
                    continue;
                }

                newEl.productQuantity = quantity
                newEl.totalPrice = sum
                newEl.totalGst = parseFloat(gst.toFixed(2))
            }
            newCount = quantity
            productsData.push(newEl)
        }
    }
    if (operation === 'decrease') {
        let res = {},
            savData
        if (productsData.length == 0) {
            const deletedData = await Carts.destroy({
                where: whereClause
            })
            if (deletedData) {
                return -1
            }
        }
        for (let i = 0; i < productsData.length; i++) {
            let dt = productsData[i]
            if (dt.productQuantity == 0) {
                productsData.splice(i, 1)
            }
        }
        res = productsData
        if (productsData.length === 1)
            savData = res
        let updatedDetails = {
            productDetails: savData ? JSON.stringify(savData) : JSON.stringify(productsData)
        }
        const newUpdatedCount = await Carts.update(updatedDetails, {
            where: whereClause
        })
        if (newUpdatedCount)
            return {
                newQuantity: newCount
            }
        else
            return false
    }
    let updatedDetails = {
        productDetails: JSON.stringify(productsData)
    }
    const newUpdatedCount = await Carts.update(updatedDetails, {
        where: whereClause
    })
    if (newUpdatedCount) {
        return {
            newQuantity: newCount
        }
    } else
        return false
})

const deleteExistingProductInCart = asyncHandler(async function (productId, { corporateUserId, subCorporateId }) {
    let productsData = [],
        quantity = 0

    let whereClause = {};
    if (corporateUserId) {
        whereClause.corporateUserId = corporateUserId;
    } else if (subCorporateId) {
        whereClause.subCorporateUserId = subCorporateId
    }
    const productDetailInCart = await Carts.findOne({
        where: whereClause,
        attributes: ['productDetails']
    })
    if (productDetailInCart) {
        let products_array = JSON.parse(productDetailInCart.productDetails);
        let isAvailable = 0
        for (let index = 0; index < products_array.length; index++) {
            let newEl = products_array[index];
            if (parseInt(newEl.productId) != parseInt(productId)) {
                continue;
            }
            isAvailable = 1
        }
        if (!isAvailable)
            return -2
        for (let index = 0; index < products_array.length; index++) {
            const element = products_array[index];
            let newEl = element
            if (newEl.productId == productId) {
                quantity = parseInt(newEl.productQuantity)
                continue;
            }
            productsData.push(newEl)
        }
        if (quantity == 0) {
            return 0
        }

        if (productsData.length == 0) {
            const deletedData = await Carts.destroy({
                where: whereClause
            })
            if (deletedData) {
                return -1
            }
        }
        let updatedDetails = {
            productDetails: JSON.stringify(productsData)
        }
        const updatedData = await Carts.update(updatedDetails, {
            where: whereClause
        })
        if (updatedData) {
            return quantity
        }
    }
    return false
})

const getAllProductsInMyCart = asyncHandler(async function ({ corporateUserId, subCorporateId }) {
    let productsArray = []
   
    let whereClause = {};
    if (corporateUserId) {
        whereClause.corporateUserId = corporateUserId;
    } else if (subCorporateId) {
        whereClause.subCorporateUserId = subCorporateId
    }

    const productDetailInCart = await Carts.findOne({
        where: whereClause,
        attributes: [
            ['id', 'cartId'], 'productDetails'
        ],
        raw: true
    })

    if (productDetailInCart) {
        let products_array = JSON.parse(productDetailInCart.productDetails)

        for (let index = 0; index < products_array.length; index++) {
            const element = products_array[index];
            // ONDC office-supply items live in the same cart but aren't backed by
            // the legacy `products` table — skip them in this legacy view.
            if (element.source === 'OFFICE_SUPPLIES') continue
            let newEl = element
            productsArray.push(newEl)
        }
        let ids = productsArray.map(proId => proId.productId)
        const pics = await Products.findAll({
            where: {
                id: ids
            },
            attributes: ['id', 'name', 'SKUCode', 'price', 'productImage', 'brand','GST','gstType']
        })

        return {
            productsArray,
            pics,
            cartId: productDetailInCart.cartId
        }
    } else {
        return -1
    }
})

const getProductDetailsByIds = asyncHandler(async function (Ids) {
    const products = await Products.findAll({
        where: {
            id: Ids
        },
        raw: true,
        attributes: [
            ['id', 'productId'], 'quantity', 'price'
        ]
    })
    if (!products)
        return false
    else
        return products
})

const deleteCartAndUpdateProducts = asyncHandler(async ({ corporateUserId, subCorporateId }) => {
    const result = await sequelizeConfig.transaction(async (t) => {
        let itemDetails = []

        let whereClause = {};
        if (corporateUserId) {
            whereClause.corporateUserId = corporateUserId;
        } else if (subCorporateId) {
            whereClause.subCorporateUserId = subCorporateId
        }

        //check whether cart exists
        let cartDetails = await Carts.findOne({
            where: whereClause,
            raw: true
        })
        if (cartDetails) {
            //clear cart items
            await Carts.destroy({
                where: whereClause,
                transaction: t
            })
            //update product quantities
            if (cartDetails.productDetails) {
                let items = JSON.parse(cartDetails.productDetails)
                itemDetails = items
                let promises = []
                for (let i = 0; i < items.length; i++) {
                    let element = items[i]
                    const productDetails = await Products.findOne({
                        where: {
                            id: items[i]['productId']
                        },
                        lock: t.LOCK.UPDATE,
                        attributes: ['quantity'],
                        transaction: t
                    })
                    let newObj = {}
                    newObj.quantity = parseInt(productDetails.quantity) - parseInt(element.productQuantity) >= 0 ? parseInt(productDetails.quantity) - parseInt(element.productQuantity) : 0
                    newObj.sold_quantity =  parseInt(productDetails.sold_quantity) + parseInt(element.productQuantity)  
                    let newPromise = await Products.update(newObj, {
                        where: {
                            id: items[i]['productId']
                        },
                        transaction: t
                    })
                    promises.push(newPromise);
                }
                Promise.all(promises).then(function () {
                    //isUpdated = true
                }).catch(error => {
                    console.error(error.message)
                    throw 'Something went wrong while placing an order'
                });

            }
        }
        //resolve(itemDetails)
        return itemDetails
    })
    return result
})

// ============================================================================
// ONDC office-supplies cart — items with `source === 'OFFICE_SUPPLIES'` in the
// same cart JSON. Items are price/name/image snapshots keyed by `productId`
// (the ondcProducts listing row id); legacy get/update/delete skip them, these
// skip everything else.
// ============================================================================

const isOndcItem = (p) => p && p.source === 'OFFICE_SUPPLIES'
const ondcItemMatches = (p, productId) => isOndcItem(p) && parseInt(p.productId) === parseInt(productId)

const buildCartWhere = ({ corporateUserId, subCorporateId }) => {
    const whereClause = {}
    if (corporateUserId) {
        whereClause.corporateUserId = corporateUserId
    } else if (subCorporateId) {
        whereClause.subCorporateUserId = subCorporateId
    }
    return whereClause
}

/**
 * Re-point cart items at the catalog row their product now lives in, after a
 * purge + re-ingest gave it a new id. Keyed on the stale productId; quantity
 * updates and deletes address items by productId, so the cart must hold the id
 * the cart-details response hands the page. Returns the number of items changed.
 */
const healOndcCartProductIds = asyncHandler(async function (userData, remaps = []) {
    const byOldId = new Map(
        (remaps || [])
            .filter((r) => r && r.from != null && r.to != null && String(r.from) !== String(r.to))
            .map((r) => [String(r.from), r.to])
    )
    if (!byOldId.size) return 0
    const whereClause = buildCartWhere(userData)
    const cart = await Carts.findOne({ where: whereClause, attributes: ['productDetails'] })
    if (!cart) return 0
    const products = JSON.parse(cart.productDetails || '[]')
    let changed = 0
    for (const p of products) {
        if (isOndcItem(p) && p.productId != null && byOldId.has(String(p.productId))) {
            p.productId = byOldId.get(String(p.productId))
            changed += 1
        }
    }
    if (changed) {
        await Carts.update({ productDetails: JSON.stringify(products) }, { where: whereClause })
    }
    return changed
})

// -1 = no cart. Returns the raw ONDC item snapshots (controller refreshes them).
const getOndcProductsInMyCart = asyncHandler(async function (userData) {
    const cart = await Carts.findOne({
        where: buildCartWhere(userData),
        attributes: [
            ['id', 'cartId'], 'productDetails'
        ],
        raw: true
    })
    if (!cart) return -1
    const items = JSON.parse(cart.productDetails || '[]').filter(isOndcItem)
    return { cartId: cart.cartId, items }
})

// operation: 'increase' | 'decrease' (always by 1). Decreasing below the
// seller's minimum order quantity (or to 0) removes the item. -1 = no cart,
// -2 = item not in cart, -3 = order cap reached (stock or seller maximum).
const updateOndcProductInCart = asyncHandler(async function (productId, operation, userData) {
    const whereClause = buildCartWhere(userData)
    const cart = await Carts.findOne({
        where: whereClause,
        attributes: ['productDetails']
    })
    if (!cart) return -1
    const products = JSON.parse(cart.productDetails || '[]')
    const item = products.find((p) => ondcItemMatches(p, productId))
    if (!item) return -2

    const unitPrice = parseFloat(item.price) || 0
    let quantity = parseInt(item.productQuantity) || 0
    const minQuantity = parseInt(item.minQuantity) || 1
    if (operation === 'increase') {
        // Bounded by MAX_ORDER_QUANTITY_PER_ITEM. The previous Infinity fallback
        // meant a snapshot missing both counts had no ceiling at all.
        const { max: cap } = ondcQuantityBounds(item)
        if (quantity + 1 > cap) return -3
        quantity += 1
    } else {
        quantity -= 1
    }

    let nextProducts = products
    if (quantity <= 0 || (operation === 'decrease' && quantity < minQuantity)) {
        nextProducts = products.filter((p) => p !== item)
        quantity = 0
    } else {
        item.productQuantity = quantity
        item.totalPrice = parseFloat((unitPrice * quantity).toFixed(2))
    }

    if (nextProducts.length === 0) {
        await Carts.destroy({ where: whereClause })
        return { newQuantity: 0 }
    }
    const updated = await Carts.update({
        productDetails: JSON.stringify(nextProducts)
    }, {
        where: whereClause
    })
    return updated ? { newQuantity: Math.max(quantity, 0) } : false
})

/**
 * Remove every OFFICE_SUPPLIES item that is no longer purchasable — legacy
 * snapshots without a `productId` (which per-item delete can never address),
 * items whose listing row is gone or hidden from the storefront, and items with
 * zero stock. This backs the
 * cart's "No longer available" clear button with a single call instead of
 * per-item deletes. -1 = no cart; otherwise { removed, remaining }.
 */
const clearUnavailableOndcProductsInCart = asyncHandler(async function (userData) {
    // Lazy require: keeps this heavy use-case out of the module's import cost
    // and avoids any accidental cycle with the products use-case.
    const { findOndcProductForCartItem, isOndcProductListed } = require('./ondc_product_with_transactionId')

    const whereClause = buildCartWhere(userData)
    const cart = await Carts.findOne({
        where: whereClause,
        attributes: ['productDetails']
    })
    if (!cart) return -1
    const products = JSON.parse(cart.productDetails || '[]')

    const keep = []
    let removed = 0
    for (const p of products) {
        if (!isOndcItem(p)) {
            keep.push(p)
            continue
        }
        let available = false
        if (p.productId || p.ondcProductId) {
            // Same lookup as the cart page: a product re-ingested under a new row id
            // is still available and must not be cleared.
            const row = await findOndcProductForCartItem(p)
            // hidden by the admin (category disabled, seller blocked, …) counts as gone
            available = isOndcProductListed(row) && (parseInt(row.availableQuantity) || 0) > 0
            if (available && row.id != null && String(row.id) !== String(p.productId)) {
                p.productId = row.id
            }
        }
        if (available) keep.push(p)
        else removed += 1
    }

    if (!removed) return { removed: 0, remaining: keep.length }

    if (keep.length === 0) {
        const deleted = await Carts.destroy({ where: whereClause })
        return deleted ? { removed, remaining: 0 } : false
    }
    const updated = await Carts.update({
        productDetails: JSON.stringify(keep)
    }, {
        where: whereClause
    })
    return updated ? { removed, remaining: keep.length } : false
})

// -1 = no cart / cart emptied, -2 = item not in cart, true = removed.
const deleteOndcProductInCart = asyncHandler(async function (productId, userData) {
    const whereClause = buildCartWhere(userData)
    const cart = await Carts.findOne({
        where: whereClause,
        attributes: ['productDetails']
    })
    if (!cart) return -1
    const products = JSON.parse(cart.productDetails || '[]')
    const remaining = products.filter((p) => !ondcItemMatches(p, productId))
    if (remaining.length === products.length) return -2

    if (remaining.length === 0) {
        const deleted = await Carts.destroy({ where: whereClause })
        return deleted ? -1 : false
    }
    const updated = await Carts.update({
        productDetails: JSON.stringify(remaining)
    }, {
        where: whereClause
    })
    return updated ? true : false
})

module.exports = {
    addNewProductInCart,
    addOndcProductInCart,
    updateExistingProductInCart,
    deleteExistingProductInCart,
    getAllProductsInMyCart,
    getProductDetailsByIds,
    deleteCartAndUpdateProducts,
    getOndcProductsInMyCart,
    updateOndcProductInCart,
    deleteOndcProductInCart,
    clearUnavailableOndcProductsInCart,
    healOndcCartProductIds,
    removeOndcProductsFromCart
};