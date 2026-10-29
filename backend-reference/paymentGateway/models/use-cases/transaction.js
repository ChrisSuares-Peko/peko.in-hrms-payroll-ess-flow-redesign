const transaction = require("./../entities/transaction");
const orders = require("./../entities/order");
const serviceOperator = require("./../entities/serviceOperator");
const userCoupons = require("./../entities/userCoupons");
const credential = require("./../entities/credential");
const moment = require("moment");
const { Op } = require("sequelize");
const asyncHandler = require("./../../middlewares/async");
const couponCode = require("./../entities/couponCode");

const getOneTransaction = async (params) => {
  try {
    return await transaction.findOne({
      include: [
        {
          model: orders,
        },
        {
          model: serviceOperator,
          attributes: ["serviceProvider"],
        },
      ],
      where: {
        corporateTxnId: params.transactionId,
      },
    });
  } catch (error) {
    console.log(error);
  } finally {
    console.log("TRANSACTION FIND ONE ROUTE CALLED");
  }
};

const findAllTransactions = asyncHandler(async (params) => {
  let {
    corporateId,
    from,
    to,
    start,
    length,
    searchText,
    order,
    column,
    details,
    categoryName,
  } = params;
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
    console.log("column selected", column);
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
  let includeOptions = [
    {
      model: serviceOperator,
      where: {
        serviceCategory: categoryName,
      },
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
  if (categoryName !== undefined) {
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
});

const transactionDetails = asyncHandler(async (params) => {
  return await orders.findOne({
    include: [
      {
        model: serviceOperator,
        attributes: ["serviceProvider", "accessKey"],
      },
      {
        model: userCoupons,
        as: "couponData",
        attributes: ["usedCouponData"], // peko credits
        required: false,
      },
      {
        model: couponCode,
        as: "couponCodeData", // coupon code
        required: false,
      },
    ],
    where: {
      corporateTxnId: params.transactionId,
    },
    raw: true,
    nest: true,
  });
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
      "Date/Time": limitData.transactionDate
        ? moment(limitData.transactionDate).format("YYYY-MM-DD HH:mm:ss")
        : "Not Available",
      "Order ID": limitData.providerId ? limitData.providerId : "Not Available",
      "Transaction ID": limitData.corporateTxnId
        ? limitData.corporateTxnId
        : "Not Available",
      Category: limitData.transactionCategory
        ? limitData.transactionCategory
        : "Not Available",
      Operator: limitData.serviceOperator.serviceProvider
        ? limitData.serviceOperator.serviceProvider
        : "Not Available",
      Amount: limitData.order.amountInINR
        ? parseFloat(limitData.order.amountInINR).toFixed(2) + " ₹"
        : "0.00",
      "Payment Mode": limitData.order.paymentMode
        ? limitData.order.paymentMode
        : "Not Available",
      Status: limitData.status ? limitData.status : "Not Available",
      //'Account No': limitData.order.accountNo ? limitData.order.accountNo : 'Not Available',
      //'Amount Paid via Wallet': limitData.debitAmount ? limitData.debitAmount : '0.00',
      //'Amount Paid via Dapi': limitData.order.paymentModeResponse == null ? '0.00' : JSON.parse(limitData.order.paymentModeResponse).dapiAmount
    });
  });
  return finalData;
});

const updateOneTransaction = async (corporateTxnId, params) => {
  try {
    const [updated] = await transaction.update(params, {
      where: { corporateTxnId: String(corporateTxnId) },
    });
    return updated;
  } catch (error) {
    console.log(error);
    return false;
  }
};

module.exports = {
  findAllTransactions,
  transactionDetails,
  getOneTransaction,
  getDataExcelCSV,
  updateOneTransaction,
};
