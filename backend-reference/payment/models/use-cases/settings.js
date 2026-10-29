const asyncHandler = require("../../middlewares/async");
const setting = require("../entities/setting");


exports.getGstDetails = asyncHandler(async () => {
  return await setting.findOne({
    where: {name: "taxRate"},
  });
});

exports.getBotBuilderValues = asyncHandler(async () => {
  return await setting.findOne({
    where: {name: "flowBuilder"},
  });
});

exports.getPGChargeDetails = asyncHandler(async (dynamicId) => {
  const pgCharges = await setting.findOne({
    where: {name: "PG_Charges"},
  });
  let chargesData={}
  if(pgCharges?.details?.length){
    chargesData = pgCharges.details.find(option => option?.key == dynamicId);
  }
  return chargesData || {}
});

exports.findByName = asyncHandler(async (params) => {
  return await setting.findOne({
      where: {
          name: params.name
      }
  })
})

exports.findByEmail = asyncHandler(async (params) => {
  return await setting.findOne({
      where: {
          name: params.name
      }
  })
})

exports.create = asyncHandler(async (data) => {
  return await setting.create(data);
})

exports.update = asyncHandler(async (params, data) => {
  const [updatedRows] = await setting.update(data, {
    where: {
      name: params.name
    }
  });
  if (updatedRows === 0) {
    return null;
  }
  return await setting.findOne({
    where: {
      name: params.name
    }
  });
})

exports.createOrUpdate = asyncHandler(async (params, data) => {
  const existing = await setting.findOne({
    where: {
      name: params.name
    }
  });
  
  if (existing) {
    await setting.update(data, {
      where: {
        name: params.name
      }
    });
    return await setting.findOne({
      where: {
        name: params.name
      }
    });
  } else {
    return await setting.create({
      name: params.name,
      ...data
    });
  }
})
