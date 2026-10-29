const { Op, Sequelize } = require("sequelize");
const asyncHandler = require("../../middlewares/async");
const setting = require("../entities/setting");

exports.getGstDetails = asyncHandler(async () => {
  return await setting.findOne({
    where: {name: "taxRate"},
  });
});

// An internal account is one of the credential ids on the Internal Accounts list. Anything unreadable counts as not internal.
exports.isInternalAccount = async (credentialId) => {
  const idNum = Number(credentialId);
  if (credentialId === null || credentialId === undefined || Number.isNaN(idNum)) return false;
  try {
    const row = await setting.findOne({
      where: {
        name: "internalAccounts",
        [Op.and]: Sequelize.literal(`JSON_CONTAINS(details, CAST(${idNum} AS JSON))`),
      },
    });
    return !!row;
  } catch (error) {
    return false;
  }
};

// The add-on price comes back with the commission markup added (when its mode is a markup one).
// Loaded here: the markup helper reads the tax rate from this same file.
const withMarkup = async (row, credentialId) => {
  const { applyCommissionMarkup } = require("../../utils/applyCommissionMarkup");
  await applyCommissionMarkup(row?.details, "amount", credentialId);
  return row;
};

exports.getBotBuilderValues = asyncHandler(async (credentialId) => {
  return withMarkup(await setting.findOne({
    where: {name: "flowBuilder"},
  }), credentialId);
});

exports.getShopifyIntegrationValues = asyncHandler(async (credentialId) => {
  return withMarkup(await setting.findOne({
    where: {name: "shopifyIntegration"},
  }), credentialId);
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

exports.getPGMethods = asyncHandler(async () => {
  return await setting.findOne({
    where: { name: "PG_Methods" },
    raw: true
  });
});

exports.createPGMethod = asyncHandler(async () => {
  // Idempotent: returns the existing PG_Methods row or creates it once. A blind setting.create here was
  // racing under concurrent first-loads and inserting duplicate PG_Methods rows. findOrCreate (atomic
  // with the unique index on settings.name) guarantees a single row.
  const [record] = await setting.findOrCreate({
    where: { name: "PG_Methods" },
    defaults: {
      name: "PG_Methods",
      details: {
        isGatewayPaymentAvailable: false,
        isWalletPaymentAvailable: false,
        isCorporateCardPaymentAvailable: false,
        isCouponApplicable: false,
      },
    },
  });

  return record;
});

exports.updatePGMethod = asyncHandler(async (updateFields) => {
  try {
    
    const existingRecord = await setting.findOne({
      where: { name: "PG_Methods" },
    });
    if (!existingRecord) {
      throw new Error("PG_Methods not found");
    }

    // update existing data with new data
    const updatedDetails = { ...existingRecord.details, ...updateFields };

    
    const updatedRecord = await setting.update(
      { details: updatedDetails },
      {
        where: { name: "PG_Methods" },
      }
    );

    console.log("Updated details:", updatedRecord);
    return updatedDetails;
  } catch (error) {
    console.log(error);
    return error;
  }
});
