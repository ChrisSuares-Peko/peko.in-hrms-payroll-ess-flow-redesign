const software_plans = require("../entities/software_plans");
const softwares = require("../entities/softwares");
const { Op } = require("sequelize");
const asyncHandler = require("../../middlewares/async");
const { handleSortFields } = require("../../utils/sortHandle");
const { formattedDateTime, formatNumberWithLocalString } = require("../../utils/formatter");
const vendors = require("../entities/vendor");

exports.findByPlanId = asyncHandler(async (planId) => {
  if (!planId) {
    throw new Error('Invalid planId'); 
  }
  return await software_plans.findOne({
    where: {
      planId: planId,
    },
  });
});

exports.create = asyncHandler(async (params) => {
  try {
    const plan = await software_plans.create(params);
    if (!plan) {
      return false;
    }
    return plan;
  } catch (error) {
    console.log("🚀 ~ exports.create=asyncHandler ~ error:", error);
    return false;
  }
});

exports.update = asyncHandler(async (params, data) => {
  try {
    return await software_plans.update(data, {
      where: {
        id: params.id,
      },
    });
  } catch (error) {
    console.log(error.message);
    return false;
  }
});

exports.Delete = asyncHandler(async (params) => {
  if (!params || !params.productCode) {
    throw new Error('Missing required field: productCode');
  }
  return await software_plans.destroy({
    where: {
      id: params.productCode,
    },
  });
});

exports.findAllPlansAndCount = asyncHandler(async (params) => {
  try{
    let { limit, offset, searchText, sort, sortField } = params;
    let order = handleSortFields(sortField,sort)
  
    return await software_plans.findAndCountAll({
      include: [
        {
          model: softwares,
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
            price: {
              [Op.like]: "%" + searchText + "%",
            },
          },
          {
            validity: {
              [Op.like]: "%" + searchText + "%",
            },
          },
          {
            noOfUsers: {
              [Op.like]: "%" + searchText + "%",
            },
          },
          {
            features: {
              [Op.like]: "%" + searchText + "%",
            },
          },
          {
            vendorPrice: {
              [Op.like]: "%" + searchText + "%",
            },
          },
        ],
      },
      order: order,
      limit,
      offset,
      raw: true,
      nest: true,
    });
  } catch (error) {
    console.log(error);
    throw  {message:'Something went wrong'};
  }
});

exports.softwarePlansAndCountExport = asyncHandler(async (params) => {
  try{
    let { searchText, sort, sortField } = params;
    let order = handleSortFields(sortField,sort)
  
    const data = await software_plans.findAndCountAll({
      include: [
        {
          model: softwares,
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
            price: {
              [Op.like]: "%" + searchText + "%",
            },
          },
          {
            validity: {
              [Op.like]: "%" + searchText + "%",
            },
          },
          {
            noOfUsers: {
              [Op.like]: "%" + searchText + "%",
            },
          },
          {
            features: {
              [Op.like]: "%" + searchText + "%",
            },
          },
          {
            vendorPrice: {
              [Op.like]: "%" + searchText + "%",
            },
          },
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
              "Software name": limitData.software?.name ? limitData.software?.name : "Not Available",
              "Vendor Price": limitData.vendorPrice ? "₹ " + formatNumberWithLocalString(limitData.vendorPrice)  : "₹ 0.00",
              "Customer Price": limitData.price ? "₹ " + formatNumberWithLocalString(limitData.price): "₹ 0.00",
              Validity: limitData.validity ? limitData.validity : "Not Available",
              "No of users": limitData.noOfUsers ? limitData.noOfUsers : "Not Available",
              Status: limitData.status>0 ? "Active"  : "In Active",
          })
      })
      return finalData
  } catch (error) {
    console.log(error);
    throw  {message:'Something went wrong'};
  }
});

exports.findAllPlans = async (product, planAttribute = undefined, productAttribute = undefined) => {
  try {
    return await software_plans.findAll({
      include: {
        model: softwares,
        where: {
          id: product,
        },
        attributes: productAttribute,
      },
      where: {
        status: true,
      },
      attributes: planAttribute,
    });
  } catch (error) {
    console.log(error);
  } finally {
    console.log("PLANS FIND ALL ROUTE CALLED");
  }
};

exports.findOnePlan = asyncHandler(async (params,planAttributes = undefined, productAttributes = undefined) => {
  return await software_plans.findOne({
      where: {
          id: params.id
      },
      attributes:planAttributes,
      include: [
          {
              model: softwares, 
              attributes:productAttributes,
              include: [
                {
                    model: vendors, 
                    attributes:['vendorEmail','vendorName','optional1','apiUrl','optional2']
                },
              ]
          },
      ],
      raw: true,
      nest: true,
  })

})

exports.find = asyncHandler(async (name) => {
  return await software_plans.findOne({
      where: {
          name: name
      }
  })
})

exports.createBulkSoftwarePlans = asyncHandler(async (params) => {

  const plans = await software_plans.create(params)

  if (!plans) {
      return false;
  }
  return plans
})

exports.SoftwarePlansCount = asyncHandler(async ({productCode}) => {
  return await software_plans.count({
      where: {
        softwareId: productCode
      }
  })
})