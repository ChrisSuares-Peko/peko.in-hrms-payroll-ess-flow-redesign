/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */

const { findAllTransactionsAndCounts } = require('../../models/use-cases/transaction')

const asyncHandler = require('../../middlewares/async')
const ErrorResponse = require('../../utils/error-response')

exports.findAllTransactionsAndCount = asyncHandler(async (req, res, next) => {
     let { from, to, searchText, page, itemsPerPage } = req.query
     let corporateId = req.user.id

     const sort = req.query.sort && req.query.sort === 'DESC' ? 'DESC' : 'ASC'
     const filter = req.query.filter || undefined

     // Parse page and itemsPerPage to integers (you can also use parseInt)
     page = page ? parseInt(page) : 1
     itemsPerPage = itemsPerPage ? parseInt(itemsPerPage) : null
     let limit = itemsPerPage

     // Calculate offset based on page and itemsPerPage
     let offset
     if (page && itemsPerPage) {
          offset = (page - 1) * itemsPerPage
     }

     let categoryName = 'Shipment Services'
     let sortField = 'transactionDate'

     let serviceAttribute = []
     let credentialAttribute = []
     let transactionAttribute = []
     let orderAttribute = ['id', 'status', 'orderResponse', 'transactionDate', 'corporateTxnId', 'shipmentStatus', 'providerId']

     let params = {
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
     }

     const transactionsData = await findAllTransactionsAndCounts(params)
     if (!transactionsData) {
          return next(new ErrorResponse(`Something went wrong while getting all corporate from DB`, 500))
     } else {
          return res.status(200).json({
               status: true,
               data: {
                    result: transactionsData.rows,
                    totalData: transactionsData.count,
               },
               message: 'fetched transactions successfully!!',
               responseCode: '000',
          })
     }
})
