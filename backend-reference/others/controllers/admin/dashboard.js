const async = require('async');
const asyncHandler = require('../../middlewares/async')
const credentials = require('../../models/entities/credential')
// const transaction = require('../../models/entities/transaction')
const vendors = require('../../models/entities/vendor')
const signupRequests = require('../../models/entities/signUp')
let sequelizeConfig = require('../../configs/database/index');
const { Op } = require("sequelize");
const corporateUser = require('../../models/entities/corporateUser');
const { getCommissionTotal, getCommissionByDay, dayKey } = require('../../models/use-cases/dashboardCommission');
const { upsertSetting } = require('../../models/use-cases/setting');

// F-OTH-21: moved here from the corporate tree — this updates a single global,
// non-tenant-scoped setting shared by every corporate, so it must be admin-only rather
// than callable by any one corporate's own session. The name is fixed, not caller-supplied.
exports.updateSearchServicesSetting = asyncHandler(async (req, res) => {
  const data = req.body;
  const result = await upsertSetting("searchServices", data);
  return res.status(200).json({
    status: true,
    message: 'Search services updated',
    data: result,
    responseCode: '000'
  });
});

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

// Returns the IST calendar date as 'YYYY-MM-DD' for `daysAgo` days back from now,
// independent of the server's OS timezone.
const istDateString = (daysAgo = 0) => {
  const shifted = new Date(Date.now() + IST_OFFSET_MS - daysAgo * 24 * 60 * 60 * 1000);
  const yyyy = shifted.getUTCFullYear();
  const mm = String(shifted.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(shifted.getUTCDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

exports.findAllDetails = asyncHandler(async (req, res) => {
  const todayIST = istDateString(0);
  const thirtyDaysAgoIST = istDateString(30);

  let fromDate = req.query.fromDate || `${todayIST} 00:00:00`,
    toDate = req.query.toDate || `${todayIST} 23:59:59`;

  let to = `${todayIST} 23:59:59`,
    fromThirty = `${thirtyDaysAgoIST} 23:59:59`;

  const daysRange = Array.from({ length: 31 }, (_, index) =>
    new Date(`${istDateString(index)} 00:00:00`).toDateString()
  ).reverse();

  function diff(A, B) {
    return A.filter(function (a) {
      return B.indexOf(a) == -1;
    });
  }
  async.parallel({
    totalRevenue: function (callback) {
      sequelizeConfig.query(
        `SELECT sum(debitAmount) as totalRevenue FROM reportAll WHERE status NOT IN ('REFUND','REFUNDED');
`, {
        type: sequelizeConfig.QueryTypes.SELECT
      }).then(function (revenueData) {
        callback(null, revenueData[0].totalRevenue)
      })
    },
    totalSubscriptionRevenue: function (callback) {
      sequelizeConfig.query(
        `SELECT sum(baseAmount) as totalRevenue FROM orders where optional in ('SUBSCRIPTION' , 'WHATSAPP-SUBSCRIPTION',
        'SUBSCRIPTION-ADDONS','ACCOUNTING-SUBSCRIPTION') and (status != 'REFUND' && status != 'REFUNDED');`, {
        type: sequelizeConfig.QueryTypes.SELECT
      }).then(function (revenueData) {
        callback(null, revenueData[0].totalRevenue)
      })
    },
    totalTransactions: function (callback) {
      sequelizeConfig.query(
        `SELECT count(*) as totalTransactions FROM reportAll where (status != 'REFUND' && status != 'REFUNDED');`, {
        type: sequelizeConfig.QueryTypes.SELECT
      }).then(function (revenueData) {
        callback(null, revenueData[0].totalTransactions)
      })
    },
    totalSubscriptionTransactions: function (callback) {
      sequelizeConfig.query(
        `SELECT count(*) as totalTransactions FROM orders where optional in ('SUBSCRIPTION' , 'WHATSAPP-SUBSCRIPTION',
        'SUBSCRIPTION-ADDONS','ACCOUNTING-SUBSCRIPTION') and (status != 'REFUND' && status != 'REFUNDED');`, {
        type: sequelizeConfig.QueryTypes.SELECT
      }).then(function (revenueData) {
        callback(null, revenueData[0].totalTransactions)
      })
    },
    totalCorporates: function (callback) {
    corporateUser.count({
      include: [
        {
          model: credentials,
          attributes: [],
          where: {
            role: 'CORPORATE',
            [Op.or]: [{ accountType: { [Op.ne]: 'freelancer' } }, { accountType: null }]
          }
        }
      ]
    }).then(function (data) {
        callback(null, data)
      })
    },
    totalCustomers: function (callback) {
      corporateUser.count({
        include: [
          {
            model: credentials,
            attributes: [],
            where: {
              role: 'CORPORATE',
              accountType: 'freelancer'
            }
          }
        ]
      }).then(function (data) {
        callback(null, data)
      })
    },
    totalSignUpRequests: function (callback) {
      signupRequests.count().then(function (data) {
        callback(null, data)
      })
    },
    totalVendors: function (callback) {
      vendors.count().then(function (data) {
        callback(null, data)
      })
    },
    activeUsers: function (callback) {
      sequelizeConfig.query(
        `SELECT count(DISTINCT t.credentialId) as count FROM transactions t
         INNER JOIN credentials c ON c.id = t.credentialId
         WHERE t.transactionDate BETWEEN ? AND ?
         AND (c.accountType != 'freelancer' OR c.accountType IS NULL)`,
        { replacements: [fromThirty, to], type: sequelizeConfig.QueryTypes.SELECT }
      ).then(function (data) {
        callback(null, data[0].count)
      })
    },
    activeUsersTillDate: function (callback) {
      sequelizeConfig.query(
        `SELECT count(DISTINCT t.credentialId) as count FROM transactions t
         INNER JOIN credentials c ON c.id = t.credentialId
         WHERE (c.accountType != 'freelancer' OR c.accountType IS NULL)`,
        { type: sequelizeConfig.QueryTypes.SELECT }
      ).then(function (data) {
        callback(null, data[0].count)
      })
    },
    activeCustomers: function (callback) {
      sequelizeConfig.query(
        `SELECT count(DISTINCT t.credentialId) as count FROM transactions t
         INNER JOIN credentials c ON c.id = t.credentialId
         WHERE t.transactionDate BETWEEN ? AND ?
         AND c.accountType = 'freelancer'`,
        { replacements: [fromThirty, to], type: sequelizeConfig.QueryTypes.SELECT }
      ).then(function (data) {
        callback(null, data[0].count)
      })
    },
    activeCustomersTillDate: function (callback) {
      sequelizeConfig.query(
        `SELECT count(DISTINCT t.credentialId) as count FROM transactions t
         INNER JOIN credentials c ON c.id = t.credentialId
         WHERE c.accountType = 'freelancer'`,
        { type: sequelizeConfig.QueryTypes.SELECT }
      ).then(function (data) {
        callback(null, data[0].count)
      })
    },
    totalCashback: function (callback) {
      getCommissionTotal()
        .then(function (commission) {
          callback(null, commission)
        })
        .catch(callback)
    },
    todaysRevenue: function (callback) {
      sequelizeConfig.query(
        `SELECT sum(debitAmount) as totalRevenue FROM reportAll where (status != 'REFUND' AND status != 'REFUNDED') AND transactionDate BETWEEN ? AND ?;`, {
        type: sequelizeConfig.QueryTypes.SELECT,
        replacements: [fromDate, toDate]
      }).then(function (revenueData) {
        callback(null, parseFloat(revenueData[0].totalRevenue) || 0)
      })
    },
    todaysSubscriptionRevenue: function (callback) {
      sequelizeConfig.query(
        `SELECT sum(baseAmount) as totalRevenue FROM orders where optional in ('SUBSCRIPTION' , 'WHATSAPP-SUBSCRIPTION',
        'SUBSCRIPTION-ADDONS','ACCOUNTING-SUBSCRIPTION') and (status != 'REFUND' && status != 'REFUNDED') and createdAt BETWEEN ? AND ?;`, {
        type: sequelizeConfig.QueryTypes.SELECT,
        replacements: [fromDate, toDate]
      }).then(function (revenueData) {
        callback(null, parseFloat(revenueData[0].totalRevenue) || 0)
      })
    },
    todaysCashback: function (callback) {
      getCommissionTotal({ range: { from: fromDate, to: toDate } })
        .then(function (commission) {
          callback(null, commission)
        })
        .catch(callback)
    },
    todaysTransactions: function (callback) {
      sequelizeConfig.query(
        `SELECT count(*) as totalTransactions FROM reportAll where (status != 'REFUND' AND status != 'REFUNDED') AND transactionDate BETWEEN ? AND ?;`, {
        type: sequelizeConfig.QueryTypes.SELECT,
        replacements: [fromDate, toDate]
      }).then(function (revenueData) {
        callback(null, revenueData[0].totalTransactions || 0)
      })
    },
    todaysSubscriptionTransactions: function (callback) {
      sequelizeConfig.query(
        `SELECT count(*) as totalTransactions FROM orders where optional in ('SUBSCRIPTION' , 'WHATSAPP-SUBSCRIPTION',
        'SUBSCRIPTION-ADDONS','ACCOUNTING-SUBSCRIPTION') and (status != 'REFUND' && status != 'REFUNDED') and createdAt BETWEEN ? AND ?;`, {
        type: sequelizeConfig.QueryTypes.SELECT,
        replacements: [fromDate, toDate]
      }).then(function (revenueData) {
        callback(null, revenueData[0].totalTransactions || 0)
      })
    },
    todaysCorporateUsers: function (callback) {
      credentials.count({
        where: {
          role: 'CORPORATE',
          createdAt: {
            [Op.between]: [fromDate, toDate]
          }
        }
      }).then(function (data) {
        callback(null, data)
      })
    },
    monthlyCorporates: function (callback) {
      sequelizeConfig.query(
        'SELECT count(id) as count, Date(createdAt) as Date FROM credentials  WHERE role = "CORPORATE"  AND credentials.createdAt BETWEEN ? AND ?  GROUP BY Date(createdAt) ;', {
        replacements: [fromThirty, to],
        type: sequelizeConfig.QueryTypes.SELECT
      }).then(function (customerData) {
        var dataCustomer = customerData.map(item => {
          return {
            date: new Date(`${item.Date} 00:00:00`).toDateString(),
            count: item.count
          };
        });

        var gotDate = dataCustomer.map(data => {
          return new Date(data.date).toDateString();
        });

        var missed = diff(daysRange, gotDate);


        var indexes = missed.map(missedDay => {
          return daysRange.indexOf(missedDay);
        });

        for (let index = 0; index < missed.length; index++) {
          dataCustomer.splice(indexes[index], 0, {
            date: missed[index],
            count: 0
          });
        }

        var label = dataCustomer.map(item => {
          return item.date.slice(0, 10);
        });

        var data = dataCustomer.map(item => {
          return item.count;
        });
        let finalBarArray = {
          corporates: data,
          labelDate: label
        };
        callback(null, finalBarArray);
      })
    },
    monthlyStatistics: function (callback) {
      Promise.all([
        sequelizeConfig.query(
          'SELECT count(*) as count, sum(debitAmount) as revenue, Date(transactionDate) as Date FROM reportAll  WHERE (status != "REFUND" AND status != "REFUNDED") AND transactionDate BETWEEN ? AND ?  GROUP BY Date(transactionDate);', {
          replacements: [fromThirty, to],
          type: sequelizeConfig.QueryTypes.SELECT
        }),
        getCommissionByDay({ range: { from: fromThirty, to } })
      ]).then(function ([transactionDetails, commissionByDay]) {
        var transData = transactionDetails.map(item => {
          return {
            date: new Date(`${item.Date} 00:00:00`).toDateString(),
            count: item.count,
            revenue: item.revenue,
            cashback: commissionByDay[dayKey(item.Date)] || 0
          };
        });

        var gotDate = transData.map(data => {
          return new Date(data.date).toDateString();
        });

        var missed = diff(daysRange, gotDate);
        var indexes = missed.map(missedDay => {
          return daysRange.indexOf(missedDay);
        });

        for (let index = 0; index < missed.length; index++) {
          transData.splice(indexes[index], 0, {
            date: missed[index],
            count: 0,
            revenue: 0,
            cashback: 0
          });
        }

        var label = transData.map(item => {
          return item.date.slice(0, 10);
        });

        var transactionData = transData.map(item => {
          return item.count;
        });
        var revenueData = transData.map(item => {
          return item.revenue;
        });
        var cashbackData = transData.map(item => {
          return item.cashback;
        });
        let finalBarArray = {
          transactions: transactionData,
          revenue: revenueData,
          cashback: cashbackData,
          labelDate: label
        };
        callback(null, finalBarArray);
      }).catch(callback)
    },
    monthlySubscriptionStatistics: function (callback) {
      sequelizeConfig.query(
        'SELECT count(*) as count, sum(baseAmount) as revenue, sum(0) as cashback, Date(transactionDate) as Date, MAX(transactionDate) AS latestCreatedAt FROM orders where optional in ("SUBSCRIPTION","WHATSAPP-SUBSCRIPTION","SUBSCRIPTION-ADDONS","ACCOUNTING-SUBSCRIPTION") and (status != "REFUND" && status != "REFUNDED") and transactionDate BETWEEN ? AND ? GROUP BY Date(transactionDate) order by latestCreatedAt;', {
        replacements: [fromThirty, to],
        type: sequelizeConfig.QueryTypes.SELECT
      }).then(function (transactionDetails) {
        var transData = transactionDetails.map(item => {
          return {
            date: new Date(`${item.Date} 00:00:00`).toDateString(),
            count: item.count,
            revenue: item.revenue,
            cashback: item.cashback
          };
        });

        var gotDate = transData.map(data => {
          return new Date(data.date).toDateString();
        });

        var missed = diff(daysRange, gotDate);
        var indexes = missed.map(missedDay => {
          return daysRange.indexOf(missedDay);
        });

        for (let index = 0; index < missed.length; index++) {
          transData.splice(indexes[index], 0, {
            date: missed[index],
            count: 0,
            revenue: 0,
            cashback: 0
          });
        }

        var label = transData.map(item => {
          return item.date.slice(0, 10);
        });

        var transactionData = transData.map(item => {
          return item.count;
        });
        var revenueData = transData.map(item => {
          return item.revenue;
        });
        var cashbackData = transData.map(item => {
          return item.cashback;
        });
        let finalBarArray = {
          transactions: transactionData,
          revenue: revenueData,
          cashback: cashbackData,
          labelDate: label
        };
        callback(null, finalBarArray);
      })
    }
  },

    function (err, result) {
      // console.log('result----', result);
      if (err) {
        return res.status(500).json({
          status: false,
          message: 'Error fetching dashboard details',
          error: err,
          responseCode: '500'
        });
      }
      // Transform monthlyCorporates data
      const monthlyCorporatesTransformed = result.monthlyCorporates.labelDate.map((date, index) => {
        return {
          name: date,
          count: result.monthlyCorporates.corporates[index]
        };
      });

      // Transform monthlyStatistics data
      const monthlyStatisticsTransformed = result.monthlyStatistics.labelDate.map((date, index) => {
        return {
          name: date,
          transactions: parseFloat(parseFloat(result.monthlyStatistics.transactions[index]).toFixed(2)) + parseFloat(parseFloat(result.monthlySubscriptionStatistics.transactions[index]).toFixed(2)),
          revenue: parseFloat(parseFloat(result.monthlyStatistics.revenue[index]).toFixed(2)) + parseFloat(parseFloat(result.monthlySubscriptionStatistics.revenue[index]).toFixed(2)),
          cashback: parseFloat(parseFloat(result.monthlyStatistics.cashback[index]).toFixed(2)) + parseFloat(parseFloat(result.monthlySubscriptionStatistics.cashback[index]).toFixed(2)) ,
        };
      });

      return res.status(201).json({
        status: true,
        message: 'Fetched all dashboard details successfully',
        data: {
          totalRevenue: parseFloat(result.totalRevenue)+parseFloat(result.totalSubscriptionRevenue),
          monthlyCorporates: monthlyCorporatesTransformed,
          totalCorporates: result.totalCorporates,
          totalCustomers: result.totalCustomers,
          totalSignUpRequests: result.totalSignUpRequests,
          todaysCorporateUsers: result.todaysCorporateUsers,
          totalVendors: result.totalVendors,
          activeUsers: result.activeUsers,
          activeUsersTillDate: result.activeUsersTillDate,
          activeCustomers: result.activeCustomers,
          activeCustomersTillDate: result.activeCustomersTillDate,
          todaysRevenue: result.todaysRevenue+ result.todaysSubscriptionRevenue,
          todaysCashback: result.todaysCashback,
          todaysTransactions: result.todaysTransactions+ result.todaysSubscriptionTransactions,
          totalTransactions: result.totalTransactions+result.totalSubscriptionTransactions,
          monthlyStatistics: monthlyStatisticsTransformed,
          totalCashback: result.totalCashback
        },
        responseCode: '000'
      });
    })
})
