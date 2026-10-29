const CorporateUser = require("../models/entities/corporateUser");
const Employee = require("../models/entities/employee");
const { anniversary1To4ExpTemplate, anniversary4ToAnyExpTemplate } = require("../utils/email/emailTemplates/anniversary");
const emailer = require('../utils/email/emailer');
const { resolveDynamicEmail } = require('./emailTemplateResolver');
const { PAYROLL_EMAIL_TEMPLATE_KEYS } = require('../utils/email/emailTemplateKeys');
const { v2LayoutVariables } = require('../utils/email/sharedLayout');

const ANNIVERSARY_HERO_IMAGE = 'https://d2fduk7g9mvyjq.cloudfront.net/common/work_anniversary.jpeg';

exports.sendAnniversaryMails  = async () => {
    console.log("sendAnniversaryMails called>>>>>>>>>>>>>>>>>>>>>>>>>>>.");
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
        let companyWebsite
        const corporateDetails = await CorporateUser.findOne({ _id: corporateId });
           if(corporateDetails){
            companyName = corporateDetails.companyName
            companyLogo = corporateDetails.logo
            companyWebsite = corporateDetails.website
           }
           const isOneToFourYears = yearOfExperience <= 4;
           const key = isOneToFourYears ? PAYROLL_EMAIL_TEMPLATE_KEYS.ANNIVERSARY_1_TO_4_YEARS : PAYROLL_EMAIL_TEMPLATE_KEYS.ANNIVERSARY_4_PLUS_YEARS;
           const text = yearOfExperience == 1 ? 'year' : 'years';
           const fallbackHtml = isOneToFourYears
             ? anniversary1To4ExpTemplate(employeeName, companyName, yearOfExperience, companyLogo, companyWebsite)
             : anniversary4ToAnyExpTemplate(employeeName, companyName, yearOfExperience, companyLogo, companyWebsite);

           const resolved = await resolveDynamicEmail({
             req: undefined,
             key,
             variables: {
               employeeName,
               companyName: companyName || '',
               experience: yearOfExperience,
               companyLogo: companyLogo || '',
               text,
               heroImage: ANNIVERSARY_HERO_IMAGE,
               // branding shows the employee's own corporate in the header; companyName
               // is not a genuine Peko reseller partner, so footerBranding overrides it
               // back to Peko for the footer's partner-icon-hiding gate.
               ...v2LayoutVariables({ website: companyWebsite, logo: companyLogo, branding: companyName, footerBranding: 'Peko' }),
             },
             fallbackSubject: subject,
             fallbackHtml,
             partnerId: null,
           });

           await emailer.email(email, resolved.subject, resolved.html)
        } 
        
    }
    } catch (error) {
      console.error("Error in sendAnniversaryMails:", error);
      throw error
    }
  };