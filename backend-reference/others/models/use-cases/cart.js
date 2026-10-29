/* eslint-disable no-unused-vars */
const Products = require('../entities/products')
const Carts = require('../entities/cart')
const asyncHandler = require('../../middlewares/async')

const getAllProductsInMyCart = asyncHandler(async function (corporateUserId, details) {
     let productsArray = []
     const productDetailInCart = await Carts.findOne({
          where: {
               corporateUserId,
          },
          attributes: [['id', 'cartId'], 'productDetails'],
          raw: true,
     })

     if (productDetailInCart) {
          let products_array = JSON.parse(productDetailInCart.productDetails)

          for (let index = 0; index < products_array.length; index++) {
               const element = products_array[index]
               let newEl = element
               productsArray.push(newEl)
          }
          let ids = productsArray.map((proId) => proId.productId)
          const pics = await Products.findAll({
               where: {
                    id: ids,
               },
               attributes: ['id', 'name', 'SKUCode', 'price', 'productImage', 'brand', 'GST', 'gstType'],
          })

          return {
               productsArray,
               pics,
               cartId: productDetailInCart.cartId,
          }
     } else {
          return -1
     }
})

module.exports = {
     getAllProductsInMyCart,
}
