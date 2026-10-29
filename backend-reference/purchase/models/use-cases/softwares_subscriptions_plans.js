const softwares_subscriptions_plans = require("../entities/softwares_subscriptions_plans");
const { Op } = require("sequelize");
const asyncHandler = require("../../middlewares/async");
const { handleSortFields } = require("../../utils/sortHandle");
const softwares_subscriptions = require("../entities/softwares_subscriptions");
const vendors = require("../entities/vendor");
const { formattedDateTime, formatNumberWithLocalString } = require("../../utils/formatter");
const { uploadFile } = require("../../utils/commonUploadFile");
const usecaseHandler = require("../../utils/usecase-handler");
const { PLAN_COMMISSION, reviewedChange } = require("../../utils/configuredFlag");
const { applyCommissionMarkup } = require("../../utils/applyCommissionMarkup");

const markUp = async (plans, credentialId) => {
  await applyCommissionMarkup(plans, "monthlyPrice", credentialId);
  await applyCommissionMarkup(plans, "yearlyPrice", credentialId);
  return plans;
};

exports.create = asyncHandler(async (params) => {
  try {
    if (Object.prototype.hasOwnProperty.call(params, "image") && params.imageFormat) {
      const filePath = `softwares_subscriptions/plans`
      const publicUrl = await uploadFile(params.image, filePath, params.imageFormat);
      params.image_url = publicUrl;
    }
    return await softwares_subscriptions_plans.create(params);
  } catch (error) {
    console.log(error.message);
    return false;
  }
});

exports.findAll = asyncHandler(async (params, status = undefined, attributes) => {
  try{
    let { limit, offset, searchText, sort, sortField, isAdmin = false } = params;
    let order = handleSortFields(sortField,sort)

    let whereClause = {
      [Op.or]: [
        {
          id: {
            [Op.like]: "%" + searchText + "%",
          },
        },
        {
          name: {
            [Op.like]: "%" + searchText + "%",
          },
        },
        {
          monthlyPrice: {
            [Op.like]: "%" + searchText + "%",
          },
        },
        {
          yearlyPrice: {
            [Op.like]: "%" + searchText + "%",
          },
        },
        {
          descriptions: {
            [Op.like]: "%" + searchText + "%",
          },
        },
        {
          "$softwares_subscription.name$": {
            [Op.like]: "%" + searchText + "%",
          },
        },
      ],
    }

    if(status){
      whereClause['status'] = status;
    }
  
    const result = await softwares_subscriptions_plans.findAndCountAll({
      include: [
        {
          model: softwares_subscriptions,
          attributes: ["name", "type"],
        },
      ],
      attributes: attributes,
      where: whereClause,
      order: order,
      limit,
      offset,
      raw: true,
      nest: true,
    });

    await applyCommissionMarkup(result.rows, "monthlyPrice", null, isAdmin, "monthlyTotalCommission");
    await applyCommissionMarkup(result.rows, "yearlyPrice", null, isAdmin, "yearlyTotalCommission");
    return result;
  } catch (error) {
    console.log(error);
    throw  {message:'Something went wrong'};
  }
});

exports.update = asyncHandler(async (params, data) => {
  try {
    if (Object.prototype.hasOwnProperty.call(data, "image") && data.imageFormat) {
      const filePath = `softwares_subscriptions/plans`
      const publicUrl = await uploadFile(data.image, filePath, data.imageFormat);
      data.image_url = publicUrl;
    }

    const reviewed = await reviewedChange({
      load: () =>
        softwares_subscriptions_plans.findOne({ where: { id: params.id }, attributes: PLAN_COMMISSION.fields, raw: true }),
      incoming: data,
      group: PLAN_COMMISSION,
      table: "softwares_subscriptions_plans",
      id: params.id,
    });
    return await softwares_subscriptions_plans.update(reviewed, {
      where: {
        id: params.id,
      },
    });
  } catch (error) {
    console.log(error.message);
    return false;
  }
});

exports.findAllPlans = async (params, planAttribute = undefined) => {
  try {
    return await softwares_subscriptions_plans.findAll({
      where: params,
      attributes: planAttribute,
    });
  } catch (error) {
    console.log(error);
    throw error
  } finally {
    console.log("SOFTWARE SUBSCRIPTIONS PLANS FIND ALL ROUTE CALLED");
  }
};

exports.findOne = async (params, credentialId, attributes, productAttribute) => {
  const plan = await softwares_subscriptions_plans.findOne({
    include: [
      {
        model: softwares_subscriptions,
        attributes: productAttribute,
        include: [
          {
            model: vendors,
            attributes: ['vendorEmail', 'vendorName', 'optional1', 'apiUrl', 'optional2']
          },
        ]
      },
    ],
    where: params,
    attributes
  })
  return markUp(plan, credentialId)
}

exports.findOnePlan = usecaseHandler(async ({params, attributes, productAttribute, credentialId} ) => {
  const plan = await softwares_subscriptions_plans.findOne({
    include:[
      {
        model: softwares_subscriptions,
        attributes: productAttribute,
        include: [
          {
              model: vendors, 
              attributes:['vendorEmail','vendorName','optional1','apiUrl','optional2']
          },
        ]
      },
    ],
    where: params,
    attributes
  })
  return markUp(plan, credentialId)
})

exports.softwareSubscriptionPlansAndCountExport = asyncHandler(async (params) => {
  try{
    let { searchText, sort, sortField } = params;
    let order = handleSortFields(sortField,sort)
  
    const data = await softwares_subscriptions_plans.findAndCountAll({
      include: [
        {
          model: softwares_subscriptions,
          attributes: ["name"],
        },
      ],
      where: {
        [Op.or]: [
          {
            id: {
              [Op.like]: "%" + searchText + "%",
            },
          },
          {
            name: {
              [Op.like]: "%" + searchText + "%",
            },
          },
          {
            monthlyPrice: {
              [Op.like]: "%" + searchText + "%",
            },
          },
          {
            yearlyPrice: {
              [Op.like]: "%" + searchText + "%",
            },
          },
          {
            descriptions: {
              [Op.like]: "%" + searchText + "%",
            },
          },
          {
            features: {
              [Op.like]: "%" + searchText + "%",
            },
          },
          {
            "$softwares_subscription.name$": {
              [Op.like]: "%" + searchText + "%",
            },
          }
        ],
      },
      order: order,
      raw: true,
      nest: true,
    });
    let finalData = []
      data.rows.forEach(function (limitData) {
          finalData.push({
              Date: limitData.createdAt ? formattedDateTime(limitData.createdAt) : 'Not Available',
              "Plan Name": limitData.name ? limitData.name : "Not Available",
              "Product name": limitData.softwares_subscription?.name ? limitData.softwares_subscription?.name : "Not Available",
              "Monthly Price": limitData.monthlyPrice ? "₹ " + formatNumberWithLocalString(limitData.monthlyPrice)  : "₹ 0.00",
              "Yearly Price": limitData.yearlyPrice ? "₹ " + formatNumberWithLocalString(limitData.yearlyPrice): "₹ 0.00",
              // "Descriptions": limitData.descriptions ? limitData.descriptions : "Not Available",
              "Image": limitData.image_url ? limitData.image_url : "Not Available",
              Status: limitData.status>0 ? "Active"  : "In Active",
          })
      })
      return finalData
  } catch (error) {
    console.log(error);
    throw  {message:'Something went wrong'};
  }
});

exports.SoftwareSubscriptionPlansCount = asyncHandler(async ({ productCode }) => {
  return await softwares_subscriptions_plans.count({
    where: {
      softwaresSubscriptionId: productCode
    }
  })
})

exports.delete = asyncHandler(async ({ id }) => {
  return await softwares_subscriptions_plans.destroy({
    where: {
      id,
    },
  });
});