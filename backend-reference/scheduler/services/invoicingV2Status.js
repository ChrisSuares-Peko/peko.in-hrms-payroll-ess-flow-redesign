const Sequelize = require("sequelize");
const sequelizeConfig = require("../configs/database/index");
const { customLog } = require("../utils/loggerHelper");

exports.updateInvoicingV2Status = async () => {
  try {
    const [, meta] = await sequelizeConfig.query(
      `UPDATE invoicings
       SET status = 'OVERDUE'
       WHERE status = 'PENDING'
         AND dueDate IS NOT NULL
         AND dueDate < CURDATE()`,
      { type: Sequelize.QueryTypes.UPDATE }
    );

    const affected = typeof meta === "number" ? meta : (meta?.affectedRows ?? 0);
    customLog(null, "info", { message: `invoicingV2Status: marked ${affected} invoice(s) as OVERDUE` });
  } catch (error) {
    customLog(null, "error", { message: "Error in invoicingV2Status", error: error.message });
  }
};
