/* eslint-disable no-unused-vars */
const { promisify } = require("util");
const moment = require("moment");
const setTimeoutPromise = promisify(setTimeout);
const CorporateUser = require("../models/entities/corporateUser");

const {
  holidayTemplate,
} = require("../utils/email/emailTemplates/holidayAnnouncement");
const { email } = require("../utils/email/emailer");
const { getNextDaysHolidays } = require("../models/use-cases/holiyDay");
const { getActiveEmployees } = require("../models/use-cases/employee");
const { humanReadableDate } = require("../utils/dateUtils");
const { findOneHrSettings } = require("../models/use-cases/hrSettings");
const { getEmployeesWithBirthdayToday } = require("../models/use-cases/calendarActivities");
const { birthdayTemplate } = require("../utils/email/emailTemplates/birthday");
const { resolveDynamicEmail } = require("./emailTemplateResolver");
const { PAYROLL_EMAIL_TEMPLATE_KEYS } = require("../utils/email/emailTemplateKeys");
const { v2LayoutVariables } = require("../utils/email/sharedLayout");

const BIRTHDAY_HERO_IMAGE = 'https://d2fduk7g9mvyjq.cloudfront.net/common/birthday.jpeg';
/**
 * send email to all employees prior to the holiday, corporate user wise sending
 */
exports.sendHolidayEmails = async () => {
  try {
    //Step-1 Fetch all corporate users, need their id
    const corporateUsers = await CorporateUser.find({});
    const corporateUsersIDs = corporateUsers.map(user => user._id);


    //Step-2 Iterating through corporate users ids
    for (const user of corporateUsersIDs) {
      const corporateData = await findOneHrSettings(user)
      //Step-3 find tomorrows holidays where email needs to be send
      let allHolidays = await getNextDaysHolidays(user)
      if (!allHolidays || !Array.isArray(allHolidays) || allHolidays.length < 1) {
        continue;
      }
      //Step-4  find active employees
      let employees = await getActiveEmployees(user)

      //Step-5  find active employees
      allHolidays.forEach(async (holiday, i) => {
        if (holiday && holiday.sendPriorEmail && !holiday.isEmailSent) {
          // Iterating through each employee to send email
          const logo = corporateData?.companyProfile?.companyLogo || corporateData?.corporateUser?.logo;
          const website = corporateData?.corporateUser?.website;
          const companyName = corporateData?.companyProfile?.companyName || corporateData?.corporateUser?.companyName;
          const hrManagerName = corporateData?.officialDocuments?.hrManagerName || '';
          const formattedStartDate = moment(holiday.start).format('MMMM D, YYYY');

          for (const employee of employees) {
            const params = {
              start: humanReadableDate(holiday.start),
              end: humanReadableDate(holiday.end),
              title: holiday.title,
              fullName: employee.fullName
            };
            const resolved = await resolveDynamicEmail({
              req: undefined,
              key: PAYROLL_EMAIL_TEMPLATE_KEYS.HOLIDAY_REMINDER,
              variables: {
                formattedStartDate,
                title: params.title || '',
                hrManagerName,
                // branding shows the employee's own corporate in the header; companyName
                // is not a genuine Peko reseller partner, so footerBranding overrides it
                // back to Peko for the footer's partner-icon-hiding gate.
                ...v2LayoutVariables({ website, logo, branding: companyName, footerBranding: 'Peko' }),
              },
              fallbackSubject: 'Holiday Reminder',
              fallbackHtml: holidayTemplate(params, corporateData),
              partnerId: null,
            });
            let resp = await email(employee.personalEmail, resolved.subject, resolved.html);
          }
          holiday.isEmailSent = true;
          await holiday.save();
        }
      })


    }
  } catch (error) {
    console.error("Error in sendHolidayEmails:", error);
    throw error
  }
};
/** //model sample for logging purpose
 * corporateUserID
 * event
 * details -- can store holiday id,etc
 * status    --success /fails
 */

async function retryWithExponentialBackoff() {
  const maxRetries = 5;
  const baseDelay = 2000;
  let result;
  let retryCount = 0;
  while (retryCount < maxRetries) {
    try {
      // result = await performTask();
      console.log("Task completed successfully");
      return; // Exit loop if task succeeds
      //save to db about the event and status
    } catch (error) {
      // console.error(`Task failed on attempt ${retryCount + 1}: ${error.message}`);
      result = error.message;
      retryCount++;
      const delay = baseDelay * Math.pow(2, retryCount);
      console.log(">>>>>>>>>>>>>>>>>>>>>>>>>>>.", delay);

      // console.log(`Retrying in ${delay} milliseconds`);
      await setTimeoutPromise(delay);
    }
  }
  //save to data bae about this event

  console.error("Task failed after maximum retries");
}

exports.sendBirthDayMails = async () => {
  console.log("sendBirthDayMails called>>>>>>>>>>>>>>>>>>>>>>>>>>>.");
  try {
    // Step-1 Fetch all corporate users, need their id
    const corporateUsers = await CorporateUser.find({});
    const corporateUsersIDs = corporateUsers.map(user => user._id);

    // Step-2 Iterating through corporate users ids
    for (const userId of corporateUsersIDs) {
      const corporateData = await findOneHrSettings(userId);
      const todaysBirthDays = await getEmployeesWithBirthdayToday(userId);

      if (!todaysBirthDays || !Array.isArray(todaysBirthDays) || todaysBirthDays.length < 1) {
        continue;
      }

      // Step-3 creating template and sending email
      for (const birthday of todaysBirthDays) {
        if (birthday && birthday.email) {
          // Iterating through each employee to send email
          const params = {
            name: birthday.fullName,
            dateOfBirth: humanReadableDate(birthday.dateOfBirth),
            today: birthday.nextBirthday,
          };
          const logo = corporateData?.companyProfile?.companyLogo || corporateData?.corporateUser?.logo;
          const website = corporateData?.corporateUser?.website;
          const companyName = corporateData?.companyProfile?.companyName || corporateData?.corporateUser?.companyName;

          try {
            const resolved = await resolveDynamicEmail({
              req: undefined,
              key: PAYROLL_EMAIL_TEMPLATE_KEYS.BIRTHDAY,
              variables: {
                name: params.name || '',
                dateOfBirth: params.dateOfBirth || '',
                today: params.today || '',
                heroImage: BIRTHDAY_HERO_IMAGE,
                // branding shows the employee's own corporate in the header; companyName
                // is not a genuine Peko reseller partner, so footerBranding overrides it
                // back to Peko for the footer's partner-icon-hiding gate.
                ...v2LayoutVariables({ website, logo, branding: companyName, footerBranding: 'Peko' }),
              },
              fallbackSubject: 'Happy Birthday!!',
              fallbackHtml: birthdayTemplate(params, corporateData),
              partnerId: null,
            });
            await email(birthday.email, resolved.subject, resolved.html);
          } catch (emailError) {
            console.error(`Error sending email to ${birthday.email}:`, emailError);
          }
        }
      }
    }
  } catch (error) {
    console.error("Error in sendBirthDayMails:", error);
    throw error;
  }
};
