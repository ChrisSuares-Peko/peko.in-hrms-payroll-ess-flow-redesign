const asyncHandler = require("../../../middlewares/async");
const { Op } = require("sequelize");
const cloud_subscriptions = require("../../entities/pekoCloud/cloud_subscriptions");
const cloud_softwares = require("../../entities/pekoCloud/cloud_softwares");
const ErrorResponse = require("../../../utils/error-response");

exports.createSubscription = asyncHandler(async (data) => {
  try {
    const existingSubscription = await cloud_subscriptions.findOne({
      where: {
        [Op.or]: [
          {
            subscriptionName: data.subscriptionName,
            credentialId: data.credentialId,
          },
        ],
      },
    });

    if (existingSubscription) {
      return {
        success: false,
        error: "Subscriptions with this name already exists.",
      };
    }

    const responseData = await cloud_subscriptions.create(data);
    if (!responseData) {
      return { success: false, error: "Failed to create subscription." };
    }
    return { success: true, data: responseData };
  } catch (error) {
    console.log(error);
    return new ErrorResponse(
      "Something went wrong, please try again later.",
      500
    );
  }
});

exports.findAllSubscriptions = async (
  page,
  itemsPerPage,
  sortField,
  sort,
  searchText,
  credentialId,
  subCorporateUserId
) => {
  try {
    const offset = (page - 1) * itemsPerPage;

    let whereClause = {};
    if (searchText) {
      whereClause = {
        [Op.or]: [
          { subscriptionName: { [Op.like]: `%${searchText}%` } },
          { planDetails: { [Op.like]: `%${searchText}%` } },
          { billingCycle: { [Op.like]: `%${searchText}%` } },
          { amount: { [Op.like]: `%${searchText}%` } },
        ],
      };
    }

    if (credentialId) {
      whereClause.credentialId = credentialId;
    }

    if (subCorporateUserId) {
      whereClause.subCorporateUserId = subCorporateUserId;
      delete whereClause.credentialId;
    }

    const subscriptionssData = await cloud_subscriptions.findAndCountAll({
      include: [
        {
          model: cloud_softwares,
          attributes: ["id", "name", "image", "status"],
        },
      ],
      limit: itemsPerPage,
      offset: offset,
      order: [[sortField, sort]],
      where: whereClause,
    });

    return { success: true, data: subscriptionssData };
  } catch (error) {
    console.log(error);
    return new ErrorResponse(
      "Something went wrong, please try again later.",
      500
    );
  }
};

exports.findSubscriptionsList = async (credentialId, subCorporateUserId) => {
  try {
    let whereClause = {};

    if (credentialId) {
      whereClause.credentialId = credentialId;
    }

    if (subCorporateUserId) {
      whereClause.subCorporateUserId = subCorporateUserId;
      delete whereClause.credentialId;
    }

    const subscriptionssData = await cloud_subscriptions.findAndCountAll({
      where: whereClause,
    });

    return { success: true, data: subscriptionssData };
  } catch (error) {
    console.log(error);
    return new ErrorResponse(
      "Something went wrong, please try again later.",
      500
    );
  }
};

exports.updateSubscription = async (id, newData, credentialId) => {
  try {
    const isSubscriptionExist = await cloud_subscriptions.findOne({
      where: { id, credentialId },
    });

    if (!isSubscriptionExist) {
      return {
        success: false,
        error: "subscription is not existing with the given details",
      };
    }
    const updateSubscription = await cloud_subscriptions.update(newData, {
      where: { id: id },
    });

    if (updateSubscription[0] === 0) {
      return {
        success: false,
        error: "something went wrong while updating the subscription",
      };
    }

    return { success: true, data: {} };
  } catch (error) {
    console.log(error);
    return new ErrorResponse(
      "Something went wrong, please try again later.",
      500
    );
  }
};

exports.deleteSubscription = async (id, credentialId = undefined) => {
  try {
    const isSubscriptionExist = await cloud_subscriptions.findOne({
      where: credentialId ? { id, credentialId } : { id },
    });

    if (!isSubscriptionExist) {
      return {
        success: false,
        error: "subscription is not existing with the given details",
      };
    }

    const deletedRowsCount = await cloud_subscriptions.destroy({
      where: credentialId ? { id: id, credentialId } : { id: id },
    });

    if (deletedRowsCount > 0) {
      return { success: true, data: {} };
    } else {
      return {
        success: false,
        error: "subscription is not existing with the given details",
      };
    }
  } catch (error) {
    console.log(error);
    return new ErrorResponse(
      "Something went wrong, please try again later.",
      500
    );
  }
};

exports.assignSubscription = async (assignData, credentialId) => {
  try {
    const isExist = await cloud_subscriptions.findOne({
      where: {
        credentialId,
        id: assignData.subscriptionId,
      },
    });

    if (!isExist) {
      return {
        success: false,
        error: "Subscription does not exist with the given details",
      };
    }

    let assignToArray = isExist.assignTo || [];

    const updateData = {
      employeeName: assignData.employeeName,
      id: assignData.id,
    };

    assignToArray.push(updateData); // Add the new data to the array

    const update = await cloud_subscriptions.update(
      { assignTo: assignToArray },
      {
        where: { id: assignData.subscriptionId, credentialId },
      }
    );

    if (update[0] === 0) {
      return { success: false, error: "Something went wrong while assigning" };
    }

    return { success: true, data: {} };
  } catch (error) {
    console.error(error);
    return { success: false, error: "Something went wrong, please try again later." };
  }
};

exports.findTotalCount = async (credentialId) => {
  try {
    const subscriptions = await cloud_subscriptions.findAll({
      where: { credentialId },
    });
    const totalCount = subscriptions.length;
  
    let totalAmount = 0;
    subscriptions.forEach((subscription) => {
      totalAmount += subscription.amount;
    });
  
    return { totalCount, totalAmount };
  } catch (error) {
    console.log(error);
    return new ErrorResponse("Something went wrong, please try again later.", 500);
  }
};
