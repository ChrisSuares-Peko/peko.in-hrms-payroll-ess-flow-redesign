const { findSubscriptionWithVendorSubId } = require("../../models/use-cases/subscription");
const { findAllTransactions, transactionDetails, getDataExcelCSV, getOneTransaction } = require("../../models/use-cases/transaction");
const { calculateDiscountResponse } = require("../../utils/calculateDiscount");

const asyncHandler = require("./../../middlewares/async");
const ErrorResponse = require("./../../utils/error-response");

exports.findAllTransactionsAndCount = asyncHandler(async (req, res, next) => {
  const from = req.query.fromDate;
  const to = req.query.toDate;
  const corporateId = parseInt(req.params.corporateId) || parseInt(req.query.corporateId) || undefined;
  const start = parseInt(req.query.start);
  const details = req.query.details || true;
  const length = parseInt(req.query.length);
  const draw = parseInt(req.query.draw);
  const categoryName = req.query.serviceCategoryName;

  let searchText = req.query.search.value;
  let order = req.query.orderCol,
    column = "transactionDate"; //req.query.column
  let params = {
    corporateId,
    categoryName,
    from,
    to,
    start,
    length,
    draw,
    searchText,
    order,
    details,
    column,
  };
  const transactionsData = await findAllTransactions(params);
  if (!transactionsData) {
    return next(new ErrorResponse(`Something went wrong while getting all corporate from DB`, 200));
  } else {
    return res.status(200).json({
      success: true,
      draw: draw,
      recordsTotal: transactionsData.count,
      recordsFiltered: transactionsData.count,
      data: transactionsData.rows,
    });
  }
});

exports.findTransactionDetails = asyncHandler(async (req, res) => {
    let transactionId = req.params.transactionId
    let params = {
        transactionId
    }
     let  data  = await transactionDetails(params)

    // Owner check (F-PG-09): the order must belong to the caller's company (sub-users share req.user.id).
    if (!data || String(data.credentialId) !== String(req.user.id)) {
        return res.status(500).json({
            'status': false,
            'data': {},
            'message': 'Something went wrong while fetching the transaction reports',
            'responseCode': '003'
        })
    } else {
        let discountAmount = 0
        if (data.couponData && data.couponData.usedCouponData) {
            discountAmount = parseFloat(data.couponData.usedCouponData.discountAmount)
        }
        delete data.couponData
          if (data.couponCodeData && data.couponCodeData?.discount) {
            const result = calculateDiscountResponse(data.couponCodeData, data.amountInINR)
            discountAmount = result?.data?.discountAmount
        }
        delete data.couponCodeData

        data.couponData = {
            discountAmount: discountAmount
        }
        return res.status(200).json({
            'status': true,
            'data': data,
            'message': 'Fetched transaction details successfully',
            'responseCode': '000'
        })
    }
})

exports.findTransactionData = asyncHandler(async (req, res, next) => {
  let transactionId = req.params.transactionId;
  let params = {
    transactionId,
  };
  let data = await getOneTransaction(params);
  // Owner check (F-PG-09): the transaction must belong to the caller's company.
  if (!data || data.length < 1 || String(data.credentialId) !== String(req.user.id)) {
    return next(new ErrorResponse(`Something went wrong while fetching the transaction reports`, 200));
  } else {
    return res.status(200).json({
      success: true,
      data: data,
    });
  }
});

exports.findSubscriptionData = asyncHandler(async (req, res, next) => {
  let transactionId = req.params.subscriptionId;
  let data = await findSubscriptionWithVendorSubId(transactionId, ["billingType", "corporateUserId", "subscriptionAmountPaid", "subscriptionPrice", "status"]);
  // F-PG-09: was `!data && ...`, which returned any found subscription and crashed on a missing one.
  // Subscriptions are stored with corporateUserId = req.user.corporateId.
  if (!data || String(data.corporateUserId) !== String(req.user.corporateId)) {
    return next(new ErrorResponse(`Something went wrong while fetching the transaction report`, 400));
  } else {
    delete data.corporateUserId;
    return res.status(200).json({
      success: true,
      data: data,
      responseCode:"000",
      message: "Transaction details fetched successfully"
    });
  }
});

exports.getExcel = asyncHandler(async (req, res, next) => {
  const from = req.query.fromDate;
  const to = req.query.toDate;
  const corporateId = parseInt(req.params.corporateId);
  let categoryName = req.query.categoryType || null;
  let order = req.query.orderCol || "DESC";
  let column = "transactionDate"; //req.query.column
  const details = req.query.details || false;

  let params = {
    corporateId,
    from,
    to,
    order,
    categoryName,
    details,
    column,
  };
  let result = await getDataExcelCSV(params);
  if (!result) {
    return next(new ErrorResponse(`Something went wrong while fetching excelCSV data`, 200));
  } else {
    return res.status(200).json({
      success: true,
      data: result,
    });
  }
});
