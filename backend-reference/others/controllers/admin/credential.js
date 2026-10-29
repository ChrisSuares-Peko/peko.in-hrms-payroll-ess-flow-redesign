/* eslint-disable no-unused-vars */
const { changePassword, fetchAllPartner } = require('../../models/use-cases/credential')
const { findAllByRoleName, fetchPartnerDetails } = require('../../models/use-cases/systemUser');
const emailer=require("../../utils/emailer");
const { resetPasswordSuccessTemplate, buildAccountNumberClause } = require('../../utils/emailTemplate/profile');
const { resolveEmailTemplate } = require('../../services/emailTemplateResolver');
const { EMAIL_TEMPLATE_KEYS, EMAIL_TEMPLATE_SERVICES } = require('../../utils/emailTemplateKeys');
const { v2LayoutVariables, PEKO_SOCIAL_LINKS } = require('../../utils/emailTemplate/sharedLayout');

exports.changePassword = async (req, res) => {
     const userDetails = req.body
     let credentialId = req.user.id
     const user = req.user
     if (req.user.role === 'CORPORATE_SUB_USER') {
         credentialId = req.user.subCorporateCredential
     }
      let templateDetails;
   templateDetails = await fetchPartnerDetails(req.user.registeredBy)
     changePassword(userDetails, credentialId).then((data) => {
         const { status,
             statusCode,
             responseCode,
             responseMessage } = data
         if (status) {
             const to = user.email; // Set recipient email address
             const branding = templateDetails?.branding || 'Peko';
             resolveEmailTemplate({
                 key: EMAIL_TEMPLATE_KEYS.PROFILE_RESET_PASSWORD_SUCCESS,
                 service: EMAIL_TEMPLATE_SERVICES.PROFILE,
                 partnerId: req.user.registeredBy || null,
                 variables: {
                     name: user.name,
                     accountNumberClause: buildAccountNumberClause(user, branding),
                     branding,
                     ...v2LayoutVariables({
                         website: templateDetails?.baseUrl || 'https://in.peko.one',
                         logo: templateDetails?.logo,
                         branding,
                         socials: PEKO_SOCIAL_LINKS,
                     }),
                 },
                 fallbackSubject: `Your ${branding} password changed successfully `,
                 fallback: () => resetPasswordSuccessTemplate(user, templateDetails),
             }).then(({ subject, html: body, sender }) => {
                 // Call email function to send email with payment details in the body
                 emailer.email(to, subject, body, function () {
                     console.log("Email sent to " + to);
                 }, sender);
             });
         }
 
         return res.status(statusCode).json({
             status,
             data: {},
             message: responseMessage,
             responseCode
         })
     }).catch((err) => {
         console.log("ERRRORR", err)
         return res.status(500).json({
             status: false,
             data: {},
             message: 'Internal Server Error',
             responseCode: '500'
         })
     })
 }

exports.fetchAllPartner = async (req, res) => {
     try {
         let searchText = req.query.q
         let partnerName = 'partner'
         let data = await findAllByRoleName(searchText, partnerName)
         return res.status(200).json({
             status: true,
             data: {data},
             message: 'Successfully fetched all partners',
             responseCode: '500'
         })
     } catch (e) {
          return res.status(500).json({
               status: false,
               data: {},
               message: 'Internal Server Error',
               responseCode: '500',
          })
     }
}
