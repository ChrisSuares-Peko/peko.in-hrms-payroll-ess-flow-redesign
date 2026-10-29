const { findAllNamesOnly } = require('../../models/use-cases/mobileRechargeProvider')
const asyncHandler = require('../../middlewares/async')
const ErrorResponse = require('../../utils/error-response')

// Name+id lookup for the corp Mobile Prepaid form's provider dropdown. Global admin-managed list
// (not scoped per corporate). Commission fields are admin-only and are never included in this
// response. Only active (status: true) providers are returned — see findAllNamesOnly. Ids are
// stringified (BIGINT-safe over JSON).
exports.listMobileRechargeProviders = asyncHandler(async (req, res, next) => {
     const rows = await findAllNamesOnly()
     if (!rows) {
          return next(new ErrorResponse(`Something went wrong while fetching mobile recharge providers`, 200))
     } else {
          const data = rows.map((row) => ({ id: String(row.id), providerName: row.providerName, displayName: row.displayName }))
          return res.status(200).json({
               status: true,
               data,
               message: 'Mobile recharge providers fetched successfully',
               responseCode: '000',
          })
     }
})
