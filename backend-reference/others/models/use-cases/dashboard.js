/* eslint-disable no-unused-vars */
const transaction = require('./../entities/transaction')
const orders = require('./../entities/order')
const serviceOperator = require('./../entities/serviceOperator')
const { Op } = require('sequelize')
const asyncHandler = require('./../../middlewares/async')
let sequelizeConfig = require('../../configs/database/index')
const moment = require('moment')
const transactions = require('./../entities/transaction')
const corporateUser = require('../entities/corporateUser')

const findAllTransactions = asyncHandler(async (params) => {
     const { corporateId } = params;

     return await transaction.findAll({
          where: {
               credentialId: corporateId,
               status: 'SUCCESS',
               remarks: {
                    [Op.notIn]: ["REFUND", "REFUNDED"],
               },
          },
          include: [
               {
                    model: orders,
                    attributes: [
                         'paymentMode',
                         'transactionDate',
                         'amountInINR',
                         'status',
                         'baseAmount',
                         'optional',
                         'orderResponse',
                    ],
               },
               {
                    model: serviceOperator,
                    attributes: ['serviceProvider', 'id', 'serviceCategory'],
               },
          ],
          order: [[orders, 'transactionDate', 'DESC']],
     });
})

const getSpendingAlert = asyncHandler(async (credentialId) => {
     let { revenue } = await getRevenue(credentialId)
     // Convert revenue to numbers and exclude months with 0 spending
     const revenueNumbers = revenue.map((value) => parseFloat(value)).filter((value) => value > 0)

     let currentMonthSpending = revenueNumbers.pop()

     // Calculate the total spending for the last 12 months
     const totalSpending = revenueNumbers.reduce((acc, val) => acc + val, 0)

     // Calculate the average monthly spending
     const averageMonthlySpending = totalSpending / revenueNumbers.length

     // Calculate the spending for the current month
     // const currentMonthSpending = parseFloat(revenue[revenue.length - 1]);

     // Calculate the difference between current month spending and average monthly spending
     const difference = currentMonthSpending - averageMonthlySpending

     // Check if the difference is greater than 25% of the average monthly spending
     if (difference > 0.25 * averageMonthlySpending) {
          const percentageMore = ((difference / averageMonthlySpending) * 100).toFixed(2)

          return parseInt(percentageMore)
     } else {
          return false
     }
})

async function getRevenue(credentialId) {
     function diff(A, B) {
          return A.filter(function (a) {
               return B.indexOf(a) == -1
          })
     }
     var element2 = []
     for (let index = 0; index < 12; index++) {
          element2.push(moment().subtract(index, 'months').startOf('month').format('MMM YYYY'))
     }
     element2 = element2.reverse()

     let to = moment().format('YYYY-MM-DD') + ' 23:59:59'
     let currentDate = moment()
     let fromThirteenMonthsAgo = currentDate.clone().subtract(13, 'months').startOf('month').format('YYYY-MM-DD') + ' 00:00:00'

     let transactionDetails = await sequelizeConfig.query(
          'SELECT count(id) as count, sum(debitAmount) as revenue, sum(corporateCashback) as cashback, Date(transactionDate) as Date FROM transactions WHERE credentialId = ? AND status = "SUCCESS" AND transactions.transactionDate BETWEEN ? AND ? GROUP BY Date(transactionDate);',
          {
               replacements: [credentialId, fromThirteenMonthsAgo, to],
               type: sequelizeConfig.QueryTypes.SELECT,
          }
     )
     var transData = transactionDetails.map((item) => {
          return {
               date: moment(item.Date).format('MMM YYYY'),
               count: item.count,
               revenue: item.revenue,
               cashback: item.cashback,
          }
     })

     //to group by month
     transData = transData.reduce((result, item) => {
          var existingMonth = result.find((entry) => entry.date === item.date)

          if (existingMonth) {
               // If the month already exists in the result array, update the values
               existingMonth.count += item.count
               existingMonth.revenue = (parseFloat(existingMonth.revenue) + parseFloat(item.revenue)).toFixed(4)
               existingMonth.cashback = (parseFloat(existingMonth.cashback) + parseFloat(item.cashback)).toFixed(4)
          } else {
               // If the month doesn't exist in the result array, add it
               result.push({
                    date: item.date,
                    count: item.count,
                    revenue: item.revenue,
                    cashback: item.cashback,
               })
          }
          return result
     }, [])

     var gotDate = transData.map((data) => {
          return data.date
     })

     var missed = diff(element2, gotDate)

     var indexes = missed.map((missedDay) => {
          return element2.indexOf(missedDay)
     })
     for (let index = 0; index < missed.length; index++) {
          transData.splice(indexes[index], 0, {
               date: missed[index],
               count: 0,
               revenue: 0,
               cashback: 0,
          })
     }

     var label = transData.map((item) => {
          return item.date.slice(0, 10)
     })

     var transactionData = transData.map((item) => {
          return item.count
     })
     var revenueData = transData.map((item) => {
          return item.revenue
     })
     var cashbackData = transData.map((item) => {
          return item.cashback
     })
     let finalBarArray = {
          revenue: revenueData,
          labelDate: label,
     }

     return finalBarArray
}

const findMonthlyCashback = asyncHandler(async (credentialId) => {
     const today = new Date()
     const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1)
     const lastDayOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0)

     let lastMonthCashback = await transactions.sum('corporateCashback', {
          where: {
               credentialId: credentialId,
               transactionDate: {
                    [Op.between]: [lastMonth, lastDayOfLastMonth],
               },
               status: 'SUCCESS',
          },
     })

     return parseInt(lastMonthCashback)
})

const getBillPaymentAlert = asyncHandler(async (params) => {
     let transactions = await transaction.findAll({
          where: {
               status: 'SUCCESS',
               [Op.or]: [{ transactionCategory: 'Telecom Payments' }, { transactionCategory: 'Utility Payments' }],
               credentialId: params,
               debitAmount: {
                    [Op.gt]: 0, // Only select transactions where 'debitAmount' is greater than 0
               },
          },
          include: [
               {
                    model: orders,
                    attributes: ['accountNo'],
               },
               {
                    model: serviceOperator,
                    attributes: ['serviceProvider', 'serviceImage'],
               },
          ],
     })

     const pendingBill = getPendingBills(transactions)

     return [...pendingBill]
})

function getPendingBills(transactions) {
     const currentDate = new Date() // Get the current date
     const twentyFiveDaysAgo = new Date(currentDate)
     twentyFiveDaysAgo.setDate(currentDate.getDate() - 25)
     const sixtyDaysAgo = new Date(currentDate)
     sixtyDaysAgo.setDate(currentDate.getDate() - 60)
     // Sort transactions by transactionDate in descending order
     transactions.sort((a, b) => new Date(b.transactionDate) - new Date(a.transactionDate))
     const uniqueTransactions = new Map() // Map to store unique transactions
     for (const transaction of transactions) {
          const transactionDate = new Date(transaction.transactionDate)
          // Check if the transaction falls within the date range and has the specified category
          if (
               transactionDate >= sixtyDaysAgo &&
               transactionDate <= twentyFiveDaysAgo &&
               (transaction.transactionCategory === 'Utility Payments' || transaction.transactionCategory === 'Telecom Payments')
               
          ) {
               // Create a unique key for the transaction
               const key = `${transaction.transactionCategory}_${transaction.order.accountNo}`

               // Check if we have already seen a transaction with the same key
               if (!uniqueTransactions.has(key)) {
                    // If not, add it to the uniqueTransactions map
                    uniqueTransactions.set(key, transaction)
               }
          }
     }
     // Convert the unique transactions map values back to an array
     const uniqueTransactionsArray = [...uniqueTransactions.values()]

     ///~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
     let newTrans = transactions.filter((transaction) => {
          const transactionDate = new Date(transaction.transactionDate)
          return (
               transactionDate > twentyFiveDaysAgo &&
               (transaction.transactionCategory === 'Utility Payments' || transaction.transactionCategory === 'Telecom Payments') &&
               transaction.serviceOperator.serviceProvider !== 'Etisalat Prepaid' &&
               transaction.serviceOperator.serviceProvider !== 'DU Prepaid'
          )
     })

     let pendingBills = new Set()

     for (const item of uniqueTransactionsArray) {
          let foundMatch = false
          for (const item2 of newTrans) {
               if (item.order.accountNo === item2.order.accountNo && item.serviceOperator.serviceProvider === item2.serviceOperator.serviceProvider) {
                    foundMatch = true
                    break
               }
          }
          if (!foundMatch) {
               pendingBills.add(item)
          }
     }

     return pendingBills
}

// simplified version of calculate total month spend
const getMonthlySpendingAlert = asyncHandler(async (credentialId) => {
    
     const userData = await corporateUser.findOne({
         where: {
             credentialId: credentialId
         },
         attributes: ['createdAt']
     })
 
     const userJoinedDate = new Date(userData.createdAt);
     const currentDate = new Date();
 
     // Calculate the start date for the past 12 months excluding the current month
     let startDate = new Date(currentDate);
     startDate.setMonth(currentDate.getMonth() - 12);
 
     // Adjust startDate if user joined after the calculated startDate
     if (userJoinedDate > startDate) {
         startDate = new Date(userJoinedDate);
     }
     startDate.setDate(1); // Set to the first day of the joining month
 
     // Calculate the end date as the last day of the previous month
     let endDate = new Date(currentDate);
     endDate.setDate(1); // Set to the first day of the current month
     endDate.setDate(0); // Move back one day to get the last day of the previous month
 
     // Format dates for the query
     const fromDate = startDate.toISOString().split('T')[0];
     const toDate = endDate.toISOString().split('T')[0];
 
     // Fetch transactions
     let transactionDetails = await sequelizeConfig.query(
         `SELECT sum(o.amountInINR) as revenue,
          Date(t.transactionDate) as Date
          FROM transactions t
          INNER JOIN orders o ON t.orderId = o.id
          WHERE t.credentialId = ?
              AND t.status = "SUCCESS"
              AND t.transactionDate BETWEEN ? AND ?
              AND t.debitAmount >= 0
              AND t.orderId IS NOT NULL
          GROUP BY Date(t.transactionDate);`,
         {
             replacements: [credentialId, fromDate, toDate],
             type: sequelizeConfig.QueryTypes.SELECT
         }
     );
 
     // Calculate the total spend and the number of months excluding the current month
     let totalSpend = 0;
     let monthsCount = 0;
 
     transactionDetails.forEach((transaction) => {
         totalSpend += parseFloat(transaction.revenue);
         monthsCount++;
     });
 
     const averageMonthlySpend = totalSpend / monthsCount;
 
     // Calculate the current month's spend
     let currentMonthStart = new Date(currentDate);
     currentMonthStart.setDate(1); // Set to the first day of the current month
 
     let currentMonthSpend = await sequelizeConfig.query(
         `SELECT sum(o.amountInINR) as revenue 
         FROM transactions t 
         INNER JOIN orders o ON t.orderId = o.id
         WHERE t.credentialId = ? 
             AND t.status = "SUCCESS" 
             AND t.transactionDate BETWEEN ? AND ? 
             AND t.debitAmount >= 0  
             AND t.orderId IS NOT NULL;`,
         {
             replacements: [credentialId, currentMonthStart.toISOString().split('T')[0], currentDate.toISOString().split('T')[0]],
             type: sequelizeConfig.QueryTypes.SELECT
         }
     );
 
     const currentMonthRevenue = parseFloat(currentMonthSpend[0].revenue || 0);
     const spendingDifference = currentMonthRevenue - averageMonthlySpend;
     const spendingPercentageChange = (spendingDifference / averageMonthlySpend) * 100;
    
     if (Math.abs(spendingPercentageChange) > 25) {
         return parseInt(spendingPercentageChange)
     } else {
         // Return false if the difference is not greater than 25%
         return false;
     }
 });

module.exports = {
     findAllTransactions,
     getSpendingAlert,
     findMonthlyCashback,
     getBillPaymentAlert,
     getMonthlySpendingAlert
}
