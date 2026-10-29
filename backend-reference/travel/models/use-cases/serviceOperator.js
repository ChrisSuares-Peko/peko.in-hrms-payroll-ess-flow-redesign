const serviceOperator = require('../entities/serviceOperator')
const vendors = require('../entities/vendor')
const asyncHandler = require('../../middlewares/async')

exports.findOne = asyncHandler(async (params) => {
     let whereClause = {
          accessKey: params.accessKey,
     }
     if (params.serviceType) whereClause['serviceType'] = params.serviceType
     return await serviceOperator.findOne({
          include: [
               {
                    model: vendors,
                    attributes: ['apiUrl','healthUrl', 'optional1', 'optional2', 'optional3', 'optional4', 'optional5','optional6','optionals','vendorName','vendorEmail','state','gstNo','address'],
               },
          ],
          where: whereClause,
          raw: true,
          nest: true,
     })
})

exports.findOneServiceOperator = async (params) => {
  try {
    return await serviceOperator.findOne({
      where: {
        id: params.serviceOperatorId,
      },
    })
  } catch (error) {
    console.log(error)
  } finally {
    console.log('SERVICE OPERATOR FIND ONE ROUTE CALLED')
  }
}

