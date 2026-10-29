/* eslint-disable no-unused-vars */
const { promisify } = require("util");
const setTimeoutPromise = promisify(setTimeout);
const CorporateUser = require("../models/entities/payroll/corporateUser");

const {
  holidayTemplate,
} = require("../utils/email/emailTemplates/holidayAnnouncement");
const { email } = require("../utils/email/emailer");
const { getNextDaysHolidays } = require("../models/use-cases/payroll/holiyDay");
const { getActiveEmployees } = require("../models/use-cases/payroll/employee");
const { humanReadableDate } = require("../utils/dateUtils");
const { findOneHrSettings } = require("../models/use-cases/payroll/hrSettings");
const { getEmployeesWithBirthdayToday } = require("../models/use-cases/payroll/calendarActivities");
const { birthdayTemplate } = require("../utils/email/emailTemplates/birthday");
const { customLog } = require("../utils/loggerHelper");
const { resolveEmailTemplate } = require("./emailTemplateResolver");
const { EMAIL_TEMPLATE_KEYS, EMAIL_TEMPLATE_SERVICES } = require("../utils/emailTemplateKeys");
const { v2LayoutVariables } = require("../utils/emailTemplate/sharedLayout");
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
      //Step-3 find tomorrows holidays where email needs to be send
      let allHolidays = await getNextDaysHolidays(user)
     
      
      if (!allHolidays || !Array.isArray(allHolidays) || allHolidays.length < 1) {
        continue;
      }
      //Step-4  find active employees
      let employees = await getActiveEmployees(user)
      const hrSettings = await findOneHrSettings(user);

      //Step-5  find active employees
      allHolidays.forEach(async (holiday, i) => {
        // forEach does not await async callbacks, so catch per item or the error is lost
        try {
        if (holiday &&  !holiday.isEmailSent) {
          // Iterating through each employee to send email
          for (const employee of employees) {
            const params = {
              start: humanReadableDate(holiday.start),
              end: humanReadableDate(holiday.end),
              title: holiday.title,
              fullName: employee.fullName
            };
            if (employee.personalEmail) {
              const branding = hrSettings?.corporateUser?.companyName || 'Peko';
              const website = 'https://www.peko.one';
              const resolved = await resolveEmailTemplate({
                key: EMAIL_TEMPLATE_KEYS.HOLIDAY_REMINDER,
                service: EMAIL_TEMPLATE_SERVICES.SCHEDULER,
                variables: {
                  title: params.title,
                  start: params.start,
                  hrManagerName: hrSettings?.officialDocuments?.hrManagerName,
                  branding,
                  website,
                  // branding here is the employee's own corporate (header logo/alt-text),
                  // not a genuine Peko reseller partner - force Peko branding so the
                  // footer's partner-icon-hiding gate doesn't fire for every corporate.
                  ...v2LayoutVariables({ branding: 'Peko', website, logo: hrSettings?.corporateUser?.logo }),
                },
                fallback: () => holidayTemplate(params, hrSettings),
                fallbackSubject: "Holiday Reminder",
              });
              await email(employee.personalEmail, resolved.subject, resolved.html);
            }
          }
          holiday.isEmailSent = true;
          await holiday.save();
        }
        } catch (error) {
            customLog(null, "error", { message: "Holiday job failed for holiday", holidayId: holiday?.id, error: error?.message || error });
        }
      })


    }
  } catch (error) {
    customLog(null, "error", { message:"Error in sendHolidayEmails ", error })
    throw error
  }
};
/** //model sample for logging purpose
 * corporateUserID
 * event
 * details -- can store holiday id,etc
 * status    --success /fails
 */

exports.sendBirthDayMails = async () => {
  customLog(null, "info", { message: "sendBirthDayMails service called" })
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
          const birthdayParams = {
            name: birthday.fullName,
            dateOfBirth: humanReadableDate(birthday.dateOfBirth),
            today: birthday.nextBirthday,
          };

          try {
            const branding = corporateData?.corporateUser?.companyName || 'Peko';
            const website = 'https://www.peko.one';
            const resolved = await resolveEmailTemplate({
              key: EMAIL_TEMPLATE_KEYS.EMPLOYEE_BIRTHDAY_WISH,
              service: EMAIL_TEMPLATE_SERVICES.SCHEDULER,
              variables: {
                name: birthdayParams.name,
                branding,
                website,
                // branding here is the employee's own corporate (header logo/alt-text),
                // not a genuine Peko reseller partner - force Peko branding so the
                // footer's partner-icon-hiding gate doesn't fire for every corporate.
                ...v2LayoutVariables({ branding: 'Peko', website, logo: corporateData?.corporateUser?.logo }),
              },
              fallback: () => birthdayTemplate(birthdayParams, corporateData),
              fallbackSubject: "Happy Birthday!!",
            });
            await email(birthday.email, resolved.subject, resolved.html);
          } catch (emailError) {
            customLog(null, "error", { message:"error sending email", error:emailError, email: birthday.email })
          }
        }
      }
    }
  } catch (error) {
    customLog(null, "error", { message:"Error in sendBirthdaymails", error })
    throw error;
  }
};
