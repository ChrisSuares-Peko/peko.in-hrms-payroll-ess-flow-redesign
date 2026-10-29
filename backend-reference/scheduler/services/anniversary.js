const CorporateUser = require("../models/entities/payroll/corporateUser");
const Employee = require("../models/entities/payroll/employee");
const { anniversary1To4ExpTemplate, anniversary4ToAnyExpTemplate } = require("../utils/email/emailTemplates/anniversary");
const emailer = require('../utils/email/emailer');
const { customLog } = require("../utils/loggerHelper");
const { resolveEmailTemplate } = require("./emailTemplateResolver");
const { EMAIL_TEMPLATE_KEYS, EMAIL_TEMPLATE_SERVICES } = require("../utils/emailTemplateKeys");
const { v2LayoutVariables } = require("../utils/emailTemplate/sharedLayout");

exports.sendAnniversaryMails  = async () => {
    try {
      //Step-1 Fetch all employee users, need their id
      const employeeDetails = await Employee.find({});

    const currentDate = new Date();

    for (const user of employeeDetails) {

        let joinDate = new Date(user?.employeeInformation?.dateOfJoin);
    
        const isLeapYear = (year) => (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
        
        // Check if join date is February 29th and the current year is not a leap year
        if (
          joinDate.getMonth() === 1 && 
          joinDate.getDate() === 29 &&
          !isLeapYear(currentDate.getFullYear())
        ) {
          // Adjust the join date to February 28th of the current year
          joinDate.setMonth(1);
          joinDate.setDate(28);
        }
        
        // Check if the current date is before the anniversary date within the current year
        if (joinDate.getDate() === currentDate.getDate() && joinDate.getMonth() === currentDate.getMonth() && joinDate.getYear() != currentDate.getYear()) {

          let  yearOfExperience = currentDate.getFullYear() - joinDate.getFullYear();
          let employeeName = user.fullName
          let email = user.personalEmail
          let subject = `Celebrating Your ${yearOfExperience}-Year Work Anniversary!`
          let corporateId = user.corporateUser
        //   let CorporateUser.
        let companyName
        let companyLogo
        const corporateDetails = await CorporateUser.findOne({ _id: corporateId });
           if(corporateDetails){
            companyName = corporateDetails.companyName
            companyLogo = corporateDetails.logo
           }
           const branding = companyName || 'Peko';
           const website = 'https://www.peko.one';
           const syntheticPartnerDetails = { branding, website, logo: companyLogo };
           // companyName is the employee's own corporate (for the header logo/alt-text),
           // not a genuine Peko reseller partner - force Peko branding here so the
           // footer's partner-icon-hiding gate doesn't fire for every corporate.
           const footerLayoutVariables = v2LayoutVariables({ ...syntheticPartnerDetails, branding: 'Peko' });
           let resolved
           if (yearOfExperience <= 4){
            let text = yearOfExperience == 1 ? 'year' : 'years'
            resolved = await resolveEmailTemplate({
              key: EMAIL_TEMPLATE_KEYS.ANNIVERSARY_1_TO_4_YEARS,
              service: EMAIL_TEMPLATE_SERVICES.SCHEDULER,
              variables: {
                employeeName,
                companyName,
                experience: yearOfExperience,
                text,
                branding,
                website,
                ...footerLayoutVariables,
              },
              fallback: () => anniversary1To4ExpTemplate(employeeName, companyName, yearOfExperience, companyLogo),
              fallbackSubject: subject,
            })
           }else{
            resolved = await resolveEmailTemplate({
              key: EMAIL_TEMPLATE_KEYS.ANNIVERSARY_4_PLUS_YEARS,
              service: EMAIL_TEMPLATE_SERVICES.SCHEDULER,
              variables: {
                employeeName,
                companyName,
                experience: yearOfExperience,
                branding,
                website,
                ...footerLayoutVariables,
              },
              fallback: () => anniversary4ToAnyExpTemplate(employeeName, companyName, yearOfExperience, companyLogo),
              fallbackSubject: subject,
            })
           }

           await emailer.email(email, resolved.subject, resolved.html)
        } 
        
    }
    } catch (error) {
      customLog(null, "error", { message: "Error in sendAnniversaryMails" ,error });
      throw error
    }
  };