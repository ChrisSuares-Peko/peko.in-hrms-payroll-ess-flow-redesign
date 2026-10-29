const schedule = require("node-schedule");
const { transactionsExcelReport, transactionsExcelReportAdmin,transactionsExcelReportAdminNew,transactionsSubscriptionExcelReportAdminNew,corporateTransactionsExcelReport } = require("../models/use-cases/transaction");
const { dataConversion } = require("../utils/reportToExcel");
const { emailWithExcel, emailWithoutData, emailWithExcelAdmin } = require("../utils/emailer");
const { promises: fsPromises } = require("fs");
const corporateUser = require("../models/entities/corporateUser");
let sequelizeConfig = require('../configs/database/index');
//const moment = require("moment");
const path = require('path');
const moment = require('moment-timezone');
const order = require("../models/entities/order");
const { Op } = require("sequelize");
const { generateSubject } = require("../utils/dateUtils");
const { customLog } = require("../utils/loggerHelper");
const { resolveEmailTemplate } = require("../services/emailTemplateResolver");
const { EMAIL_TEMPLATE_KEYS, EMAIL_TEMPLATE_SERVICES } = require("../utils/emailTemplateKeys");
const { v2LayoutVariables } = require("../utils/emailTemplate/sharedLayout");
const { addAdminReportTemplate } = require("../utils/email/emailTemplates/reportAdminTemplate");
const { generateTransactionReportEmailBody, generateNoTransactionReportEmailBody } = require("../utils/emailTemplates");

// Shared helper for the 4 addAdminReportTemplate call sites below (2 in
// generateTransactionReportForAllUsers, 2 in generateTransactionReportForAllUsersAdmin) — one
// named helper per hard rule 4 (multiple call sites, same file, same key/template).
async function sendAdminReportEmail(to, subject, fileName, filePath, reportData) {
  const resolved = await resolveEmailTemplate({
    key: EMAIL_TEMPLATE_KEYS.REPORT_ADMIN_TRANSACTION_SUMMARY,
    service: EMAIL_TEMPLATE_SERVICES.SCHEDULER,
    variables: { ...reportData, ...v2LayoutVariables(reportData?.partnerDetails) },
    fallback: () => addAdminReportTemplate(reportData),
    fallbackSubject: subject,
  });
  return emailWithExcelAdmin(to, resolved.subject, fileName, filePath, resolved.html);
}
// Ensure directory exists
const ensureDirectoryExists = async (dirPath) => {
  try {
    await fsPromises.mkdir(dirPath, { recursive: true });
  } catch (err) {
    customLog(null, "error", { message:"Error creating directory", error: err, dirPath })

  }
};

// Call this function at the start of your script
ensureDirectoryExists(path.join(__dirname, '../public/excelReports'));
//Calling Function to get the details of order Report

const transactionReport = async (emailId, credentialId, from, to, type, timePhrase, accountName) => {
  let params = {
    credentialId,
    from,
    to,
  };
  let data = await transactionsExcelReport(params);
  let corporateTransactionReport = await corporateTransactionsExcelReport(params);
  // accountName goes into a filesystem path, so strip anything that isn't safe in a filename.
  const safeName = accountName
    ? String(accountName).replace(/[^a-zA-Z0-9]+/g, "_").replace(/^_+|_+$/g, "")
    : "";
  const fileNamePrefix = `${type}_Transaction_Report${safeName ? `_${safeName}` : ""}`;
  const excelData = await dataConversion(data, fileNamePrefix,corporateTransactionReport);

  const subject = `${type} Transaction Report${accountName ? ` - ${accountName}` : ""}`;

  if (excelData) {
    const resolvedDataAttached = await resolveEmailTemplate({
      key: EMAIL_TEMPLATE_KEYS.TRANSACTION_REPORT_DATA_ATTACHED,
      service: EMAIL_TEMPLATE_SERVICES.SCHEDULER,
      variables: {
        type,
        // Pre-rendered blob, not a raw ${accountName} placeholder — accountName is legitimately
        // absent for admin-wide reports, and an empty variable would discard the whole
        // admin-stored template (see resolveEmailTemplate's empty-value-triggers-fallback rule).
        accountNameSuffix: accountName ? ` for ${accountName}` : '<!-- no account name -->',
      },
      fallback: () => generateTransactionReportEmailBody({ type, accountName }),
      fallbackSubject: subject,
    });
    const emailData = await emailWithExcel(
      emailId,
      resolvedDataAttached.subject,
      excelData.fileName,
      excelData.filePath,
      resolvedDataAttached.html
    );

    if (emailData) {
      try {
        await fsPromises.unlink(excelData.filePath);
      } catch (err) {
        customLog(null, "error", { message:"Error removing file", error: err })
      }
    }
    return excelData;
  } else {
    const resolvedNoData = await resolveEmailTemplate({
      key: EMAIL_TEMPLATE_KEYS.TRANSACTION_REPORT_NO_DATA,
      service: EMAIL_TEMPLATE_SERVICES.SCHEDULER,
      variables: { timePhrase },
      fallback: () => generateNoTransactionReportEmailBody({ timePhrase }),
      fallbackSubject: subject,
    });
    emailWithoutData(emailId, resolvedNoData.subject, resolvedNoData.html);
  }
};
let jobDailyMap = {};
let jobWeeklyMap = {};
let jobMonthlyMap = {};
let jobDailyDataForAdmin = {}
let jobWeeklyDataForAdmin = {}
let jobMonthlyDataForAdmin = {}

exports.cronTaskScheduler = async () => {
  await ensureDirectoryExists(path.join(__dirname, '../public/excelReports'));
  const dailyUserDetails = await corporateUser.findAll({
    where: {
      isActive: true,

    },
    attributes: ["name", "credentialId", "dailyReport"],
  });
  dailyUserDetails.forEach((data) => {
    let time = data?.dailyReport?.scheduledTime;
    if (jobDailyMap[data.credentialId]) {
      jobDailyMap[data.credentialId].cancel();
      delete jobDailyMap[data.credentialId]; // Remove the canceled job from the map
    }
    if (data?.dailyReport?.isActive && time) {
      const adjustedTime = getAdjustedTime(time)
      let [hour, minute] = adjustedTime.split(":");
      let rule = new schedule.RecurrenceRule();
      rule.hour = parseInt(hour);
      rule.minute = parseInt(minute);

      if (rule.minute >= 0 && rule.minute <= 9) {
        rule.minute = rule.minute.toString(); // Convert to string to remove leading zero
      }
      // Schedule a new job for the current user
      jobDailyMap[data.credentialId] = schedule.scheduleJob(rule, async function () {
        const type = "Daily";
        try {
          let from = moment().tz('Asia/Kolkata').subtract(12, 'd').format('YYYY-MM-DD') + " " + '00:00:00';
          let to = moment().tz('Asia/Kolkata').subtract(1, 'd').format('YYYY-MM-DD') + " " + '23:59:59';
          // let body =
          //   "<p>Hello,</p><p>You have not made any transactions yesterday.</p> <p>Regards</p><p>PEKO</p>";
           
          const body = `
          <p>Hello,</p>
          <p>You have not made any transactions yesterday.</p>
          <br>
          <p>Thank you for using Peko.</p>
          <br>
          <p>If you have any queries or need further assistance, please reach out to us at 
            <a href="mailto:reach@peko.one">reach@peko.one</a>. We assure you of our best services at all times.
          </p>
          <p>Best Regards</p>
          <p>Team Peko</p>
        `;
          await transactionReport(
            data.dailyReport.email,
            data.credentialId,
            from,
            to,
            type,
            body,
            data.name
          );
        } catch (error) {
          customLog(null, "error", { message:"Error in transaction report", error })
        }
      });
    }
  });
  //Weekly User Details
  const weeklyUserDetails = await corporateUser.findAll({
    where: {
      isActive: true,
    },
    attributes: ["name", "credentialId", "weeklyReport"],
  });
  weeklyUserDetails.forEach((data) => {
    let time = data?.weeklyReport?.scheduledTime;
    let day = data?.weeklyReport?.scheduledDay;
    if (jobWeeklyMap[data.credentialId]) {
      jobWeeklyMap[data.credentialId].cancel();
      delete jobWeeklyMap[data.credentialId]; // Remove the canceled job from the map
    }
    if (data?.weeklyReport?.isActive && time) {
      const adjustedTime = getAdjustedTime(time)
      let [hour, minute] = adjustedTime.split(":");
      let rule = new schedule.RecurrenceRule();
      rule.hour = parseInt(hour);
      rule.minute = parseInt(minute);
      rule.dayOfWeek = parseInt(day);

      if (rule.minute >= 0 && rule.minute <= 9) {
        rule.minute = rule.minute.toString(); // Convert to string to remove leading zero
      }
      jobWeeklyMap[data.credentialId] = schedule.scheduleJob(rule, async function () {
        const type = "Weekly";
        try {
          let from =
            moment().tz('Asia/Kolkata').subtract(7, "d").format("YYYY-MM-DD") +
            " 00" +
            ":00" +
            ":00",
            to =
              moment().tz('Asia/Kolkata').subtract(1, "d").format("YYYY-MM-DD") +
              " " +
              "23:59:59";
          // let body =
          //   "<p>Hello,</p><p>You have not made any transactions last week. </p><br>  <p>Thank you for using Peko.</p></br> <p>If you have any queries or need further assistance, please reach out to us at <a href ="mailto:reach@peko.one">reach@peko.one</a>. We assure you of our best services at all times.</p> <p>Regards</p><p>PEKO</p> ";
           
          const body = `
  <p>Hello,</p>
  <p>You have not made any transactions last week.</p>
  <br>
  <p>Thank you for using Peko.</p>
  <br>
  <p>If you have any queries or need further assistance, please reach out to us at 
    <a href="mailto:reach@peko.one">reach@peko.one</a>. We assure you of our best services at all times.
  </p>
  <p>Best Regards</p>
  <p>Team Peko</p>
`;
          await transactionReport(
            data.weeklyReport.email,
            data.credentialId,
            from,
            to,
            type,
            body,
            data.name
          );
        } catch (error) {
          customLog(null, "error", { message:"Error in transaction report", error })
        }
      });
    }
  });

  // Monthly Scheduler
  const monthlyUserDetails = await corporateUser.findAll({
    where: {
      isActive: true,

    },
    attributes: ["name", "credentialId", "monthlyReport"],
  });
  monthlyUserDetails.forEach((data) => {
    let time = data?.monthlyReport?.scheduledTime;
    if (jobMonthlyMap[data.credentialId]) {
      jobMonthlyMap[data.credentialId].cancel();
      delete jobMonthlyMap[data.credentialId]; // Remove the canceled job from the map
    }

    if (data?.monthlyReport?.isActive && time) {
      const adjustedTime = getAdjustedTime(time)
      let [hour, minute] = adjustedTime.split(":");
      let rule = new schedule.RecurrenceRule();
      rule.hour = parseInt(hour);
      rule.minute = parseInt(minute);
      rule.date = 2;

      if (rule.minute >= 0 && rule.minute <= 9) {
        rule.minute = rule.minute.toString(); // Convert to string to remove leading zero
      }
      jobMonthlyMap[data.credentialId] = schedule.scheduleJob(rule, async function () {
        const type = "Monthly";
        try {
          const nowIST = moment().tz('Asia/Kolkata');
          let from = nowIST.clone().subtract(1, 'month').startOf('month').format('YYYY-MM-DD') + " 00:00:00";
          let to = nowIST.clone().subtract(1, 'month').endOf('month').format('YYYY-MM-DD') + " 23:59:59";
          // let body =
          //   "<p>Hello,</p><p>You have not made any transactions last month. </p> <p>Regards</p><p>PEKO</p> ";
            
          const body = `
          <p>Hello,</p>
          <p>You have not made any transactions last month.</p>
          <br>
          <p>Thank you for using Peko.</p>
          <br>
          <p>If you have any queries or need further assistance, please reach out to us at 
            <a href="mailto:reach@peko.one">reach@peko.one</a>. We assure you of our best services at all times.
          </p>
          <p>Best Regards</p>
          <p>Team Peko</p>
        `;

          await transactionReport(
            data.monthlyReport.email,
            data.credentialId,
            from,
            to,
            type,
            body,
            data.name
          );
        } catch (error) {
          customLog(null, "error", { message:"Error in transaction report", error })
        }
      });
    }
  });
};


function getAdjustedTime(time, sourceFormat = 'HH:mm') {
  // Check if the current time format is Indian time (Asia/Kolkata) or UTC
  const isIndia = moment.tz(moment().format('YYYY-MM-DD HH:mm'), 'Asia/Kolkata').utcOffset() === moment().utcOffset();

  // If the current time format is UTC, convert the provided time from Indian time to UTC
  if (!isIndia) {
    const indiaDateTime = moment.tz(moment().format('YYYY-MM-DD') + ' ' + time, 'Asia/Kolkata');
    const utcDateTime = indiaDateTime.clone().utc();
    time = utcDateTime.format(sourceFormat);
  }

  return time;
}


exports.dailyReportScheduler=async(data)=>{
    let time = data?.dailyReport?.scheduledTime;
    if (jobDailyMap[data.credentialId]) {
      jobDailyMap[data.credentialId].cancel();
      delete jobDailyMap[data.credentialId]; // Remove the canceled job from the map
    }
    if (data?.dailyReport?.isActive && time) {
      const adjustedTime = getAdjustedTime(time)
      let [hour, minute] = adjustedTime.split(":");
      let rule = new schedule.RecurrenceRule();
      rule.hour = parseInt(hour);
      rule.minute = parseInt(minute);

      if (rule.minute >= 0 && rule.minute <= 9) {
        rule.minute = rule.minute.toString(); // Convert to string to remove leading zero
      }
      // Schedule a new job for the current user
      jobDailyMap[data.credentialId] = schedule.scheduleJob(rule, async function () {
        const type = "Daily";
        try {
          let from = moment().tz('Asia/Kolkata').subtract(1, 'd').format('YYYY-MM-DD') + " " + '00:00:00';
          let to = moment().tz('Asia/Kolkata').subtract(1, 'd').format('YYYY-MM-DD') + " " + '23:59:59';

          await transactionReport(
            data.dailyReport.email,
            data.credentialId,
            from,
            to,
            type,
            'yesterday',
            data.name
          );
        } catch (error) {
          customLog(null, "error", { message:"Error in transaction report", error })
        }
      });
    }
}

const generateTransactionReportForAllUsers = async (adminEmail, from, to, type) => {

  const results = await transactionsExcelReportAdmin({from:from,to:to})
  const resultsSubscription = await transactionsSubscriptionExcelReportAdminNew({from:from,to:to})

  const combinedData = results.flat();

  const [
    revenueResult,
    transactionsResult,
    pendingTicketsResult,
    signupsResult,
    loggedInResult,
    subAmountResult,
    subCountResult,
  ] = await Promise.allSettled([
    sequelizeConfig.query(
      `SELECT SUM(debitAmount) AS totalRevenue 
       FROM reportAll 
       WHERE (status != 'REFUND' AND status != 'REFUNDED') 
       AND transactionDate BETWEEN ? AND ?;`,
      { type: sequelizeConfig.QueryTypes.SELECT, replacements: [from, to] }
    ),
    sequelizeConfig.query(
      `SELECT COUNT(*) AS totalTransactions 
       FROM reportAll 
       WHERE (status != 'REFUND' AND status != 'REFUNDED') 
       AND transactionDate BETWEEN ? AND ?;`,
      { type: sequelizeConfig.QueryTypes.SELECT, replacements: [from, to] }
    ),
    sequelizeConfig.query(
      `SELECT COUNT(*) AS totalPendingTickets 
       FROM supports 
       WHERE status = 'PENDING' 
       AND createdAt BETWEEN ? AND ?;`,
      { type: sequelizeConfig.QueryTypes.SELECT, replacements: [from, to] }
    ),
    sequelizeConfig.query(
      `SELECT COUNT(*) AS totalSignups 
       FROM corporateUsers 
       WHERE createdAt BETWEEN ? AND ?;`,
      { type: sequelizeConfig.QueryTypes.SELECT, replacements: [from, to] }
    ),
    sequelizeConfig.query(
      `SELECT COUNT(DISTINCT cu.id) AS totalLoggedIn
       FROM corporateUsers cu
       INNER JOIN credentials c ON cu.credentialId = c.id
       WHERE c.lastLogin BETWEEN ? AND ?;`,
      { type: sequelizeConfig.QueryTypes.SELECT, replacements: [from, to] }
    ),
    order.sum("amountInINR", {
      where: {
        optional: { [Op.ne]: null },
        transactionDate: { [Op.between]: [from, to] }
      }
    }),
    order.count({
      where: {
        optional: { [Op.ne]: null },
        status: 'SUCCESS',
        transactionDate: { [Op.between]: [from, to] }
      }
    }),
  ]);

  const safeValue = (result, extractor) => {
    if (result.status === 'fulfilled') {
      try { return extractor(result.value); } catch { return 0; }
    }
    customLog(null, "error", { message: "Summary query failed", error: result.reason?.message });
    return 0;
  };

  const dataSummary = {
    totalRevenue: safeValue(revenueResult, v => v[0]?.totalRevenue || 0),
    totalTransactions: safeValue(transactionsResult, v => parseInt(v[0]?.totalTransactions) || 0),
    totalPendingTickets: safeValue(pendingTicketsResult, v => parseInt(v[0]?.totalPendingTickets) || 0),
    totalSignups: safeValue(signupsResult, v => parseInt(v[0]?.totalSignups) || 0),
    totalCorporateUsersLoggedIn: safeValue(loggedInResult, v => parseInt(v[0]?.totalLoggedIn) || 0),
    totalsubscriptionAmount: safeValue(subAmountResult, v => v || 0),
    totalsubscriptionCount: safeValue(subCountResult, v => v || 0),
  };
  const fileNamePrefix = `${type}_monitoring_report`;

  
  if (dataSummary.totalTransactions > 0 || dataSummary.totalsubscriptionCount > 0) {
    const excelData = await dataConversion(combinedData, fileNamePrefix,resultsSubscription);
    
    const subject = generateSubject(type, from, to);
    
    let emailBody = `The ${type} monitoring report has been attached to this email.`;
    
    // Send email with the Excel report
    const emailData = await sendAdminReportEmail(
      adminEmail,
      subject,
      excelData.fileName,
      excelData.filePath,
      {
        countOfloggedinCorporates: dataSummary.totalCorporateUsersLoggedIn,
        totalTransactions: dataSummary.totalTransactions+dataSummary.totalsubscriptionCount,
        totalSignups: dataSummary.totalSignups,
        totalRevenue: parseFloat(dataSummary.totalRevenue)+dataSummary.totalsubscriptionAmount,
        totalPendingTickets: dataSummary.totalPendingTickets,
        emailBody,
      }
    );

    if (emailData) {
      try {
        await fsPromises.unlink(excelData.filePath);
      } catch (err) {
        customLog(null, "error", { message:"Error in removing file", error:err })
      }
    }

    return excelData;

  } else {
    const subject = generateSubject(type, from, to);
    const emailBody = `No transactions were made between this timeline.`;

    await sendAdminReportEmail(
      adminEmail,
      subject,
      null,
      null,
      {
        countOfloggedinCorporates: dataSummary.totalCorporateUsersLoggedIn,
        totalTransactions: dataSummary.totalTransactions+dataSummary.totalsubscriptionCount,
        totalSignups: dataSummary.totalSignups,
        totalRevenue: parseFloat(dataSummary.totalRevenue)+dataSummary.totalsubscriptionAmount,
        totalPendingTickets: dataSummary.totalPendingTickets,
        emailBody,
      }
    );

    return null; 
  }
};

const generateTransactionReportForAllUsersAdmin = async (adminEmail, from, to, type) => {
  const results = await transactionsExcelReportAdminNew({from:from,to:to})
  const resultsSubscription = await transactionsSubscriptionExcelReportAdminNew({from:from,to:to})

  const combinedData = results.flat();

  const [
    revenueResult,
    transactionsResult,
    pendingTicketsResult,
    signupsResult,
    loggedInResult,
    subAmountResult,
    subCountResult,
  ] = await Promise.allSettled([
    sequelizeConfig.query(
      `SELECT SUM(debitAmount) AS totalRevenue 
       FROM reportAll 
       WHERE (status != 'REFUND' AND status != 'REFUNDED') 
       AND transactionDate BETWEEN ? AND ?;`,
      { type: sequelizeConfig.QueryTypes.SELECT, replacements: [from, to] }
    ),
    sequelizeConfig.query(
      `SELECT COUNT(*) AS totalTransactions 
       FROM reportAll 
       WHERE (status != 'REFUND' AND status != 'REFUNDED') 
       AND transactionDate BETWEEN ? AND ?;`,
      { type: sequelizeConfig.QueryTypes.SELECT, replacements: [from, to] }
    ),
    sequelizeConfig.query(
      `SELECT COUNT(*) AS totalPendingTickets 
       FROM supports 
       WHERE status = 'PENDING' 
       AND createdAt BETWEEN ? AND ?;`,
      { type: sequelizeConfig.QueryTypes.SELECT, replacements: [from, to] }
    ),
    sequelizeConfig.query(
      `SELECT COUNT(*) AS totalSignups 
       FROM corporateUsers 
       WHERE createdAt BETWEEN ? AND ?;`,
      { type: sequelizeConfig.QueryTypes.SELECT, replacements: [from, to] }
    ),
    sequelizeConfig.query(
      `SELECT COUNT(DISTINCT cu.id) AS totalLoggedIn
       FROM corporateUsers cu
       INNER JOIN credentials c ON cu.credentialId = c.id
       WHERE c.lastLogin BETWEEN ? AND ?;`,
      { type: sequelizeConfig.QueryTypes.SELECT, replacements: [from, to] }
    ),
    order.sum("amountInINR", {
      where: {
        optional: { [Op.ne]: null },
        transactionDate: { [Op.between]: [from, to] }
      }
    }),
    order.count({
      where: {
        optional: { [Op.ne]: null },
        status: 'SUCCESS',
        transactionDate: { [Op.between]: [from, to] }
      }
    }),
  ]);

  // Safely extract values -- default to 0 if any query failed
  const safeValue = (result, extractor) => {
    if (result.status === 'fulfilled') {
      try { return extractor(result.value); } catch { return 0; }
    }
    customLog(null, "error", { message: "Summary query failed", error: result.reason?.message });
    return 0;
  };

  const dataSummary = {
    totalRevenue: safeValue(revenueResult, v => v[0]?.totalRevenue || 0),
    totalTransactions: safeValue(transactionsResult, v => parseInt(v[0]?.totalTransactions) || 0),
    totalPendingTickets: safeValue(pendingTicketsResult, v => parseInt(v[0]?.totalPendingTickets) || 0),
    totalSignups: safeValue(signupsResult, v => parseInt(v[0]?.totalSignups) || 0),
    totalCorporateUsersLoggedIn: safeValue(loggedInResult, v => parseInt(v[0]?.totalLoggedIn) || 0),
    totalsubscriptionAmount: safeValue(subAmountResult, v => v || 0),
    totalsubscriptionCount: safeValue(subCountResult, v => v || 0),
  };
  const fileNamePrefix = `${type}_monitoring_report`;

  
  if (dataSummary.totalTransactions > 0 || dataSummary.totalsubscriptionCount > 0) {
    const excelData = await dataConversion(combinedData, fileNamePrefix,resultsSubscription);
    
    const subject = generateSubject(type, from, to);
    
    let emailBody = `The ${type} monitoring report has been attached to this email.`;
    
    // Send email with the Excel report
    const emailData = await sendAdminReportEmail(
      adminEmail,
      subject,
      excelData.fileName,
      excelData.filePath,
      {
        countOfloggedinCorporates: dataSummary.totalCorporateUsersLoggedIn,
        totalTransactions: dataSummary.totalTransactions+dataSummary.totalsubscriptionCount,
        totalSignups: dataSummary.totalSignups,
        totalRevenue: parseFloat(dataSummary.totalRevenue)+dataSummary.totalsubscriptionAmount,
        totalPendingTickets: dataSummary.totalPendingTickets,
        emailBody,
      }
    );

    if (emailData) {
      try {
        await fsPromises.unlink(excelData.filePath);
      } catch (err) {
        customLog(null, "error", { message:"Error in removing file", error:err })
      }
    }

    return excelData;

  } else {
    const subject = generateSubject(type, from, to);
    const emailBody = `No transactions were made between this timeline.`;

    await sendAdminReportEmail(
      adminEmail,
      subject,
      null,
      null,
      {
        countOfloggedinCorporates: dataSummary.totalCorporateUsersLoggedIn,
        totalTransactions: dataSummary.totalTransactions+dataSummary.totalsubscriptionCount,
        totalSignups: dataSummary.totalSignups,
        totalRevenue: parseFloat(dataSummary.totalRevenue)+dataSummary.totalsubscriptionAmount,
        totalPendingTickets: dataSummary.totalPendingTickets,
        emailBody,
      }
    );

    return null; 
  }
};

exports.scheduleDailyReportOfCorporates = async (corporateUsers, admin) => {
  try {
    if (!admin || !admin.dataValues.dailyReport) {
      return;
    }

    const { dailyReport } = admin.dataValues;
    const adminCredentialId = admin.dataValues.credentialId;

    // Cancel existing job if it's already scheduled for this admin
    if (jobDailyDataForAdmin[adminCredentialId]) {
      jobDailyDataForAdmin[adminCredentialId].cancel();
      delete jobDailyDataForAdmin[adminCredentialId]; // Remove the canceled job from the map
    }

    if (!dailyReport.isActive || !dailyReport.scheduledTime) {
      return; 
    }

    // Get adjusted time for scheduling the job
    const adjustedTime = getAdjustedTime(dailyReport.scheduledTime);
    const [hour, minute] = adjustedTime.split(":").map(Number);

    const rule = new schedule.RecurrenceRule();
    rule.hour = hour;
    rule.minute = minute >= 0 && minute <= 9 ? minute.toString() : minute;
    // Schedule the job
    jobDailyDataForAdmin[adminCredentialId] = schedule.scheduleJob(rule, async () => {
      const type = "Daily";

      const reportParams = {
        emailId: dailyReport.email,
        from: moment().tz('Asia/Kolkata').subtract(1, 'd').format('YYYY-MM-DD') + " 00:00:00",
        to: moment().tz('Asia/Kolkata').subtract(1, 'd').format('YYYY-MM-DD') + " 23:59:59",
      };

      // Fetch and send transaction report
      const reportData = await generateTransactionReportForAllUsers(reportParams.emailId, reportParams.from, reportParams.to, type, corporateUsers);

      if (reportData) {
        customLog(null, "info", { message: "Report sent to admin successfully." })

      } else {
        customLog(null, "info", { message: "No transaction data found for the report." })

      }
    });

    // Confirm scheduling
    if (jobDailyDataForAdmin[adminCredentialId]) {
      customLog(null, "info", { message: "Scheduled daily report for admin with credential ID", adminCredentialId, hour, minute })
    }
  } catch (error) {
    customLog(null, "error", { message: "Error in scheduleDailyReportForCorporates", error })
  }
};


exports.scheduleWeeklyReportOfCorporates = async (admin) => {
  try {
    if (!admin || !admin.dataValues.weeklyReport) {
      customLog(null, "error", { message: "No weekly report settings found for the admin." })
      return;
    }

    const adminWeeklyReport = admin.dataValues.weeklyReport;
    const scheduledTime = adminWeeklyReport.scheduledTime;

    if (!adminWeeklyReport.isActive || !scheduledTime) {
      customLog(null, "error", { message: "Admin's weekly report is inactive or scheduled time is missing." })
      return;
    }

    // Cancel any existing scheduled job for the admin
    if (jobWeeklyDataForAdmin[admin.dataValues.credentialId]) {
      jobWeeklyDataForAdmin[admin.dataValues.credentialId].cancel();
      delete jobWeeklyDataForAdmin[admin.dataValues.credentialId];
    }

    const adjustedTime = getAdjustedTime(scheduledTime);
    const [hour, minute] = adjustedTime.split(":");
    const rule = new schedule.RecurrenceRule();
    rule.hour = parseInt(hour);
    rule.minute = parseInt(minute);

    // Schedule the new weekly report job
    jobWeeklyDataForAdmin[admin.dataValues.credentialId] = schedule.scheduleJob(rule, async function () {
      const reportType = "Weekly";

      const params = {
        emailId: adminWeeklyReport.email,
        from: moment().tz('Asia/Kolkata').subtract(7, 'd').format('YYYY-MM-DD') + " 00:00:00",
        to: moment().tz('Asia/Kolkata').subtract(1, 'd').format('YYYY-MM-DD') + " 23:59:59",
      };


      // Fetch and send the combined report for all users
      const reportData = await generateTransactionReportForAllUsers(
        params.emailId,
        params.from,
        params.to,
        reportType,
        // corporateUsers
      );

      if (reportData) {
        customLog(null, "info", { message: "Weekly report sent successfully." })
      } else {
        customLog(null, "info", { message: "No data available for the weekly report." })
      }
    });

    if (jobWeeklyDataForAdmin[admin.dataValues.credentialId]) {
      customLog(null, "info", { message: `Scheduled weekly report for ${admin?.dataValues?.weeklyReport?.email} at ${rule?.hour}:${rule?.minute}` })
    } else {
      customLog(null, "error", { message: `Failed to schedule weekly report for ${admin?.dataValues?.email}` })
    }

  } catch (error) {
    customLog(null, "error", { message: "Error in scheduling weekly report:", error })
  }
};

exports.scheduleMonthlyReportOfCorporates = async (admin) => {
  try {
    customLog(null, "info", { message: "Starting monthlyReportSchedulerAllCorporates function..." })

    if (!admin || !admin.dataValues.monthlyReport) {
      customLog(null, "error", { message: "Admin or monthly report settings are undefined." })
      return;
    }   
    const { monthlyReport, credentialId } = admin.dataValues;  
    if (!monthlyReport.isActive || !monthlyReport.scheduledTime) {
      customLog(null, "error", { message: "Admin's monthly report is inactive or missing scheduled time." })
      return;
    }

    const adminTime = monthlyReport.scheduledTime;
    const adjustedTime = getAdjustedTime(adminTime);
    let [hour, minute] = adjustedTime.split(":");

    // Create the scheduling rule
    let rule = new schedule.RecurrenceRule();
    rule.hour = parseInt(hour);
    rule.minute = parseInt(minute);
    rule.date = 26;

    // Cancel any existing scheduled job for this admin
    if (jobMonthlyDataForAdmin[credentialId]) {
      customLog(null, "info", { message: `Cancelling existing job for admin: ${admin?.dataValues?.monthlyReport?.email}` })
      jobMonthlyDataForAdmin[credentialId].cancel();
      delete jobMonthlyDataForAdmin[credentialId]; // Remove the canceled job from the map
    }
    // Schedule the new job
    jobMonthlyDataForAdmin[credentialId] = schedule.scheduleJob(rule, async function () {
      customLog(null, "info", { message: `Monthly report job scheduled for ${admin?.dataValues?.monthlyReport?.email} at ${rule}` })
      const type = "Monthly";
      const nowIST = moment().tz('Asia/Kolkata');
      const firstDayOfPreviousMonth = nowIST.clone().subtract(1, 'month').startOf('month').format('YYYY-MM-DD');
      const lastDayOfPreviousMonth = nowIST.clone().subtract(1, 'month').endOf('month').format('YYYY-MM-DD');

      const params = {
        emailId: monthlyReport.email,
        from: firstDayOfPreviousMonth + " 00:00:00",
        to: lastDayOfPreviousMonth + " 23:59:59",
      };


      try {
        // Fetch the combined report for all users
        const combinedExcelData = await generateTransactionReportForAllUsers(params.emailId, params.from, params.to, type);

        if (combinedExcelData) {
          customLog(null, "info", { message: "Monthly report sent to admin successfully." })
        } else {
          customLog(null, "info", { message: "No data collected for the monthly report." })
        }
      } catch (err) {
        customLog(null, "error", { message: `Error executing monthly report job for ${admin?.dataValues?.email}:`, err })
      }

      customLog(null, "info", { message: `Job for ${admin?.dataValues?.email} completed.` })
    });

    // Log the successful scheduling of the job
    if (jobMonthlyDataForAdmin[credentialId]) {
      customLog(null, "info", { message: `Scheduled new monthly job for ${admin?.dataValues?.monthlyReport?.email} at ${hour}:${minute} ` })
    } else {
      customLog(null, "error", { message: `Failed to schedule job for ${admin?.dataValues?.email}` })
    }

  } catch (error) {
    customLog(null, "error", { message: error?.message, data: error?.response?.data })
  }
};




exports.weeklyReportScheduler=async(data)=>{
    let time = data?.weeklyReport?.scheduledTime;
    let day = data?.weeklyReport?.scheduledDay;
    if (jobWeeklyMap[data.credentialId]) {

      jobWeeklyMap[data.credentialId].cancel();
      delete jobWeeklyMap[data.credentialId]; // Remove the canceled job from the map
    }
    if (data?.weeklyReport?.isActive && time) {
      const adjustedTime = getAdjustedTime(time)
      let [hour, minute] = adjustedTime.split(":");
      let rule = new schedule.RecurrenceRule();
      rule.hour = parseInt(hour);
      rule.minute = parseInt(minute);
      rule.dayOfWeek = parseInt(day);

      if (rule.minute >= 0 && rule.minute <= 9) {
        rule.minute = rule.minute.toString(); // Convert to string to remove leading zero
      }
      jobWeeklyMap[data.credentialId] = schedule.scheduleJob(rule, async function () {
        const type = "Weekly";
        try {
          let from =
            moment().tz('Asia/Kolkata').subtract(7, "d").format("YYYY-MM-DD") +
            " 00" +
            ":00" +
            ":00",
            to =
              moment().tz('Asia/Kolkata').subtract(1, "d").format("YYYY-MM-DD") +
              " " +
              "23:59:59";
          await transactionReport(
            data.weeklyReport.email,
            data.credentialId,
            from,
            to,
            type,
            'last week',
            data.name
          );
        } catch (error) {
          customLog(null, "error", { message:"Error in transaction report", error })
        }
      });
    }
}
exports.monthlyReportScheduler=async(data)=>{
    let time = data?.monthlyReport?.scheduledTime;
    if (jobMonthlyMap[data.credentialId]) {

      jobMonthlyMap[data.credentialId].cancel();
      delete jobMonthlyMap[data.credentialId]; // Remove the canceled job from the map
    }

    if (data?.monthlyReport?.isActive && time) {
      const adjustedTime = getAdjustedTime(time)
      let [hour, minute] = adjustedTime.split(":");
      let rule = new schedule.RecurrenceRule();
      rule.hour = parseInt(hour);
      rule.minute = parseInt(minute);
      rule.date = 11;

      if (rule.minute >= 0 && rule.minute <= 9) {
        rule.minute = rule.minute.toString(); // Convert to string to remove leading zero
      }
      jobMonthlyMap[data.credentialId] = schedule.scheduleJob(rule, async function () {
        const type = "Monthly";
        try {
          const nowIST = moment().tz('Asia/Kolkata');
          let from = nowIST.clone().subtract(1, 'month').startOf('month').format('YYYY-MM-DD') + " 00:00:00";
          let to = nowIST.clone().subtract(1, 'month').endOf('month').format('YYYY-MM-DD') + " 23:59:59";
          await transactionReport(
            data.monthlyReport.email,
            data.credentialId,
            from,
            to,
            type,
            'last month',
            data.name
          );
        } catch (error) {
          customLog(null, "error", { message:"Error in transaction report", error })
        }
      });
    }
}

exports.scheduleDailyReportOfCorporatesAdmin = async (admin) => {
  try {
    if (!admin || !admin.dataValues.dailyReport) {
      return;
    }

    const { dailyReport } = admin.dataValues;
    const adminCredentialId = admin.dataValues.credentialId;

    // Cancel existing job if it's already scheduled for this admin
    if (jobDailyDataForAdmin[adminCredentialId]) {
      jobDailyDataForAdmin[adminCredentialId].cancel();
      delete jobDailyDataForAdmin[adminCredentialId]; // Remove the canceled job from the map
    }

    if (!dailyReport.isActive || !dailyReport.scheduledTime) {
      return; 
    }

    // Get adjusted time for scheduling the job
    const adjustedTime = getAdjustedTime(dailyReport.scheduledTime);
    const [hour, minute] = adjustedTime.split(":").map(Number);
    // const hour= "18";
    // const minute="43";
    const rule = new schedule.RecurrenceRule();
    rule.hour = hour;
    rule.minute = minute >= 0 && minute <= 9 ? minute.toString() : minute;
    // Schedule the job
    jobDailyDataForAdmin[adminCredentialId] = schedule.scheduleJob(rule, async () => {
      const type = "Daily";

      const reportParams = {
        emailId: dailyReport.email,
        from: moment().tz('Asia/Kolkata').subtract(1, 'd').format('YYYY-MM-DD') + " 00:00:00",
        to: moment().tz('Asia/Kolkata').subtract(1, 'd').format('YYYY-MM-DD') + " 23:59:59",
      };

      // Fetch and send transaction report
      const reportData = await generateTransactionReportForAllUsersAdmin(reportParams.emailId, reportParams.from, reportParams.to, type, {});

      if (reportData) {
        customLog(null, "info", { message: "Report sent to admin successfully." })
      } else {
        customLog(null, "info", { message: "No transaction data found for the report." })
      }
    });
  
    // Confirm scheduling
    if (jobDailyDataForAdmin[adminCredentialId]) {
      customLog(null, "info", { message: `Scheduled daily report for admin with credential ID ${adminCredentialId} at ${hour}:${minute}` })
    }
  } catch (error) {
    customLog(null, "error", { message: "Error in scheduleDailyReportForCorporates:", error })
  }
};

exports.triggerReportNow = async (adminEmail, from, to, type = 'Daily') => {
  return generateTransactionReportForAllUsers(adminEmail, from, to, type);
};

exports.triggerAdminReportNow = async (adminEmail, from, to, type = 'Daily') => {
  return generateTransactionReportForAllUsersAdmin(adminEmail, from, to, type, {});
};