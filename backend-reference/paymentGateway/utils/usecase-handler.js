const UsecaseResponse = require("./usecase-response");
const sequelize = require("../configs/database");
const { customLog } = require("./loggerHelper");

/**
 * @returns {Promise<{ success: boolean, message: string, data?: any, error?: any }>}
 */
const usecaseHandler = (fn, isTransaction = false) => {
  return async (params) => {
    let transaction;
    try {
      if (isTransaction) transaction = await sequelize.transaction();

      const result = await fn(params, transaction);

      if (transaction) await transaction.commit();

      return UsecaseResponse.success(result);
    } catch (error) {
      customLog(null, 'error', {...error, message: error?.message})
      if (transaction) await transaction.rollback();
      return UsecaseResponse.error(error);
    }
  };
};

module.exports = usecaseHandler;
