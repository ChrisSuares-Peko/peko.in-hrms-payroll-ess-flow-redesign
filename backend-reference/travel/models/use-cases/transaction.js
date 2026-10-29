const transaction = require('../entities/transaction')
const orders = require('../entities/order')
const serviceOperator = require('../entities/serviceOperator')
const credential = require('../entities/credential')
const sequelize = require('sequelize')

const { Op } = require('sequelize')
const asyncHandler = require('../../middlewares/async')

const findOneTransaction = async ({corporateTxnId}) => {
     try {
          return await transaction.findOne({
               where: {
                    corporateTxnId: corporateTxnId,
               },
               include: [
                    {
                         model: credential,
                         required: false,
                    },
                    {
                         model: orders,
                         required: false,
                    },
               ],
          })
     } catch (error) {
          console.log(error)
     } finally {
          console.log('TRANSACTION FIND ONE ROUTE CALLED')
     }
}

const findAllTransactionsAndCounts = asyncHandler(async (params) => {
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
     } = params

     let whereClause = {
          [Op.or]: [
               {
                    id: {
                         [Op.like]: '%' + searchText + '%',
                    },
               },
               {
                    corporateTxnId: {
                         [Op.like]: '%' + searchText + '%',
                    },
               },
               {
                    debitAmount: {
                         [Op.like]: '%' + searchText + '%',
                    },
               },
               {
                    creditAmount: {
                         [Op.like]: '%' + searchText + '%',
                    },
               },
               {
                    corporateCashback: {
                         [Op.like]: '%' + searchText + '%',
                    },
               },
               {
                    systemCashback: {
                         [Op.like]: '%' + searchText + '%',
                    },
               },
               {
                    balance: {
                         [Op.like]: '%' + searchText + '%',
                    },
               },
               {
                    remarks: {
                         [Op.like]: '%' + searchText + '%',
                    },
               },
               {
                    '$serviceOperator.serviceProvider$': {
                         [Op.like]: '%' + searchText + '%',
                    },
               },
               {
                    transactionCategory: {
                         [Op.like]: '%' + searchText + '%',
                    },
               },
               {
                    '$order.paymentMode$': {
                         [Op.like]: '%' + searchText + '%',
                    },
               },
               {
                    '$order.status$': {
                         [Op.like]: '%' + searchText + '%',
                    },
               },
               {
                    '$credential.name$': {
                         [Op.like]: '%' + searchText + '%',
                    },
               },
          ],
     }
     if (from && to) {
          whereClause.transactionDate = {
               [Op.between]: [from, to],
          }
     }
     if (corporateId) {
          whereClause.credentialId = corporateId
     }

     let includeOptions = [
          {
               model: serviceOperator,
               where: {
                    serviceCategory: categoryName,
               },
               attributes: serviceAttribute,
          },
          {
               model: credential,
               attributes: credentialAttribute,
          },
          {
               model: orders,
               where: {
                    status: filter,
                    orderResponse: {
                         [sequelize.Op.ne]: null, // Using Sequelize's not equal operator
                    },
               },
               attributes: orderAttribute,
          },
     ]
     let sortClause

     if (sort) {
          sortClause = [sortField, sort]
     } else {
          sortClause = [sortField, 'ASC']
     }

     if (filter) {
          includeOptions[2].where.status = filter
     } else {
          delete includeOptions[2].where.status
     }

     if (categoryName && categoryName != 'all') {
          includeOptions[0].where.serviceCategory = categoryName
     } else {
          delete includeOptions[0].where.serviceCategory
     }

     return await transaction.findAndCountAll({
          include: includeOptions,
          where: whereClause,
          order: [sortClause],
          limit: limit,
          offset: offset,
          attributes: transactionAttribute,
          raw: true,
          nest: true,
     })
})

module.exports = {
     findOneTransaction,
     findAllTransactionsAndCounts,
}
