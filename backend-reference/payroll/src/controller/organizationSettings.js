const asyncHandler = require("../middleware/async");
const OrganizationSettings = require("../models/entities/organizationSettings");
const CorporateUser = require("../models/entities/corporateUser");
const ErrorResponse = require("../utils/error-response");
const {
  updateCompanyProfile,
  updatePayrollSettings,

} = require("../models/use-cases/organizationSettings");
const { recalculateAndUpsertProgress } = require("../services/progressCalculator");


//get organization settings
exports.getOrganizationSettings = asyncHandler(async (req, res) => {
  const corporateUserID = req.user._id;
  const existingOrganizationSettings = await OrganizationSettings.findOne({
    corporateUser: corporateUserID,
  });

  if (!existingOrganizationSettings) {
    return res.status(200).json({
      status: true,
      responseCode: "000",
      message: "Error fetching organization settings successfully",
      data: {},
    });
  }
  const {
    companyProfile,
    organizationTaxDetails,
    payrollSettings,
    bankDetails,
  } = existingOrganizationSettings;

  return res.status(200).json({
    status: true,
    responseCode: "000",
    message: "Retrieved organization settings successfully",
    data: {
      companyProfile,
      organizationTaxDetails,
      payrollSettings,
      bankDetails,
    },
  });
});
//company info
exports.updateCompanyProfile = asyncHandler(async (req, res, next) => {
  const corporateUserID = req.user._id;
  const existingCompanyProfile = await OrganizationSettings.findOne({
    corporateUser: corporateUserID,
  });
  const { companyProfile, organizationTaxDetails } = req.body;

  // step-1 update corporate details with companyDetails
  const updatedUser = await CorporateUser.findOneAndUpdate(
    { _id: corporateUserID },
    { new: true }
  );
  if (!updatedUser) {
    return next(
      new ErrorResponse(
        "Company profile setting failed,Error in updating corporate details",
        400
      )
    );
  }
  const companyProfileData = {
    corporateUser: corporateUserID,
    companyProfile,
    organizationTaxDetails,
  };
  if (existingCompanyProfile) {
    // Update existing HR settings
    const updatedHrSettings = await updateCompanyProfile(
      corporateUserID,
      companyProfileData
    );
    const { companyProfile, organizationTaxDetails } = updatedHrSettings;

    return res.status(200).json({
      status: true,
      responseCode: "000",
      message: "Company profile settings updated successfully",
      data: { companyProfile, organizationTaxDetails },
    });
  } else {
    // Create new HR settings
    const newCompanyProfileData = new OrganizationSettings(companyProfileData);
    const savedCompanyProfileSettings = await newCompanyProfileData.save();
    const { companyProfile, organizationTaxDetails } =
      savedCompanyProfileSettings;
    return res.status(201).json({
      status: true,
      responseCode: "000",
      message: "Company profile settings created successfully",
      data: { companyProfile, organizationTaxDetails },
    });
  }
});



//payroll-settings
exports.updatePayrollSettings = asyncHandler(async (req, res, next) => {
  const corporateUserID = req.user._id;
  const existingPayrollSettings = await OrganizationSettings.findOne({
    corporateUser: corporateUserID,
  });
  const { payrollSettings } = req.body;
  payrollSettings.salaryCycleDay = 1;
  // step-1 update corporate details with companyDetails
  const updatedUser = await CorporateUser.findOneAndUpdate(
    { _id: corporateUserID },
    { new: true }
  );
  if (!updatedUser) {
    return next(
      new ErrorResponse(
        "Company profile setting failed,Error in updating corporate details",
        400
      )
    );
  }
  const payrollSettingsData = {
    corporateUser: corporateUserID,
    payrollSettings,
  };
  if (existingPayrollSettings) {
    // Update existing HR settings
    const updatedPayrollSettings = await updatePayrollSettings(
      corporateUserID,
      payrollSettingsData
    );
    const { payrollSettings } = updatedPayrollSettings;

    return res.status(200).json({
      status: true,
      responseCode: "000",
      message: "Payroll settings updated successfully",
      data: { payrollSettings },
    });
  } else {
    // Create new HR settings
    const newPayrollSettingsData = new OrganizationSettings(
      payrollSettingsData
    );
    const savedPayrollSettings = await newPayrollSettingsData.save();
    const { payrollSettings } = savedPayrollSettings;
    return res.status(201).json({
      status: true,
      responseCode: "000",
      message: "Payroll settings created successfully",
      data: { payrollSettings },
    });
  }
});



//bank-details
exports.updateBankDetails = asyncHandler(async (req, res, next) => {
  const corporateUserID = req.user._id;
  const existingBankDetails = await OrganizationSettings.findOne({
    corporateUser: corporateUserID,
  });
  const { bankDetails } = req.body;

  // step-1 update corporate details with companyDetails
  const updatedUser = await CorporateUser.findOneAndUpdate(
    { _id: corporateUserID },
    { new: true }
  );
  if (!updatedUser) {
    return next(
      new ErrorResponse(
        "Bank details adding failed,Error in updating corporate details",
        400
      )
    );
  }
  const bankDetailsData = {
    corporateUser: corporateUserID,
    bankDetails,
  };
  if (existingBankDetails) {
    const updatedBankDetails = await updatePayrollSettings(
      corporateUserID,
      bankDetailsData
    );
    const { bankDetails } = updatedBankDetails;

    return res.status(200).json({
      status: true,
      responseCode: "000",
      message: "Bank details updated successfully",
      data: { bankDetails },
    });
  } else {
    const newBankDetailsData = new OrganizationSettings(bankDetailsData);
    const savedBankDetails = await newBankDetailsData.save();
    const { bankDetails } = savedBankDetails;
    return res.status(201).json({
      status: true,
      responseCode: "000",
      message: "Bank details created successfully",
      data: { bankDetails },
    });
  }
});


exports.findCorporateDetails = asyncHandler(async (req, res) => {
  
    let data = {
      companyName:req.user.companyName,
      userEmail: req.user.email,
      userState: req.user.country,
      mobileNo: req.user.mobileNo,
    };
    return res.status(200).json({
      status: true,
      message: "Details fetched successfully",
      data: data,
      responseCode: "001",
    });
});

exports.getCompanyProfile = asyncHandler(async (req, res) => {
  const corporateUserID = req.user._id;
  const type = req.query?.type || '';
  if (type !== 'setting'){
    await CorporateUser.findOneAndUpdate(
      { _id: corporateUserID,
        onboardStatus: { $lt: 0 }
       },
      { $set: { onboardStatus: 0 } },
      { new: true }
    );
    recalculateAndUpsertProgress(corporateUserID).catch(err =>
      console.error('[Progress] Failed to update progress:', err.message)
    );
  }

  // if (!updatedUser) {
  //   return next(
  //     new ErrorResponse(
  //       "Company profile setting failed,Error in updating corporate details",
  //       400
  //     )
  //   );
  // }
  const existingOrganizationSettings = await OrganizationSettings.findOne({
    corporateUser: corporateUserID,
  });

  if (!existingOrganizationSettings) {
    return res.status(200).json({
      status: true,
      responseCode: "000",
      message: "Error fetching organization settings successfully",
      data: {},
    });
  }
  const {
    companyProfile,
    organizationTaxDetails,
  } = existingOrganizationSettings;

  return res.status(200).json({
    status: true,
    responseCode: "000",
    message: "Retrieved company profile successfully",
    data: {
      companyProfile,
      organizationTaxDetails,
    },
  });
});

exports.getPayrollCycle = asyncHandler(async (req, res) => {
  const corporateUserID = req.user._id;
  const type = req.query?.type || '';
  if (type !== 'setting') {
    await CorporateUser.findOneAndUpdate(
      {
        _id: corporateUserID,
        onboardStatus: { $lt: 1 }
      },
      { $set: { onboardStatus: 1 } },
      { new: true }
    );
    recalculateAndUpsertProgress(corporateUserID).catch(err =>
      console.error('[Progress] Failed to update progress:', err.message)
    );
  }
  const existingOrganizationSettings = await OrganizationSettings.findOne({
    corporateUser: corporateUserID,
  });

  if (!existingOrganizationSettings) {
    return res.status(200).json({
      status: true,
      responseCode: "000",
      message: "Error fetching organization settings successfully",
      data: {},
    });
  }
  const {
    payrollSettings,
  } = existingOrganizationSettings;

  return res.status(200).json({
    status: true,
    responseCode: "000",
    message: "Retrieved Payroll Cycle successfully",
    data: {
      payrollSettings,
    },
  });
});

exports.getPayrollActiveYears = asyncHandler(async (req, res) => {

    const corporateUserID = req.user._id;
    const existingHrSettings = await OrganizationSettings.findOne({ corporateUser: corporateUserID });

    if (!existingHrSettings) {
        return res.status(400).json({
            status: false,
            responseCode: '000',
            message: 'Organization onboarding is incomplete. Please complete the required setup to continue.',
            data: {}
        })
    }

    if (!existingHrSettings.payrollSettings?.payrollFrom) {
        return res.status(400).json({
            status: false,
            responseCode: '000',
            message: 'Please select your payroll start date in Settings to view financial years.',
            data: {}
        })
    }

    const payrollStartYear = new Date(existingHrSettings.payrollSettings.payrollFrom).getFullYear();
    let currentYear = new Date().getFullYear();
    const fromYear = Math.min(currentYear, payrollStartYear);
    const toYear = Math.max(currentYear + 1, payrollStartYear); // Add 1 to include future year in the list

    const yearsArray = Array.from(

        { length: toYear - fromYear + 1 },
        (_, index) => {
            const year = (fromYear + index).toString();
            return { label: year, value: year };
        }

    );

    return res.status(200).json({
        status: true,
        responseCode: '000',
        message: 'Retrieved Payroll active years successfully',
        data: { years: yearsArray }
    });

})