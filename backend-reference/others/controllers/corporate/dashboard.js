const async = require("async");
const asyncHandler = require("../../middlewares/async");
const transactions = require("../../models/entities/transaction");
let sequelizeConfig = require("../../configs/database/index");
const { getSpendingAlert, findMonthlyCashback, getBillPaymentAlert, findAllTransactions, getMonthlySpendingAlert } = require("../../models/use-cases/dashboard");
const CartUseCase = require('./../../models/use-cases/cart');
const moment = require('moment');
const ErrorResponse = require("../../utils/error-response");
const { findAllBanner } = require("../../models/use-cases/banners");
const { customLog } = require("../../utils/loggerHelper");
const orders = require("../../models/entities/order");
const { Op, Sequelize } = require('sequelize');
const { findOneWallets } = require("../../models/use-cases/wallets");
const { formatNumberWithLocalString } = require("../../utils/formatter");
const { searchServices } = require("../../utils/searchService");
const { getRecentSearches } = require("../../utils/cacheDataMethods");
// const { upsertSetting } = require("../../models/use-cases/setting"); // F-OTH-21: only used by the disabled updateSettings below
const operatorsData = require("../../utils/operatorsData.json");
const { storeServiceSearchRecords, updateRecentSearches } = require("../../models/use-cases/analytics");
const { findOnePartnerPermissionData } = require("../../models/use-cases/partnerPermission");

const categoryByAccessKey = Object.fromEntries(
    Object.values(operatorsData)
        .filter(v => v.accessKey && v.category)
        .map(v => [v.accessKey, v.category])
);


exports.findAllDetails = asyncHandler(async (req, res) => {
  const credentialId = req.user.id;
  customLog(req?.LogTraceId, "info", { credentialId });

  const transactionsData = await findAllTransactions({ corporateId: credentialId });

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  let totalSpendCurrentMonth = 0;
  let totalSpend = 0;

  for (const tx of transactionsData) {
    if (tx.order?.optional != null) continue; // subscription orders counted separately via orders table
    const baseAmount = parseFloat(tx.order?.baseAmount || 0);
    if (isNaN(baseAmount)) continue;
    totalSpend += baseAmount;

    const txDate = new Date(tx.order?.transactionDate);
    if (
      !isNaN(txDate.getTime()) &&
      txDate.getMonth() + 1 === currentMonth &&
      txDate.getFullYear() === currentYear
    ) {
      totalSpendCurrentMonth += baseAmount;
    }
  }

  const subscriptionTotalSpend = await orders.sum("amountInINR", {
    where: {
      credentialId,
      status: "SUCCESS",
      optional: { [Op.ne]: null },
    },
  });

  const subscriptionCurrentMonthSpend = await orders.sum("amountInINR", {
    where: {
      credentialId,
      status: "SUCCESS",
      optional: { [Op.ne]: null },
      [Op.and]: [
        Sequelize.where(Sequelize.fn('MONTH', Sequelize.col('transactionDate')), Sequelize.fn('MONTH', Sequelize.fn('CURDATE'))),
        Sequelize.where(Sequelize.fn('YEAR', Sequelize.col('transactionDate')), Sequelize.fn('YEAR', Sequelize.fn('CURDATE'))),
      ],
    },
  });

  const subscriptionCount = await orders.count({
    where: {
      credentialId,
      status: "SUCCESS",
      optional: { [Op.ne]: null },
    },
  });

  return res.status(200).send({
    status: true,
    responseCode: "000",
    message: "Dashboard datas fetched successfully",
    data: {
      totalSpendCurrentMonth: parseFloat((totalSpendCurrentMonth + parseFloat(subscriptionCurrentMonthSpend ?? 0)).toFixed(2)),
      totalSpend: parseFloat((totalSpend + parseFloat(subscriptionTotalSpend ?? 0)).toFixed(2)),
      totalTransactions: transactionsData.length + subscriptionCount,
    },
  });
});

exports.findAllAlerts = asyncHandler(async (req, res) => {
  let alerts = []
  let currentUser = req.user.id
  // let corporateId = req.user.corporateId

  //priority 1 --Spending
  let percentageMore = await getSpendingAlert(currentUser)
  if (percentageMore) {
    // percentageMore = percentageMore > 100 ? 100 : percentageMore //if max percentage is 100
    alerts.push({
      type: "Monthly Spending",
      message: `Your current month spending is ${percentageMore}% more than usual`,
      action: "View",
      linkUrl: '/reports'
    })
  }

  //priority 2 --Cash back
  // const currentDate = new Date();
  // const currentDay = currentDate.getDate();
  // if (currentDay >= 1 && currentDay <= 31) {
  //   let lastMonthCashback = await findMonthlyCashback(currentUser);
  //   if (lastMonthCashback) {
  //     alerts.push({
  //       type: 'Cashback',
  //       message: `You received a cashback of INR ${lastMonthCashback} last month`,
  //       action: "View",
  //       linkUrl: '/'
  //     });
  //   }
  // }

  //priority 3 --Order Pending
  // const allProducts = await CartUseCase.getAllProductsInMyCart(corporateId);
  // const lengthOfCartProducts = allProducts?.pics?.length;
  // if (lengthOfCartProducts > 0) {
  //   const { productsArray } = allProducts
  //   let totalPrice = 0;
  //   for (const product of productsArray) {
  //     totalPrice += product.totalPrice;
  //   }

  //   alerts.push({
  //     type: 'Order Pending',
  //     message: `Complete your order in office supplies`,
  //     action: `Pay ${totalPrice}`,
  //     linkUrl: '/office-supplies?viewCart=true'
  //   })
  // }
  //priority 4 --Bill pay DED
  // const licenseRenewalDate = req?.user?.tradeLicenseExpiry;
  // if (licenseRenewalDate != 'Not Available') {
  //   const renewalDate = new Date(licenseRenewalDate);
  const currentDate = new Date();
  //   const timeDifference = renewalDate - currentDate;
  //   const daysRemaining = Math.floor(timeDifference / (1000 * 60 * 60 * 24));
  //   let formattedDate = moment(licenseRenewalDate);
  //   //let message= `${daysRemaining} for the expiry of license renewal.`
  //   // if (daysRemaining <= 15 && daysRemaining >= 0) 
  //   if (daysRemaining <= 15 && daysRemaining >= 0) {
  //     alerts.push({
  //       type: 'DED Renewal',
  //       message: `Your DED license will expire on ${formattedDate.format(' Do MMMM, YYYY')}`,
  //       action: "Pay",
  //       linkUrl: '/system/corporate/licenseRenewal'
  //     })
  //   }
  // }
  //priority 4 --mobile and utility

  let bills = await getBillPaymentAlert(currentUser)

  if (Array.isArray(bills)) {
    bills.sort((a, b) => new Date(a.transactionDate) - new Date(b.transactionDate));
    for (const bill of bills) {
      if (bill) {
        let billDate = new Date(bill.transactionDate);
        billDate.setDate(billDate.getDate() + 30);
        if (billDate >= currentDate) {
          let formattedDate = moment(billDate);
          let providerName = bill.serviceOperator.serviceProvider
          let url = bill.serviceOperator.serviceProvider.replace(/\s/g, '')
          if (bill.serviceOperator.serviceProvider === 'Mobile Postpaid') {
            url = 'mobile-recharge/postpaid'
          } else if (bill.serviceOperator.serviceProvider === 'Mobile Prepaid') {
            url = 'mobile-recharge/prepaid'
          } else {
            url = 'bill-payments'
          }

          alerts.push({
            type: providerName,
            message: `You have a bill payment for ${bill.order.accountNo} on ${formattedDate.format(' Do MMMM, YYYY')}`,
            action: "Pay",
            providerImage: bill?.serviceOperator?.serviceImage,
            linkUrl: `/${url}`

          })
        }
      }
    }
  }

  //priority 4 --work space


  return res.status(200).json({
    'status': true,
    'data': { alerts },
    responseCode: "000",
    message: "Succesully fetched all alerts"
  })
})


exports.findAllTransactions = asyncHandler(async (req, res, next) => {

  const corporateId = parseInt(req.user.id)
  const { paymentMode, monthlyView } = req.query
  const year = req.query.year?.toString()
  const month = req.query.month?.toString()

  const transactionsData = await findAllTransactions({ corporateId });
  const transformedData = transactionsData
    .filter(transaction => transaction.order?.optional == null) // subscription orders handled separately
    .map((transaction) => {
      let orderServiceName = null;
      const isSubscriptionTx = transaction?.transactionCategory?.toUpperCase().includes('SUBSCRIPTION');
      if (isSubscriptionTx) {
        try {
          const parsed = transaction.order?.orderResponse ? JSON.parse(transaction.order.orderResponse) : null;
          orderServiceName = parsed?.serviceName || null;
        } catch (_) { /* ignore malformed orderResponse JSON */ }
      }
      const transformed = {
        transactionDate: transaction?.order?.transactionDate || null,
        serviceCategory: transaction?.serviceOperator?.serviceCategory === "Other Services"
          ? transaction?.serviceOperator?.serviceProvider
          : transaction?.serviceOperator?.serviceCategory || orderServiceName || 'Other',
        amountInINR: transaction?.order?.amountInINR || null,
        status: transaction?.order?.status || null,
      };

      return transformed;
    })
    .filter(transaction => transaction.transactionDate !== null);

  const subscriptionOrdersList = await orders.findAll({
    where: {
      credentialId: corporateId,
      status: "SUCCESS",
      optional: { [Op.ne]: null },
    },
    attributes: ['transactionDate', 'amountInINR', 'baseAmount', 'paymentMode', 'optional', 'orderResponse'],
    order: [['transactionDate', 'DESC']],
  });

  const transformedSubscriptions = subscriptionOrdersList
    .filter(o => o.transactionDate !== null)
    .map(o => {
      let parsedResponse = null;
      // eslint-disable-next-line no-empty
      try { parsedResponse = o.orderResponse ? JSON.parse(o.orderResponse) : null; } catch (_) {}
      const serviceName = parsedResponse?.serviceName || (o.optional === 'SUBSCRIPTION-ADDONS' ? 'Subscription Addon' : 'Subscription');
      return {
        transactionDate: o.transactionDate,
        serviceCategory: serviceName,
        amountInINR: o.amountInINR,
        status: 'SUCCESS',
      };
    });

  const allTransformed = [...transformedData, ...transformedSubscriptions]
    .sort((a, b) => new Date(b.transactionDate) - new Date(a.transactionDate));

  const firstFourItems = allTransformed.slice(0, 4);

  function filterAndAggregate(transactions, year, month, paymentMode, monthlyView) {
    const filteredTransactions = transactions.filter(transaction => {
      const transactionDate = new Date(transaction.order?.transactionDate);
      if (isNaN(transactionDate.getTime())) {
        // Invalid date, skip this transaction
        return false;
      }
      const transactionYear = transactionDate.getFullYear();
      const transactionMonth = transactionDate.getMonth() + 1; // Months are zero-based

      return (year === 'all' || transactionYear.toString() === year) &&
        (month === 'all' || (transactionMonth.toString() === month && !monthlyView) || monthlyView) &&
        (paymentMode === 'all' || transaction?.order?.paymentMode === paymentMode);
    });

    const result = filteredTransactions.reduce((accumulator, transaction) => {
        const serviceCategory = transaction?.serviceOperator?.serviceCategory === "Other" ? transaction?.serviceOperator?.serviceProvider : transaction?.serviceOperator?.serviceCategory || 'Other';
        const transactionMonth = new Date(transaction.order.transactionDate).toLocaleString('default', { month: 'short' });
        const amount = parseFloat(transaction.order.baseAmount);

      // Aggregate the amount for each service provider and month
      const key = monthlyView ? transactionMonth : serviceCategory;
      if (accumulator[key]) {
        accumulator[key] += amount;
      } else {
        accumulator[key] = amount;
      }

      return accumulator;
    }, {});

    let finalResult;

    if (monthlyView) {
      // Assuming result is the initial data
      const allMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

      // Initialize all months with zero values
      const initializedResult = {};
      allMonths.forEach(month => {
        initializedResult[month] = 0;
      });

      // Merge the actual data into initializedResult
      Object.assign(initializedResult, result);

      // Convert the result to the desired format
      finalResult = Object.entries(initializedResult).map(([name, amount]) => ({
        name,
        amount: parseFloat(amount).toFixed(2)
      }));
    } else {
      // Convert the result to the desired format
      finalResult = Object.entries(result).map(([name, amount]) => ({
        name,
        amount: parseFloat(amount).toFixed(2)
      }));
    }

    return { finalResult, filteredTransactions };
  }



  const subscriptionAsTransactions = subscriptionOrdersList.map(o => {
    const serviceName = o.optional === 'SUBSCRIPTION-ADDONS' ? 'Subscription Addon' : 'Subscription';
    return {
      order: {
        transactionDate: o.transactionDate,
        paymentMode: o.paymentMode,
        baseAmount: o.baseAmount ?? o.amountInINR,
        amountInINR: o.amountInINR,
        status: 'SUCCESS',
      },
      serviceOperator: {
        serviceCategory: serviceName,
        serviceProvider: serviceName,
      },
    };
  });

  const nonSubscriptionTransactions = transactionsData.filter(tx => tx.order?.optional == null);
  const { finalResult } = filterAndAggregate([...nonSubscriptionTransactions, ...subscriptionAsTransactions], year, month, paymentMode, monthlyView);
  //const reversedResult = filteredTransactions.reverse();

  // Extracting the first 5 objects
  //const firstFiveObjects = reversedResult.slice(0, 4);

  // const parsedFirstFiveObjects = firstFiveObjects.map(entry => {
  //   return {
  //     transactionDate: entry.order.transactionDate,
  //     serviceCategory: entry.serviceOperator.serviceCategory,
  //     amountInINR: parseInt(entry.order.baseAmount),
  //     status: entry.order.status,

  //   };
  // });


  if (!transactionsData) {
    return next(new ErrorResponse(`Something went wrong while getting all corporate from DB`, 400))
  } else {
    return res.status(200).json({
      'status': true,
      'data': {
        filteredResult: finalResult,
        recentTransaction: firstFourItems
      },
      'messsage': 'Data fetched successfully',
      'responseCode': '000'
    })
  }
})

exports.dashboard = asyncHandler(async (req, res) => {
  const credentialId = req.user.id;
  const balanceDetails = await findOneWallets(credentialId, ['balance']);
  const balance = balanceDetails?.balance;
  async.parallel(
    {
      totalSpendCurrentMonth: function (callback) {
        sequelizeConfig
          .query(
            `SELECT sum(debitAmount) as totalSpendCurrentMonth FROM reportAll
             WHERE credentialId = ${credentialId} 
             and month(transactionDate) = month(CURRENT_DATE()) 
             and year(transactionDate) = year(CURRENT_DATE()) 
             and  (status != 'REFUND' && status != 'REFUNDED' && status != 'PENDING');`,
            {
              type: sequelizeConfig.QueryTypes.SELECT,
            }
          )
          .then(function (totalSpendCurrentMonth) {
            callback(null, totalSpendCurrentMonth[0].totalSpendCurrentMonth);
          });
      },
      totalSpendSubscriptionCurrentMonth: function (callback) {
        orders
          .sum("amountInINR", {
            where: {
              credentialId: credentialId,
              status: "SUCCESS",
              optional: {
                [Op.ne]: null
              },
              [Op.and]: [
                Sequelize.where(Sequelize.fn('MONTH', Sequelize.col('transactionDate')), Sequelize.fn('MONTH', Sequelize.fn('CURDATE'))),
                Sequelize.where(Sequelize.fn('YEAR', Sequelize.col('transactionDate')), Sequelize.fn('YEAR', Sequelize.fn('CURDATE')))
              ]
            },
          })
          .then(function (data) {
            callback(null, data);
          });
      },
      totalSpend: function (callback) {
        sequelizeConfig
          .query(
            `SELECT sum(debitAmount) as totalSpend FROM reportAll  WHERE credentialId = ${credentialId} and (status != 'REFUND' && status != 'REFUNDED' && status !='PENDING');`,
            {
              type: sequelizeConfig.QueryTypes.SELECT,
            }
          )
          .then(function (revenueData) {
            callback(null, revenueData[0].totalSpend);
          });
      },
      totalSpendSubscription: function (callback) {
        orders
          .sum("amountInINR", {
            where: {
              credentialId: credentialId,
              status: "SUCCESS",
              optional: {
                [Op.ne]: null
              },
            },
          })
          .then(function (data) {
            callback(null, data);
          });
      },
      totalCashback: function (callback) {
        transactions
          .sum("corporateCashback", {
            where: {
              credentialId: credentialId,
              status: "SUCCESS",
            },
          })
          .then(function (data) {
            callback(null, data);
          });
      },
    },

    async function (err, result) {
      if (err) {
        return res.status(500).json({
          status: false,
          responseCode: "001",
          message: "Something went wrong while fetching datas",
          data: {},
        });
      }

      let alerts = []
      let currentUser = credentialId
      let corporateId = req.user.corporateId


      //priority 1 --Spending
      // let percentageMore = await getSpendingAlert(currentUser)
      let percentageMore = await getMonthlySpendingAlert(currentUser);

      if (percentageMore !== false) {
        let message;

        if (percentageMore > 0) {
          // Spending is more than usual
          message = `Your current month spending is ${percentageMore}% more than usual`;
        } else if (percentageMore < 0) {
          // Spending is less than usual
          message = `Your current month spending is ${Math.abs(percentageMore)}% less than usual`;
        } else {
          // Spending is the same as usual
          message = `Your current month spending is the same as usual`;
        }

        alerts.push({
          type: "Monthly Spending",
          message: message,
          action: "View",
          linkUrl: '/reports',
          providerImage: null,
          serviceName: "Transactions",
          subServiceName: "Transactions",
        });
      }

      //priority 2 --Cash back
      const currentDate = new Date();
      const currentDay = currentDate.getDate();
      if (currentDay >= 1 && currentDay <= 5) {
        let lastMonthCashback = await findMonthlyCashback(currentUser);
        if (lastMonthCashback) {
          alerts.push({
            type: 'Cashback',
            message: `You received a cashback of ₹ ${formatNumberWithLocalString(lastMonthCashback)} last month`,
            action: "View",
            linkUrl: '/',
            providerImage: null,
            serviceName: 'Transactions',
            subServiceName: null,
          });
        }
      }

      //priority 3 --Order Pending
      const allProducts = await CartUseCase.getAllProductsInMyCart(corporateId);
      const lengthOfCartProducts = allProducts?.pics?.length;
      if (lengthOfCartProducts > 0) {
        const { productsArray } = allProducts
        let totalPrice = 0;
        for (const product of productsArray) {
          totalPrice += product.totalPrice;
        }

        alerts.push({
          type: 'Order Pending',
          message: `Complete your order in office supplies`,
          action: `Pay ${totalPrice}`,
          linkUrl: '/office-supplies?viewCart=true',
          providerImage: null,
          serviceName: "Office Supplies",
          subServiceName: null,
        })
      }
      //priority 4 --mobile and utility

      let bills = await getBillPaymentAlert(currentUser)


      if (Array.isArray(bills)) {
        bills.sort((a, b) => new Date(a.transactionDate) - new Date(b.transactionDate));
        for (const bill of bills) {
          if (bill) {
            let billDate = new Date(bill.transactionDate);
            billDate.setDate(billDate.getDate() + 30);
            if (billDate >= currentDate) {
              let formattedDate = moment(billDate);
              let providerName = bill.serviceOperator.serviceProvider
              let providerImage = bill.serviceOperator.serviceImage
              let url = bill.order.serviceProvider?.replace(/\s/g, '')
              let serviceName = categoryByAccessKey[bill.order.accessKey] || "Utility Payments"
              let subServiceName = null

              alerts.push({
                type: providerName,
                message: `You have a bill payment for ${bill.order.accountNo} on ${formattedDate.format(' Do MMMM, YYYY')}`,
                action: "Pay",
                linkUrl: `/system/corporate/${url}`,
                providerImage,
                serviceName,
                subServiceName,
              })
            }
          }
        }
      }

      //exclude attributes
      let attributes = ['createdAt', 'updatedAt', 'status', 'deviceType']
      let deviceType = 'MOBILE'
      let partnerId = req.user.registeredBy
      let allBanners = await findAllBanner(deviceType, undefined, partnerId, attributes)

      return res.status(200).json({
        'status': true,
        'data': {
          alerts: alerts, totalSpendCurrentMonth: (parseFloat(result.totalSpendCurrentMonth ?? 0) + parseFloat(result.totalSpendSubscriptionCurrentMonth ?? 0)).toFixed(2),
          totalSpend: (parseFloat(result.totalSpend ?? 0) + parseFloat(result.totalSpendSubscription ?? 0)).toFixed(2),
          totalCashback: parseFloat(result.totalCashback ?? 0).toFixed(2), allBanners, balance
        },
        responseCode: "000",
        message: "Successfully fetched all dashboard details."
      })
    }
  );
});

exports.searchServices = asyncHandler(async (req, res) => {
  const searchText = req.query.q

  if(searchText){
    await updateRecentSearches({credentialId:req.user.id, searchText})
  }

  const result = await searchServices(searchText);

   customLog(null, "info", { message: `result`,body:result });

  const partnerPermissionData = await findOnePartnerPermissionData(req.user.registeredBy, ['permissions']);
    customLog(null, "info", { message: `partnerPermissionData` ,body:partnerPermissionData});
  const permissions = partnerPermissionData?.permissions || [];

  const accessibleResult = result.filter(item => {
    const itemName = item.name?.trim().toLowerCase();
    return permissions.some(permission => {
      if (permission.label?.trim().toLowerCase() === itemName) {
        return !!permission.hasAccess;
      }
      return (permission.subServices || []).some(
        sub => sub.label?.trim().toLowerCase() === itemName && sub.hasAccess
      );
    });
  });
    customLog(null, "info", { message: `accessibleResult`,body:accessibleResult });

  // searchServices is flattened from services + sub-services, so the same name can appear twice
  const seen = new Set();
  const uniqueResult = accessibleResult.filter(item => {
    const key = item.name?.trim().toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return res.status(200).json({
    status: true,
    message: 'Search result fetched successfully',
    data: uniqueResult,
    responseCode: '000'
  })
});
exports.fetchSearchHistory = asyncHandler(async (req, res) => {
  const userId = req.user?.id;

  const result = await getRecentSearches(userId);
  return res.status(200).json({
    status: true,
    message: 'Recent search history fetched successfully',
    data: result,
    responseCode: '000'
  })
});

exports.storeHistory = asyncHandler(async (req, res) => {
  const userId = req.user?.id;
  const { q } = req.query;

  if (!q || !userId) {
    return res.status(400).json({ status: false, message: 'Missing search query or user ID' });
  }

  await storeServiceSearchRecords({ credentialId: userId, service: q });
  return res.status(200).json({
    status: true,
    message: 'Search submitted and stored successfully',
    responseCode: '000'
  });
});
// F-OTH-21: disabled — this updates a platform-wide, non-tenant-scoped setting (every
// corporate shares one searchServices list), so it has moved to the system-user tree,
// admin-only. See controllers/admin/dashboard.js's updateSearchServicesSetting.
// exports.updateSettings = asyncHandler(async (req, res) => {
//   const data = req.body
//
//   const result = await upsertSetting("searchServices", data);
//   return res.status(200).json({
//     status: true,
//     message: 'Search services updated',
//     data: result,
//     responseCode: '000'
//   })
// });