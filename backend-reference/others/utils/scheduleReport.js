/* eslint-disable no-undef */
const schedule = require("node-schedule");
const { transactionsExcelReport } = require("../models/use-cases/transaction");
const { dataConversion } = require("../utils/reportToExcel");
const { emailWithExcel ,emailWithoutData} = require("../utils/emailer");
const { promises: fsPromises } = require("fs");
const corporateUser = require("../models/entities/corporateUser");
const moment = require("moment");

//Calling Function to get the details of order Report

const transactionReport = async (emailId, credentialId, from, to, type,body) => {
  let params = {
    credentialId,
    from,
    to,
  };
  let data = await transactionsExcelReport(params);
  const excelData = await dataConversion(data, type);

  if (excelData) {
    // F-OTH-22: unlink in `finally` so the temp file is always cleaned up, even if
    // emailWithExcel throws (previously a send failure left the file on disk forever).
    try {
      const emailData = await emailWithExcel(
        emailId,
        "Transaction Report",
        excelData.fileName,
        excelData.filePath
      );
      if (!emailData) {
        await emailWithoutData(emailId, "Transaction Report", body);
      }
      return excelData;
    } finally {
      try {
        await fsPromises.unlink(excelData.filePath);
      } catch (err) {
        console.error("Error removing file:", err);
      }
    }
  } else {
    emailWithoutData(emailId, "Transaction Report",body);
  }
};
let jobDailyMap = {};
let jobWeeklyMap={};
let jobMonthlyMap={};

exports.cronTaskScheduler = async () => {
  // F-OTH-16: node-schedule jobs only live in this process's memory, so this now also runs
  // once at server startup (bin/www) in addition to every settings-update call — a DB not
  // yet ready at that point must not crash startup, just log and leave jobs unscheduled
  // until the next settings update re-triggers this.
  try {
  const dailyUserDetails = await corporateUser.findAll({
    where: {
      isActive: true,
     
    },
    attributes: ["name", "credentialId", "dailyReport"],
  });
  dailyUserDetails.forEach((data) => {
    let time = data?.dailyReport?.scheduledTime;
    if (jobDailyMap[data.credentialId]) {
      jobDailyMap[data.credentialId].cancel(true);
      delete jobDailyMap[data.credentialId]; // Remove the canceled job from the map
    }
    if (data?.dailyReport?.isActive&&time ) {
      let [hour, minute] = time.split(":");
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
          let from = moment().subtract(1, 'd').format('YYYY-MM-DD') + " " + '00:00:00';
          let to = moment().subtract(1, 'd').format('YYYY-MM-DD') + " " + '23:59:59';
          let body =
            "<p>Hello,</p><p>You Dont Have Any Orders Last Day.</p> <p>Regards</p><p>PEKO</p>";
          await transactionReport(
            data.dailyReport.email,
            data.credentialId,
            from,
            to,
            type,
            body
          );
        } catch (error) {
          console.error("Error in transactionReport:", error);
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
    
      jobWeeklyMap[data.credentialId].cancel(true);
      delete jobWeeklyMap[data.credentialId]; // Remove the canceled job from the map
    }
    if (data?.weeklyReport?.isActive&&time) {
      let [hour, minute] = time.split(":");
      let rule = new schedule.RecurrenceRule();
      rule.hour = parseInt(hour);
      rule.minute = parseInt(minute);
      rule.dayOfWeek = parseInt(day);
     
      if (rule.minute >= 0 && rule.minute <= 9) {
        rule.minute = rule.minute.toString(); // Convert to string to remove leading zero
      }
      jobWeeklyMap[data.credentialId]= schedule.scheduleJob(rule, async function () {
        const type = "Weekly";
        try {
                      let from =
                          moment().subtract(7, "d").format("YYYY-MM-DD") +
                          " 00" +
                          ":00" +
                          ":00",
                        to =
                          moment().subtract(1, "d").format("YYYY-MM-DD") +
                          " " +
                          "23:59:59";
                          let body =
    "<p>Hello,</p><p>You Dont Have Any Orders Last Week.</p> <p>Regards</p><p>PEKO</p> ";

          await transactionReport(
            data.weeklyReport.email,
            data.credentialId,
            from,
            to,
            type,
            body
          );
        } catch (error) {
          console.error("Error in transactionReport:", error);
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
    
      jobMonthlyMap[data.credentialId].cancel(true);
      delete jobMonthlyMap[data.credentialId]; // Remove the canceled job from the map
    }
   
    if (data?.monthlyReport?.isActive&&time) {
      let [hour, minute] = time.split(":");
      let rule = new schedule.RecurrenceRule();
      rule.hour = parseInt(hour);
      rule.minute = parseInt(minute);
      rule.date = 2;
     
      if (rule.minute >= 0 && rule.minute <= 9) {
        rule.minute = rule.minute.toString(); // Convert to string to remove leading zero
      }
      jobMonthlyMap[data.credentialId]= schedule.scheduleJob(rule, async function () {
        const type = "Monthly";
        try {   
              let currentDayDate = new Date();
              let firstDayOfPreviousMonth = new Date(
                currentDayDate.getFullYear(),
                currentDayDate.getMonth() - 1,
                1
              );
              let lastDayOfPreviousMonth = new Date(
                currentDayDate.getFullYear(),
                currentDayDate.getMonth(),
                0
              );   
              let from =
                moment(firstDayOfPreviousMonth).format("YYYY-MM-DD") + " 00:00:00";
              let to =
                moment(lastDayOfPreviousMonth).format("YYYY-MM-DD") + " 23:59:59";
                let body =
    "<p>Hello,</p><p>You Dont Have Any Orders Last Month.</p> <p>Regards</p><p>PEKO</p> ";
          await transactionReport(
            data.monthlyReport.email,
            data.credentialId,
            from,
            to,
            type,
            body
          );
        } catch (error) {
          console.error("Error in transactionReport:", error);
        }
      });
    }
  });
  } catch (error) {
    console.error("Failed to initialize scheduled report jobs:", error);
  }
};
