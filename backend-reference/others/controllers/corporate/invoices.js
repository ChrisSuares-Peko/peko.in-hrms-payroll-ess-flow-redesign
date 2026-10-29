/* eslint-disable no-unused-vars */

const { findAllBankAccount } = require('../../models/use-cases/bankDetails')
const asyncHandler = require('../../middlewares/async')

exports.findAllBankAccount = asyncHandler(async (req, res, next) => {
     const corporateId = req.user.id;

     const result = await findAllBankAccount({ corporateId });

     if (!result || result.length === 0) {
          const bankDetails = [
               {
                    accountHolderName: 'Not available',
                    accountNumber: 'Not available',
                    iban: 'Not available',
                    bankName: 'Not available',
               },
          ]
          return res.status(200).json({
               status: true,
               data: { bankDetails },
               message: 'Fetched all bank accounts details successfully',
               responseCode: '000',
          })
     }

     return res.status(200).json({
          status: true,
          data: { bankDetails: result },
          message: 'Fetched all bank accounts details successfully',
          responseCode: '000',
     })
})
