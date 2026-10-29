const Products = require("../entities/products");
const Carts = require("../entities/cart");
const asyncHandler = require("../../middlewares/async");
const sequelizeConfig = require("../../configs/database");
const { customLog } = require("../../utils/loggerHelper");

const deleteCartAndUpdateProducts = asyncHandler(async (corporateUserId) => {
  const result = await sequelizeConfig.transaction(async (t) => {
    let itemDetails = [];
    //check whether cart exists
    let cartDetails = await Carts.findOne({
      where: {
        corporateUserId,
      },
      raw: true,
    });
    if (cartDetails) {
      //clear cart items
      await Carts.destroy({
        where: {
          corporateUserId,
        },
        transaction: t,
      });
      //update product quantities
      if (cartDetails.productDetails) {
        let items = JSON.parse(cartDetails.productDetails);
        itemDetails = items;
        let promises = [];
        for (let i = 0; i < items.length; i++) {
          let element = items[i];
          const productDetails = await Products.findOne({
            where: {
              id: items[i]["productId"],
            },
            lock: t.LOCK.UPDATE,
            attributes: ["quantity"],
            transaction: t,
          });
          let newObj = {};
          newObj.quantity =
            parseInt(productDetails.quantity) -
              parseInt(element.productQuantity) >=
            0
              ? parseInt(productDetails.quantity) -
                parseInt(element.productQuantity)
              : 0;
          let newPromise = await Products.update(newObj, {
            where: {
              id: items[i]["productId"],
            },
            transaction: t,
          });
          promises.push(newPromise);
        }
        Promise.all(promises)
          .then(function (values) {
            customLog(null, "info", {values})
            //isUpdated = true
          })
          .catch((error) => {
            console.error(error.message);
            throw "Something went wrong while placing an order";
          });
      }
    }
    //resolve(itemDetails)
    return itemDetails;
  });
  return result;
});
module.exports = {
  deleteCartAndUpdateProducts,
};
