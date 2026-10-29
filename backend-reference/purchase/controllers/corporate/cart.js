/* eslint-disable no-undef */
const ProductsUseCase = require("./../../models/use-cases/products");
const CartUseCase = require("./../../models/use-cases/cart");
const Cart = require("./../../models/entities/cart");
const ErrorResponse = require("./../../utils/error-response");
const asyncHandler = require("./../../middlewares/async");
const { customLog } = require("../../utils/loggerHelper");

exports.addProductToCart = asyncHandler(async (req, res, next) => {
  const productId = req.body.productId;
  const { productQuantity } = req.body;
  //  const productExist = await ProductsUseCase.findOne({ productCode: productId }, ['price', 'quantity', 'name','VAT','vatType'])
  const productExist = await ProductsUseCase.findOne({ productCode: productId }, ["price", "quantity", "name", "GST", "gstType", "productImage"]);
  if (!productExist) {
    return next(new ErrorResponse(`Product with id ${productId} not found`, 404));
  } else if (productExist.quantity < 1) {
    return next(new ErrorResponse(`${productExist.name} is out of stock`, 409));
  } else if (productExist.quantity < productQuantity) {
    return next(new ErrorResponse(`Insufficient quantity available for the desired product`, 422));
  }
  let sumPrice = parseFloat(productExist.price) * productQuantity;

  let GstSum;
  if (productExist.gstType == "CUSTOM") {
    GstSum = parseFloat(productExist.GST) * productQuantity;
  } else {
    // GstSum = (parseFloat(productExist.GST) / 100) * (parseFloat(productExist.price) * productQuantity);
    const priceExcludingGST = parseFloat(productExist.price) / (1 + parseFloat(productExist.GST) / 100);
    GstSum = parseFloat(productExist.price) - priceExcludingGST * productQuantity;
  }
  GstSum = parseFloat(GstSum.toFixed(2));

  const productDetails = {
    productId,
    productQuantity,
    productName: productExist.name,
    productImage: productExist.productImage,
    totalPrice: sumPrice,
    totalGst: GstSum,
  };
  const userData = {}
    if (req.user.role === 'CORPORATE_SUB_USER' && req.user.subCorporateId) {
        userData.subCorporateId = req.user.subCorporateId;
    } else {
        userData.corporateId = req.user.corporateId;
    }
  const newCartProduct = await CartUseCase.addNewProductInCart(productDetails, userData);
  if (!newCartProduct) {
    return next(new ErrorResponse(`Something went wrong while adding product to the cart`, 500));
  }
  if (newCartProduct == "duplicate") {
    return res.status(201).json({
      status: true,
      message: "Product(s) already in the cart. Cart updated successfully",
      data: { newCartProduct, status: "updated" },
      responseCode: "000",
    });
    // return next(new ErrorResponse(`Product already in your cart`, 300))
  }
  return res.status(201).json({
    status: true,
    message: "Product(s) added to cart successfully",
    data: { newCartProduct, status: "added" },
    responseCode: "000",
  });
});

exports.updateProductInCart = asyncHandler(async (req, res, next) => {
  
  const { productQuantity, productId, operation } = req.body;
  if (productQuantity > 1) {
    return next(new ErrorResponse(`Quantity can only be updated one at a time.`, 409));
  }
  const userData = {}
  if (req.user.role === 'CORPORATE_SUB_USER' && req.user.subCorporateId) {
      userData.subCorporateId = req.user.subCorporateId;
  } else {
      userData.corporateUserId = req.user.corporateId;
  }
  const getAllProductsCart = await CartUseCase.getAllProductsInMyCart(userData);
  const productExist = await ProductsUseCase.findOne({ productCode: productId }, ["id", "price", "quantity", "GST", "gstType"]);
  if (!productExist) {
    return next(new ErrorResponse(`Product with id ${productId} doesn't exist`, 404));
  }
  let productQuantityExceeded = false;
  if (getAllProductsCart == -1) {
    return next(new ErrorResponse(`No data found`, 404));
  }
  getAllProductsCart.productsArray.forEach((cartElement) => {
    if (cartElement.productId == productExist.dataValues.id) {
      if (!(productExist.dataValues.quantity > cartElement.productQuantity) && req.body.operation == "increase") {
        productQuantityExceeded = true;
      }
    }
  });
  if (productQuantityExceeded) return next(new ErrorResponse(`Cannot add more items of this product`, 409));
  let unitPrice = parseFloat(productExist.price) * parseFloat(productQuantity);

  let unitGst;
  if (productExist.gstType == "CUSTOM") {
    unitGst = parseFloat(productExist.GST) * productQuantity;
  } else {
    //unitVat = (productExist.GST / 100) * (parseFloat(productExist.price) * productQuantity);
    const priceExcludingGST = parseFloat(productExist.price) / (1 + parseFloat(productExist.GST) / 100);
    unitGst = parseFloat(productExist.price) - priceExcludingGST * productQuantity;
  }
  unitGst = parseFloat(unitGst.toFixed(2));
  const productDetails = {
    productId,
    productQuantity,
    operation,
    
  };

  if (req.user.role === 'CORPORATE_SUB_USER' && req.user.subCorporateId) {
    productDetails.subCorporateId = req.user.subCorporateId;
} else {
    productDetails.corporateId = req.user.corporateId;
}

  const newCartProduct = await CartUseCase.updateExistingProductInCart(productDetails, unitPrice, unitGst);

  if (!newCartProduct) {
    return next(new ErrorResponse(`Something went wrong while adding product to the cart`, 500));
  }
  if (newCartProduct === -1) {
    return next(new ErrorResponse(`Your cart is empty now!`, 404));
  }
  if (newCartProduct === -2) return next(new ErrorResponse(`Product not available in your cart`, 400));
  return res.status(200).json({
    status: true,
    message: "Product updated successfully",
    data: {newCartProduct},
    responseCode: "000",
  });
});

exports.deleteProductFromCart = asyncHandler(async (req, res, next) => {
  if (!req.query.productId) return next(new ErrorResponse(`Missing 'productId' in the request body. Please provide a valid productId.`, 400));
  const productId = req.query.productId;
  const productExist = await ProductsUseCase.findOne({ productCode: productId }, ["quantity"]);
  if (!productExist) {
    return next(new ErrorResponse(`Product with id ${productId} not found`, 404));
  }
  const userData = {}
    if (req.user.role === 'CORPORATE_SUB_USER' && req.user.subCorporateId) {
        userData.subCorporateId = req.user.subCorporateId;
    } else {
        userData.corporateUserId = req.user.corporateId;
    }
  // let mode = req.query.mode
  const deleteCartProduct = await CartUseCase.deleteExistingProductInCart(productId, userData);
  if (deleteCartProduct === 0) {
    return next(new ErrorResponse(`Product with id of ${productId} not available in your cart`, 404));
  }
  if (!deleteCartProduct) {
    return next(new ErrorResponse(`Something went wrong while deleting product from the cart`, 500));
  }
  if (deleteCartProduct === -2) return next(new ErrorResponse(`Product not available in your cart`, 404));

  return res.status(200).json({
    status: true,
    message: deleteCartProduct === -1 ? "Your cart is empty now" : "Product deleted from the cart successfully",
    data: {},
    responseCode: "000",
  });
});

exports.getAllProductsInCart = asyncHandler(async (req, res, next) => {
  const userData = {}
  if (req.user.role === 'CORPORATE_SUB_USER' && req.user.subCorporateId) {
      userData.subCorporateId = req.user.subCorporateId;
  } else {
      userData.corporateUserId = req.user.corporateId;
  }
  const allProducts = await CartUseCase.getAllProductsInMyCart(userData)
  if (!allProducts) {
      return next(new ErrorResponse(`Something went wrong while fetching the product(s) from the cart`, 500))
  }
  if (allProducts === -1) {
      return res.status(200).json({
          status: true,
          message: "Your cart is empty. Add some items to it!",
          responseCode: "002",
          data: {
              items: [],
              count: 0,
              cartId: 0,
              itemsTotalAmount: 0,
              allowCheckout: false,
              grandTotal: 0,
              totalGst: 0,
              shippingCharge:0,
              freeDelivery : false,
              eligibleFreeShipping:0
          },
      });
  }
  let totalPrice, productIds = []
  const cartId = parseInt(allProducts.cartId)
  allProducts.productsArray.forEach(element => {
      productIds.push(element.productId)
      totalPrice = totalPrice === undefined ? parseFloat(element.totalPrice) : parseFloat(totalPrice) + parseFloat(element.totalPrice)
  });
  const productCurrentQuantities = await CartUseCase.getProductDetailsByIds(productIds);
  allProducts.productsArray.forEach(el1 => {
      allProducts.pics.forEach(el2 => {
          if (el1.productId == el2.id) {
              el2.dataValues['productQuantity'] = parseInt(el1.productQuantity)
              el2.dataValues['totalPrice'] = el1.totalPrice
              el2.dataValues['totalGst'] = el1.totalGst
          }
      });
  });
  let newCartItem = []
  allProducts.pics.forEach(el1 => {
      productCurrentQuantities.forEach(el2 => {
          if (el1.id == el2.productId) {
              let cartObj = {}
              const qnty = el1.dataValues.productQuantity
              el1.dataValues.productQuantity = el1.dataValues.productQuantity > el2.quantity ? el2.quantity > 0 ? el2.quantity : qnty : el1.dataValues.productQuantity
              el1.dataValues.totalPrice = parseFloat(el2.price) * (el1.dataValues.productQuantity)
              el1.dataValues['productQuantityInDB'] = parseInt(el2.quantity)
              el1.dataValues.price = parseFloat(el2.price)
              cartObj.productId = el1.id
              cartObj.productQuantity = el1.dataValues.productQuantity
              cartObj.productName = el1.dataValues.name
              cartObj.productImage = el1.dataValues.productImage
              cartObj.totalPrice = el1.dataValues.totalPrice
              cartObj.totalGst = el1.dataValues.totalGst
              newCartItem.push(cartObj)
              if (el2.quantity == 0) {
                  totalPrice = totalPrice - (parseFloat(el2.price) * (el1.dataValues.productQuantity))
              } else if (el2.quantity < qnty) {
                  let deductedQuantity = qnty - el2.quantity
                  totalPrice = totalPrice - parseFloat(el2.price) * (deductedQuantity)
              }
          }
      });
  });
  let grandtotalGst = newCartItem.reduce((total, item) => {
      return total + (Number(item.totalGst) || 0);
  }, 0);

  grandtotalGst = parseFloat(grandtotalGst.toFixed(2))

  customLog(req?.LogTraceId, "info", { message: "Grand Total GST: " + grandtotalGst })

  await Cart.update({ productDetails: JSON.stringify(newCartItem) }, {
      where: {
          id: cartId
      }
  })
  allowCheckout = true

  let shippingCharge = 15
  let eligibleFreeShipping = 100
  let freeDelivery = true
  let grandTotal = totalPrice
  
  if(totalPrice < eligibleFreeShipping){
    grandTotal += shippingCharge
    freeDelivery = false
  }

  return res.status(200).json({
      status: true,
      message: "Successfully retrieved all products in your cart.",
      responseCode: "000",
      data: {
          items: allProducts.pics,
          count: allProducts.productsArray.reduce((total, product) => total + product.productQuantity, 0),
          cartId,
          itemsTotalAmount: totalPrice ? parseFloat(totalPrice.toFixed(2)) : 0,
          allowCheckout,
          grandTotal: grandTotal ? parseFloat(parseFloat(grandTotal).toFixed(2)) : 0,
          totalGst: grandtotalGst,
          shippingCharge: totalPrice ? totalPrice > 100 ? 0 : shippingCharge : shippingCharge,
          freeDelivery,
          eligibleFreeShipping

      },
  });

});