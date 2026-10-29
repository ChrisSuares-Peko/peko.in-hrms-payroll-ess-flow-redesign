const OrganizationSettings = require('../entities/organizationSettings');
const SalaryComponent = require('../entities/salaryComponent');
const DeductionComponent = require('../entities/deductionComponent');

exports.updateCompanyProfile = async (corporateUserID, companyProfileData) => {
  try {
    return await OrganizationSettings.findOneAndUpdate(
      { corporateUser: corporateUserID },
      companyProfileData,
      { new: true }
    );
  } catch (error) {
    console.log(error);
    return error;
  }
};
exports.updatePayrollSettings = async (corporateUserID, payrollData) => {
  try {
    return await OrganizationSettings.findOneAndUpdate(
      { corporateUser: corporateUserID },
      payrollData,
      { new: true }
    );
  } catch (error) {
    console.log(error);
    return error;
  }
};

exports.getPayrollSettingsUsingCorporateId = async (corporateUser) => {
  try {
    // Fetch organization settings
    const organizationSettings = await OrganizationSettings.find({
      corporateUser,
      $and: [
        { 'companyProfile.companyName': { $exists: true, $ne: null } },
        { 'companyProfile.state': { $exists: true, $ne: null } },
        { 'companyProfile.contactNumber': { $exists: true, $ne: null } },
        { 'companyProfile.emailAddress': { $exists: true, $ne: null } },
        { 'organizationTaxDetails.PAN': { $exists: true, $ne: null } },
        { 'organizationTaxDetails.TAN': { $exists: true, $ne: null } },
        { 'organizationTaxDetails.TDSCode': { $exists: true, $ne: null } },
        {
          'organizationTaxDetails.taxPaymentFrequency': {
            $exists: true,
            $ne: null,
          },
        },
        { 'payrollSettings.selectWorkingDays': { $exists: true, $ne: null } },
        {
          'payrollSettings.calculateSalaryBasedOn': {
            $exists: true,
            $ne: null,
          },
        },
        // { 'bankDetails.bankName': { $exists: true, $ne: null } },
        // { 'bankDetails.accountNumber': { $exists: true, $ne: null } },
        // { 'bankDetails.accountHolderName': { $exists: true, $ne: null } },
        // { 'bankDetails.ifscCode': { $exists: true, $ne: null } },
      ],
    });
    const salaryComponents = await SalaryComponent.find({ corporateUser });
    const deductionComponents = await DeductionComponent.find({ corporateUser });

    return {
      organizationSettings,
      salaryComponents,
      deductionComponents
    };
  } catch (error) {
    return error;
  }
};

exports.getPayrollSettingsUsingCorporateIdDashboard = async (corporateUser) => {
    const [organizationSettings, salaryComponents, deductionComponents] =
      await Promise.all([
        OrganizationSettings.findOne(
          { corporateUser },
          {
            companyProfile: 1,
            organizationTaxDetails: 1,
            payrollSettings: 1
          }
        ).lean(),

        SalaryComponent.find(
          { corporateUser },
          {
            componentName: 1,
            amountPercentage: 1
          }
        ).lean(),

        DeductionComponent.find(
          { corporateUser },
          { _id: 1 }
        ).lean()
      ]);

    return {
      organizationSettings: organizationSettings ? [organizationSettings] : [],
      salaryComponents: salaryComponents || [],
      deductionComponents: deductionComponents || []
    };
};


