const sequelize = require("../../configs/database/index");
const asyncHandler = require("../../middlewares/async");
const corporateUser = require("./../entities/corporateUser");

exports.enableProductTour = asyncHandler(async (id) => {
  const transaction = await sequelize.transaction();
  try {
    const user = await corporateUser.findOne({
      where: { credentialId:id },
      attributes: ["productTour"],
      transaction,
    });
    const productTour = user.productTour || {};

    Object.keys(productTour).forEach((key) => (productTour[key] = true));

    const updatedProductTour = await corporateUser.update(
      {
        productTour: productTour,
      },
      {
        where: { credentialId:id },
        transaction,
      }
    );
    if (!updatedProductTour) {
      transaction.rollback();
      return false;
    }
    const userData = await corporateUser.findOne({
      where: { credentialId:id },
      attributes: ["productTour"],
      transaction,
    });
    await transaction.commit();

    return userData;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
});

exports.enableProductTourSingle = asyncHandler(async (id, service) => {
  const transaction = await sequelize.transaction();
  try {
    const user = await corporateUser.findOne({
      where: { credentialId:id },
      attributes: ["productTour"],
      transaction,
    });
    const productTour = user.productTour || {};
    productTour[service] = false;

    const updatedProductTour = await corporateUser.update(
      {
        productTour: productTour,
      },
      {
        where: { credentialId:id },
        transaction,
      }
    );
    if (!updatedProductTour) {
      transaction.rollback();
      return false;
    }
    const userData = await corporateUser.findOne({
      where: { credentialId:id },
      attributes: ["productTour"],
      transaction,
    });

    await transaction.commit();

    return userData;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
});
