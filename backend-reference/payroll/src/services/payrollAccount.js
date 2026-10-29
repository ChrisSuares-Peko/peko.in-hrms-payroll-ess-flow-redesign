const {
  findOneByCorporateUser: findVirtualAccount,
} = require('../models/use-cases/corporateVirtualAccount');
const {
  findOneByCorporateUser: findBankAccount,
} = require('../models/use-cases/corporateBankAccount');
const ErrorResponse = require('../utils/error-response');

exports.getPayrollAccountStatus = async ({ corporateUserId }) => {
  const va = await findVirtualAccount(corporateUserId);
  if (va) {
    return { type: 'virtual', record: va };
  }

  const bank = await findBankAccount(corporateUserId);
  if (bank) {
    return { type: 'bank', record: bank };
  }

  throw new ErrorResponse(
    'No payroll account found for this merchant',
    404
  );
};
