const async = require('async');
const { Op } = require('sequelize');
const moment = require('moment')

const asyncHandler = require("../../middlewares/async")
// const { fetchAllPartner } = require("../../models/use-cases/partner");
const { findCorporateByPartner, fetchAllSubPartnerList } = require('../../models/use-cases/credential');
const { findAllPartnerPackage,createCloneNewPartner,findPartnerPermissions,findPackagesCashback } = require('../../models/use-cases/package');
const credential = require('../../models/entities/credential');
let sequelizeConfig = require('../../configs/database/index');
const { findAllByRoleName, findClonePartnerFrom, findClonePartnerTo, findOne: findParnterShare } = require('../../models/use-cases/systemUser');
const ErrorResponse = require('../../utils/error-response');
const {
  PARTNER_CORPORATES,
  dayKey,
  getCommissionTotal,
  getCommissionByDay,
  networkShareOf,
} = require('../../models/use-cases/dashboardCommission');

const convertToUTC = (date) => new Date(date.getTime() - date.getTimezoneOffset() * 60000);

const convertToIST = (date) => {
  return new Date(date.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
};

const partnerShareOf = async (user) => {
  if (!user.registeredBy) return null;
  const partner = await findParnterShare({ id: user.id }, ['sharePercentage']);
  return partner?.sharePercentage ?? null;
};

exports.fetchAllPartner = async (req, res) => {
    try {
        let searchText = req.query.q
        let partnerName = 'partner'
        let data = await findAllByRoleName(searchText, partnerName)
        return res.status(200).json({
            status: true,
            data: {data},
            message: 'Successfully fetched all partners',
            responseCode: '000'
        })
    } catch (e) {
      console.error(e);
        return res.status(500).json({
            status: false,
            data: {},
            message: 'Internal Server Error',
            responseCode: '001'
        })
    }
}

exports.fetchAllSubPartner = async (req, res, next) => {
    try {
        const { partnerId } = req.query
        if(!partnerId){
          return next(new ErrorResponse("Partner ID is not provided", 400));
        }
        let data = await fetchAllSubPartnerList(partnerId)
        return res.status(200).json({
            status: true,
            data: {data},
            message: 'Successfully fetched all sub partners',
            responseCode: '000'
        })
    } catch (e) {
        console.error(e);
        return res.status(500).json({
            status: false,
            data: {},
            message: 'Internal Server Error',
            responseCode: '001'
        })
    }
}
exports.fetchAllSubPartner = async (req, res, next) => {
  try {
      const { partnerId } = req.query
      if(!partnerId){
        return next(new ErrorResponse("Partner ID is not provided", 400));
      }
      let data = await fetchAllSubPartnerList(partnerId)
      return res.status(200).json({
          status: true,
          data: {data},
          message: 'Successfully fetched all sub partners',
          responseCode: '500'
      })
  } catch (e) {
    console.error(e);
      return res.status(500).json({
          status: false,
          data: {},
          message: 'Internal Server Error',
          responseCode: '500'
      })
  }
}
exports.getDashboardDetails = asyncHandler( async(req, res) => {

  // Get current time in IST
  const currentTimeInIST = convertToIST(new Date());
  
  // Set start of day in IST
  const startOfDayInIST = new Date(currentTimeInIST);
  startOfDayInIST.setHours(0, 0, 0, 0);

  // Set start of the current month in IST
  const startOfMonthInIST = new Date(currentTimeInIST);
  startOfMonthInIST.setDate(1);
  startOfMonthInIST.setHours(0, 0, 0, 0);

  // Convert start of the day and current time to UTC for database queries
  const startOfDayInUTC = convertToUTC(startOfDayInIST);
  const currentTimeInUTC = convertToUTC(currentTimeInIST);

  const registeredBy = req.user.registeredBy;
  const subPartnerId = req.user.subPartnerId

  const corporatesUnderPartner = await findCorporateByPartner(registeredBy, subPartnerId);
  if (!corporatesUnderPartner) {
    return res.send({
      responseCode: '404',
      responseMessage: 'No Data Found'
    })
  }

  //partner share
  const partnerSharePercentage = await partnerShareOf(req.user);
  const corporateIds = corporatesUnderPartner.map((corporate) => corporate.id);
  const todayRange = { from: startOfDayInUTC.toISOString(), to: currentTimeInUTC.toISOString() };

  async.parallel({
    totalRevenue: function (callback) {
      sequelizeConfig.query(
        `SELECT sum(debitAmount) as totalRevenue 
            FROM reportAll  
            WHERE (status != 'REFUND' AND status != 'REFUNDED') 
            AND credentialId IN (${corporateIds});`, {
        type: sequelizeConfig.QueryTypes.SELECT
      }).then(function (revenueData) {
        callback(null, revenueData[0].totalRevenue)
      })
    },
    totalSubscriptionRevenue: function (callback) {
      sequelizeConfig.query(
        `SELECT sum(baseAmount) as totalRevenue FROM orders where optional in ('SUBSCRIPTION' , 'WHATSAPP-SUBSCRIPTION',
                  'SUBSCRIPTION-ADDONS','ACCOUNTING-SUBSCRIPTION') and (status != 'REFUND' && status != 'REFUNDED')
                  AND credentialId IN (${corporateIds});`, {
        type: sequelizeConfig.QueryTypes.SELECT
      }).then(function (revenueData) {
        callback(null, revenueData[0].totalRevenue)
      })
    },
    totalTransactions: function (callback) {
      sequelizeConfig.query(
        `SELECT count(*) as totalTransactions 
            FROM reportAll 
            WHERE (status != 'REFUND' AND status != 'REFUNDED') 
            AND credentialId IN (${corporateIds});`, {
        type: sequelizeConfig.QueryTypes.SELECT
      }).then(function (revenueData) {
        callback(null, revenueData[0].totalTransactions)
      })
    },
    totalSubscriptionTransactions: function (callback) {
      sequelizeConfig.query(
        `SELECT count(*) as totalTransactions FROM orders where optional in ('SUBSCRIPTION' , 'WHATSAPP-SUBSCRIPTION',
                  'SUBSCRIPTION-ADDONS','ACCOUNTING-SUBSCRIPTION') and (status != 'REFUND' && status != 'REFUNDED')
                  AND credentialId IN (${corporateIds});`, {
        type: sequelizeConfig.QueryTypes.SELECT
      }).then(function (revenueData) {
        callback(null, revenueData[0].totalTransactions)
      })
    },
    totalCorporateUsers: function (callback) {
      let whereClause = {
        role: 'CORPORATE',
        registeredBy: registeredBy,
      }

      if (subPartnerId) {
        whereClause.subPartnerId = subPartnerId;
      }
      credential.count({
        where: whereClause
      }).then(function (data) {
        callback(null, data)
      })
    },
    totalCashback: function (callback) {
      getCommissionTotal({ scope: { credentialIds: corporateIds } })
        .then(function (commission) {
          callback(null, commission)
        })
        .catch(callback)
    },
    activeUsers: function (callback) {
      let whereClause = {
        role: 'CORPORATE',
        lastLogin: {
          [Op.between]: [startOfMonthInIST, currentTimeInUTC]
        },
        registeredBy: registeredBy,
      }

      if (subPartnerId) {
        whereClause.subPartnerId = subPartnerId
      }
      credential.count({
        where: whereClause
      }).then(function (data) {
        callback(null, data)
      })
    },
    todaysRevenue: function (callback) {
      sequelizeConfig.query(
        `SELECT sum(debitAmount) as todaysRevenue 
                FROM reportAll 
                WHERE (status != 'REFUND' AND status != 'REFUNDED') 
                AND credentialId IN (${corporateIds}) AND transactionDate BETWEEN ? AND ?;`, {
        type: sequelizeConfig.QueryTypes.SELECT,
        replacements: [startOfDayInUTC.toISOString(), currentTimeInUTC.toISOString()]
      }).then(function (revenueData) {
        callback(null, revenueData[0].todaysRevenue)
      })
    },
    todaysSubscriptionRevenue: function (callback) {
      sequelizeConfig.query(
        `SELECT sum(baseAmount) as totalRevenue FROM orders where optional in ('SUBSCRIPTION' , 'WHATSAPP-SUBSCRIPTION',
                  'SUBSCRIPTION-ADDONS','ACCOUNTING-SUBSCRIPTION') and (status != 'REFUND' && status != 'REFUNDED')
                  AND credentialId IN (${corporateIds}) and createdAt BETWEEN ? AND ?;`, {
        type: sequelizeConfig.QueryTypes.SELECT,
        replacements: [startOfDayInUTC.toISOString(), currentTimeInUTC.toISOString()]
      }).then(function (revenueData) {
        callback(null, parseFloat(revenueData[0].totalRevenue) || 0)
      })
    },
    todaysCashback: function (callback) {
      getCommissionTotal({ range: todayRange, scope: { credentialIds: corporateIds } })
        .then(function (commission) {
          callback(null, commission)
        })
        .catch(callback)
    },
    todaysTransactions: function (callback) {
      sequelizeConfig.query(
        `SELECT count(*) as todaysTransactions 
            FROM reportAll 
            WHERE (status != 'REFUND' AND status != 'REFUNDED') 
            AND credentialId IN (${corporateIds}) AND transactionDate BETWEEN ? AND ?;`, {
        type: sequelizeConfig.QueryTypes.SELECT,
        replacements: [startOfDayInUTC.toISOString(), currentTimeInUTC.toISOString()]
      }).then(function (revenueData) {
        callback(null, revenueData[0].todaysTransactions)
      })
    },
    todaysSubscriptionTransactions: function (callback) {
      sequelizeConfig.query(
        `SELECT count(*) as totalTransactions FROM orders where optional in ('SUBSCRIPTION' , 'WHATSAPP-SUBSCRIPTION',
                  'SUBSCRIPTION-ADDONS','ACCOUNTING-SUBSCRIPTION') and (status != 'REFUND' && status != 'REFUNDED')
                  AND credentialId IN (${corporateIds}) and createdAt BETWEEN ? AND ?;`, {
        type: sequelizeConfig.QueryTypes.SELECT,
        replacements: [startOfDayInUTC.toISOString(), currentTimeInUTC.toISOString()]
      }).then(function (revenueData) {
        callback(null, revenueData[0].totalTransactions || 0)
      })
    },
    todaysCorporateUsers: function (callback) {
      let whereClause = {
        role: 'CORPORATE',
        createdAt: {
          $between: [startOfDayInUTC.toISOString(), currentTimeInUTC.toISOString()]
        },
        registeredBy: registeredBy
      }

      if (subPartnerId) {
        whereClause.subPartnerId = subPartnerId
      }
      credential.count({
        where: whereClause
      }).then(function (data) {
        callback(null, data)
      })
    },
    todaysActiveUsers: function (callback) {
      let whereClause = {
        role: 'CORPORATE',
        lastLogin: {
          [Op.between]: [startOfDayInUTC, currentTimeInUTC]
        },
        registeredBy: registeredBy
      }

      if (subPartnerId) {
        whereClause.subPartnerId = subPartnerId
      }
      credential.count({
        where: whereClause
      }).then(function (data) {
        callback(null, data)
      })
    }
  },

    function (err, result) {
      if (err) {
        return res.send({
          responseCode: "001",
          responseMessage: "Something went wrong",
          data: {}
        })
      }
      return res.send({
        responseCode: '000',
        responseMessage: 'Success',
        data: {
          totalRevenue: parseFloat(result.totalRevenue) + parseFloat(result.totalSubscriptionRevenue),
          totalTransactions: result.totalTransactions + result.totalSubscriptionTransactions,
          totalCashback: result.totalCashback,
          totalNetworkShare: networkShareOf(result.totalCashback, partnerSharePercentage),
          todaysRevenue: result.todaysRevenue + result.todaysSubscriptionRevenue,
          todaysCashback: result.todaysCashback,
          todaysTransactions: result.todaysTransactions + result.todaysSubscriptionTransactions,
          todaysNetworkShare: networkShareOf(result.todaysCashback, partnerSharePercentage),
          totalCorporateUsers: result.totalCorporateUsers,
          activeUsers: result.activeUsers,
          todaysCorporateUsers: result.todaysCorporateUsers,
          todaysActiveUsers: result.todaysActiveUsers,
        },
      })
    })
})

exports.getDashboardStatisticsData = asyncHandler(async (req, res) => {
  let { month, year } = req.query
  const fromDate = moment().subtract(30, "day").format("YYYY-MM-DD") + " 23" + ":59" + ":59";
  const toDate = moment().format('YYYY-MM-DD') + ' 23' + ':59' + ':59';
  const daysRange = Array.from({ length: 31 }, (_, index) =>
    moment().subtract(index, 'days')._d.toDateString()
  ).reverse();

  function diff(A, B) {
    return A.filter(function (a) {
      return B.indexOf(a) == -1;
    });
  }
  const registeredBy = req.user.registeredBy;
  const subPartnerId = req.user.subPartnerId

  let element = [];
  const startDate = moment([year, month - 1]).startOf('month');
  const endDate = moment([year, month - 1]).endOf('month');

  for (let m = moment(startDate); m.isSameOrBefore(endDate); m.add(1, 'days')) {
    element.push(m.toDate().toDateString());
  }

  const corporatesUnderPartner = await findCorporateByPartner(registeredBy, subPartnerId);
  if (!corporatesUnderPartner) {
    return res.send({
      responseCode: '404',
      responseMessage: 'No Data Found'
    })
  }
  const corporateIds = corporatesUnderPartner.map((corporate) => corporate.id);
  const partnerSharePercentage = await partnerShareOf(req.user);
  const partnerScope = { registeredBy: registeredBy ?? null, subPartnerId: subPartnerId ?? null };
  async.parallel({
    // allTransactions: function (callback) {
    //     sequelizeConfig.query(
    //         `SELECT count(id) as count, sum(debitAmount) as revenue, sum(totalCashback) as cashback, Date(transactionDate) as Date, sum(systemCashback) as networkShare
    //         FROM transactions  
    //         WHERE (status != "REFUND" AND status != "REFUNDED") AND transactionDate BETWEEN :fromDate AND :toDate  
    //         AND credentialId IN (:corporateIds)
    //         GROUP BY Date(transactionDate);`, {
    //         replacements: {fromDate: fromDate, toDate: toDate, corporateIds: corporateIds},
    //         type: sequelizeConfig.QueryTypes.SELECT
    //       })
    //     .then(function (data) {
    //         const result = getAllDatesInMonth(year, month, ["count", "revenue", "cashback", "networkShare"]); 
    //         data.forEach( (doc) => {
    //             const date = new Date(doc.Date).getDate();
    //             result[date - 1] = {
    //                 ...doc,
    //                 Date: result[date - 1].Date
    //             }
    //         })
    //         callback(null, result);
    //     })
    // },
    allCorporates: function (callback) {
      sequelizeConfig.query(
        `SELECT COUNT(id) as count, Date(createdAt) as Date 
                FROM credentials  
                WHERE role = "CORPORATE" AND ${registeredBy === null ? "registeredBy IS NULL" : "registeredBy = :registeredBy"} AND ${subPartnerId === null ? "subPartnerId IS NULL" : "subPartnerId = :subPartnerId"}
                AND createdAt BETWEEN :fromDate AND :toDate  
                GROUP BY Date(createdAt) ORDER BY DATE(createdAt) DESC;`, {
        replacements: { registeredBy: registeredBy, fromDate: fromDate, toDate: toDate, subPartnerId: subPartnerId },
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
      }).catch(function (error) {
        callback(error);
      })
    },
    monthlyStatistics: function (callback) {
      Promise.all([
        sequelizeConfig.query(
          `SELECT count(*) as count, sum(debitAmount) as revenue, Date(transactionDate) as Date FROM reportAll  WHERE ${PARTNER_CORPORATES} AND (status != "REFUND" AND status != "REFUNDED") AND transactionDate BETWEEN :fromDate AND :toDate  GROUP BY Date(transactionDate) ORDER BY Date(transactionDate) ASC;`, {
          replacements: { ...partnerScope, fromDate: fromDate, toDate: toDate },
          type: sequelizeConfig.QueryTypes.SELECT
        }),
        getCommissionByDay({ range: { from: fromDate, to: toDate }, scope: { partner: partnerScope } })
      ]).then(function ([transactionDetails, commissionByDay]) {
        var transData = transactionDetails.map(item => {
          const commission = commissionByDay[dayKey(item.Date)] || 0;
          return {
            date: new Date(`${item.Date} 00:00:00`).toDateString(),
            count: item.count,
            revenue: item.revenue,
            cashback: commission,
            partnerShares: networkShareOf(commission, partnerSharePercentage)
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
            cashback: 0,
            partnerShares: 0
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
        var partnerSharesData = transData.map(item => {
          return item.partnerShares;
        });
        let finalBarArray = {
          transactions: transactionData,
          revenue: revenueData,
          cashback: cashbackData,
          partnerShares: partnerSharesData,
          labelDate: label
        };
        callback(null, finalBarArray);
      }).catch(function (error) {
        callback(error);
      })
    },
    monthlySubscriptionStatistics: function (callback) {
      sequelizeConfig.query(
        'SELECT count(*) as count, sum(baseAmount) as revenue, sum(0) as cashback, Date(transactionDate) as Date,MAX(transactionDate) AS latestCreatedAt FROM orders where optional in ("SUBSCRIPTION" ,"WHATSAPP-SUBSCRIPTION","SUBSCRIPTION-ADDONS","ACCOUNTING-SUBSCRIPTION") and (status != "REFUND" && status != "REFUNDED") and transactionDate BETWEEN ? AND ? AND credentialId IN (?) GROUP BY Date(transactionDate) order by latestCreatedAt;', {
        replacements: [fromDate, toDate, corporateIds],
        type: sequelizeConfig.QueryTypes.SELECT
      }).then(function (transactionDetails) {
        var transData = transactionDetails.map(item => {
          return {
            date: new Date(`${item.Date} 00:00:00`).toDateString(),
            count: item.count,
            revenue: item.revenue,
            cashback: item.cashback,
            partnerShares: item.partnerShares
          };
        });

        var gotDate = transData.map(data => {
          return new Date(data.date).toDateString();
        });

        var missed = diff(element, gotDate);
        var indexes = missed.map(missedDay => {
          return element.indexOf(missedDay);
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
        var partnerSharesData = transData.map(item => {
          return item.partnerShares;
        });
        let finalBarArray = {
          transactions: transactionData,
          revenue: revenueData,
          cashback: cashbackData,
          partnerShares: partnerSharesData,
          labelDate: label
        };
        callback(null, finalBarArray);
      }).catch(function (error) {
        callback(error);
      })
    },
  },

    function (err, result) {
      if (err) {
        return res.send({
          responseCode: "001",
          responseMessage: "Something went wrong",
          data: {}
        })
      }

      const monthlyCorporatesTransformed = result.allCorporates.labelDate.map((date, index) => {
        return {
          Date: date,
          count: result.allCorporates.corporates[index]
        };
      }).reverse();

      const toAmount = (value) => {
        const parsed = parseFloat(value);
        return Number.isFinite(parsed) ? parseFloat(parsed.toFixed(2)) : 0;
      };

      const monthlyStatisticsTransformed = result.monthlyStatistics.labelDate.map((date, index) => {
        return {
          name: date,
          transactions: toAmount(result.monthlyStatistics.transactions[index]) + toAmount(result.monthlySubscriptionStatistics.transactions[index]),
          revenue: toAmount(result.monthlyStatistics.revenue[index]) + toAmount(result.monthlySubscriptionStatistics.revenue[index]),
          cashback: toAmount(result.monthlyStatistics.cashback[index]) + toAmount(result.monthlySubscriptionStatistics.cashback[index]),
          partnerShares: toAmount(result.monthlyStatistics.partnerShares[index]),
        };
      }).reverse();
      // sort descending by date (latest first)
      // const sortedMonthlyStatisticsTransformed = monthlyStatisticsTransformed.sort(
      //   (a, b) => {
      //     // Append the year so we can correctly parse the date
      //     const dateA = moment(`${a.name} ${year}`, "ddd MMM DD YYYY");
      //     const dateB = moment(`${b.name} ${year}`, "ddd MMM DD YYYY");
      //     return dateB - dateA;
      //   }
      // );
      delete result.monthlySubscriptionStatistics
      return res.send({
        responseCode: '000',
        responseMessage: 'Success',
        data: { ...result, allCorporates: monthlyCorporatesTransformed, monthlyStatistics: monthlyStatisticsTransformed }
      })
    })
})

// function getAllDatesInMonth(year, month, properties) {
//     const dates = [];
//     const date = new Date(year, month - 1, 1);

//     while (date.getMonth() === month - 1) {
//         const obj = {
//             Date: new Date(date).toDateString().slice(0, 10)
//         }
//         properties.map( (property) => {
//             obj[property] = 0;
//         })
//         dates.push(obj);
//         date.setDate(date.getDate() + 1);
//     }

//     return dates;
// }

exports.getCloneFromPartnerDetails = async (req, res) => {
  try {
    let data = await findClonePartnerFrom()
    return res.status(200).json({
      status: true,
      data: { data },
      message: 'Successfully fetched partners from',
      responseCode: '000'
    })
  } catch (e) {
    console.error(e);
    return res.status(500).json({
      status: false,
      data: {},
      message: 'Internal Server Error',
      responseCode: '001'
    })
  }
}

exports.getCloneToPartnerDetails = async (req, res) => {
  try {
    let data = await findClonePartnerTo()
    return res.status(200).json({
      status: true,
      data: { data },
      message: 'Successfully fetched partners to',
      responseCode: '000'
    })
  } catch (e) {
    console.error(e);
    return res.status(500).json({
      status: false,
      data: {},
      message: 'Internal Server Error',
      responseCode: '001'
    })
  }
}

exports.createClonePartner = async (req, res) => {
  try {
    const newPartnerId = req.body.newPartnerId
    const partnerId = req.body.partnerId
    const packageIds = req.body.packageIds
    const cashbackIds = req.body.cashbackIds
    const data = {
      // partnerId:req.body.partnerId,
      type: 1
    }
    let bulkPackagesdata = await findAllPartnerPackage(data, packageIds)
    let partnerPermissions = await findPartnerPermissions(partnerId)
    if (partnerPermissions.length > 0) {
      return res.status(500).json({
        status: false,
        data: {},
        message: 'PartnerId not available',
        responseCode: '001'
      })
    }
    let alreadypartnerPermissions = await findPartnerPermissions(partnerId)
    if (!alreadypartnerPermissions) {
      return res.status(500).json({
        status: false,
        data: {},
        message: 'Partner Permission does not exists',
        responseCode: '001'
      })
    }

    partnerPermissions = partnerPermissions.permissions
    let bulkCashBackdata = await createCloneNewPartner({ bulkPackagesdata, newPartnerId, partnerPermissions, cashbackIds, packageIds })
    return res.status(200).json({
      status: true,
      bulkCashBackdata: bulkCashBackdata,
      message: 'Clone partner added successfully',
      responseCode: '000'
    })
  } catch (e) {
    console.error(e);
    return res.status(500).json({
      status: false,
      data: {},
      message: 'Internal Server Error',
      responseCode: '001'
    })
  }
}

exports.getPackagesCashback = async (req, res) => {
  try {
    let { partnerId } = req.query
    if (partnerId === "default") {
      partnerId = null;
    } 
    let data = await findPackagesCashback(partnerId)
    return res.status(200).json({
      status: true,
      data: { data },
      message: 'Successfully fetched packages and cashback',
      responseCode: '000'
    })
  } catch (e) {
    console.error(e);
    return res.status(500).json({
      status: false,
      data: {},
      message: 'Internal Server Error',
      responseCode: '001'
    })
  }
}