const { Op, literal } = require("sequelize")
const sequelize = require("sequelize");
const asyncHandler = require("../../middlewares/async")
const eSIM = require("../entities/eSIM")
const credential = require("../entities/credential")
const transaction = require("../entities/transaction")
const orders = require("../entities/order")
const serviceOperators = require("../entities/serviceOperator")
const { handleSortFields } = require("../../utils/sortHandle")
const { formattedDateTime, formatNumberWithLocalString } = require("../../utils/formatter")
const SubCorporateUser = require("../entities/subCorporateUsers");
const { safeJsonExtract } = require("../../utils/safeJsonExtract");

exports.create = asyncHandler(async (params) => {
  return await eSIM.create(params)
})

exports.findAllEsimRecordsCount = asyncHandler(async (params) => {
  let {
    from,
    to,
    limit,
    offset,
    searchText,
    sort,
    column,
    corporateId,
    subCorporateUserId // Added subCorporateUserId to destructured params
  } = params;

  let whereClause = {
    [Op.or]: [{
      id: {
        [Op.like]: '%' + searchText + '%'
      }
    }, {
      packageDetails: {
        [Op.like]: '%' + searchText + '%'
      }
    }, {
      simDetails: {
        [Op.like]: '%' + searchText + '%'
      }
    }, {
      remarks: {
        [Op.like]: '%' + searchText + '%'
      }
    }, {
      quantity: {
        [Op.like]: '%' + searchText + '%'
      }
    }, {
      amount: {
        [Op.like]: '%' + searchText + '%'
      }
    }, {
      '$transaction.corporateTxnId$': {
        [Op.like]: '%' + searchText + '%'
      }
    }]
  };

  if (from && to) {
    // Adjust 'to' date to end of day
    const tomorrow = new Date(to);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    whereClause.createdAt = {
      [Op.between]: [from, tomorrow]
    };
  }

  if (corporateId) {
    whereClause.credentialId = corporateId;
  }

  if (subCorporateUserId) {
    whereClause.subCorporateUserId = subCorporateUserId;
  }

  return await eSIM.findAndCountAll({
    include: [
      {
        model: credential,
        attributes: ['id', 'name']
      },
      {
        model: transaction,
        attributes: ['corporateTxnId', 'status'],
        include: [
          {
            model: orders,
            attributes: ['paymentMode', 'amountInINR']
          }
        ]
      },
      {
        model: SubCorporateUser,
        attributes: ['id', 'name'],
        required: false
      }
    ],
    where: whereClause,
    order: [
      [column, sort]
    ],
    limit,
    offset
  });
});


exports.findAllEsimRecordsCountAdmin = asyncHandler(async (params) => {
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
      partnerId
    } = params;

    let order = handleSortFields(sortField, sort)

    let whereClause = {
      [Op.or]: [
        {
          '$order.corporateTxnId$': {
            [Op.like]: '%' + searchText + '%',
          },
        },
        {
          '$order.paymentMode$': {
            [Op.like]: '%' + searchText + '%',
          },
        },
        {
          '$credential.name$': {
            [Op.like]: '%' + searchText + '%',
          },
        },
        {
          '$credential.username$': {
            [Op.like]: '%' + searchText + '%',
          },
        },
        sequelize.where(
          safeJsonExtract('order.orderResponse', '$.package'),
          {
            [Op.like]: `%${searchText}%`
          }
        )        
      ],
    };

    let whereClauseCredential = {}
   
    if (partnerId === 'default') {
     whereClauseCredential.registeredBy = null; 
        } else if (partnerId) {
     whereClauseCredential.registeredBy = partnerId;
   } 
    if (from && to) {
      let tomorrow = new Date(to);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);

      whereClause.transactionDate = {
        [Op.between]: [from, tomorrow],
      };
    }

    if (corporateId) {
      whereClause.credentialId = corporateId;
    }

    let includeOptions = [
      {
        model: serviceOperators,
        where: {
          accessKey: accessKey,
        },
        attributes: serviceAttribute,
      },
      {
        model: credential,
        attributes: credentialAttribute,
        where: whereClauseCredential,
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
      },
    ];


    const replacements = {
      searchText: `%${searchText}%`,
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
      nest: true,
    });
  } catch (error) {
    console.log(error);
    throw { message: 'Something went wrong' };
  }
});
exports.esimOrderExcelCSV = asyncHandler(async (params) => {
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
    } = params;

    let order = handleSortFields(sortField, sort)

    let whereClause = {
      [Op.or]: [
        {
          '$order.corporateTxnId$': {
            [Op.like]: '%' + searchText + '%',
          },
        },
        {
          '$credential.name$': {
            [Op.like]: '%' + searchText + '%',
          },
        },
        {
          '$credential.username$': {
            [Op.like]: '%' + searchText + '%',
          },
        },
      ],
    };

    if (from && to) {
      let tomorrow = new Date(to);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);

      whereClause.transactionDate = {
        [Op.between]: [from, tomorrow],
      };
    }

    if (corporateId) {
      whereClause.credentialId = corporateId;
    }

    let includeOptions = [
      {
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
      },
    ];


    const replacements = {
      searchText: `%${searchText}%`,
    };

    const data = await transaction.findAndCountAll({
      include: includeOptions,
      where: whereClause,
      order: order,
      attributes: transactionAttribute,
      replacements: replacements,
      raw: true,
      nest: true,
    });
    let finalData = []
    data.rows.forEach(function (limitData) {
      let orderResponse = {};

      try {
        orderResponse = JSON.parse(limitData.order?.orderResponse || "{}");
      } catch {
        orderResponse = {};
      }
      finalData.push({
        'Transaction Date': limitData.order?.transactionDate ? formattedDateTime(limitData.order?.transactionDate) : 'Not Available',
        'Transaction ID': limitData.order?.corporateTxnId ? limitData.order?.corporateTxnId : 'Not Available',
        'Corporate ID': limitData.credential?.username ? limitData.credential?.username : 'Not Available',
        'Corporate Name': limitData.credential?.name ? limitData.credential?.name : 'Not Available',
        "Partner Name": limitData.credential?.registeredByCredential?.name ? limitData.credential?.registeredByCredential?.name : "Not Available",
        'Plan': orderResponse?.package ? orderResponse?.package : 'Not Available',
        'Payment Type': limitData.order?.paymentMode ? limitData.order?.paymentMode : 'Not Available',
        'Purchase Type': "eSIM",
        // 'Retail Price': orderResponse?.price ? orderResponse?.currency + formatNumberWithLocalString(orderResponse?.price) : "0.00",
        // 'Net Price': orderResponse?.net_price ? orderResponse?.currency + formatNumberWithLocalString(orderResponse?.net_price) : "0.00",
        'Amount Paid': limitData.order?.amountInINR ? "₹" + formatNumberWithLocalString(limitData.order?.amountInINR) : "0.00",
        // Quantity: orderResponse?.quantity ? orderResponse?.quantity : 'Not Available',
        Status: limitData.order?.status ? limitData.order?.status : "Not Available",
      })
    })
    return finalData
  } catch (error) {
    console.log(error);
    throw new Error('Something went wrong')
  }
});

// credentialId is required: an id alone would return any customer's eSIM.
exports.packageSingleDetails = asyncHandler(async (params) => {
  if (!params.id || !params.credentialId) return null;
  return await eSIM.findOne({
    include: [{
      model: credential,
      attributes: ['id', 'name']
    }, {
      model: transaction,
      attributes: ['corporateTxnId', 'status']
    },],
    where: {
      id: params.id,
      credentialId: params.credentialId
    },

  })
})


exports.findAllRecordsOrderListAndCount = asyncHandler(async (params) => {
  let {
    from,
    to,
    limit,
    offset,
    searchText,
    sort,
    column,
    corporateId,
    subCorporateUserId
  } = params;

  const likeSearch = `%${searchText}%`;

  let whereClause = {
    transactionCategory: "Travel",
    status: {
      [Op.in]: ["SUCCESS", "REFUNDED", "FAILURE"]
    },

    [Op.or]: [
      { id: { [Op.like]: likeSearch } },
      { corporateTxnId: { [Op.like]: likeSearch } },
      sequelize.where(sequelize.literal('order.amountInINR'), {
        [Op.like]: likeSearch
      }),

      sequelize.where(sequelize.literal('order.status'), {
        [Op.like]: likeSearch
      }),

      sequelize.where(sequelize.literal('order.paymentMode'), {
        [Op.like]: likeSearch
      }),

      sequelize.where(
        safeJsonExtract('order.orderResponse', '$.esimProfile.iccid'),
        { [Op.like]: likeSearch }
      ),

      sequelize.where(
        safeJsonExtract('order.orderResponse', '$.iccid'),
        { [Op.like]: likeSearch }
      ),

      sequelize.where(
        safeJsonExtract('order.orderResponse', '$.activatedItem.balance.name'),
        { [Op.like]: likeSearch }
      )
    ],

    [Op.and]: [
      sequelize.where(
        sequelize.literal(`
          COALESCE(
            JSON_UNQUOTE(JSON_EXTRACT(order.orderResponse, '$.esimProfile.iccid')),
            JSON_UNQUOTE(JSON_EXTRACT(order.orderResponse, '$.iccid'))
          )
        `),
        {
          [Op.ne]: null
        }
      )
    ]
  };

  if (from || to) {
    whereClause.createdAt = {};

    if (from) {
      whereClause.createdAt[Op.gte] = from;
    }

    if (to) {
      const tomorrow = new Date(to);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);

      whereClause.createdAt[Op.lt] = tomorrow;
    }
  }

  if (corporateId) {
    whereClause.credentialId = corporateId;
  }

  if (subCorporateUserId) {
    whereClause['$order.subCorporateUserId$'] = subCorporateUserId;
  }

  return await transaction.findAndCountAll({
    attributes: [
      "createdAt",
      "transactionCategory",
      "corporateTxnId",
      "orderId",

      [literal('order.status'), 'status'],
      [literal('order.amountInINR'), 'amountInINR'],
      [literal('order.paymentMode'), 'paymentMode'],

      [
        literal(`
          COALESCE(
            JSON_UNQUOTE(JSON_EXTRACT(order.orderResponse, '$.esimProfile.iccid')),
            JSON_UNQUOTE(JSON_EXTRACT(order.orderResponse, '$.iccid'))
          )
        `),
        'simDetailsEsim'
      ],

      [
        literal(`
          COALESCE(
            JSON_UNQUOTE(JSON_EXTRACT(order.orderResponse, '$.customerUid')),
            JSON_UNQUOTE(JSON_EXTRACT(order.orderResponse, '$.customer.uid'))
          )
        `),
        'customerUid'
      ],
      [literal("JSON_UNQUOTE(JSON_EXTRACT(order.orderResponse, '$.country'))"), 'country'],
      [literal("JSON_UNQUOTE(JSON_EXTRACT(order.orderResponse, '$.planId'))"), 'simDetailsPlanId'],

      [safeJsonExtract('order.orderResponse', '$.activatedItem.balance.name'), 'planName'],
      [safeJsonExtract('order.orderResponse', '$.activatedItem.balance.activationMode'), 'activationMode'],
      [
        literal("NULLIF(JSON_UNQUOTE(JSON_EXTRACT(order.orderResponse, '$.activatedItem.balance.activatedAt')), 'null')"),
        'activatedAt'
      ],
      [
        literal("NULLIF(JSON_UNQUOTE(JSON_EXTRACT(order.orderResponse, '$.activatedItem.balance.expiresAt')), 'null')"),
        'expiresAt'
      ],
      [
        literal(`
          NULLIF(CONCAT_WS(' ',
            JSON_UNQUOTE(JSON_EXTRACT(order.orderResponse, '$.activatedItem.balance.size.sizeValue')),
            JSON_UNQUOTE(JSON_EXTRACT(order.orderResponse, '$.activatedItem.balance.size.sizeUnit'))
          ), '')
        `),
        'dataSize'
      ],
      [
        literal(`
          NULLIF(CONCAT_WS(' ',
            JSON_UNQUOTE(JSON_EXTRACT(order.orderResponse, '$.activatedItem.balance.validitySize')),
            JSON_UNQUOTE(JSON_EXTRACT(order.orderResponse, '$.activatedItem.balance.validityUnit'))
          ), '')
        `),
        'validity'
      ],
      [safeJsonExtract('order.orderResponse', '$.esimProfile.installationUrl'), 'installationUrl'],
      [safeJsonExtract('order.orderResponse', '$.purchasedFor.name'), 'purchasedForName'],
    ],

    include: [
      {
        model: orders,
        attributes: []
      }
    ],
    where: whereClause,
    order: [[column, sort]],
    limit,
    offset
  });
});

exports.findAllRecordsTopUpListAndCount = asyncHandler(async (params) => {
  let {
    from,
    to,
    limit,
    offset,
    searchText,
    sort,
    column,
    corporateId,
    subCorporateUserId,
    iccid
  } = params;

  const likeSearch = `%${searchText}%`;

  let whereClause = {
    transactionCategory: "Travel",
    status: "SUCCESS",

    [Op.or]: [
      { id: { [Op.like]: likeSearch } },
      { orderId: { [Op.like]: likeSearch } },

      sequelize.where(sequelize.literal('order.amountInINR'), {
        [Op.like]: likeSearch
      }),

      sequelize.where(sequelize.literal('order.paymentMode'), {
        [Op.like]: likeSearch
      }),

      sequelize.where(
        safeJsonExtract('order.orderResponse', '$.esim'),
        { [Op.like]: likeSearch }
      )
    ],

    [Op.and]: [
      sequelize.where(
        safeJsonExtract('order.orderResponse', '$.type'),
        { [Op.eq]: "topup" }
      ),

      sequelize.where(
        safeJsonExtract('order.orderResponse', '$.iccid'),
        { [Op.eq]: iccid }
      )
    ]
  };

  if (from || to) {
    whereClause.createdAt = {};

    if (from) {
      whereClause.createdAt[Op.gte] = from;
    }

    if (to) {
      const tomorrow = new Date(to);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);

      whereClause.createdAt[Op.lt] = tomorrow;
    }
  }

  if (corporateId) {
    whereClause.credentialId = corporateId;
  }

  if (subCorporateUserId) {
    whereClause.subCorporateUserId = subCorporateUserId;
  }

  return await transaction.findAndCountAll({
    attributes: [
      "id",
      "createdAt",
      "transactionCategory",
      "orderId",
      [literal('order.amountInINR'), 'amountInINR'],
      [literal('order.paymentMode'), 'paymentMode'],

      [safeJsonExtract('order.orderResponse', '$.id'), 'orderResponseId'],
      [safeJsonExtract('order.orderResponse', '$.esim'), 'eSIM'],
      [safeJsonExtract('order.orderResponse', '$.createdAt'), 'planCreatedAt'],
      [safeJsonExtract('order.orderResponse', '$.metadata'), 'metadata'],
      [safeJsonExtract('order.orderResponse', '$.planId'), 'planId'],
      [safeJsonExtract('order.orderResponse', '$.type'), 'type'],
      [safeJsonExtract('order.orderResponse', '$.validity'), 'validity'],
      [safeJsonExtract('order.orderResponse', '$.data'), 'data'],
    ],
    include: [
      {
        model: orders,
        attributes: []
      },
    ],
    where: whereClause,
    order: [[column, sort]],
    limit,
    offset
  });

});

// credentialId is required: a batchId alone would return any customer's bulk transactions.
exports.findTransactionsByBatchId = async (batchId, credentialId, attributes=['status', 'corporateTxnId']) => {
  try {
    if (!batchId || !credentialId) return [];
    let transactions = await transaction.findAll({
      where: {
        batchId,
        credentialId
      },
      include: [
        { model: orders }
      ],
      attributes,
      raw: true,
      nest: true,
    })
    // Convert corporateTxnId to integer for UI type match
    transactions = transactions.map(transaction => ({
      ...transaction,
      corporateTxnId: parseInt(transaction.corporateTxnId)
    }));
    return transactions
  } catch (error) {
    console.log({ error })
    return []
  }
}