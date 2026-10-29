const express = require('express');
const router = express.Router();
const {
    addProductToCart,
    updateProductInCart,
    updateCartItemDetails,
    deleteProductFromCart,
    getAllProductsInCart,
    clearCart,
    refreshCart
} = require('../../../../controllers/corporate/serviceCart');

router.get('/', getAllProductsInCart);
router.post('/add', addProductToCart);
router.put('/update', updateProductInCart);
router.put('/update-details', updateCartItemDetails);
router.delete('/remove', deleteProductFromCart);
router.delete('/clear', clearCart);
router.post('/refresh', refreshCart);

module.exports = router;
