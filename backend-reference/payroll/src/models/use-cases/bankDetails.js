const BankDetails = require('../entities/bankDetails');
const Employee = require('../entities/employee');
const { isEmployeeOfCorporate } = require('../../utils/tenantScope');

// Loads a bank record only if its employee belongs to the corporate (older rows may
// not carry corporateUser, so ownership is checked through the employee).
const findOwnedBankDetails = async (bankId, corporateUserID) => {
  const bankDetails = await BankDetails.findById(bankId);
  if (!bankDetails || !(await isEmployeeOfCorporate(bankDetails.employeeId, corporateUserID))) {
    return null;
  }
  return bankDetails;
};

exports.addEmployeeBankDetails = async ({ employeeId, bankDetailsData, corporateUserID }) => {
  try {

    if (!(await isEmployeeOfCorporate(employeeId, corporateUserID))) {
      throw new Error('Employee not found');
    }

    const existingDefaultAccount = await BankDetails.findOne({
      employeeId: employeeId,
      isDefaultAccount: true
    });
    const existingAccountsCount = await BankDetails.countDocuments({ employeeId });

   if (existingAccountsCount >= 5) {
  throw new Error(`Oops! You've reached the maximum limit for adding the bank accounts. Remove one to add a new one`);
}

    const duplicateAccount = await BankDetails.findOne({
      employeeId,
      accountNumber: bankDetailsData.accountNumber,
    });
    if (duplicateAccount) {
      throw new Error('This bank account has already been added.');
    }

    if (bankDetailsData.isDefaultAccount && existingDefaultAccount) {

      existingDefaultAccount.isDefaultAccount = false;
      await existingDefaultAccount.save();
    }

    // Create the new BankDetails document
    const newBankDetails = new BankDetails({
      employeeId: employeeId,
      accountName: bankDetailsData.accountName,
      accountNumber: bankDetailsData.accountNumber,
      bankName: bankDetailsData.bankName,
      ifscCode: bankDetailsData.ifscCode,
      isDefaultAccount: bankDetailsData.isDefaultAccount || false,
      corporateUser: corporateUserID
    });

    await newBankDetails.save();


    await Employee.findOneAndUpdate({ _id: employeeId, corporateUser: corporateUserID }, { bankDetails: newBankDetails._id });

    return {
      status: true,
      message: 'Bank details added successfully',
      bankDetails: newBankDetails
    };
  } catch (error) {
    throw new Error(error.message);
  }
};


exports.updateEmployeeBankDetails = async ({ bankId, bankDetailsData, corporateUserID }) => {
  try {

    const bankDetails = await findOwnedBankDetails(bankId, corporateUserID);

    if (!bankDetails) {
      throw new Error('Bank details not found');
    }

    const newAccountNumber = bankDetailsData.accountNumber || bankDetails.accountNumber;
    const duplicateAccount = await BankDetails.findOne({
      _id: { $ne: bankId },
      employeeId: bankDetails.employeeId,
      accountNumber: newAccountNumber,
    });
    if (duplicateAccount) {
      throw new Error('This bank account has already been added.');
    }

    if (bankDetailsData.isDefaultAccount && bankDetails.isDefaultAccount !== bankDetailsData.isDefaultAccount) {


      await BankDetails.updateMany(
        { employeeId: bankDetails.employeeId, isDefaultAccount: true },
        { isDefaultAccount: false }
      );
    }

    const accountChanged =
      (bankDetailsData.accountNumber && bankDetailsData.accountNumber !== bankDetails.accountNumber) ||
      (bankDetailsData.ifscCode && bankDetailsData.ifscCode !== bankDetails.ifscCode);

    // Update the bank details with the new data
    bankDetails.accountName = bankDetailsData.accountName || bankDetails.accountName;
    bankDetails.accountNumber = bankDetailsData.accountNumber || bankDetails.accountNumber;
    bankDetails.bankName = bankDetailsData.bankName || bankDetails.bankName;
    bankDetails.ifscCode = bankDetailsData.ifscCode || bankDetails.ifscCode;
    bankDetails.isDefaultAccount = !!bankDetailsData.isDefaultAccount;

    // A changed destination account must be verified and added as a beneficiary again.
    if (accountChanged) {
      bankDetails.bankAccountStatus = 'Pending';
      bankDetails.beneficiaryStatus = 'Pending';
    }


    if (corporateUserID) {
      bankDetails.corporateUser = corporateUserID;
    }

    await bankDetails.save();

    return {
      success: true,
      message: 'Bank account updated successfully',
      bankDetails,
    };
  } catch (error) {
    console.error('Error updating bank details:', error);
    throw new Error(error.message);
  }
};



exports.deleteEmployeeBankDetails = async (bankId, corporateUserID) => {
  try {

    const bankDetails = await findOwnedBankDetails(bankId, corporateUserID);


    if (!bankDetails) {
      throw new Error('Bank details not found');
    }

    await BankDetails.findByIdAndDelete(bankId);

    await Employee.updateOne(
      { bankAccounts: bankId },
      { $pull: { bankAccounts: bankId } }
    );

    return {
      success: true,
      message: 'Bank details deleted successfully',
    };
  } catch (error) {
    console.error('Error deleting bank details:', error);
    throw new Error('Unable to delete bank details');
  }
};



exports.getEmployeeBankDetails = async (employeeId, corporateUserID) => {
  try {

    if (!(await isEmployeeOfCorporate(employeeId, corporateUserID))) {
      return [];
    }

    const bankDetailsList = await BankDetails.find({ employeeId });
    return bankDetailsList;

  } catch (error) {

    console.error('Error fetching bank details:', error);
    throw new Error('Unable to fetch bank details');

  }

};


