
const { isValidObjectId } = require('mongoose');
const IncomeDeclarationForm = require('../entities/incomeDeclarationForm');

exports.createIncomeDeclarationForm = async (data) => {
  try {
    const { corporateUser, employee, financialYear } = data;

    const existingRecord = await IncomeDeclarationForm.findOne({
      corporateUser,
      employee,
      financialYear,
    });

    if (existingRecord) {
      
      const updatedForm = await IncomeDeclarationForm.findByIdAndUpdate(
        existingRecord._id,
        data,
        { new: true }
      );
      return updatedForm;
    } else {
      // Create new record
      const newForm = new IncomeDeclarationForm(data);
      const savedForm = await newForm.save();
      return savedForm;
    }
  } catch (error) {
    console.error("Error saving Income Declaration Form:", error);
    throw error;
  }
};

exports.getIncomeDeclarationForm = async (params) => {
  const { corporateUserID, employee, financialYear } = params;

  if (!isValidObjectId(employee)) {
    return null;
  }

  const form = await IncomeDeclarationForm.findOne({
    corporateUser: corporateUserID,
    employee,
    financialYear,
  });

  return form;
};