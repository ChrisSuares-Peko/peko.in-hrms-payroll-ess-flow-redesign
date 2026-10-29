const { getPayrollSettingsUsingCorporateIdDashboard } = require('../models/use-cases/organizationSettings');
const { getOnBoardStatusByCorporateIdDashboard, getNoOfDaysWorkingDashboard } = require('../models/use-cases/employee');
const CorporateUserProgress = require('../models/entities/corporateUserProgress');

const calculateProgress = async (corporateUserID) => {
    const [payrollSettings, onBoardStatus, numberOfDaysWorking] = await Promise.all([
        getPayrollSettingsUsingCorporateIdDashboard(corporateUserID),
        getOnBoardStatusByCorporateIdDashboard(corporateUserID),
        getNoOfDaysWorkingDashboard(corporateUserID)
    ]);

    const orgSettings = payrollSettings?.organizationSettings?.[0] ?? {};
    const salaryComponents = payrollSettings?.salaryComponents ?? [];
    const deductionComponents = payrollSettings?.deductionComponents ?? [];

    const hasCompanyProfile = !!orgSettings.companyProfile && !!orgSettings.organizationTaxDetails;
    const hasPayrollSettings = !!orgSettings.payrollSettings;
    const hasBasicSalaryComponent = salaryComponents.some(
        c => c.componentName === 'Basic Salary' && Number(c.amountPercentage) > 0
    );
    const hasDeductionComponents = deductionComponents.length > 0;

    let progress = 0;
    if (hasCompanyProfile) progress += 25;
    if (hasPayrollSettings) progress += 25;
    if (hasBasicSalaryComponent) progress += 25;
    if (hasDeductionComponents) progress += 25;

    return {
        corporateUser: corporateUserID,
        progress: Math.min(progress, 100),
        hasCompanyProfile,
        hasPayrollSettings,
        hasSalaryComponent: hasBasicSalaryComponent,
        hasDeductionComponents,
        hasBasicSalaryComponent,
        basicSalaryAmount: 0,
        onBoardStatus: onBoardStatus?.onboardStatus ?? 0,
        isSkippedDasboard: onBoardStatus?.isSkippedDasboard ?? false,
        numberOfDaysWorking: numberOfDaysWorking ?? 0
    };
};

exports.recalculateAndUpsertProgress = async (corporateUserID) => {
    const data = await calculateProgress(corporateUserID);
    await CorporateUserProgress.findOneAndUpdate(
        { corporateUser: corporateUserID },
        { $set: data },
        { upsert: true, new: true }
    );
};
