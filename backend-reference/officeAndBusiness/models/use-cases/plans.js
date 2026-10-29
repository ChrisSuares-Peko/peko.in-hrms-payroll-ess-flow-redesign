/* eslint-disable no-unused-vars */
/* eslint-disable no-prototype-builtins */
const plans = require("../entities/plans");
const sequelize = require("../../configs/database/index");
const { Op } = require("sequelize");
const asyncHandler = require("../../middlewares/async");
const { handleSortFields } = require("../../utils/sortHandle");
const { PLAN_COMMISSION, reviewedChange } = require("../../utils/configuredFlag");
const { applyCommissionMarkup } = require("../../utils/applyCommissionMarkup");
const {
  formatNumberWithLocalString,
  formattedDateTime,
} = require("../../utils/formatter");
const { uploadFile } = require("../../utils/commonUploadFile");

exports.create = asyncHandler(async (params) => {
  if (params.hasOwnProperty("logo") && params.logoFormat) {
    const publicUrl = await uploadFile(
      params.logo,
      "planLogo",
      params.logoFormat
    );
    params.logo = publicUrl;
  }
  const plan = await plans.create(params);
  if (!plan) {
    return false;
  }
  return plan;
});

exports.findOne = asyncHandler(async (name) => {
  return await plans.findOne({
      where: {
          name: name
      },
      raw: true,
      nest: true,
  })

})

exports.findAllPlans = asyncHandler(async (credentialId) => {
  const result = await plans.findAll({
    where: {
      status: true,
    },
  });
  await applyCommissionMarkup(result, "price", credentialId);
  return result;
});

exports.updatePlan = asyncHandler(async (params, data) => {
  if (data.hasOwnProperty("logo") && data.logoFormat) {
    const publicUrl = await uploadFile(data.logo, "planLogo", data.logoFormat);
    data.logo = publicUrl;
  }
  
  const reviewed = await reviewedChange({
    load: () => plans.findOne({ where: { id: params.id }, attributes: PLAN_COMMISSION.fields, raw: true }),
    incoming: data,
    group: PLAN_COMMISSION,
    table: "plans",
    id: params.id,
  });
  
  return await plans.update(reviewed, {
    where: {
      id: params.id,
    },
  });
});

exports.deletePlan = asyncHandler(async (params) => {
  return await plans.destroy({
    where: {
      id: params.id,
    },
  });
});

exports.findAllPlansAndCount = asyncHandler(async (params) => {
  try{
    let {
        limit,
        offset,
        searchText,
        sort,
        sortField,
        isAdmin = false
    } = params
    let order = handleSortFields(sortField,sort)
 
    const result = await plans.findAndCountAll({
        where: {
            [Op.or]: [{
                id: {
                    [Op.like]: '%' + searchText + '%'
                }
            }, {
                name: {
                    [Op.like]: '%' + searchText + '%'
                }
            }, {
                price: {
                    [Op.like]: '%' + searchText + '%'
                }
            }, {
                description: {
                    [Op.like]: '%' + searchText + '%'
                }
            }, {
                highlights: {
                    [Op.like]: '%' + searchText + '%'
                }
            }, {
                billingCycle: {
                    [Op.like]: '%' + searchText + '%'
                }
            }]
        },
        order: order,
        limit,
        offset,
        raw: true,
        nest: true
    })

    await applyCommissionMarkup(result.rows, "price", null, isAdmin);
    return result;
} catch (error) {
  console.log(error);
  throw  {message:'Something went wrong'};
}
});

exports.fetchPlans = asyncHandler(async (query, res) => {
  return await plans.findAll({
    where: {
      name: {
        [Op.like]: "%" + query + "%",
      },
      status: true,
    },
    attributes: ["id", "name"],
  });
});
exports.plansAndCountExport = asyncHandler(async (params) => {
  try {
    let { searchText, sort, sortField } = params;
    let order = handleSortFields(sortField, sort);

    const data = await plans.findAndCountAll({
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
            price: {
              [Op.like]: "%" + searchText + "%",
            },
          },
          {
            description: {
              [Op.like]: "%" + searchText + "%",
            },
          },
          {
            highlights: {
              [Op.like]: "%" + searchText + "%",
            },
          },
          {
            billingCycle: {
              [Op.like]: "%" + searchText + "%",
            },
          },
        ],
      },
      order: order,
      raw: true,
      nest: true,
    });
    let finalData = [];
    data.rows.forEach(function (limitData) {
      finalData.push({
        Date: limitData.createdAt
          ? formattedDateTime(limitData.createdAt)
          : "Not Available",
        "Plan Name": limitData.name ? limitData.name : "Not Available",
        "Plan Price": limitData.price
          ? "₹ " + formatNumberWithLocalString(limitData.price)
          : "Not Available",
        Description: limitData.description
          ? limitData.description
          : "Not Available",
        Highlights: limitData.highlights
          ? limitData.highlights
          : "Not Available",
        Logo: limitData.logo ? limitData.logo : "Not Available",
        Status: limitData.status > 0 ? "Active" : "In Active",
      });
    });
    return finalData;
  } catch (error) {
    console.log(error);
    throw { message: "Something went wrong" };
  }
});
