const corporateUser = require('./../entities/corporateUser')
const asyncHandler = require('./../../middlewares/async')
const { authenticator } = require('otplib')

// Verify TOTP token
exports.authVerification = asyncHandler(async (userId, token) => {
     const user = await corporateUser.findOne({
          where: {
               credentialId: userId,
          },
     })
     const totpSecret = user.totpSecret
     if (!user) {
          return false
     } else if (!totpSecret) {
          return false
     } else {
          const valid = authenticator.check(token, totpSecret)
          if (valid) {
               return {
                    valid: true,
               }
          } else {
               return false
          }
     }
})
