const sequelize = require("sequelize");
const asyncHandler = require("../../middlewares/async");
const transaction = require("../entities/transaction");
const works = require("../entities/works");
const orders = require("../entities/order");
const credential = require("../entities/credential");
const serviceOperators = require("../entities/serviceOperator");
const { Op } = require("sequelize");
const { handleSortFields } = require("../../utils/sortHandle");
const {
  formattedDateTime,
  formatNumberWithLocalString,
} = require("../../utils/formatter");
const { uploadFile } = require("../../utils/commonUploadFile");
const { customLog } = require("../../utils/loggerHelper");

exports.findAllWorks = asyncHandler(async (params) => {
  let {
    limit,
    offset,
    sort,
    filter,
    credentialId
  } = params;

  let whereClause = {
    status: true,
    credentialId
  };

    return await works.findAndCountAll({
    where: whereClause,
    order: [[filter, sort]],
    limit: limit,
    offset: offset,
  });
});

exports.findOne = asyncHandler(async (params) => {
  return await works.findOne({
    where: {
      id: params.id,
    },
    raw: true,
    nest: true,
  });
});

exports.findAllTransactions = asyncHandler(async (params) => {
  try {
    let {
      from,
      to,
      accessKey,
      searchText,
      sort,
      limit,
      offset,
      corporateId,
      serviceAttribute,
      credentialAttribute,
      transactionAttribute,
      orderAttribute,
      sortField,
      subCorporateUserId,
      partnerId
    } = params

    let order = handleSortFields(sortField, sort)

    let whereClause = {
      [Op.or]: [
        {
          '$order.workspaceOrderStatus$': {
            [Op.like]: '%' + searchText + '%'
          }
        },
        {
          '$order.corporateTxnId$': {
            [Op.like]: '%' + searchText + '%'
          }
        },
        {
          "$order.amountInINR$": {
            [Op.like]: "%" + searchText + "%",
          },
        },
        {
          '$credential.name$': {
            [Op.like]: '%' + searchText + '%'
          }
        },
        {
          '$credential.username$': {
            [Op.like]: '%' + searchText + '%'
          }
        },

        sequelize.literal(`LOWER(JSON_EXTRACT(\`order\`.\`orderResponse\`, '$.planDetails.name')) LIKE LOWER(:searchText)`),
        sequelize.literal(`LOWER(JSON_EXTRACT(\`order\`.\`orderResponse\`, '$.planDetails.work.name')) LIKE LOWER(:searchText)`),
      ]
    }
    if (partnerId) {
      if (partnerId === 'default') partnerId = null
      whereClause['$credential.registeredBy$'] = {
        [Op.eq]: partnerId
      };
    }

    if (from && to) {
      let tomorrow = new Date(to);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);

      whereClause.transactionDate = {
        [Op.between]: [from, tomorrow]
      }
    }
    if (corporateId) {
      whereClause.credentialId = corporateId
    }

    if (subCorporateUserId) {
      whereClause['$order.subCorporateUserId$'] = subCorporateUserId;
    }

    let includeOptions = [{
      model: serviceOperators,
      where: {
        accessKey: accessKey,
      },
      attributes: serviceAttribute,


    },
    {
      model: credential,
      attributes: credentialAttribute,
      include: [
        {
          model: credential,
          as: 'registeredByCredential',
          attributes: ['name'],
        }
      ],
    },
    {
      model: orders,
      attributes: orderAttribute,
    }
    ];


    const replacements = {
      searchText: `%${searchText}%`
    };

    return await transaction.findAndCountAll({
      include: includeOptions,
      where: whereClause,
      order: order,
      limit: limit,
      offset: offset,
      attributes: transactionAttribute,
      replacements: replacements,
      raw: true,
      nest: true
    });
  } catch (error) {
    customLog(null, 'error', { error: error.message });
    throw { message: 'Something went wrong' };
  }
});

exports.worksExcelCSVData = asyncHandler(async (params) => {
  try {
    let {
      from,
      to,
      accessKey,
      searchText,
      sort,
      corporateId,
      serviceAttribute,
      credentialAttribute,
      transactionAttribute,
      orderAttribute,
      sortField,
      partnerId
    } = params

    let order = handleSortFields(sortField, sort)

    let whereClause = {
      [Op.or]: [
        {
          '$order.workspaceOrderStatus$': {
            [Op.like]: '%' + searchText + '%'
          }
        },
        {
          '$order.corporateTxnId$': {
            [Op.like]: '%' + searchText + '%'
          }
        },
        {
          '$credential.name$': {
            [Op.like]: '%' + searchText + '%'
          }
        },
        {
          '$credential.username$': {
            [Op.like]: '%' + searchText + '%'
          }
        },

        sequelize.literal(`LOWER(JSON_EXTRACT(\`order\`.\`orderResponse\`, '$.planDetails.name')) LIKE LOWER(:searchText)`),
        sequelize.literal(`LOWER(JSON_EXTRACT(\`order\`.\`orderResponse\`, '$.planDetails.work.name')) LIKE LOWER(:searchText)`),

      ]
    }
    if (from && to) {
      let tomorrow = new Date(to);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);

      whereClause.transactionDate = {
        [Op.between]: [from, tomorrow]
      }
    }
    if (corporateId) {
      whereClause.credentialId = corporateId
    }
    if (partnerId) {
      if (partnerId === 'default') partnerId = null
      whereClause['$credential.registeredBy$'] = {
        [Op.eq]: partnerId
      };
    }

    let includeOptions = [{
      model: serviceOperators,
      where: {
        accessKey: accessKey,
      },
      attributes: serviceAttribute,


    },
    {
      model: credential,
      attributes: credentialAttribute,
      include: [
        {
          // Self-reference join to get the name of the registeredBy user
          model: credential, // Referencing the same `credential` model
          as: 'registeredByCredential', // Alias for the registeredBy relation
          attributes: ['name'], // Assuming 'username' is the name field
        }
      ],

    },
    {
      model: orders,
      attributes: orderAttribute,
    }
    ];


    const replacements = {
      searchText: `%${searchText}%`
    };

    const data = await transaction.findAndCountAll({
      include: includeOptions,
      where: whereClause,
      order: order,
      attributes: transactionAttribute,
      replacements: replacements,
      raw: true,
      nest: true
    });
    let finalData = []
    data.rows.forEach(function (limitData) {
      const orderResponse = JSON.parse(limitData.order?.orderResponse)
      finalData.push({
        "Transaction Date": limitData.order?.transactionDate ? formattedDateTime(limitData.order?.transactionDate) : 'Not Available',
        "Transaction ID": limitData.order?.corporateTxnId ? limitData.order?.corporateTxnId.toString() : "Not Available",
        "Corporate ID": limitData.credential?.username ? limitData.credential?.username : "Not Available",
        "Corporate Name": limitData.credential?.name ? limitData.credential?.name : "Not Available",
        "Partner Name": limitData.credential?.registeredByCredential?.name ? limitData.credential?.registeredByCredential?.name : "Not Available",
        "Work Name": orderResponse?.planDetails?.work?.name ? orderResponse?.planDetails?.work?.name : "Not Available",
        "Plan Name": orderResponse?.planDetails?.name ? orderResponse?.planDetails?.name : "Not Available",
        Price: limitData.order?.amountInINR ? "₹ " + formatNumberWithLocalString(limitData.order?.amountInINR) : "₹ 0.00",
        Status: limitData.order?.workspaceOrderStatus ? limitData.order?.workspaceOrderStatus : "Not Available",
      })
    })
    return finalData
  } catch (error) {
    customLog(null, 'error', { error: error.message });
    throw { message: 'Something went wrong' };
  }
})

exports.create = asyncHandler(async (params) => {
  if (typeof params["portfolio"] === "object") {
    if (!Array.isArray(params["portfolio"])) {
      params["portfolio"] = [params["portfolio"]];
    }
  }

  if (params["imageBase"] && params["imageFormat"]) {
    const publicUrl = await uploadFile(
      params["imageBase"],
      "works",
      params["imageFormat"]
    );
    params.image = publicUrl;
  }

  let transformedPortfolioArray = [];

  for (let i = 0; i < params["portfolio"].length; i++) {
    const portfolioItem = params["portfolio"][i];
    if (typeof portfolioItem === "object") {
      const key = Object.keys(portfolioItem)[0]; // Get the key of the portfolio object
      const base64Value = portfolioItem[key].base64; // Get the base64 value
      const format = portfolioItem[key].format; // Get the format value (corrected typo)

      if (base64Value != null) {
        const publicUrl = await uploadFile(base64Value, "works", format);
        transformedPortfolioArray.push({ [key]: publicUrl }); // Create a new object with the key and base64 value
      }
    } else {
      const key = Object.keys(portfolioItem)[0];
      transformedPortfolioArray.push({ [key]: portfolioItem[key] });
    }
  }

  params["portfolio"] = transformedPortfolioArray;
  if (params.credentialId === "default") {
    params.credentialId = null;
  }
  const responseData = await works.create(params);
  return responseData || false;
});

exports.update = asyncHandler(async (data, params) => {
  if (data["imageBase"] && data["imageFormat"]) {
    const publicUrl = await uploadFile(
      data["imageBase"],
      "logo",
      data["imageFormat"]
    );
    data.image = publicUrl;
  }
  if (data["portfolio"]) {
    if (typeof data["portfolio"] === "object") {
      if (!Array.isArray(data["portfolio"])) {
        data["portfolio"] = [data["portfolio"]];
      }
    }

    let transformedPortfolioArray = [];

    for (let i = 0; i < data["portfolio"].length; i++) {
      const portfolioItem = data["portfolio"][i];
      const key = Object.keys(portfolioItem)[0]; // Get the key of the portfolio object
      if (typeof portfolioItem[key] === "object") {
        const base64Value = portfolioItem[key].base64; // Get the base64 value
        const format = portfolioItem[key].format; // Get the format value (corrected typo)

        if (base64Value != null) {
          const publicUrl = await uploadFile(base64Value, "works", format);
          transformedPortfolioArray.push({ [key]: publicUrl }); // Create a new object with the key and base64 value
        }
      } else {
        transformedPortfolioArray.push({ [key]: portfolioItem[key] });
      }
    }
    data["portfolio"] = transformedPortfolioArray;
  }
  if (params.credentialId === "default") {
    params.credentialId = null;
  }
  const responseData = await works.update(data, {
    where: {
      id: params.id,
    },
  });
  if (!responseData) {
    return false;
  }
  return responseData;
});

exports.fetchAllWorks = asyncHandler(async (params) => {
  try{
    let {
        from, 
        to, 
        searchText,
        sort,
        limit,
        offset,
        sortField,
        partnerId
    } = params
    let order = handleSortFields(sortField,sort)
  
    let whereClause = {
        [sequelize.Op.or]: [ {
            name: {
                [sequelize.Op.like]: '%' + searchText + '%'
            }
        },
        {
            description: {
                [sequelize.Op.like]: '%' + searchText + '%'
            }
        },
        {
          features: {
                [sequelize.Op.like]: '%' + searchText + '%'
            }
        },
        {
          contactName: {
                [sequelize.Op.like]: '%' + searchText + '%'
            }
        },
        {
          '$credential.name$': {
                [sequelize.Op.like]: '%' + searchText + '%'
            }
        }
        ]
    }

    if(from && to){
  // Adjust 'to' date to end of day
     const tomorrow = new Date(to);
     tomorrow.setDate(tomorrow.getDate() + 1);
     tomorrow.setHours(0, 0, 0, 0);
      whereClause.createdAt = {
        [sequelize.Op.between]: [from, tomorrow]
    }
    }

    if (partnerId) {
      if(partnerId=='default'){
        whereClause['credentialId'] = null;
      }else{
        whereClause['credentialId'] = partnerId;
      }
    }

    return await works.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: credential,
          as: 'credential',
          attributes: ['id', 'name'],
          include: [
            {
              model: credential,
              as: 'registeredByCredential', // Use the alias for credential's self-association
              attributes: ['id', 'name'],
            },
          ],
          required: false,
        },
      ],
        order: order,
        limit: limit,
        offset: offset,
        raw: true,
        nest: true
    });
  } catch (error) {
    console.log(error);
    throw  {message:'Something went wrong'};
  }

})

exports.worksExport = asyncHandler(async (params) => {
  try{
    let {
        from, 
        to, 
        searchText,
        sort,
        sortField
    } = params
    let order = handleSortFields(sortField,sort)
  
    let whereClause = {
        [sequelize.Op.or]: [ {
            name: {
                [sequelize.Op.like]: '%' + searchText + '%'
            }
        },
        {
            description: {
                [sequelize.Op.like]: '%' + searchText + '%'
            }
        },
        {
          features: {
                [sequelize.Op.like]: '%' + searchText + '%'
            }
        },
        {
          contactName: {
                [sequelize.Op.like]: '%' + searchText + '%'
            }
        }
        ]
    }
    
    if(from && to){
  // Adjust 'to' date to end of day
     const tomorrow = new Date(to);
     tomorrow.setDate(tomorrow.getDate() + 1);
     tomorrow.setHours(0, 0, 0, 0);
      whereClause.createdAt = {
        [sequelize.Op.between]: [from, tomorrow]
    }
    }
  
    
    const data = await works.findAndCountAll({
        where: whereClause,
        order: order,
        raw: true,
        nest: true
    });
  
    let finalData = []
    data.rows.forEach(function (limitData) {
        finalData.push({
            Date: limitData.createdAt ? formattedDateTime(limitData.createdAt) : 'Not Available',
            "Work Name": limitData.name ? limitData.name : "Not Available",
            "POC Name": limitData.contactName ? limitData.contactName : "Not Available",
            // Features: limitData.features ? limitData.features : "Not Available",
            // Description: limitData.description ? limitData.description : "Not Available",
            Status: limitData.status>0 ? "Active"  : "In Active",
        })
    })
    return finalData
  } catch (error) {
    console.log(error);
    throw  {message:'Something went wrong'};
  }

})

exports.findAllAvailableWorks = asyncHandler(async (query) => {
  const whereCondition = {
    name: {
      [sequelize.Op.like]: "%" + query + "%",
    },
    status: true,
  };

  return await works.findAll({
    where: whereCondition,
    attributes: ["id", "name"],
  });
});

exports.Delete = asyncHandler(async (params) => {
  return await works.destroy({
    where: {
      id: params.id,
    },
  });
});
