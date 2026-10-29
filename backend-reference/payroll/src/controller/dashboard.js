const async = require('async'); // Import the async library
const HrSettings = require('../models/entities/hrSettings');
const CorporateUser = require('../models/entities/corporateUser');
const CorporateUserProgress = require('../models/entities/corporateUserProgress');
const asyncHandler = require("../middleware/async");
const { recalculateAndUpsertProgress } = require('../services/progressCalculator');

const { getPayrollSettingsUsingCorporateId } = require("../models/use-cases/organizationSettings");
const { getEmployeesUsingCorporateId, getOnBoardStatusByCorporateId, getNoOfDaysWorking, getProbationReviews, probationReviewActivity } = require("../models/use-cases/employee");
// const { getLeaveandAttendanceUsingCorporateId } = require("../models/use-cases/leaveComponent");
// const { getComplianceSettingsUsingCorporateId } = require("../models/use-cases/complianceSettings");
const { getMonthlyTotalSalary, getCurrentMonthTotalSalary, getNextMonthTotalSalary, getMonthlyDeductionSummary } = require('../models/use-cases/dashBoard');
const { getEmployeesByBirthday, getUpComingDocExpiries, getUpcomingHolidays } = require('../models/use-cases/calendarActivities');
const { getEmployeesByBirthdayDashboard, getUpComingDocExpiriesDashboard, getUpcomingHolidaysDashboard } = require('../models/use-cases/calendarActivities');
const { humanReadableDate } = require('../utils/dateUtils');
const { countActiveEmployees,countActiveEmployeesDashboard } = require('../models/use-cases/dashBoard');
const { formatDocName } = require('../services/formatDocName')
const { getCurrentMonthTotalSalaryDashboard, getNextMonthTotalSalaryDashboard, getTotalSalaryForActiveAndLeaveEmployees, getSalarySummaryDashboard } = require('../models/use-cases/dashBoard');


exports.getProgress = asyncHandler(async (req, res) => {

  let progressData = {};
  let progress = 0;
  const corporateUserID = req.user._id;
  // const payrollSettings = await getPayrollSettingsUsingCorporateId(corporateUserID);
  const payrollSettings = await getPayrollSettingsUsingCorporateId(corporateUserID);
  // const leaveandAttendance = await getLeaveandAttendanceUsingCorporateId(corporateUserID);
  // const complianceSettings = await getComplianceSettingsUsingCorporateId(corporateUserID);
  // const departmentData = await getDepartmentUsingCorporateId(corporateUserID);
  const employeesData = await getEmployeesUsingCorporateId(corporateUserID);
  const onBoardStatus = await getOnBoardStatusByCorporateId(corporateUserID);
  const numberOfDaysWorking = await getNoOfDaysWorking(corporateUserID)


  // Check if companyProfile, organizationTaxDetails, payrollSettings, bankDetails, salaryComponents, and deductionComponents exist
  const hasCompanyProfile = payrollSettings.organizationSettings.length > 0 && payrollSettings.organizationSettings[0].companyProfile;
  const hasOrganizationTaxDetails = payrollSettings.organizationSettings.length > 0 && payrollSettings.organizationSettings[0].organizationTaxDetails;
  const hasPayrollSettings = payrollSettings.organizationSettings.length > 0 && payrollSettings.organizationSettings[0].payrollSettings;
  //   const hasBankDetails = payrollSettings.organizationSettings.length > 0 && payrollSettings.organizationSettings[0].bankDetails;
  const hasSalaryComponents = payrollSettings.salaryComponents.length > 0;
  const hasDeductionComponents = payrollSettings.deductionComponents.length > 0;

  // Check if Basic Salary component exists inside salaryComponents
  let hasBasicSalaryComponent = false;
  let basicSalaryAmount = 0;

  if (hasSalaryComponents) {
    const basicSalaryComponent = payrollSettings.salaryComponents.find(
      (component) => component.componentName === 'Basic Salary' && component.amountPercentage > 0
    );

    if (basicSalaryComponent) {
      hasBasicSalaryComponent = true;
      //   basicSalaryAmount = basicSalaryComponent.amountPercentage; // Extract basic salary amount
    }
  }
  // Set progress for payroll settings and basic salary component
  //   if (hasCompanyProfile && hasOrganizationTaxDetails && hasPayrollSettings && hasSalaryComponents && hasDeductionComponents&& hasBasicSalaryComponent) {

  if (hasCompanyProfile && hasOrganizationTaxDetails) {
    progressData.hasCompanyProfile = true;
    progress += 20;
  } else {
    progressData.hasCompanyProfile = false;
    // progress += 25;
  }
  if (hasPayrollSettings) {
    progress += 20;
  } else {
    progressData.payrollSettings = false;
  }
  if (hasBasicSalaryComponent) {
    progressData.hasSalaryComponent = true;
    progress += 20;
  } else {
    progressData.hasSalaryComponent = false;
    // progress += 25;
  }
  if (hasDeductionComponents) {
    progressData.hasDeductionComponents = true;
    progress += 20;
  } else {
    progressData.hasDeductionComponents = false;
    // progress += 25;
  }
  progressData.progress = `${progress}%`;
  progressData.hasBasicSalaryComponent = hasBasicSalaryComponent;
  progressData.basicSalaryAmount = basicSalaryAmount;
  if (employeesData.length > 0) {
    progressData.hasEmployeesData = true;
    progressData.progress = `${progress + 20}%`
    progress += 20;
  } else {
    progressData.hasEmployeesData = false;
    progressData.progress = `${progress}%`

  }

  // if (leaveandAttendance.length > 0) {
  //     progressData.leaveandAttendance = true;
  //     progressData.progress = `${progress + 25}%`
  //     progress += 25;
  // } else {
  //     progressData.leaveandAttendance = false;
  //     progressData.progress = `${progress}%`
  // } 
  // if (complianceSettings.length > 0) {
  //     const compliance = complianceSettings[0];
  //     const hasEpf = compliance.epf && Object.keys(compliance.epf).length > 0;
  //     const hasEsi = compliance.esi && Object.keys(compliance.esi).length > 0;
  //     const hasLaborWelfareFund = compliance.laborWelfareFund && Object.keys(compliance.laborWelfareFund).length > 0;
  //     const hasProfessionalTax = compliance.professionalTax && Object.keys(compliance.professionalTax).length > 0;

  //     if (hasEpf && hasEsi && hasLaborWelfareFund && hasProfessionalTax) {
  //         progressData.complianceSettings = true;
  //         progress += 25;
  //     } else {
  //         progressData.complianceSettings = false;
  //     }
  // } else {
  //     progressData.complianceSettings = false;
  // }

  progressData.progress = `${progress}%`;
  progressData.onBoardStatus = onBoardStatus?.onboardStatus ?? 0
  progressData.isSkippedDasboard = onBoardStatus?.isSkippedDasboard ?? false
  progressData.numberOfDaysWorking = numberOfDaysWorking

  return res.status(201).json({
    status: true,
    responseCode: '000',
    message: 'progress calculated successfully',
    data: progressData
  });
});

exports.getCharts = asyncHandler(async (req, res) => {

  const corporateUser = req.user._id
  const year = parseInt(req.query.year) || new Date().getFullYear();
  // const year = parseInt(new Date().getFullYear());
  const chartData = await getMonthlyTotalSalary(year, corporateUser)

  return res.status(200).json({
    status: true,
    responseCode: '000',
    message: 'Retrieved chart details',
    data: { chartData }
  });

})

exports.getAllDashboardDetails = asyncHandler(async (req, res) => {

  const corporateUser = req.user._id
  const now = new Date();
  let month = now.getMonth()+1; // previous month
  let year = now.getFullYear();
  if (month === 0) {
    month = 12;
    year -= 1;
}
  const results = await async.parallel({
    activeEmployees: async () => {
      const count = await await countActiveEmployees(corporateUser);
      return count || 0;
    },
    totalSalary: async () => {
      let lastMonth = await getCurrentMonthTotalSalary({ corporateUser })
      return lastMonth || 0;
    },
    nextMonthSalary: async () => {
      // Perform query for next month's salary
      let totalSalary = await getNextMonthTotalSalary({ corporateUser })
      return totalSalary || 0;
    },
    // lastMonthSalary: async () => {
    //     // Perform query for last month's salary
    //     let lastMonth = await getLastMonthSalaryDetails({ corporateUser })
    //     return lastMonth || 0;
    // },
    upcomingActivities: async () => {
      let activities = []
      //within 10 days
      //birth days
      let comingBirthDays = await getEmployeesByBirthday(corporateUser, 30)
      comingBirthDays.forEach((data) => {
        let { nextBirthday, fullName, gender } = data
        let represent = gender == "MALE" ? "him" : "her";

        activities.push({
          title: `Birthday`,
          body: `Celebrate ${fullName}'s birthday on ${humanReadableDate(nextBirthday)}, and wish ${represent} a fantastic year ahead!`,
          start: nextBirthday,
          type: "BIRTHDAY"
        })
      })
      //docs expiry 
      let comingExpiries = await getUpComingDocExpiries(corporateUser, 30)//show for next 30 days
      comingExpiries.forEach((data) => {
        let { docName, fullName, expiryDate } = data;
        const formattedDocName = formatDocName(docName); // Format the docName
        activities.push({
          title: `${formattedDocName} expiring`,
          body: `${fullName}'s ${formattedDocName} is expiring on ${humanReadableDate(expiryDate)}. Please ensure timely renewal.`,
          start: expiryDate,
          type: "EXPIRY"
        });
      });
      //holidays
      const upcomingHolidays = await getUpcomingHolidays(corporateUser, 30)

      upcomingHolidays.forEach((data) => {
        let { title, start, sendPriorEmail } = data
        if (!sendPriorEmail) sendPriorEmail = false
        activities.push({
          title: title,
          body: `Upcoming holiday on ${humanReadableDate(start)}. Plan ahead and enjoy your time off!`,
          start: start,
          type: "HOLIDAYS"
        })
      })




      // in ascending order
      activities.sort((a, b) => new Date(a.start) - new Date(b.start));
      const firstUpcomingActivities = activities.slice(0, 10);

      return firstUpcomingActivities || [];
    },
    deductionSummary: async () => {
      // Perform query for last month's salary
      let deductionSummary = await getMonthlyDeductionSummary({ corporateUser, year, month })
      console.log("deductionSummary",deductionSummary)
      return deductionSummary || [];
    }
  });

  return res.status(200).json({
    status: true,
    responseCode: '000',
    message: 'Retrieved dash details',
    data: results
  });

})

exports.updateDashboardStatus = asyncHandler(async (req, res) => {
  const { isSkippedDasboard } = req.body; // Employee ID (if it's employee-specific)
  const corporateUserID = req.user._id;
  try {
    const query = {
      _id: corporateUserID
    }
    const result = await CorporateUser.updateOne(query, { isSkippedDasboard });
    return res.status(200).json({
      status: true,
      responseCode: '000',
      message: "Dashboard Status updated successfully",
      data: result.matchedCount === 1 ? true : false,
    });
  } catch (error) {
    return res.status(400).json({
      status: false,
      responseCode: '400',
      message: error.message || 'Failed to update Dashboard status',
    });
  }
})

exports.getProgressForCorporateUser = asyncHandler(async (req, res) => {
  const corporateUserID = req.user._id;

  let cached = await CorporateUserProgress.findOne(
    { corporateUser: corporateUserID }
  ).lean();

  if (!cached) {
    await recalculateAndUpsertProgress(corporateUserID);
    cached = await CorporateUserProgress.findOne(
      { corporateUser: corporateUserID }
    ).lean();
  }

  return res.status(200).json({
    status: true,
    responseCode: "000",
    message: "progress calculated successfully",
    data: {
      progress: `${cached.progress}%`,
      hasCompanyProfile: cached.hasCompanyProfile,
      hasPayrollSettings: cached.hasPayrollSettings,
      hasSalaryComponent: cached.hasSalaryComponent,
      hasDeductionComponents: cached.hasDeductionComponents,
      hasBasicSalaryComponent: cached.hasBasicSalaryComponent,
      basicSalaryAmount: cached.basicSalaryAmount,
      onBoardStatus: cached.onBoardStatus,
      isSkippedDasboard: cached.isSkippedDasboard,
      numberOfDaysWorking: cached.numberOfDaysWorking
    }
  });
});

exports.getEstimatedSalary = asyncHandler(async (req, res) => {
  const corporateUser = req.user._id;

  const estimatedSalary = await getTotalSalaryForActiveAndLeaveEmployees({ corporateUser });

  return res.status(200).json({
    status: true,
    responseCode: "000",
    message: "Estimated salary retrieved successfully",
    data: {
      totalSalary: estimatedSalary || 0,
      nextMonthSalary: estimatedSalary || 0
    }
  });
});

exports.getAllDashboardDetailsForCorporate = asyncHandler(async (req, res) => {
  const corporateUser = req.user._id;
  const DAYS = 30;
  const now  = new Date();
  
  let month = now.getMonth()+1; // previous month
  let year = now.getFullYear();
  if (month === 0) {
    month = 12;
    year -= 1;
  }


  // ---------- PARALLEL DB QUERIES ----------
  const [
    activeEmployees,
    totalSalary,
    nextMonthSalary,
    birthdays,
    expiries,
    holidays,
    deductionSummary,
    hrSettings,
    probationReviews
  ] = await Promise.all([
    countActiveEmployeesDashboard(corporateUser),
    getCurrentMonthTotalSalaryDashboard({ corporateUser }),
    getNextMonthTotalSalaryDashboard({ corporateUser }),

    getEmployeesByBirthdayDashboard(corporateUser, DAYS),
    getUpComingDocExpiriesDashboard(corporateUser, DAYS),
    getUpcomingHolidaysDashboard(corporateUser, DAYS),
    getMonthlyDeductionSummary({ corporateUser, year, month }),

    HrSettings.findOne(
      { corporateUser },
      { _id: 1 }
    ).lean(),
    getProbationReviews(corporateUser, 60),
  ]);

  // ---------- BUILD UPCOMING ACTIVITIES ----------
  const activities = [];

  // 🎂 Birthdays
  birthdays.forEach(({ fullName, gender, nextBirthday }) => {
    const represent = gender === "MALE" ? "him" : "her";
    activities.push({
      title: "Birthday",
      body: `Celebrate ${fullName}'s birthday on ${humanReadableDate(nextBirthday)}, and wish ${represent} a fantastic year ahead!`,
      start: nextBirthday,
      type: "BIRTHDAY"
    });
  });

  // 📄 Document Expiry
  expiries.forEach(({ fullName, docName, expiryDate }) => {
    const formattedDocName = formatDocName(docName);
    activities.push({
      title: `${formattedDocName} expiring`,
      body: `${fullName}'s ${formattedDocName} is expiring on ${humanReadableDate(expiryDate)}. Please ensure timely renewal.`,
      start: expiryDate,
      type: "EXPIRY"
    });
  });

  // 🏖 Holidays
  holidays.forEach(({ title, start }) => {
    activities.push({
      title,
      body: `Upcoming holiday on ${humanReadableDate(start)}. Plan ahead and enjoy your time off!`,
      start,
      type: "HOLIDAYS"
    });
  });

  // Probation reviews: ending within 60 days, or overdue (dated today)
  probationReviews.forEach((review) => {
    activities.push({
      ...probationReviewActivity(review),
      type: review.overdue ? "PROBATION_REVIEW_OVERDUE" : "PROBATION_REVIEW"
    });
  });

  // ⚠️ HR Settings Alert
  if (!hrSettings) {
    activities.push({
      title: "HR Settings",
      body: "Your HR settings need attention to ensure seamless payroll activities. Please update your HR settings.",
      start: now,
      type: "OTHERS"
    });
  }

  // ---------- SORT & LIMIT ----------
  const upcomingActivities = activities
    .sort((a, b) => new Date(a.start) - new Date(b.start))
    .slice(0, 10);

  // ---------- RESPONSE ----------
  return res.status(200).json({
    status: true,
    responseCode: "000",
    message: "Retrieved dash details",
    data: {
      activeEmployees: activeEmployees || 0,
      totalSalary: totalSalary || 0,
      nextMonthSalary: nextMonthSalary || 0,
      upcomingActivities,
      deductionSummary: deductionSummary || []
    }
  });
});

exports.salarySummary = asyncHandler(async (req, res) => {
  const corporateUser = req.user._id;
  const data = await getSalarySummaryDashboard({ corporateUser });
  return res.status(200).json({
    status: true,
    responseCode: '000',
    message: 'Salary summary retrieved successfully',
    data,
  });
});
