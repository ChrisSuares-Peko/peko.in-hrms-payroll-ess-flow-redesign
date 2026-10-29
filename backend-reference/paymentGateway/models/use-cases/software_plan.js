const software_plans = require("../entities/software_plans");
const softwares = require("../entities/softwares");
const vendor = require("../entities/vendor");
const asyncHandler = require("../../middlewares/async");


exports.findOnePlan = asyncHandler(async (params,planAttributes = undefined, productAttributes = undefined) => {
  return await software_plans.findOne({
      where: {
          id: params.id
      },
      attributes:planAttributes,
      include: [
          {
              model: softwares, 
              attributes:productAttributes,
              include: [
                {
                    model: vendor, 
                    attributes:['vendorEmail','vendorName','optional1','apiUrl','optional2']
                },
              ]
          },
      ],
      raw: true,
      nest: true,
  })

})