const transaction = require("./../entities/transaction");
const orders = require("./../entities/order");
const Subscription = require("./../entities/subscription");
const serviceOperator = require("./../entities/serviceOperator");
const vendor = require("./../entities/vendor")
const credential = require("./../entities/credential");
const subCorporateUsers = require("./../entities/subCorporateUsers");
const sequelize = require("sequelize");
const moment = require("moment");
const { Op } = require("sequelize");
const asyncHandler = require("./../../middlewares/async");
const ErrorResponse = require('../../utils/error-response')
let sequelizeConfig = require("../../configs/database/index");
const { handleSortFields } = require("../../utils/sortHandle");
const { formatNumberWithLocalString, formattedDateTime } = require("../../utils/formatter");
const { customLog } = require("../../utils/loggerHelper");
const { derivePaymentInstrument } = require("../../utils/paymentInstrument");
const { dayBoundedRange } = require("../../utils/istRange");

const createTransaction = async (params) => {
  try {
    return await transaction.create(params);
  } catch (error) {
    console.log(error.message);
  } finally {
    console.log("TRANSACTION CREATE ROUTE CALLED");
  }
};

const findOneTransaction = async (params) => {
  try {
    console.log(params.corporateTxnId);
    return await transaction.findOne({
      where: {
        corporateTxnId: params.corporateTxnId,
      },
      include: [
        {
          model: credential,
          required: false,
        },
        {
          model: serviceOperator,
          required: false,
        },
        {
          model: orders,
          required: false,
        },
      ],
    });
  } catch (error) {
    console.log(error);
  } finally {
    console.log("TRANSACTION FIND ONE ROUTE CALLED");
  }
};

const getOneTransaction = async (params) => {
  try {
       return await transaction.findOne({
            include: [
                 {
                      model: orders,
                 },
                 {
                      model: serviceOperator,
                      attributes: ['serviceProvider'],
                 },
            ],
            where: {
                 corporateTxnId: params.transactionId,
            },
       })
  } catch (error) {
       console.log(error)
  } finally {
       console.log('TRANSACTION FIND ONE ROUTE CALLED')
  }
}

const findAllTransaction = async (params) => {
  try {
    return await transaction.findAll({
      where: {
        credentialId: params.corporateId,
      },
    });
  } catch (error) {
    console.log(error);
  } finally {
    console.log("TRANSACTION FIND ALL ROUTE CALLED");
  }
};

const updateTransaction = async (params) => {
  try {
    return await transaction.update({
      where: {
        tranId: params.tranId,
      },
    });
  } catch (error) {
    console.log(error);
  } finally {
    console.log("TRANSACTION FIND ALL ROUTE CALLED");
  }
};

const deleteTransaction = async (params) => {
  try {
    return await transaction.destroy({
      where: {
        tranId: params.tranId,
      },
    });
  } catch (error) {
    console.log(error.message.message);
  } finally {
    console.log("TRANSACTION DELETE ROUTE CALLED");
  }
};

const findAllTransactions = asyncHandler(async (params) => {
  try {
    let {
      from,
      to,
      categoryName,
      accessKey,
      searchText,
      sort,
      filter,
      limit,
      offset,
      corporateId,
      serviceAttribute,
      credentialAttribute,
      transactionAttribute,
      orderAttribute,
      sortField,
      registeredBy,
      subCorporateUserId,
      cashbackFilter,
      subPartnerId,
    } = params;

    const escapeLike = (str = "") => str.replace(/[\\%_]/g, "\\$&");
    const safeSearch = escapeLike((searchText || "").toLowerCase());

    let order = handleSortFields(sortField, sort);

    const whereClause = {};

    if (from && to) {
      const tomorrow = new Date(to);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);

      whereClause.transactionDate = {
        [Op.between]: [from, tomorrow],
      };
    }

    if (safeSearch) {
      whereClause[Op.or] = [
        { id: { [Op.like]: `%${safeSearch}%` } },
        { corporateTxnId: { [Op.like]: `%${safeSearch}%` } },
        { debitAmount: { [Op.like]: `%${safeSearch}%` } },
        { creditAmount: { [Op.like]: `%${safeSearch}%` } },
        { corporateCashback: { [Op.like]: `%${safeSearch}%` } },
        { systemCashback: { [Op.like]: `%${safeSearch}%` } },
        { balance: { [Op.like]: `%${safeSearch}%` } },
        { transactionCategory: { [Op.like]: `%${safeSearch}%` } },
        { "$serviceOperator.serviceProvider$": { [Op.like]: `%${safeSearch}%` } },
        { "$order.paymentMode$": { [Op.like]: `%${safeSearch}%` } },
        { "$order.accountNo$": { [Op.like]: `%${safeSearch}%` } },
        { "$order.status$": { [Op.like]: `%${safeSearch}%` } },
        { "$credential.name$": { [Op.like]: `%${safeSearch}%` } },
        { "$credential.username$": { [Op.like]: `%${safeSearch}%` } },
      ];
    }

    if (corporateId) {
      whereClause.credentialId = corporateId;
    }

    if (subCorporateUserId) {
      whereClause["$order.subCorporateUserId$"] = subCorporateUserId;
    }

    if (cashbackFilter) {
      whereClause.corporateCashback = { [Op.gt]: 0 };
    }

    if (filter) {
      if (filter === 'FAILED') {
        whereClause["$order.status$"] = { [Op.in]: ['FAILED', 'FAILURE'] };
      } else if (filter === 'PENDING') {
        whereClause["$order.status$"] = { [Op.in]: ['PENDING', 'PROCESSING'] };
      } else {
        whereClause["$order.status$"] = filter;
      }
    }

    const serviceWhere = {};
    if (categoryName && categoryName !== "all") {
      serviceWhere.serviceCategory = categoryName;
    }
    if (accessKey && accessKey !== "all") {
      serviceWhere.accessKey = accessKey;
    }

    const credentialWhere = {};
    if (registeredBy) {
      credentialWhere.registeredBy = registeredBy;
      if (subPartnerId) {
        credentialWhere.subPartnerId = subPartnerId;
      }
    }

    const includeOptions = [
      {
        model: serviceOperator,
        attributes: serviceAttribute,
        required: false,
      },
      {
        model: credential,
        attributes: credentialAttribute,
        required: false,
        include: [
          {
            model: credential,
            as: "registeredByCredential",
            attributes: ["name"],
          },
        ],
      },
      {
        model: orders,
        attributes: orderAttribute,
        required: true,
        include: [
          {
            model: subCorporateUsers,
            attributes: ["name"],
          },
        ],
      },
    ];

    if (Object.keys(serviceWhere).length) {
      includeOptions[0].where = serviceWhere;
      includeOptions[0].required = true;
    }

    if (registeredBy) {
      includeOptions[1].where = credentialWhere;
      includeOptions[1].required = true;
    }

    return await transaction.findAndCountAll({
      include: includeOptions,
      where: whereClause,
      order,
      limit,
      offset,
      attributes: transactionAttribute,
      raw: true,
      nest: true,
    });
  } catch (error) {
    console.log(error);
    throw { message: "Something went wrong" };
  }
})
const findAllTransactionsCashback = asyncHandler(async (params) => {
  try{
    let {
        from, 
        to, 
        categoryName, 
        searchText,
        sort,
        filter,
        limit,
        offset,
        corporateId,
        serviceAttribute,
        credentialAttribute,
        transactionAttribute,
        orderAttribute,
        sortField,
        registeredBy,
        isCashbackRecord,
        subCorporateUserId
    } = params
  
    let order = handleSortFields(sortField,sort)
  
    // Adjust 'to' date to end of day
    const tomorrow = new Date(to);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
  
    let whereClause = {
        transactionDate: {
            [Op.between]: [from, tomorrow]
        },
        [Op.or]: [{
            id: {
                [Op.like]: '%' + searchText + '%'
            }
        }, {
            corporateTxnId: {
                [Op.like]: '%' + searchText + '%'
            }
        },
        {
            debitAmount: {
                [Op.like]: '%' + searchText + '%'
            }
        }, {
            creditAmount: {
                [Op.like]: '%' + searchText + '%'
            }
        },
        {
            corporateCashback: {
                [Op.like]: '%' + searchText + '%'
            }
        }, {
            systemCashback: {
                [Op.like]: '%' + searchText + '%'
            }
        }, {
            balance: {
                [Op.like]: '%' + searchText + '%'
            },
        }, {
            remarks: {
                [Op.like]: '%' + searchText + '%'
            }
        }, {
            '$serviceOperator.serviceProvider$': {
                [Op.like]: '%' + searchText + '%'
            }
        },
        {
            transactionCategory: {
                [Op.like]: '%' + searchText + '%'
            }
        },
        {
            '$order.paymentMode$': {
                [Op.like]: '%' + searchText + '%'
            }
        },
        {
            '$order.status$': {
                [Op.like]: '%' + searchText + '%'
            }
        },
        {
            '$credential.name$': {
                [Op.like]: '%' + searchText + '%'
            }
        },{
          '$credential.username$': {
              [Op.like]: '%' + searchText + '%'
          }
      }]
    }

    if (corporateId) {
        whereClause.credentialId = corporateId
    }
    if(categoryName && categoryName!='all'){
      whereClause.transactionCategory = categoryName
    }

    let whereClauseCredential = {}
    if (registeredBy) {
      whereClauseCredential.registeredBy = registeredBy
    }
    
    if (subCorporateUserId) {
      whereClause['$order.subCorporateUserId$'] = subCorporateUserId;
    }
    if (isCashbackRecord) {
      whereClause.corporateCashback = {
          [Op.gt]: 0
      };
    }

    if (filter) {
      // Expand certain UI filter values to their backend equivalents:
      //   FAILED  → matches both FAILED and FAILURE (legacy/synonym statuses)
      //   PENDING → matches both PENDING and PROCESSING (frontend labels both as "In Progress")
      if (filter === 'FAILED') {
        whereClause['$order.status$'] = { [Op.in]: ['FAILED', 'FAILURE'] };
      } else if (filter === 'PENDING') {
        whereClause['$order.status$'] = { [Op.in]: ['PENDING', 'PROCESSING'] };
      } else {
        whereClause['$order.status$'] = filter;
      }
    }

    let includeOptions = [
      {
        model: serviceOperator,
        attributes: serviceAttribute,
        required: false,
      },
      {
        model: credential,
        attributes: credentialAttribute,
        required: !!registeredBy,
        ...(registeredBy ? { where: whereClauseCredential } : {}),
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
        required: true,
        include: [
          {
            model: subCorporateUsers,
            attributes: ['name'],
          },
        ],
      }
    ];

    return await transaction.findAndCountAll({
        include: includeOptions,
        where: whereClause,
        order: order,
        limit: limit,
        offset: offset,
        attributes: transactionAttribute,
        raw: true,
        nest: true
    });
  } catch (error) {
    console.log(error);
    throw  {message:'Something went wrong'};
  }
})
const transactionsExcelCSV = asyncHandler(async (params, route) => {
  try {
    let {
      from,
      to,
      categoryName,
      searchText,
      sort,
      filter,
      corporateId,
      serviceAttribute,
      credentialAttribute,
      transactionAttribute,
      orderAttribute,
      sortField,
      registeredBy,
      cashbackFilter,
      subPartnerId,
      accessKey,
    } = params;

    const escapeLike = (str = "") => str.replace(/[\\%_]/g, "\\$&");
    const safeSearch = escapeLike((searchText || "").toLowerCase());

    if (!from || !to) {
      throw new Error("Invalid date range");
    }

    let order = handleSortFields(sortField, sort);
    const tomorrow = new Date(to);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    let whereClause = {
      transactionDate: {
        [Op.between]: [from, tomorrow],
      },
      [Op.or]: [
        { id: { [Op.like]: `%${safeSearch}%` } },
        { corporateTxnId: { [Op.like]: `%${safeSearch}%` } },
        { debitAmount: { [Op.like]: `%${safeSearch}%` } },
        { creditAmount: { [Op.like]: `%${safeSearch}%` } },
        { corporateCashback: { [Op.like]: `%${safeSearch}%` } },
        { systemCashback: { [Op.like]: `%${safeSearch}%` } },
        { balance: { [Op.like]: `%${safeSearch}%` } },
        { "$serviceOperator.serviceProvider$": { [Op.like]: `%${safeSearch}%` } },
        { transactionCategory: { [Op.like]: `%${safeSearch}%` } },
        { "$order.paymentMode$": { [Op.like]: `%${safeSearch}%` } },
        { "$order.accountNo$": { [Op.like]: `%${safeSearch}%` } },
        { "$order.status$": { [Op.like]: `%${safeSearch}%` } },
        { "$credential.name$": { [Op.like]: `%${safeSearch}%` } },
      ],
    };

    if (corporateId) {
      whereClause.credentialId = corporateId;
    }

    if (cashbackFilter) {
      whereClause.corporateCashback = { [Op.gt]: 0 };
    }

    if (filter) {
      // Expand certain UI filter values to their backend equivalents:
      //   FAILED  → matches both FAILED and FAILURE (legacy/synonym statuses)
      //   PENDING → matches both PENDING and PROCESSING (frontend labels both as "In Progress")
      if (filter === 'FAILED') {
        whereClause["$order.status$"] = { [Op.in]: ['FAILED', 'FAILURE'] };
      } else if (filter === 'PENDING') {
        whereClause["$order.status$"] = { [Op.in]: ['PENDING', 'PROCESSING'] };
      } else {
        whereClause["$order.status$"] = filter;
      }
    }

    let whereClauseCredential = {};
    if (registeredBy) whereClauseCredential.registeredBy = registeredBy;
    if (subPartnerId) whereClauseCredential.subPartnerId = subPartnerId;

    let includeOptions = [
      {
        model: serviceOperator,
        attributes: serviceAttribute,
        required: false,
      },
      {
        model: credential,
        attributes: credentialAttribute,
        required: !!(registeredBy || subPartnerId),
        ...(registeredBy || subPartnerId ? { where: whereClauseCredential } : {}),
        include: [
          {
            model: credential,
            as: "registeredByCredential",
            attributes: ["name"],
          },
        ],
      },
      {
        model: orders,
        attributes: orderAttribute,
        required: true,
      },
    ];

    const serviceWhere = {};
    if (categoryName && categoryName !== "all") {
      serviceWhere.serviceCategory = categoryName;
    }
    if (accessKey && accessKey !== "all") {
      serviceWhere.accessKey = accessKey;
    }
    if (Object.keys(serviceWhere).length) {
      includeOptions[0].where = serviceWhere;
      includeOptions[0].required = true;
    }

    const data = await transaction.findAndCountAll({
      include: includeOptions,
      where: whereClause,
      order: order,
      attributes: transactionAttribute,
      raw: true,
      nest: true,
    });

    let finalData = [];

    const isGateway = /gateway/i;
    const isWallet = /wallet/i;

    data.rows.forEach((limitData) => {
      const paymentMode = derivePaymentInstrument(limitData.order?.paymentModeResponse, limitData.order?.paymentMode)
        || (limitData.order?.paymentMode
          ? isGateway.test(limitData.order.paymentMode)
            ? "Payment Gateway"
            : isWallet.test(limitData.order.paymentMode)
            ? "Wallet"
            : limitData.order.paymentMode
          : "Not Available");

      if (route === "corporateTransaction") {
        finalData.push({
          Date: limitData.transactionDate
            ? formattedDateTime(limitData.transactionDate)
            : "Not Available",
          "Order ID": limitData.corporateTxnId || "Not Available",
          Category: limitData.transactionCategory || "Not Available",
          Operator: limitData.serviceOperator?.serviceProvider || "Not Available",
          Amount: limitData.order?.amountInINR
            ? "₹ " + formatNumberWithLocalString(limitData.order.amountInINR)
            : "0.00",
          "Payment Mode": paymentMode,
          Status: limitData.order?.status || "Not Available",
        });
      } else if (route === "corporateCashback") {
        finalData.push({
          Date: limitData.transactionDate
            ? formattedDateTime(limitData.transactionDate)
            : "Not Available",
          "Order ID": limitData.corporateTxnId || "Not Available",
          Category: limitData.transactionCategory || "Not Available",
          Operator: limitData.serviceOperator?.serviceProvider || "Not Available",
          Amount: limitData.order?.amountInINR
            ? "₹ " + formatNumberWithLocalString(limitData.order.amountInINR)
            : "0.00",
          "Cashback Received": limitData.corporateCashback
            ? "₹ " + formatNumberWithLocalString(limitData.corporateCashback)
            : "0.00",
          "Payment Mode": paymentMode,
        });
      } else if (route === "corporate") {
        finalData.push({
          "Transaction Date": limitData.transactionDate
            ? formattedDateTime(limitData.transactionDate)
            : "Not Available",
          "Transaction ID": limitData.corporateTxnId || "Not Available",
          "Corporate ID": limitData.credential?.username || "Not Available",
          "Corporate Name": limitData.credential?.name || "Not Available",
          "Partner Name": limitData.credential?.registeredByCredential?.name || "Not Available",
          "Service Category": limitData.serviceOperator?.serviceCategory || "Not Available",
          "Service Provider": limitData.serviceOperator?.serviceProvider || "Not Available",
          "Account Number": limitData.order?.accountNo || "Not Available",
          Amount: limitData.order?.amountInINR
            ? "₹ " + formatNumberWithLocalString(limitData.order.amountInINR)
            : "0.00",
          "Payment Mode": limitData.order?.paymentMode || "Not Available",
          "Corporate Cashback": limitData.corporateCashback
            ? "₹ " + formatNumberWithLocalString(limitData.corporateCashback)
            : "0.00",
          "Admin Cashback": limitData.systemCashback
            ? "₹ " + formatNumberWithLocalString(limitData.systemCashback)
            : "0.00",
          Balance: limitData.balance
            ? "₹ " + formatNumberWithLocalString(limitData.balance)
            : "0.00",
          Status: limitData.status || "Not Available",
        });
      }
    });

    return finalData;
  } catch (error) {
    console.error("transactionsExcelCSV error:", error);
    return [];
  }
});


const findAllPartnerTransactions = asyncHandler(async (params) => {
  let { corporateId, partnerId, from, to, start, length, searchText, order, column, details, categoryName } = params;
  console.log(partnerId);
  const sortableColumns = [
    "transactionDate",
    "providerId",
    "corporateTxnId",
    "transactionCategory",
    "serviceOperator.serviceProvider",
    "amountInINR",
    "order.paymentMode ",
    "order.status",
  ];
  // Convert column index to column name
  if (column >= 0 && column < sortableColumns.length) {
    column = sortableColumns[column];
  } else {
    column = "createdAt"; // Default column name if invalid index is provided
  }

  let whereClause = {
    transactionDate: {
      [Op.between]: [from, to],
    },
    [Op.or]: [
      {
        id: {
          [Op.like]: "%" + searchText + "%",
        },
      },
      {
        corporateTxnId: {
          [Op.like]: "%" + searchText + "%",
        },
      },
      {
        debitAmount: {
          [Op.like]: "%" + searchText + "%",
        },
      },
      {
        creditAmount: {
          [Op.like]: "%" + searchText + "%",
        },
      },
      {
        corporateCashback: {
          [Op.like]: "%" + searchText + "%",
        },
      },
      {
        systemCashback: {
          [Op.like]: "%" + searchText + "%",
        },
      },
      {
        balance: {
          [Op.like]: "%" + searchText + "%",
        },
      },
      {
        remarks: {
          [Op.like]: "%" + searchText + "%",
        },
      },
      {
        "$serviceOperator.serviceProvider$": {
          [Op.like]: "%" + searchText + "%",
        },
      },
      {
        transactionCategory: {
          [Op.like]: "%" + searchText + "%",
        },
      },
      {
        "$order.paymentMode$": {
          [Op.like]: "%" + searchText + "%",
        },
      },
      {
        "$order.status$": {
          [Op.like]: "%" + searchText + "%",
        },
      },
      {
        "$credential.name$": {
          [Op.like]: "%" + searchText + "%",
        },
      },
    ],
  };
  if (corporateId) {
    whereClause.credentialId = corporateId;
  }

  const clauseRegisteredBy = {};

  if (typeof partnerId !== "undefined") {
    clauseRegisteredBy.registeredBy = partnerId;
  }

  let includeOptions = [
    {
      model: serviceOperator,
      where: {
        serviceCategory: categoryName,
        // [Op.or]: [{
        //     serviceProvider: {
        //         [Op.like]: '%' + searchText + '%'
        //     }
        // }]
      },
      required: details || false,
    },
    {
      model: credential,
      where: clauseRegisteredBy,
      // attributes: ['name', 'id']
      // required: details || false,
    },
    {
      model: orders,
      required: details || false,
    },
  ];
  if (categoryName !== undefined) {
    console.log("if ==================");
    includeOptions[0].where.serviceCategory = categoryName;
  } else {
    delete includeOptions[0].where.serviceCategory;
  }
  return await transaction.findAndCountAll({
    include: includeOptions,
    where: whereClause,
    order: [[column, order]],
    limit: length,
    offset: start,
    raw: true,
    nest: true,
  });
  // return await transaction.findAndCountAll({
  //     include: [{
  //         model: serviceOperator,
  //         where: {
  //             serviceCategory: categoryName,
  //             [Op.or]: [{
  //                 serviceProvider: {
  //                     [Op.like]: '%' + searchText + '%'
  //                 }
  //             }]
  //         },
  //         required: details || false,

  //     },
  //     {
  //         model: credential,
  //         where: {
  //             [Op.or]: [{
  //                 name: {
  //                     [Op.like]: '%' + searchText + '%'
  //                 }
  //             }]
  //         },
  //         required: details || false,

  //     },
  //     {
  //         model: orders,
  //         required: details || false,

  //     }
  //     ],
  //     where: whereClause,
  //     order: [
  //         [column, order]
  //     ],
  //     limit: length,
  //     offset: start,
  //     raw: true,
  //     nest: true
  // })
});
const findAllVendorTransactions = asyncHandler(async (params) => {
  try{
    let {  vendorId,
      from,
      to,
      limit,
      offset,
      searchText,
      sort,
      sortField } = params;
    let details = true;
  
    let order = handleSortFields(sortField,sort)
    
    let tomorrow = new Date(to);
    if(to){
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
    }
    let whereClause = {
      transactionDate: {
        [Op.between]: [from, tomorrow],
      },
      [Op.or]: [
        {
          id: {
            [Op.like]: "%" + searchText + "%",
          },
        },
        {
          corporateTxnId: {
            [Op.like]: "%" + searchText + "%",
          },
        },
        {
          debitAmount: {
            [Op.like]: "%" + searchText + "%",
          },
        },
        {
          creditAmount: {
            [Op.like]: "%" + searchText + "%",
          },
        },
        {
          corporateCashback: {
            [Op.like]: "%" + searchText + "%",
          },
        },
        {
          systemCashback: {
            [Op.like]: "%" + searchText + "%",
          },
        },
        {
          balance: {
            [Op.like]: "%" + searchText + "%",
          },
        },
        {
          remarks: {
            [Op.like]: "%" + searchText + "%",
          },
        }, {
          '$serviceOperator.serviceProvider$': {
            [Op.like]: "%" + searchText + "%",
          }
        },  {
          '$serviceOperator.vendor.vendorName$': {
            [Op.like]: "%" + searchText + "%",
          }
        }, {
          '$credential.name$': {
            [Op.like]: "%" + searchText + "%",
          }
        }, {
          '$credential.username$': {
            [Op.like]: "%" + searchText + "%",
          }
        }
      ],
    };

    if (vendorId) {
      whereClause['$serviceOperator.vendorId$'] = vendorId;
    } 

    return await transaction.findAndCountAll({
      attributes:["createdAt","transactionDate","corporateTxnId","debitAmount","status","remarks"],
      include: [
        {
          model: serviceOperator,
          attributes:["vendorId","serviceProvider"],
          required: details || false,
          include: [
            {
              model: vendor,  
              attributes: ['vendorName'],
            }
          ],
        },
        {
          model: credential,
          attributes:["username","name"],
          required: details || false,
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
          attributes:["orderResponse","amountInINR"],
          required: details || false,
        },
      ],
      where: whereClause,
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
const vendorTransactionsExcelCSV = asyncHandler(async (params) => {
  try {
    let {  vendorId,
      from,
      to,
      searchText,
      sort,
      sortField } = params;
    let details = true;

    let order = handleSortFields(sortField,sort)
  
    let tomorrow = new Date(to);
    if(to){
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
    }
    let whereClause = {
      transactionDate: {
        [Op.between]: [from, tomorrow],
      },
      [Op.or]: [
        {
          id: {
            [Op.like]: "%" + searchText + "%",
          },
        },
        {
          corporateTxnId: {
            [Op.like]: "%" + searchText + "%",
          },
        },
        {
          debitAmount: {
            [Op.like]: "%" + searchText + "%",
          },
        },
        {
          creditAmount: {
            [Op.like]: "%" + searchText + "%",
          },
        },
        {
          corporateCashback: {
            [Op.like]: "%" + searchText + "%",
          },
        },
        {
          systemCashback: {
            [Op.like]: "%" + searchText + "%",
          },
        },
        {
          balance: {
            [Op.like]: "%" + searchText + "%",
          },
        },
        {
          remarks: {
            [Op.like]: "%" + searchText + "%",
          },
        },{
          '$serviceOperator.serviceProvider$': {
            [Op.like]: "%" + searchText + "%",
          }
        },  {
          '$serviceOperator.vendor.vendorName$': {
            [Op.like]: "%" + searchText + "%",
          }
        }, {
          '$credential.name$': {
            [Op.like]: "%" + searchText + "%",
          }
        }, {
          '$credential.username$': {
            [Op.like]: "%" + searchText + "%",
          }
        }
      ],
    };
    let vendorWhereClause = {};
    if (vendorId) {
      whereClause['$serviceOperator.vendorId$'] = vendorId;
      // whereClause[Op.or].push({
      //   '$serviceOperator.vendorId$': vendorId
      // })
    } 
    // else {
    //   vendorWhereClause = {
    //     [Op.or]: [
    //       {
    //         serviceProvider: {
    //           [Op.like]: "%" + searchText + "%",
    //         },
    //       },
    //     ],
    //   };
    // }
    let data = await transaction.findAndCountAll({
      attributes:["createdAt","transactionDate","corporateTxnId","debitAmount","status","remarks"],
      include: [
        {
          model: serviceOperator,
          attributes:["vendorId","serviceProvider"],
          where: vendorWhereClause,
          required: details || false,
          include: [
            {
              model: vendor,  
              attributes: ['vendorName'],
            }
          ],
        },
        {
          model: credential,
          attributes:["username","name"],
          required: details || false,
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
          attributes:["orderResponse","amountInINR"],
          required: details || false,
        },
      ],
      where: whereClause,
      order: order,
      raw: true,
      nest: true,
    });
    let finalData = [];
    data.rows.forEach(function (limitData) {
      finalData.push({
        "Transaction Date": limitData.transactionDate ? formattedDateTime(limitData.transactionDate) : "Not Available",
        "Transaction ID": limitData.corporateTxnId ? limitData.corporateTxnId.toString() : "Not Available",
        "Corporate ID": limitData.credential?.username ? limitData.credential?.username : "Not Available",
        "Corporate Name": limitData.credential?.name ? limitData.credential?.name : "Not Available",
        "Partner Name": limitData?.credential?.registeredByCredential?.name ?? "Not Available",
        Vendor: limitData.serviceOperator?.vendor?.vendorName ? limitData.serviceOperator?.vendor?.vendorName : "Not Available",
        "Service Provider": limitData.serviceOperator?.serviceProvider ? limitData.serviceOperator?.serviceProvider : "Not Available",
        Amount: limitData.order?.amountInINR ?  "₹ " + formatNumberWithLocalString(limitData.order?.amountInINR) : "₹ 0.00",
        Status: limitData.status ? limitData.status  : "Not Available",
        Remarks: limitData.remarks ? limitData.remarks : "Not Available",
      });
    });
    return finalData;
  } catch (error) {
    console.log(error);
    return [];
  }
});
const transactionDetails = async (params) => {
  console.log(params)
  try {
      return await orders.findOne({
          include: [{
              model: serviceOperator,
              attributes: ['serviceProvider']
          }],
          where: {
              corporateTxnId: params.transactionId
          }
      })
  } catch (error) {
      console.log(error)
  } finally {
      console.log("ORDER FIND ONE ROUTE CALLED")
  }
}
const transactionReports = async (params) => {
  try {
    const { credentialId, from, to } = params;

    return sequelizeConfig.query(
      `
      SELECT *
      FROM reportAll
      WHERE reportAll.credentialId = ?
      AND reportAll.transactionDate BETWEEN ? AND ?
      `,
      {
        replacements: [credentialId, from, to],
        type: sequelizeConfig.QueryTypes.SELECT,
      }
    );
  } catch (error) {
    return [];
  }
};
const transactionsExcelReport = async (params) => {
  
  try {
   
    let { credentialId, from, to, partnerId } = params;
   
    let whereClause = {
      transactionDate: {
        [Op.between]: [from, to],
      }
    };
    if (credentialId) {
      whereClause.credentialId = credentialId;
    }
    let registeredByClause = {};
  
    if (typeof partnerId !== "undefined") {
      registeredByClause.registeredBy = partnerId;
    }
    let includeOptions = [
      {
        model: serviceOperator,
       
       
      },
      {
        model: credential,
      
      },
      {
        model: orders,
       
      },
    ];
   
   const data= await transaction.findAndCountAll({
      include: includeOptions,
      where: whereClause,
      raw: true,
      nest: true,
    });
    let finalData = [];
  data.rows.forEach(function (limitData) {
    finalData.push({
      ID: limitData.id,
      "Date/Time": limitData.transactionDate ? moment(limitData.transactionDate).format("YYYY-MM-DD HH:mm:ss") : "Not Available",
      "Order ID": limitData.providerId ? limitData.providerId : "Not Available",
      "Transaction ID": limitData.corporateTxnId ? limitData.corporateTxnId : "Not Available",
      Category: limitData.transactionCategory ? limitData.transactionCategory : "Not Available",
      Operator: limitData.serviceOperator.serviceProvider ? limitData.serviceOperator.serviceProvider : "Not Available",
      Amount: limitData.order.amountInINR ? parseFloat(limitData.order.amountInINR).toFixed(2) + " ₹" : "0.00",
      "Payment Mode": limitData.order.paymentMode ? limitData.order.paymentMode : "Not Available",
      Status: limitData.status ? limitData.status : "Not Available",
      
    });
  });
  return finalData;
    

  } catch (error) {
    console.error(error,"errror");
    return [];
  }
};

const transactionExcelCSV = async (params) => {
  try {
    let { from, to, order, column } = params;

    let whereClause = {
      transactionDate: {
        [Op.between]: [from, to],
      },
    };

    let data = await transaction.findAndCountAll({
      include: [
        {
          model: serviceOperator,
          required: false,
        },
        {
          model: credential,
          required: false,
        },
        {
          model: orders,
          required: false,
        },
      ],
      where: whereClause,
      order: [[column, order]],
      raw: true,
      nest: true,
    });

    let finalData = [];
    data.rows.forEach(function (limitData) {
      finalData.push({
        "Transaction ID": limitData.corporateTxnId ? limitData.corporateTxnId.toString() : "Not Available",
        "Corporate Name": limitData.credential.name ? limitData.credential.name : "Not Available",
        Date: limitData.transactionDate ? moment(limitData.transactionDate).format("YYYY-MM-DD HH:mm:ss") : "Not Available",
        Type: limitData.transactionType ? limitData.transactionType : "Not Available",
        Category: limitData.transactionCategory ? limitData.transactionCategory : "Not Available",
        "Debit Amount": limitData.debitAmount ? limitData.debitAmount + "₹" : "0.0000",
        "Credit Amount": limitData.creditAmount ? limitData.creditAmount + "₹" : "0.0000",
        Cashback: limitData.corporateCashback ? limitData.corporateCashback + "₹" : "0.0000",
        Balance: limitData.balance ? limitData.balance + "₹" : "0.0000",
        Remarks: limitData.remarks ? limitData.remarks : "Not Available",
      });
    });
    return finalData;
  } catch (error) {
    return [];
  }
};

const transactionPDF = async (params) => {
  try {
    let { from, to, order, column } = params;

    let whereClause = {
      transactionDate: {
        [Op.between]: [from, to],
      },
    };

    let data = await transaction.findAndCountAll({
      include: [
        {
          model: serviceOperator,
          required: false,
        },
        {
          model: credential,
          required: false,
        },
        {
          model: orders,
          required: false,
        },
      ],
      where: whereClause,
      order: [[column, order]],
      raw: true,
      nest: true,
    });

    let finalData = [];
    data.rows.forEach(function (limitData) {
      finalData.push({
        TransactionId: limitData.corporateTxnId ? limitData.corporateTxnId.toString() : "Not Available",
        CorporateName: limitData.credential.name ? limitData.credential.name : "Not Available",
        Date: limitData.transactionDate ? moment(limitData.transactionDate).format("YYYY-MM-DD HH:mm:ss") : "Not Available",
        Type: limitData.transactionType ? limitData.transactionType : "Not Available",
        Category: limitData.transactionCategory ? limitData.transactionCategory : "Not Available",
        DebitAmount: limitData.debitAmount ? limitData.debitAmount + "₹" : "0.0000",
        CreditAmount: limitData.creditAmount ? limitData.creditAmount + "₹" : "0.0000",
        Cashback: limitData.corporateCashback ? limitData.corporateCashback + "₹" : "0.0000",
        Balance: limitData.balance ? limitData.balance + "₹" : "0.0000",
        Remarks: limitData.remarks ? limitData.remarks : "Not Available",
      });
    });
    return finalData;
  } catch (error) {
    return [];
  }
};

const walletExcelCSV = async (
  params,
  transactionType = ["PAYMENT", "CREDIT"],
  fields = [
    "Transaction Date",
    "Transaction ID",
    "Corporate Name",
    "Corporate ID",
    "Transaction Type",
    "Debit Amount",
    "Credit Amount",
    "Status",
  ]
) => {
  try {
    let { from, to, searchText, sort, sortField, userId, partnerId } = params;

    let order = handleSortFields(sortField, sort);

    let whereClause = {};

    if (from && to) {
      const { from: dayStart, to: dayEnd } = dayBoundedRange(from, to);

      whereClause.transactionDate = {
        [Op.between]: [dayStart, dayEnd],
      };
    }

    if (searchText) {
      whereClause[Op.or] = [
        { id: { [Op.like]: `%${searchText}%` } },
        { corporateTxnId: { [Op.like]: `%${searchText}%` } },
        { debitAmount: { [Op.like]: `%${searchText}%` } },
        { creditAmount: { [Op.like]: `%${searchText}%` } },
        { corporateCashback: { [Op.like]: `%${searchText}%` } },
        { systemCashback: { [Op.like]: `%${searchText}%` } },
        { balance: { [Op.like]: `%${searchText}%` } },
        { remarks: { [Op.like]: `%${searchText}%` } },
        { "$credential.name$": { [Op.like]: `%${searchText}%` } },
      ];
    }

    if (userId) {
      whereClause.credentialId = userId;
    }

    whereClause.transactionType = {
      [Op.or]: transactionType,
    };

    let registeredByClause = {
      role: "CORPORATE",
    };

    if (partnerId) {
      registeredByClause.registeredBy = partnerId;
    }

    const data = await transaction.findAll({
      attributes: [
        "transactionDate",
        "corporateTxnId",
        "transactionType",
        "debitAmount",
        "creditAmount",
        "status",
        [sequelize.literal("order.paymentMode"), "paymentMode"],
      ],
      include: [
        {
          model: credential,
          where: registeredByClause,
          attributes: ["name", "username"],
        },
        {
          model: orders,
          attributes: [],
        },
      ],
      where: whereClause,
      order,
      raw: true,
      nest: true,
    });

    return buildFinalData(data, fields);
  } catch (error) {
    console.error("walletExcelCSV error:", error);
    return [];
  }
};


const findAllWalletTransactions = asyncHandler(async (params) => {
  let {
    from,
    to,
    limit,
    offset,
    searchText,
    sort,
    sortField,
    userId,
    partnerId,
  } = params;

  let order = handleSortFields(sortField, sort);

  let whereClause = {};

  if (from && to) {
    const { from: dayStart, to: dayEnd } = dayBoundedRange(from, to);

    whereClause.transactionDate = {
      [Op.between]: [dayStart, dayEnd],
    };
  }

  if (searchText) {
    whereClause[Op.or] = [
      { id: { [Op.like]: `%${searchText}%` } },
      { corporateTxnId: { [Op.like]: `%${searchText}%` } },
      { debitAmount: { [Op.like]: `%${searchText}%` } },
      { creditAmount: { [Op.like]: `%${searchText}%` } },
      { corporateCashback: { [Op.like]: `%${searchText}%` } },
      { systemCashback: { [Op.like]: `%${searchText}%` } },
      { balance: { [Op.like]: `%${searchText}%` } },
      { remarks: { [Op.like]: `%${searchText}%` } },
      { "$credential.name$": { [Op.like]: `%${searchText}%` } },
    ];
  }

  if (userId) {
    whereClause.credentialId = userId;
  }

  whereClause.transactionCategory = {
    [Op.or]: ["FUND TRANSFER", "FUND REVERSAL"],
  };

  let registeredByClause = {
    role: "CORPORATE",
  };

  if (partnerId) {
    registeredByClause.registeredBy = partnerId;
  }

  return await transaction.findAndCountAll({
    attributes: [
      "id",
      "transactionDate",
      "corporateTxnId",
      "transactionType",
      "debitAmount",
      "creditAmount",
      "status",
      "journalRecordStatus",
      "journalData",
    ],
    include: [
      {
        model: credential,
        where: registeredByClause,
        attributes: ["name", "username"],
      },
    ],
    where: whereClause,
    order,
    limit: limit ? parseInt(limit, 10) : 10,
    offset: offset ? parseInt(offset, 10) : 0,
    raw: true,
    nest: true,
  });
});


const findPekoWalletTransactions = asyncHandler(  async (params, transactionType = ["PAYMENT", "CREDIT"]) => {
    const {
      from,
      to,
      limit,
      offset,
      searchText = "",
      sort,
      sortField,
      userId,
      partnerId,
    } = params;

    const order = handleSortFields(sortField, sort);

    let whereClause = {};

    if (from && to) {
      const tomorrow = new Date(to);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);

      whereClause.transactionDate = {
        [Op.between]: [from, tomorrow],
      };
    }

    if (searchText) {
      whereClause[Op.or] = [
        { id: { [Op.like]: `%${searchText}%` } },
        { corporateTxnId: { [Op.like]: `%${searchText}%` } },
        { debitAmount: { [Op.like]: `%${searchText}%` } },
        { creditAmount: { [Op.like]: `%${searchText}%` } },
        { corporateCashback: { [Op.like]: `%${searchText}%` } },
        { systemCashback: { [Op.like]: `%${searchText}%` } },
        { balance: { [Op.like]: `%${searchText}%` } },
        { remarks: { [Op.like]: `%${searchText}%` } },
        { "$credential.name$": { [Op.like]: `%${searchText}%` } },
      ];
    }

    if (userId) {
      whereClause.credentialId = userId;
    }

    whereClause.transactionType = {
      [Op.in]: transactionType,
    };

    let registeredByClause = { role: "CORPORATE" };

    if (partnerId) {
      registeredByClause.registeredBy = partnerId;
    }

    return await transaction.findAndCountAll({
      attributes: [
        "transactionDate",
        "corporateTxnId",
        "transactionType",
        "debitAmount",
        "creditAmount",
        "status",
        "id",
        "remarks",
      ],
      include: [
        {
          model: credential,
          where: registeredByClause,
          attributes: ["name", "username"],
        },
      ],
      where: whereClause,
      order,
      limit,
      offset,
      raw: true,
      nest: true,
    });
  }
);


const findAllInvestmentsAndCount = asyncHandler(async (params) => {
  let { corporateId, from, to, start, length, searchText, order, column } = params;
  const sortableColumns = ["id", "createdAt", "operatorId", "investmentData.name", "amount"];
  // Convert column index to column name
  if (column >= 0 && column < sortableColumns.length) {
    column = sortableColumns[column];
  } else {
    column = "createdAt"; // Default column name if invalid index is provided
  }
  let whereClause = {
    transactionDate: {
      [Op.between]: [from, to],
    },
    [Op.or]: [
      {
        id: {
          [Op.like]: "%" + searchText + "%",
        },
      },
      {
        corporateTxnId: {
          [Op.like]: "%" + searchText + "%",
        },
      },
      {
        debitAmount: {
          [Op.like]: "%" + searchText + "%",
        },
      },
      {
        creditAmount: {
          [Op.like]: "%" + searchText + "%",
        },
      },
      {
        corporateCashback: {
          [Op.like]: "%" + searchText + "%",
        },
      },
      {
        systemCashback: {
          [Op.like]: "%" + searchText + "%",
        },
      },
      {
        balance: {
          [Op.like]: "%" + searchText + "%",
        },
      },
      {
        remarks: {
          [Op.like]: "%" + searchText + "%",
        },
      },
    ],
  };
  if (corporateId) {
    whereClause.credentialId = corporateId;
  }
  return await orders.findAndCountAll({
    include: [
      {
        model: serviceOperator,
        where: {
          serviceCategory: "zeroCarbon", //filter only those who belongs to serviceCategory workspace
        },
      },
    ],
    where: {
      credentialId: corporateId, //filter only those who belongs to specific user
      [Op.or]: [
        {
          id: {
            [Op.like]: "%" + searchText + "%",
          },
        },
        {
          operatorId: {
            [Op.like]: "%" + searchText + "%",
          },
        },
        {
          amountInINR: {
            [Op.like]: "%" + searchText + "%",
          },
        },
        {
          orderResponse: {
            [Op.like]: "%" + searchText + "%",
          },
        },
        sequelize.literal(`orderResponse -> '$.investData.name' LIKE :searchText`),
      ],
    },
    order: [[column, order]],
    limit: length,
    offset: start,
    raw: true,
    nest: true,
    replacements: { searchText: `%${searchText}%` },
  });
});
const findAllWorkspaceOrders = asyncHandler(async (params) => {
  try {
    let {
      from,
      to,
      limit,
      offset,
      searchText,
      sort,
      sortField,
      // registeredBy,
      partnerId
    } = params;

    let order = handleSortFields(sortField, sort)
    // Adjust 'to' date to end of day
    const tomorrow = new Date(to);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    let whereClauseCredential = {}
    //  if(registeredBy)
    //   whereClauseCredential.registeredBy = registeredBy

    if (partnerId === 'default') {
      whereClauseCredential.registeredBy = null;
    } else if (partnerId) {
      whereClauseCredential.registeredBy = partnerId;

    }
    return await orders.findAndCountAll({
      attributes: ['id', 'transactionDate', 'corporateTxnId', 'orderResponse', 'paymentMode', 'amountInINR', 'workspaceOrderStatus'],
      include: [
        {
          model: serviceOperator,
          attributes: ['serviceCategory'],
          where: {
            serviceCategory: "Office Address", //filter only those who belongs to serviceCategory workspace
            //  [Op.or]: [{
            // serviceProvider: {
            // [Op.like]: '%' + searchText + '%'
            // }
            //}]
          },
        },
        {
          model: credential,
          attributes: ["name", "email", "username"],
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
      ],
      where: {
        transactionDate: {
          [Op.between]: [from, tomorrow],
        },
        [Op.or]: [
          {
            id: {
              [Op.like]: "%" + searchText + "%",
            },
          },
          {
            corporateTxnId: {
              [Op.like]: "%" + searchText + "%",
            },
          },
          {
            operatorId: {
              [Op.like]: "%" + searchText + "%",
            },
          },
          {
            amountInINR: {
              [Op.like]: "%" + searchText + "%",
            },
          },
          {
            baseAmount: {
              [Op.like]: "%" + searchText + "%",
            },
          },
          {
            baseCurrency: {
              [Op.like]: "%" + searchText + "%",
            },
          },
          {
            exchangeRate: {
              [Op.like]: "%" + searchText + "%",
            },
          },
          {
            status: {
              [Op.like]: "%" + searchText + "%",
            },
          },
          {
            paymentMode: {
              [Op.like]: "%" + searchText + "%",
            },
          },
          {
            "$credential.name$": {
              [Op.like]: "%" + searchText + "%",
            },
          },
          {
            "$credential.username$": {
              [Op.like]: "%" + searchText + "%",
            },
          },
          {
            message: {
              [Op.like]: "%" + searchText + "%",
            },
          },
          sequelize.literal(`LOWER(JSON_EXTRACT(\`orderResponse\`, '$.planDetails.name')) LIKE LOWER(:searchText)`),
          sequelize.literal(`LOWER(JSON_EXTRACT(\`orderResponse\`, '$.planDetails.billingCycle')) LIKE LOWER(:searchText)`),
        ],
      },
      order: order,
      limit,
      offset,
      replacements: { searchText: `%${searchText}%` },
      raw: true,
      nest: true,
    });
  } catch (error) {
    customLog(
      null,
      "error",
      {
        error: error,
      },

    );
    throw { message: 'Something went wrong' };
  }
});
const workspaceOrdersExcelCSVData = asyncHandler(async (params) => {
  try {
    let {
      from,
      to,
      searchText,
      sort,
      sortField,
      // registeredBy,
      partnerId } = params;

    let order = handleSortFields(sortField, sort)
    // Adjust 'to' date to end of day
    const tomorrow = new Date(to);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    let whereClauseCredential = {}
    //  if(registeredBy)
    //   whereClauseCredential.registeredBy = registeredBy
    if (partnerId === 'default') {
      whereClauseCredential.registeredBy = null;
    } else if (partnerId) {
      whereClauseCredential.registeredBy = partnerId;
    }

    const data = await orders.findAndCountAll({
      // attributes:["transactionDate","corporateTxnId","transactionCategory","amountInINR","corporateCashback","remarks","status"],
      include: [
        {
          attributes: ["serviceProvider"],
          model: serviceOperator,
          where: {
            serviceCategory: "Office Address", //filter only those who belongs to serviceCategory workspace
            //  [Op.or]: [{
            // serviceProvider: {
            // [Op.like]: '%' + searchText + '%'
            // }
            //}]
          },
        },
        {
          model: credential,
          attributes: ["name", "email", 'username'],
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
      ],
      where: {
        transactionDate: {
          [Op.between]: [from, tomorrow],
        },
        [Op.or]: [
          {
            id: {
              [Op.like]: "%" + searchText + "%",
            },
          },
          {
            corporateTxnId: {
              [Op.like]: "%" + searchText + "%",
            },
          },
          {
            operatorId: {
              [Op.like]: "%" + searchText + "%",
            },
          },
          {
            amountInINR: {
              [Op.like]: "%" + searchText + "%",
            },
          },
          {
            baseAmount: {
              [Op.like]: "%" + searchText + "%",
            },
          },
          {
            baseCurrency: {
              [Op.like]: "%" + searchText + "%",
            },
          },
          {
            exchangeRate: {
              [Op.like]: "%" + searchText + "%",
            },
          },
          {
            status: {
              [Op.like]: "%" + searchText + "%",
            },
          },
          {
            paymentMode: {
              [Op.like]: "%" + searchText + "%",
            },
          },
          {
            "$credential.name$": {
              [Op.like]: "%" + searchText + "%",
            },
          },
          {
            "$credential.username$": {
              [Op.like]: "%" + searchText + "%",
            },
          },
          {
            message: {
              [Op.like]: "%" + searchText + "%",
            },
          },
          sequelize.where(
            sequelize.literal(`LOWER(JSON_EXTRACT(\`orderResponse\`, '$.planDetails.name'))`),
            {
              [Op.like]: `%${searchText.toLowerCase()}%`
            }
          ),

        ],
      },
      order: order,
      raw: true,
      nest: true,
    });
    let finalData = []
    data.rows.forEach(function (limitData) {
      const orderResponse = JSON.parse(limitData.orderResponse)
      finalData.push({
        "Transaction Date": limitData.transactionDate ? formattedDateTime(limitData.transactionDate) : 'Not Available',
        "Transaction ID": limitData.corporateTxnId ? limitData.corporateTxnId : 'Not Available',
        "Corporate ID": limitData.credential?.username ? limitData.credential?.username : 'Not Available',
        "Corporate Name": limitData.credential?.name ? limitData.credential?.name : 'Not Available',
        "Partner Name": limitData.credential?.registeredByCredential?.name ? limitData.credential?.registeredByCredential?.name : "Not Available",
        "Plan Name": orderResponse?.planDetails?.name ? orderResponse?.planDetails?.name : 'Not Available',
        "Billing Cycle": orderResponse?.planDetails?.billingCycle ? orderResponse?.planDetails?.billingCycle : 'Not Available',
        "Payment Mode": limitData.paymentMode ? limitData.paymentMode : 'Not Available',
        Amount: limitData.baseAmount ? "₹ " + formatNumberWithLocalString(limitData.baseAmount) : "₹ 0.00",
        Status: limitData.status ? limitData.status : "Not Available",
      })
    })
    return finalData
  } catch (error) {
    customLog(
      null,
      "error",
      {
        error: error,
      },

    );
    throw { message: 'Something went wrong' };
  }
});

const findAllPartnerWorkspaceOrders = asyncHandler(async (params) => {
  let { corporateId, start, from, to, length, searchText, order, column, partnerId } = params;
  const sortableColumns = [
    "corporateTxnId",
    "credential.name",
    "planDetails.name",
    "transactionDate",
    "amountInINR",
    "paymentMode",
    "status",
    "bookingDetails.name",
  ];
  // Convert column index to column name
  if (column >= 0 && column < sortableColumns.length) {
    column = sortableColumns[column];
  } else {
    column = "createdAt"; // Default column name if invalid index is provided
  }
  let whereClause = {
    transactionDate: {
      [Op.between]: [from, to],
    },
    [Op.or]: [
      {
        id: {
          [Op.like]: "%" + searchText + "%",
        },
      },
      {
        corporateTxnId: {
          [Op.like]: "%" + searchText + "%",
        },
      },
      {
        operatorId: {
          [Op.like]: "%" + searchText + "%",
        },
      },
      {
        amountInINR: {
          [Op.like]: "%" + searchText + "%",
        },
      },
      {
        baseAmount: {
          [Op.like]: "%" + searchText + "%",
        },
      },
      {
        baseCurrency: {
          [Op.like]: "%" + searchText + "%",
        },
      },
      {
        exchangeRate: {
          [Op.like]: "%" + searchText + "%",
        },
      },
      {
        status: {
          [Op.like]: "%" + searchText + "%",
        },
      },
      {
        paymentMode: {
          [Op.like]: "%" + searchText + "%",
        },
      },
      {
        "$credential.name$": {
          [Op.like]: "%" + searchText + "%",
        },
      },
      {
        message: {
          [Op.like]: "%" + searchText + "%",
        },
      },
    ],
  };
  if (corporateId) {
    whereClause.credentialId = corporateId;
  }

  let registeredByClause = {};
  if (typeof partnerId !== "undefined") {
    registeredByClause.registeredBy = partnerId;
  }

  return await orders.findAndCountAll({
    include: [
      {
        model: serviceOperator,
        where: {
          serviceCategory: "Workspaces", //filter only those who belongs to serviceCategory workspace
          //  [Op.or]: [{
          // serviceProvider: {
          // [Op.like]: '%' + searchText + '%'
          // }
          //}]
        },
      },
      {
        model: credential,
        where: registeredByClause,
        attributes: ["name"],
      },
    ],
    where: whereClause,
    order: [[column, order]],
    limit: length,
    offset: start,
    raw: true,
    nest: true,
  });
});

const findAllOrdersCount = asyncHandler(async (params, statusAlt) => {
  let { start, from, to, length, searchText, order, column } = params;
  const sortableColumns = ["corporateTxnId", "credential.name", "productName", "transactionDate", "totalPrice ", "paymentMode", "status"];
  // Convert column index to column name
  if (column >= 0 && column < sortableColumns.length) {
    column = sortableColumns[column];
  } else {
    column = "updatedAt"; // Default column name if invalid index is provided
  }

  const whereConditions = {
    [Op.or]: [
      {
        id: {
          [Op.like]: "%" + searchText + "%",
        },
      },
      {
        corporateTxnId: {
          [Op.like]: "%" + searchText + "%",
        },
      },
      {
        operatorId: {
          [Op.like]: "%" + searchText + "%",
        },
      },
      {
        amountInINR: {
          [Op.like]: "%" + searchText + "%",
        },
      },
      {
        baseAmount: {
          [Op.like]: "%" + searchText + "%",
        },
      },
      {
        baseCurrency: {
          [Op.like]: "%" + searchText + "%",
        },
      },
      {
        exchangeRate: {
          [Op.like]: "%" + searchText + "%",
        },
      },
      {
        status: {
          [Op.like]: "%" + searchText + "%",
        },
      },
      {
        paymentMode: {
          [Op.like]: "%" + searchText + "%",
        },
      },
      {
        "$credential.name$": {
          [Op.like]: "%" + searchText + "%",
        },
      },
      {
        message: {
          [Op.like]: "%" + searchText + "%",
        },
      },
    ],
  };

  if (from && to) {
    whereConditions.transactionDate = {
      [Op.between]: [from, to],
    };
  }

  if (statusAlt) {
    whereConditions.workspaceOrderStatus = statusAlt;
  }

  return await orders.findAndCountAll({
    include: [
      {
        model: serviceOperator,
        where: {
          serviceCategory: "Office Supplies", //filter only those who belongs to serviceCategory Office Supplies
          // [Op.or]: [{
          //     serviceProvider: {
          //         [Op.like]: '%' + searchText + '%'
          //     }
          // }]
        },
      },
      {
        model: credential,
        attributes: ["name"],
      },
    ],
    where: whereConditions,
    order: [[column, order]],
    limit: length,
    offset: start,
    raw: true,
    nest: true,
  });
});

const findAllPartnerOrdersCount = asyncHandler(async (params) => {
  let { corporateId, start, from, to, length, searchText, order, column, partnerId } = params;
  const sortableColumns = ["corporateTxnId", "credential.name", "productName", "transactionDate", "totalPrice ", "paymentMode", "status"];
  // Convert column index to column name
  if (column >= 0 && column < sortableColumns.length) {
    column = sortableColumns[column];
  } else {
    column = "createdAt"; // Default column name if invalid index is provided
  }
  let whereClause = {
    transactionDate: {
      [Op.between]: [from, to],
    },
    [Op.or]: [
      {
        id: {
          [Op.like]: "%" + searchText + "%",
        },
      },
      {
        corporateTxnId: {
          [Op.like]: "%" + searchText + "%",
        },
      },
      {
        operatorId: {
          [Op.like]: "%" + searchText + "%",
        },
      },
      {
        amountInINR: {
          [Op.like]: "%" + searchText + "%",
        },
      },
      {
        baseAmount: {
          [Op.like]: "%" + searchText + "%",
        },
      },
      {
        baseCurrency: {
          [Op.like]: "%" + searchText + "%",
        },
      },
      {
        exchangeRate: {
          [Op.like]: "%" + searchText + "%",
        },
      },
      {
        status: {
          [Op.like]: "%" + searchText + "%",
        },
      },
      {
        paymentMode: {
          [Op.like]: "%" + searchText + "%",
        },
      },
      {
        "$credential.name$": {
          [Op.like]: "%" + searchText + "%",
        },
      },
      {
        message: {
          [Op.like]: "%" + searchText + "%",
        },
      },
    ],
  };
  if (corporateId) {
    whereClause.credentialId = corporateId;
  }
  let registeredByClause = {};
  if (typeof partnerId !== "undefined") {
    registeredByClause.registeredBy = partnerId;
  }
  return await orders.findAndCountAll({
    include: [
      {
        model: serviceOperator,
        where: {
          serviceCategory: "Office Supplies", //filter only those who belongs to serviceCategory Office Supplies
          // [Op.or]: [{
          //     serviceProvider: {
          //         [Op.like]: '%' + searchText + '%'
          //     }
          // }]
        },
      },
      {
        model: credential,
        where: registeredByClause,
        attributes: ["name"],
      },
    ],
    where: whereClause,
    order: [[column, order]],
    limit: length,
    offset: start,
    raw: true,
    nest: true,
  });
});

const getExcelCSVData = asyncHandler(async (params) => {
  let { corporateId, from, to, searchText, order, column, reportFor } = params;
  let whereClause = {
    transactionDate: {
      [Op.between]: [from, to],
    },
    [Op.or]: [
      {
        id: {
          [Op.like]: "%" + searchText + "%",
        },
      },
      {
        corporateTxnId: {
          [Op.like]: "%" + searchText + "%",
        },
      },
      {
        debitAmount: {
          [Op.like]: "%" + searchText + "%",
        },
      },
      {
        creditAmount: {
          [Op.like]: "%" + searchText + "%",
        },
      },
      {
        corporateCashback: {
          [Op.like]: "%" + searchText + "%",
        },
      },
      {
        systemCashback: {
          [Op.like]: "%" + searchText + "%",
        },
      },
      {
        balance: {
          [Op.like]: "%" + searchText + "%",
        },
      },
      {
        remarks: {
          [Op.like]: "%" + searchText + "%",
        },
      },
    ],
  };
  if (corporateId) {
    whereClause.credentialId = corporateId;
  }
  let data = await transaction.findAndCountAll({
    include: [
      {
        model: serviceOperator,
        where: {
          [Op.or]: [
            {
              serviceProvider: {
                [Op.like]: "%" + searchText + "%",
              },
            },
          ],
        },
        required: false,
      },
      {
        model: credential,
        where: {
          [Op.or]: [
            {
              name: {
                [Op.like]: "%" + searchText + "%",
              },
            },
          ],
        },
        required: false,
      },
      {
        model: orders,
        required: false,
      },
    ],
    where: whereClause,
    order: [[column, order]],
    raw: true,
    nest: true,
  });

  let finalData = [];
  if (reportFor && reportFor == "walletReports") {
    data.rows.forEach(function (limitData) {
      finalData.push({
        ID: limitData.id,
        "Transaction ID": limitData.corporateTxnId ? limitData.corporateTxnId : "Not Available",
        Date: limitData.transactionDate ? moment(limitData.transactionDate).format("YYYY-MM-DD HH:mm:ss") : "Not Available",
        "Transaction Type": limitData.transactionType ? limitData.transactionType : "Not Available",
        Category: limitData.transactionCategory ? limitData.transactionCategory : "Not Available",
        "Debit Amount": limitData.debitAmount ? limitData.debitAmount : "0.00",
        "Credit Amount": limitData.creditAmount ? limitData.creditAmount : "0.00",
        Cashback: limitData.corporateCashback ? limitData.corporateCashback : "0.00",
        Balance: limitData.balance ? limitData.balance : "0.00",
        Remarks: limitData.remarks ? limitData.remarks : "Not Available",
      });
    });
  } else {
    data.rows.forEach(function (limitData) {
      finalData.push({
        ID: limitData.id,
        "Date/Time": limitData.transactionDate ? moment(limitData.transactionDate).format("YYYY-MM-DD HH:mm:ss") : "Not Available",
        "Order ID": limitData.providerId ? limitData.providerId : "Not Available",
        "Transaction ID": limitData.corporateTxnId ? limitData.corporateTxnId : "Not Available",
        Category: limitData.transactionCategory ? limitData.transactionCategory : "Not Available",
        Operator: limitData.serviceOperator.serviceProvider ? limitData.serviceOperator.serviceProvider : "Not Available",
        Amount: limitData.order.amountInINR ? parseFloat(limitData.order.amountInINR).toFixed(2) + " ₹" : "0.00",
        "Payment Mode": limitData.order.paymentMode ? limitData.order.paymentMode : "Not Available",
        Status: limitData.status ? limitData.status : "Not Available",
        //'Account No': limitData.order.accountNo ? limitData.order.accountNo : 'Not Available',
        //'Amount Paid via Wallet': limitData.debitAmount ? limitData.debitAmount : '0.00',
        //'Amount Paid via Dapi': limitData.order.paymentModeResponse == null ? '0.00' : JSON.parse(limitData.order.paymentModeResponse).dapiAmount
      });
    });
  }
  return finalData;
});

const getDataExcelCSV = asyncHandler(async (params) => {
  let { corporateId, from, to, categoryName, details } = params;

  let whereClause = {
    transactionDate: {
      [Op.between]: [from, to],
    },
  };

  if (corporateId) {
    whereClause.credentialId = corporateId;
  }

  let includeOptions = [
    {
      model: serviceOperator,
      required: details || false,
    },
    {
      model: credential,
      required: details || false,
    },
    {
      model: orders,
      required: details || false,
    },
  ];

  if (categoryName != "null") {
    whereClause.transactionCategory = categoryName;
  }

  let data = await transaction.findAndCountAll({
    include: includeOptions,
    where: whereClause,
    raw: true,
    nest: true,
  });

  let finalData = [];
  data.rows.forEach(function (limitData) {
    finalData.push({
      ID: limitData.id,
      "Date/Time": limitData.transactionDate ? moment(limitData.transactionDate).format("YYYY-MM-DD HH:mm:ss") : "Not Available",
      "Order ID": limitData.providerId ? limitData.providerId : "Not Available",
      "Transaction ID": limitData.corporateTxnId ? limitData.corporateTxnId : "Not Available",
      Category: limitData.transactionCategory ? limitData.transactionCategory : "Not Available",
      Operator: limitData.serviceOperator.serviceProvider ? limitData.serviceOperator.serviceProvider : "Not Available",
      Amount: limitData.order.amountInINR ? parseFloat(limitData.order.amountInINR).toFixed(2) + " ₹" : "0.00",
      "Payment Mode": limitData.order.paymentMode ? limitData.order.paymentMode : "Not Available",
      Status: limitData.status ? limitData.status : "Not Available",
      //'Account No': limitData.order.accountNo ? limitData.order.accountNo : 'Not Available',
      //'Amount Paid via Wallet': limitData.debitAmount ? limitData.debitAmount : '0.00',
      //'Amount Paid via Dapi': limitData.order.paymentModeResponse == null ? '0.00' : JSON.parse(limitData.order.paymentModeResponse).dapiAmount
    });
  });
  return finalData;
});

const corporateAllTransactions = asyncHandler(async (params) => {
  let { corporateId, from, to } = params;

  let whereClause = {
    transactionDate: {
      [Op.between]: [from, to],
    },
  };
  if (corporateId) {
    whereClause.credentialId = corporateId;
  }
  let includeOptions = [
    {
      model: serviceOperator,
    },
    {
      model: credential,
    },
    {
      model: orders,
    },
  ];
  return await transaction.findAndCountAll({
    include: includeOptions,
    where: whereClause,
    raw: true,
    nest: true,
  });
});

const transactionExcelCSVOnFinance = async (params) => {
  try {
    let { from, to, order, column, partnerId, corporateId } = params;
    let whereClause = {
      transactionDate: {
        [Op.between]: [from, to],
      },
    };

    if (corporateId) {
      whereClause.credentialId = corporateId;
    }

    let data = await transaction.findAndCountAll({
      include: [
        {
          model: serviceOperator,
          required: false,
        },
        {
          model: credential,
          required: false,
        },
        {
          model: orders,
          required: false,
        },
      ],
      where: whereClause,
      order: [[column, order]],
      raw: true,
      nest: true,
    });
    let finalData = [];
    data.rows.forEach(function (limitData) {
      if (limitData.credential.registeredBy == partnerId) {
        finalData.push({
          "Transaction ID": limitData.corporateTxnId ? limitData.corporateTxnId.toString() : "Not Available",
          "Corporate Name": limitData.credential.name ? limitData.credential.name : "Not Available",
          Date: limitData.transactionDate ? moment(limitData.transactionDate).format("YYYY-MM-DD HH:mm:ss") : "Not Available",
          Type: limitData.transactionType ? limitData.transactionType : "Not Available",
          Category: limitData.transactionCategory ? limitData.transactionCategory : "Not Available",
          "Debit Amount": limitData.debitAmount ? limitData.debitAmount + "₹" : "0.0000",
          "Credit Amount": limitData.creditAmount ? limitData.creditAmount + "₹" : "0.0000",
          Cashback: limitData.corporateCashback ? limitData.corporateCashback + "₹" : "0.0000",
          Balance: limitData.balance ? limitData.balance + "₹" : "0.0000",
          Remarks: limitData.remarks ? limitData.remarks : "Not Available",
        });
      }
    });
    return finalData;
  } catch (error) {
    return [];
  }
};

const findLatestFiveOrders = asyncHandler(async (params) => {
  let { length, order, column, serviceCategory } = params;

  return await orders.findAndCountAll({
    include: [
      {
        model: serviceOperator,
        where: {
          serviceCategory: serviceCategory, //filter only those who belongs to serviceCategory Office Supplies
        },
        attributes: ["serviceCategory"],
      },
      {
        model: credential,
        attributes: ["name"],
      },
    ],
    order: [[column, order]],
    limit: length,
    //offset: -1,
    raw: true,
    nest: true,
  });
});

const findStatusCountEcommerce = asyncHandler(async (params) => {
  let { serviceCategory } = params;
  const serviceOperatorRecord = await serviceOperator.findOne({
    where: { serviceCategory },
  });
  return await orders.findAll({
    attributes: ["ecomOrderStatus", [sequelize.fn("COUNT", "ecomOrderStatus"), "count"]],
    where: {
      serviceOperatorId: serviceOperatorRecord.id,
      // ecomOrderStatus: {
      //   [Op.in]: ["PENDING", "CONFIRMED", "ON PROGRESS", "SHIPPED", "COMPLETE", "CANCELLED"],
      // },
    },
    group: ["ecomOrderStatus"],
    raw: true,
  });
});

const updateTransactionById = async (transactionId, data) => {
  try {
    return await transaction.update(data, {
      where: {
        id: transactionId
      }
    })
  } catch (error) {
    console.log(error.message);
  } finally {
    console.log("TRANSACTION CREATE ROUTE CALLED");
  }
};

const findAllSubscriptionOrders = asyncHandler(async (params) => {
  try{
    let {    
      from,
      to,
      limit,
      offset,
      searchText,
      sort,
      sortField,
      corporateId,
      registeredBy
    } = params;
  
    let order = handleSortFields(sortField,sort)
     // Adjust 'to' date to end of day
     const tomorrow = new Date(to);
     tomorrow.setDate(tomorrow.getDate() + 1);
     tomorrow.setHours(0, 0, 0, 0);
  
     let whereClause={
      transactionDate: {
        [Op.between]: [from, tomorrow],
      },
      [Op.or]: [
        {
          id: {
            [Op.like]: "%" + searchText + "%",
          },
        },
        {
          corporateTxnId: {
            [Op.like]: "%" + searchText + "%",
          },
        },
        {
          operatorId: {
            [Op.like]: "%" + searchText + "%",
          },
        },
        {
          amountInINR: {
            [Op.like]: "%" + searchText + "%",
          },
        },
        {
          baseAmount: {
            [Op.like]: "%" + searchText + "%",
          },
        },
        {
          baseCurrency: {
            [Op.like]: "%" + searchText + "%",
          },
        },
        {
          exchangeRate: {
            [Op.like]: "%" + searchText + "%",
          },
        },
        {
          status: {
            [Op.like]: "%" + searchText + "%",
          },
        },
        {
          paymentMode: {
            [Op.like]: "%" + searchText + "%",
          },
        },
        {
          "$credential.name$": {
            [Op.like]: "%" + searchText + "%",
          },
        },
        {
          "$credential.username$": {
            [Op.like]: "%" + searchText + "%",
          },
        },
        {
          message: {
            [Op.like]: "%" + searchText + "%",
          },
        },
        sequelize.literal(`LOWER(JSON_EXTRACT(\`orderResponse\`, '$.subscriptionDetails.name')) LIKE LOWER(:searchText)`),
      ],
    }

    if(corporateId){
      whereClause.credentialId=corporateId
    }

    let whereClauseCredential = {}
    if(registeredBy){
      whereClauseCredential.registeredBy=registeredBy
    }
  
    return await orders.findAndCountAll({
      attributes:["id","createdAt","transactionDate","corporateTxnId","orderResponse","paymentMode","amountInINR","status"],
      // attributes:["transactionDate","corporateTxnId","transactionCategory","amountInINR","corporateCashback","remarks","status"],
      include: [
        {
          model: serviceOperator,
          attributes:["serviceProvider"],
          where: {
            serviceCategory: "Softwares", //filter only those who belongs to serviceCategory subscription
            //  [Op.or]: [{
            // serviceProvider: {
            // [Op.like]: '%' + searchText + '%'
            // }
            //}]
          },
        },
        {
          model: credential,
          attributes: ["name","email", 'username'],
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
      ],
      where: whereClause,
      order: order,
      limit,
      offset,
      replacements: { searchText: `%${searchText}%` },
      raw: true,
      nest: true,
    });
  } catch (error) {
    console.log(error);
    throw  {message:'Something went wrong'};
  }
});
const subscriptionOrdersExcelCSVData = asyncHandler(async (params) => {
  try{
    let {    
      from,
      to,
      searchText,
      sort,
      sortField,
      corporateId,
      registeredBy
    } = params;
  
    let order = handleSortFields(sortField,sort)
     // Adjust 'to' date to end of day
     const tomorrow = new Date(to);
     tomorrow.setDate(tomorrow.getDate() + 1);
     tomorrow.setHours(0, 0, 0, 0);
  
     let whereClause={
      transactionDate: {
        [Op.between]: [from, tomorrow],
      },
      [Op.or]: [
        {
          id: {
            [Op.like]: "%" + searchText + "%",
          },
        },
        {
          corporateTxnId: {
            [Op.like]: "%" + searchText + "%",
          },
        },
        {
          operatorId: {
            [Op.like]: "%" + searchText + "%",
          },
        },
        {
          amountInINR: {
            [Op.like]: "%" + searchText + "%",
          },
        },
        {
          baseAmount: {
            [Op.like]: "%" + searchText + "%",
          },
        },
        {
          baseCurrency: {
            [Op.like]: "%" + searchText + "%",
          },
        },
        {
          exchangeRate: {
            [Op.like]: "%" + searchText + "%",
          },
        },
        {
          status: {
            [Op.like]: "%" + searchText + "%",
          },
        },
        {
          paymentMode: {
            [Op.like]: "%" + searchText + "%",
          },
        },
        {
          "$credential.name$": {
            [Op.like]: "%" + searchText + "%",
          },
        },
        {
          "$credential.username$": {
            [Op.like]: "%" + searchText + "%",
          },
        },
        {
          message: {
            [Op.like]: "%" + searchText + "%",
          },
        },
      ],
    }
  
    if(corporateId){
      whereClause.credentialId=corporateId
    }

    let whereClauseCredential = {}
    if(registeredBy)
     whereClauseCredential.registeredBy = registeredBy
  
    const data = await orders.findAndCountAll({
      include: [
        {
          model: serviceOperator,
          where: {
            serviceCategory: "Softwares", //filter only those who belongs to serviceCategory subscription
            //  [Op.or]: [{
            // serviceProvider: {
            // [Op.like]: '%' + searchText + '%'
            // }
            //}]
          },
        },
        {
          model: credential,
          attributes: ["name","email", 'username'],
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
      ],
      where: whereClause,
      order: order,
      raw: true,
      nest: true,
    });
    let finalData = [];
      data.rows.forEach(function (limitData) {
        const orderResponse = JSON.parse(limitData.orderResponse)
        finalData.push({
          "Transaction Date": limitData.transactionDate ? formattedDateTime(limitData.transactionDate) : "Not Available",
          "Transaction ID": limitData.corporateTxnId ? limitData.corporateTxnId.toString() : "Not Available",
          "Corporate ID": limitData.credential?.username ? limitData.credential?.username : "Not Available",
          "Corporate Name": limitData.credential.name ? limitData.credential.name : "Not Available",
          "Partner Name": limitData.credential?.registeredByCredential?.name ? limitData.credential?.registeredByCredential?.name : "Not Available",
          "Software Name": orderResponse?.subscriptionDetails?.name ? orderResponse?.subscriptionDetails?.name : "Not Available",
          "Payment Mode": limitData.paymentMode ? limitData.paymentMode : "Not Available",
          Amount: limitData.amountInINR ? "₹ " + formatNumberWithLocalString(limitData.amountInINR)  : "₹ 0.00",
          Status: limitData.status ? limitData.status  : "Not Available",
        });
      });
      return finalData;
  } catch (error) {
    console.log(error);
    throw  {message:'Something went wrong'};
  }
});

const findOneTransactionDetails = asyncHandler(async (params) => {
  const where = {
    corporateTxnId: params.transactionId,
    status: 'SUCCESS',
  };
  // Ownership scoping — mirrors the transaction listing queries so a user can
  // only fetch a transaction they own (see findAllTransactions credentialId /
  // $order.subCorporateUserId$ filters).
  if (params.credentialId) {
    where.credentialId = params.credentialId;
  }
  if (params.subCorporateUserId) {
    where['$order.subCorporateUserId$'] = params.subCorporateUserId;
  }

  return await transaction.findOne({
    where,
    include: [
      {
        model: serviceOperator
      },
      {
        model: orders
      },
      {
        model: credential,
      },
    ],
    raw: true,
    nest: true,
  });
});

const findAllFaildBulkTransactions = asyncHandler(async (params) => {
  let { serviceAccessKey, corporateId, from, end, searchText, partnerId } = params
  searchText = searchText.trim();
  let whereClause = {
    transactionDate: {
      [Op.between]: [from, end],
    },
    batchId: { [Op.ne]: null }, // Ensure batchId is not null for getting bulk transactions
    status: {
      [Op.or]: ['FAILURE', 'PENDING','REFUNDED'] // Filter by FAILURE or PENDING status
    },
    [Op.or]: [
      {
        batchId: {
          [Op.like]: "%" + searchText + "%",
        },
      },
      {
        corporateTxnId: {
          [Op.like]: "%" + searchText + "%",
        },
      }
    ],
  };
  if (corporateId) {
    whereClause.credentialId = corporateId;
  }
  let registeredByClause = {};

  if (typeof partnerId !== "undefined") {
    registeredByClause.registeredBy = partnerId;
  }
  let includeOptions = [
    {
      model: serviceOperator,
      where: {
        accessKey: serviceAccessKey,
      },
      required: true,
    },
    {
      model: credential,
      where: registeredByClause,
      required: true,
    },
    {
      model: orders,
      required: true,
    },
  ];
  if (serviceAccessKey !== undefined) {
    includeOptions[0].where.accessKey = serviceAccessKey;
  } else {
    delete includeOptions[0].where.accessKey;
  }
  return await transaction.findAndCountAll({
    include: includeOptions,
    where: whereClause,
    order: [["createdAt", 'DESC']],
    raw: true,
    nest: true,
  });
});

const findAllTransactionsByIds = asyncHandler(async (corporateTxnIds) => {

  let transactions = await transaction.findAll({
    where: {
      corporateTxnId: {
        [Op.in]: corporateTxnIds
      }
    },
    include: [
      { model: orders },
      { model: serviceOperator }
    ]
  })


  let transactionsByBatchObj = {}
  // let total=0
  transactions.forEach((data) => {
    if (transactionsByBatchObj[data.batchId]) {
      transactionsByBatchObj[data.batchId].push(data)
    } else {
      transactionsByBatchObj[data.batchId] = []
      transactionsByBatchObj[data.batchId].push(data)
    }
  })

  console.log({ transactions, one: transactions[0], transactionsByBatchObj })
  return {transactions,transactionsByBatchObj}
});

const findAllCustomerSubscriptionOrders = asyncHandler(async (params) => {
  try {
    let {
      from,
      to,
      categoryName,
      searchText,
      sort,
      filter,
      limit,
      offset,
      corporateId,
      serviceAttribute,
      credentialAttribute,
      sortField,
      registeredBy,
      subCorporateUserId
    } = params;

    const escapeLike = (str = "") => str.replace(/[\\%_]/g, "\\$&");
    const safeSearch = escapeLike((searchText || "").toLowerCase());

    let order = handleSortFields(sortField, sort);

    const tomorrow = new Date(to);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    let whereClause = {
      optional: {
        [Op.in]: [
          "SUBSCRIPTION",
          "WHATSAPP-SUBSCRIPTION",
          "SUBSCRIPTION-ADDONS",
          "ACCOUNTING-SUBSCRIPTION",
          "BUSINESS-EMAIL-SUBSCRIPTION",
          "ECOMMERCE-SUBSCRIPTION",
          "POS-SUBSCRIPTION"
        ]
      },
      transactionDate: {
        [Op.between]: [from, tomorrow]
      },
      [Op.or]: [
        { id: { [Op.like]: `%${safeSearch}%` } },
        { corporateTxnId: { [Op.like]: `%${safeSearch}%` } },
        { paymentMode: { [Op.like]: `%${safeSearch}%` } },
        { status: { [Op.like]: `%${safeSearch}%` } },
        { amountInINR: { [Op.like]: `%${safeSearch}%` } },
        { "$credential.name$": { [Op.like]: `%${safeSearch}%` } },
        { "$credential.username$": { [Op.like]: `%${safeSearch}%` } },

        sequelize.where(
          sequelize.literal(`
            IF(
              JSON_VALID(orderResponse),
              LOWER(JSON_UNQUOTE(JSON_EXTRACT(orderResponse,'$.billingType'))),
              NULL
            )
          `),
          { [Op.like]: `%${safeSearch}%` }
        ),

        sequelize.where(
          sequelize.literal(`
            IF(
              JSON_VALID(orderResponse),
              LOWER(JSON_UNQUOTE(JSON_EXTRACT(orderResponse,'$.serviceName'))),
              NULL
            )
          `),
          { [Op.like]: `%${safeSearch}%` }
        ),
      ]
    };

    if (corporateId) {
      whereClause.credentialId = corporateId;
    }

    if (subCorporateUserId) {
      whereClause.subCorporateUserId = subCorporateUserId;
    }

    if (filter) {
      whereClause.status = filter === 'FAILED'
        ? { [Op.in]: ['FAILED', 'FAILURE'] }
        : filter;
    }

    if (categoryName && categoryName !== "all") {
      whereClause.optional = categoryName;
    }

    let whereClauseCredential = {};
    if (registeredBy) {
      whereClauseCredential.registeredBy = registeredBy;
    }

    const includeOptions = [
      {
        model: subCorporateUsers,
        attributes: ["name"],
      },
      {
        model: serviceOperator,
        attributes: serviceAttribute,
      },
      {
        model: credential,
        attributes: credentialAttribute,
        where: whereClauseCredential,
        include: [
          {
            model: credential,
            as: "registeredByCredential",
            attributes: ["name"],
          },
        ],
      },
    ];

    return await orders.findAndCountAll({
      include: includeOptions,
      where: whereClause,
      order,
      limit,
      offset,
      raw: true,
      nest: true,
    });

  } catch (error) {
    customLog(null, "error", { error });
    throw new Error("Something went wrong");
  }
});


const subscriptionTransactionsExcelCSV = asyncHandler(async (params) => {
  try {
    let {
      from,
      to,
      categoryName,
      searchText = "",
      sort,
      filter,
      corporateId,
      serviceAttribute,
      credentialAttribute,
      sortField,
      registeredBy
    } = params;

    const escapeLike = (str = "") => str.replace(/[\\%_]/g, "\\$&");
    const safeSearch = escapeLike(searchText.toLowerCase());

    let order = handleSortFields(sortField, sort);

    const tomorrow = new Date(to);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    let whereClause = {
      optional: {
        [Op.in]: [
          "SUBSCRIPTION",
          "WHATSAPP-SUBSCRIPTION",
          "SUBSCRIPTION-ADDONS",
          "ACCOUNTING-SUBSCRIPTION",
          "ECOMMERCE-SUBSCRIPTION",
          "POS-SUBSCRIPTION"
        ],
      },
      transactionDate: {
        [Op.between]: [from, tomorrow],
      },
    };

    if (safeSearch) {
      whereClause[Op.or] = [
        { id: { [Op.like]: `%${safeSearch}%` } },
        { corporateTxnId: { [Op.like]: `%${safeSearch}%` } },
        { paymentMode: { [Op.like]: `%${safeSearch}%` } },
        { status: { [Op.like]: `%${safeSearch}%` } },
        { amountInINR: { [Op.like]: `%${safeSearch}%` } },
        { "$credential.name$": { [Op.like]: `%${safeSearch}%` } },
        { "$credential.username$": { [Op.like]: `%${safeSearch}%` } },
        sequelize.literal(`
          JSON_VALID(orderResponse)
          AND LOWER(JSON_UNQUOTE(JSON_EXTRACT(orderResponse, '$.billingType')))
          LIKE LOWER(:searchText)
        `),
        sequelize.literal(`
          JSON_VALID(orderResponse)
          AND LOWER(JSON_UNQUOTE(JSON_EXTRACT(orderResponse, '$.serviceName')))
          LIKE LOWER(:searchText)
        `),
      ];
    }

    if (corporateId) whereClause.credentialId = corporateId;
    if (filter) whereClause.status = filter;

    if (categoryName && categoryName !== "ALL") {
      whereClause.optional = categoryName;
    }

    let whereClauseCredential = {};
    if (registeredBy) whereClauseCredential.registeredBy = registeredBy;

    const data = await orders.findAndCountAll({
      include: [
        { model: subCorporateUsers, attributes: ["name"] },
        { model: serviceOperator, attributes: serviceAttribute },
        {
          model: credential,
          attributes: credentialAttribute,
          where: whereClauseCredential,
          include: [
            {
              model: credential,
              as: "registeredByCredential",
              attributes: ["name"],
            },
          ],
        },
      ],
      where: whereClause,
      order,
      replacements: { searchText: `%${safeSearch}%` },
      raw: true,
      nest: true,
    });

    let finalData = [];

    data.rows.forEach((limitData) => {
      let orderResponse = {};
      try {
        orderResponse = JSON.parse(limitData.orderResponse || "{}");
      } catch {
        console.log("error")
      }

      finalData.push({
        Date: limitData.transactionDate
          ? formattedDateTime(limitData.transactionDate)
          : "Not Available",
        "Order ID": limitData.corporateTxnId || "Not Available",
        Subscription: orderResponse?.serviceName || "Not Available",
        "Billing Type": orderResponse?.billingType || "Not Available",
        Amount: limitData?.amountInINR
          ? "₹ " + formatNumberWithLocalString(limitData.amountInINR)
          : "0.00",
        Status: limitData.status || "Not Available",
        "Payment Mode": derivePaymentInstrument(limitData.paymentModeResponse, limitData.paymentMode)
          || limitData.paymentMode
          || "Not Available",
      });
    });

    return finalData;
  } catch (error) {
    return [];
  }
});


const findTransactionCategoryByTxnId = asyncHandler(async (corporateTxnId) => {
  if (!corporateTxnId) return null;
  const row = await transaction.findOne({
    where: { corporateTxnId },
    attributes: ['transactionCategory'],
    raw: true,
  });
  return row?.transactionCategory || null;
});

const findOneOrderDetails = asyncHandler(async (params) => {
  const where = {
    corporateTxnId: params.transactionId,
    status: 'SUCCESS',
  };
  // Ownership scoping — orders is the orders table itself, so credentialId and
  // subCorporateUserId are direct columns.
  if (params.credentialId) {
    where.credentialId = params.credentialId;
  }
  if (params.subCorporateUserId) {
    where.subCorporateUserId = params.subCorporateUserId;
  }

  return await orders.findOne({
    where,
    include: [
      {
        model: serviceOperator
      },
      {
        model: credential,
      },
    ],
    raw: true,
    nest: true,
  });
});

// orders.paymentInstrument is only written at order creation and only understands
// Cashfree payloads, so BBPS (CCAvenue) rows and orders created by another service are
// NULL. Derive those from the raw gateway payload here, and never ship the payload out.
const withPaymentInstrument = (row) => {
  const { orderPaymentMode, orderPaymentModeResponse, ...rest } = row;
  if (rest.paymentInstrument) return rest;
  const instrument = derivePaymentInstrument(
    orderPaymentModeResponse,
    orderPaymentMode || rest.paymentMode
  );
  return instrument ? { ...rest, paymentInstrument: instrument } : rest;
};

const getTransactionReport = asyncHandler(async (params) => {
  try {
    let {
      limit,
      offset,
      searchText,
      sort,
      sortField,
      from,
      to,
      partnerId,
    } = params;

    searchText = searchText || "";

    let tomorrow;
    if (to) {
      tomorrow = new Date(to);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
    }

    const replacements = {
      searchText: `%${searchText}%`,
      limit: parseInt(limit, 10) || 10,
      offset: parseInt(offset, 10) || 0,
    };

    if (from && tomorrow) {
      replacements.from = from;
      replacements.tomorrow = tomorrow;
    }

    if (partnerId && partnerId !== "default") {
      replacements.partnerId = partnerId;
    }

    const query = `
      SELECT transactionReportView.*, orders.status AS status,
             orders.paymentInstrument AS paymentInstrument,
             orders.paymentMode AS orderPaymentMode,
             CASE WHEN orders.paymentInstrument IS NULL
                  THEN orders.paymentModeResponse END AS orderPaymentModeResponse
      FROM transactionReportView
      LEFT JOIN orders ON orders.id = transactionReportView.id
      WHERE
        (transactionReportView.id LIKE :searchText OR
         transactionReportView.customerName LIKE :searchText OR
         transactionReportView.service COLLATE utf8mb4_unicode_ci LIKE :searchText OR
         transactionReportView.serviceCategory COLLATE utf8mb4_unicode_ci LIKE :searchText OR
         transactionReportView.Amount LIKE :searchText OR
         transactionReportView.partner LIKE :searchText OR
         transactionReportView.paymentMode LIKE :searchText OR
         transactionReportView.vendorName LIKE :searchText)
        ${from && tomorrow ? `AND transactionReportView.transactionDate BETWEEN :from AND :tomorrow` : ""}
        ${partnerId === "default"
        ? `AND transactionReportView.partnerId IS NULL`
        : partnerId
          ? `AND transactionReportView.partnerId = :partnerId`
          : ""
      }
      ORDER BY transactionReportView.${sortField} ${sort}
      LIMIT :limit OFFSET :offset;
    `;

    const data = await sequelizeConfig.query(query, {
      replacements,
      type: sequelize.QueryTypes.SELECT,
    });

    const countQuery = `
      SELECT COUNT(*) AS totalCount
      FROM transactionReportView
      WHERE
        (id LIKE :searchText OR 
         customerName LIKE :searchText OR
         service COLLATE utf8mb4_unicode_ci LIKE :searchText OR
         serviceCategory COLLATE utf8mb4_unicode_ci LIKE :searchText OR
         Amount LIKE :searchText OR
         partner LIKE :searchText OR
         paymentMode LIKE :searchText OR
         vendorName LIKE :searchText)
        ${from && tomorrow ? `AND transactionDate BETWEEN :from AND :tomorrow` : ""}
        ${partnerId === "default"
        ? `AND partnerId IS NULL`
        : partnerId
          ? `AND partnerId = :partnerId`
          : ""
      }
    `;

    const totalCountResult = await sequelizeConfig.query(countQuery, {
      replacements,
      type: sequelize.QueryTypes.SELECT,
    });

    return {
      rows: data.map(withPaymentInstrument),
      count: totalCountResult[0].totalCount,
    };
  } catch (error) {
    customLog(null, "error", {
      message: "transactionReport:queryFailed",
      action: "transactionReport:queryFailed",
      errName: error?.name,
      errMessage: error?.message,
      sqlMessage: error?.parent?.sqlMessage || error?.original?.sqlMessage,
      sqlState: error?.parent?.sqlState || error?.original?.sqlState,
      sqlCode: error?.parent?.code || error?.original?.code,
      sql: error?.sql,
      partnerId: params?.partnerId ?? null,
      sortField: params?.sortField ?? null,
    }, "CONSOLE");
    throw new ErrorResponse(
      "Something went wrong. If the issue persists, please contact support at reach@peko.one",
      500
    );
  }
});

const getTransactionReportExcel = asyncHandler(async (params) => {
  try {
    let { searchText, sort, sortField, from, to, partnerId } = params;

    searchText = searchText || "";

    let tomorrow;
    if (to) {
      tomorrow = new Date(to);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
    }

    const replacements = {
      searchText: `%${searchText}%`,
    };

    if (from && tomorrow) {
      replacements.from = from;
      replacements.tomorrow = tomorrow;
    }

    if (partnerId && partnerId !== "default") {
      replacements.partnerId = partnerId;
    }

    const query = `
      SELECT transactionReportView.*, orders.status AS status,
             orders.paymentInstrument AS paymentInstrument,
             orders.paymentMode AS orderPaymentMode,
             CASE WHEN orders.paymentInstrument IS NULL
                  THEN orders.paymentModeResponse END AS orderPaymentModeResponse
      FROM transactionReportView
      LEFT JOIN orders ON orders.id = transactionReportView.id
      WHERE
        (transactionReportView.id LIKE :searchText OR
         transactionReportView.customerName LIKE :searchText OR
         transactionReportView.service COLLATE utf8mb4_unicode_ci LIKE :searchText OR
         transactionReportView.serviceCategory COLLATE utf8mb4_unicode_ci LIKE :searchText OR
         transactionReportView.Amount LIKE :searchText OR
         transactionReportView.partner LIKE :searchText OR
         transactionReportView.paymentMode LIKE :searchText OR
         transactionReportView.vendorName LIKE :searchText)
        ${from && tomorrow ? `AND transactionReportView.transactionDate BETWEEN :from AND :tomorrow` : ""}
        ${partnerId === "default"
        ? `AND transactionReportView.partnerId IS NULL`
        : partnerId
          ? `AND transactionReportView.partnerId = :partnerId`
          : ""
      }
      ORDER BY transactionReportView.${sortField} ${sort}
    `;

    const data = await sequelizeConfig.query(query, {
      replacements,
      type: sequelize.QueryTypes.SELECT,
    });

    let finalData = data.map(withPaymentInstrument).map(limitData => ({
      "Date & Time ": limitData.transactionDate
        ? moment(limitData.transactionDate).format("YYYY-MM-DD HH:mm:ss")
        : "Not Available",
      Customer: limitData.customerName || "Not Available",
      Service: limitData.service || "Not Available",
      "Service Category": limitData.serviceCategory || "Not Available",
      "Amount ": limitData.Amount
        ? "₹ " + formatNumberWithLocalString(limitData.Amount)
        : "₹ 0.00",
      "Total Amount ": limitData.totalAmount
        ? "₹ " + formatNumberWithLocalString(limitData.totalAmount)
        : "₹ 0.00",      
      "Payment Mode": limitData.paymentInstrument || limitData.paymentMode || "Not Available",
      Vendor: limitData.vendorName || "Not Available",
      Partner: limitData.partner || "Not Available",
      "Status": limitData.status || "Not Available",  
    }));

    return finalData;
  } catch (error) {
    customLog(null, "error", {
      message: "transactionReportExport:queryFailed",
      action: "transactionReportExport:queryFailed",
      errName: error?.name,
      errMessage: error?.message,
      sqlMessage: error?.parent?.sqlMessage || error?.original?.sqlMessage,
      sqlState: error?.parent?.sqlState || error?.original?.sqlState,
      sqlCode: error?.parent?.code || error?.original?.code,
      partnerId: params?.partnerId ?? null,
      sortField: params?.sortField ?? null,
    }, "CONSOLE");
    throw new ErrorResponse(
      "Something went wrong. If the issue persists, please contact support at reach@peko.one",
      500
    );
  }
});

const findSubscriptionTransactionStatusByTxnId = asyncHandler(async ({ transactionId, paymentRefId, corporateId }) => {
  const mapSubscriptionStatus = (s) =>
    s === 'ACTIVE' ? 'SUCCESS' :
    s === 'CANCELLED' || s === 'EXPIRED' ? 'FAILED' :
    'PENDING';

  // Subscription is the source of truth. Once a row exists, it answers definitively —
  // try every identifier the caller might have (paymentRefId, corporateTxnId, vendorSubscriptionId)
  // in one query so stale orders rows can never shadow a successful subscription.
  const subscriptionMatch = await Subscription.findOne({
    where: {
      [Op.or]: [
        ...(paymentRefId ? [{ subscriptionPaymentRefId: String(paymentRefId) }] : []),
        { corporateTxnId: String(transactionId) },
        { vendorSubscriptionId: String(transactionId) },
      ],
    },
    attributes: ['status'],
    order: [['id', 'DESC']],
    raw: true,
  });
  if (subscriptionMatch) {
    return { corporateTxnId: transactionId, status: mapSubscriptionStatus(subscriptionMatch.status) };
  }

  // WhatsApp subscriptions live in their own table; check before falling through to orders
  // so successful WA subscriptions also short-circuit any stale orders row.
  const whatsappRows = await sequelizeConfig.query(
    `SELECT status FROM whatsAppSubscriptions WHERE vendorSubscriptionId = :transactionId AND isCustom = 0 ORDER BY id DESC LIMIT 1`,
    { replacements: { transactionId: String(transactionId) }, type: sequelize.QueryTypes.SELECT },
  );
  if (whatsappRows && whatsappRows[0]) {
    return { corporateTxnId: transactionId, status: mapSubscriptionStatus(whatsappRows[0].status) };
  }

  // Last resort: orders table for wallet/post-PG flows. Only treat terminal statuses
  // (SUCCESS / FAILURE / FAILED) as authoritative — a lingering PENDING row must not
  // override the "still waiting on webhook" state we surface to the frontend.
  const orderRow = await orders.findOne({
    where: {
      corporateTxnId: String(transactionId),
      credentialId: corporateId,
      optional: {
        [Op.in]: [
          'SUBSCRIPTION',
          'WHATSAPP-SUBSCRIPTION',
          'SUBSCRIPTION-ADDONS',
          'ACCOUNTING-SUBSCRIPTION',
          'BUSINESS-EMAIL-SUBSCRIPTION',
          'ECOMMERCE-SUBSCRIPTION',
          'POS-SUBSCRIPTION',
        ],
      },
      status: { [Op.in]: ['SUCCESS', 'FAILURE', 'FAILED'] },
    },
    attributes: ['corporateTxnId', 'status'],
    order: [['id', 'DESC']],
    raw: true,
  });
  if (orderRow) return orderRow;

  return null;
});
const findTransactionDiagnosticDetails = asyncHandler(async (transactionId) => {
  try {
    const txn = await transaction.findOne({
      where: { id: transactionId },
      attributes: [
        'id', 'corporateTxnId', 'transactionId', 'transactionDate',
        'transactionType', 'transactionCategory', 'status', 'remarks',
        'debitAmount', 'creditAmount', 'providerId', 'createdAt',
      ],
      include: [
        {
          model: credential,
          attributes: ['name', 'email'],
        },
        {
          model: serviceOperator,
          attributes: ['id', 'serviceProvider', 'serviceCategory'],
        },
        {
          model: orders,
          attributes: [
            'id', 'corporateTxnId', 'amountInINR', 'baseAmount', 'paymentMode',
            'accountNo', 'status', 'message', 'orderResponse',
            'paymentModeResponse', 'createdAt',
          ],
        },
      ],
      raw: true,
      nest: true,
    });

    if (!txn) return null;

    let providerResponse = null;
    let paymentModeResponse = null;
    try {
      providerResponse = txn.order?.orderResponse ? JSON.parse(txn.order.orderResponse) : null;
    } catch (error) {
      customLog(null, "error", {
        error,
        message: "Failed to parse txn.order.orderResponse",
      });
      providerResponse = null;
    }
    try {
      paymentModeResponse = txn.order?.paymentModeResponse ? JSON.parse(txn.order.paymentModeResponse) : null;
    } catch (error) {
      customLog(null, "error", {
        error,
        message: "Failed to parse txn.order.paymentModeResponse",
      });
      paymentModeResponse = null;
    }

    // Find the sibling refund row — same corporateTxnId, remarks = 'REFUND', negative debitAmount
    const refundTxn = await transaction.findOne({
      where: {
        corporateTxnId: txn.corporateTxnId,
        remarks: 'REFUND',
        id: { [Op.ne]: txn.id },
      },
      attributes: ['id', 'debitAmount', 'creditAmount', 'corporateCashback', 'transactionDate', 'createdAt'],
      raw: true,
    });

    const isRefunded = !!refundTxn || txn.remarks?.toUpperCase() === 'REFUNDED';

    return {
      transaction: {
        id: txn.id,
        corporateTxnId: txn.corporateTxnId,
        transactionId: txn.transactionId,
        transactionDate: txn.transactionDate,
        transactionType: txn.transactionType,
        transactionCategory: txn.transactionCategory,
        status: txn.status,
        remarks: txn.remarks,
        debitAmount: txn.debitAmount,
        creditAmount: txn.creditAmount,
        providerId: txn.providerId,
        createdAt: txn.createdAt,
      },
      failure: {
        status: txn.order?.status || txn.status,
        message: txn.order?.message || null,
        errorCode: providerResponse?.errorCode || providerResponse?.error_code || providerResponse?.code || null,
        errorMessage: providerResponse?.errorMessage || providerResponse?.error_message || providerResponse?.message || null,
        providerName: txn.serviceOperator?.serviceProvider || null,
        paymentMode: txn.order?.paymentMode || null,
        rawResponse: providerResponse,
      },
      order: {
        id: txn.order?.id,
        corporateTxnId: txn.order?.corporateTxnId,
        amountInINR: txn.order?.amountInINR,
        baseAmount: txn.order?.baseAmount,
        paymentMode: txn.order?.paymentMode,
        accountNo: txn.order?.accountNo,
        status: txn.order?.status,
        message: txn.order?.message,
        paymentModeResponse,
        createdAt: txn.order?.createdAt,
      },
      serviceOperator: {
        id: txn.serviceOperator?.id,
        serviceProvider: txn.serviceOperator?.serviceProvider,
        serviceCategory: txn.serviceOperator?.serviceCategory,
      },
      credential: {
        name: txn.credential?.name,
        email: txn.credential?.email,
      },
      refund: {
        isRefunded,
        refundTransactionId: refundTxn ? Number(refundTxn.id) : null,
        refundAmount: refundTxn ? Math.abs(Number(refundTxn.debitAmount)) : null,
        cashbackReversed: refundTxn ? Math.abs(Number(refundTxn.corporateCashback)) : null,
        refundDate: refundTxn?.transactionDate || refundTxn?.createdAt || null,
      },
    };
  } catch (error) {
    customLog(null, 'error', { error });
    throw { message: 'Something went wrong fetching transaction diagnostic details' };
  }
});
module.exports = {
  updateTransactionById,
  createTransaction,
  findOneTransaction,
  findAllTransaction,
  updateTransaction,
  deleteTransaction,
  findAllTransactions,
  findAllTransactionsCashback,
  transactionExcelCSV,
  transactionPDF,
  findAllVendorTransactions,
  findAllWalletTransactions,
  findPekoWalletTransactions,
  findAllOrdersCount,
  walletExcelCSV,
  transactionDetails,
  findAllPartnerTransactions,
  transactionReports,
  getExcelCSVData,
  findAllWorkspaceOrders,
  findAllPartnerWorkspaceOrders,
  findAllPartnerOrdersCount,
  findAllInvestmentsAndCount,
  getDataExcelCSV,
  corporateAllTransactions,
  transactionExcelCSVOnFinance,
  findLatestFiveOrders,
  findStatusCountEcommerce,
  findAllSubscriptionOrders,
  transactionsExcelReport,
  findOneTransactionDetails,
  findAllFaildBulkTransactions,
  findAllTransactionsByIds,
  transactionsExcelCSV,
  workspaceOrdersExcelCSVData,
  vendorTransactionsExcelCSV,
  subscriptionOrdersExcelCSVData,
  findAllCustomerSubscriptionOrders,
  subscriptionTransactionsExcelCSV,
  findOneOrderDetails,
  findTransactionCategoryByTxnId,
  getTransactionReport,
  getTransactionReportExcel,
  getOneTransaction,
  findSubscriptionTransactionStatusByTxnId,
  findTransactionDiagnosticDetails
};

function buildFinalData(rows, fieldsToInclude) {
  const finalData = [];

  rows.forEach((limitData) => {
   
    const entry = {};
    if (limitData.remarks === 'REFUND') {
      limitData.status = 'REFUND';
    }
    fieldsToInclude.forEach((field) => {
      switch (field) {
        case "Transaction Date":
          entry[field] = limitData.transactionDate
            ? formattedDateTime(limitData.transactionDate)
            : "Not Available";
          break;

        case "Transaction ID":
          entry[field] = `${limitData.corporateTxnId ?? "Not Available"}`;
          break;

        case "Corporate Name":
          entry[field] = limitData.credential?.name || "Not Available";
          break;

        case "Corporate ID":
          entry[field] = limitData.credential?.username || "Not Available";
          break;

        case "Transaction Type":
          entry[field] = limitData.transactionType || "Not Available";
          break;

        case "Debit Amount":
          entry[field] = limitData.debitAmount
            ? "₹ " + formatNumberWithLocalString(limitData.debitAmount)
            : "0.00";
          break;

        case "Credit Amount":
          entry[field] = limitData.creditAmount
            ? "₹ " + formatNumberWithLocalString(limitData.creditAmount)
            : "0.00";
          break;

        case "Status":
          entry[field] = limitData.status || "Not Available";
          break;
        
        case "Amount":
          entry[field] = limitData.transactionType === "PAYMENT" ? "₹ " + formatNumberWithLocalString(limitData.debitAmount) : "₹ " +formatNumberWithLocalString(limitData.creditAmount);
          break;
      
          case "Type":
            entry[field] = limitData.transactionType === "PAYMENT" ? "Debit" : "Credit";
            break;
        
          case "Payment Mode":
            entry[field] = limitData.transactionType === "PAYMENT" ? "Wallet" : "Payment gateway";
            break;
        default:
          entry[field] = "Field Not Handled";
      }
    });

    finalData.push(entry);
  });

  return finalData;
}
