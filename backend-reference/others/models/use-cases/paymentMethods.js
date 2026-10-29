const { QueryTypes } = require("sequelize");
const sequelizeConfig = require("../../configs/database/index");
const { getPGMethods } = require("./setting");

const hasWalletPaymentMethod = async (partnerId) => {
  const rows = await sequelizeConfig.query(
    `SELECT 1
     FROM payment_methods pm
     JOIN payment_methods_services pms ON pms.paymentMethodId = pm.id AND pms.isAvailable = 1
     JOIN serviceOperators so ON so.id = pms.serviceOperatorId
     WHERE pm.paymentMethod = 'WALLET' AND pm.partnerId <=> :partnerId
     LIMIT 1`,
    {
      replacements: { partnerId: partnerId ?? null },
      type: QueryTypes.SELECT,
    }
  );
  return rows.length > 0;
};

exports.isWalletPaymentAvailableForPartner = async (partnerId) => {
  const [pgMethods, hasWalletMethod] = await Promise.all([getPGMethods(), hasWalletPaymentMethod(partnerId)]);
  return pgMethods?.details?.isWalletPaymentAvailable === true && hasWalletMethod;
};
