
const emailer = require("../../utils/emailer");
const asyncHandler = require("../../middlewares/async");
const ErrorResponse = require("../../utils/error-response");
const fs = require("fs");
const { fetchSinglePlan } = require("../../models/use-cases/plans");
const { findOne } = require("../../models/use-cases/corporateUser");
const { workspaceDocumentFromAdminEmail } = require("../../utils/emailTemplate/workspaces");
const { updateOrder, findOneOrderById } = require("../../models/use-cases/order");
const moment = require('moment');
const { createSubscription } = require("../../models/use-cases/officeAddressSubscriptions");
const { fetchPartnerDetails } = require("../../models/use-cases/systemUser");
const { resolveEmailTemplate } = require('../../services/emailTemplateResolver');
const { EMAIL_TEMPLATE_KEYS, EMAIL_TEMPLATE_SERVICES } = require('../../utils/emailTemplateKeys');

exports.sendAMail = asyncHandler(async (req, res, next) => {
  try {
    const { content, planId, files, credentialId } = req.body;
    const planDetails = await fetchSinglePlan(planId)
    const corporateDetails = await findOne({corporateId:credentialId})

    let templateDetails;
  templateDetails = await fetchPartnerDetails(corporateDetails?.registeredBy);
    const to = corporateDetails.email
    const name = corporateDetails.name
    const subject = "Your workspace details"; // Set email subject
    const highlights = planDetails.highlights
        ? planDetails.highlights
            .split('\n')
            .map((line) => line.trim())
            .filter((line) => line !== '')
            .join('<br>')
        : ''
    const resolved = await resolveEmailTemplate({
        key: EMAIL_TEMPLATE_KEYS.WORKSPACE_DOCUMENT_FROM_ADMIN,
        service: EMAIL_TEMPLATE_SERVICES.WORKSPACES,
        variables: {
            name,
            content,
            planName: planDetails.name,
            highlights,
            price: planDetails.price,
            billingCycle: planDetails.billingCycle,
            branding: templateDetails?.branding || 'Peko',
            logo: templateDetails?.logo,
            copyrightYear: new Date().getUTCFullYear(),
        },
        fallback: () => workspaceDocumentFromAdminEmail(name, content, planDetails, templateDetails),
        fallbackSubject: subject,
        logTraceId: req?.LogTraceId,
    });
    const body = resolved.html;
    // Call email function to send email with payment details in the body
    const attachments = [];
    let fileCounter = 1;
    for (const file of files) {
      const fileName = `public/document_${fileCounter}.${file.format}`;
      // const fileName = `public/docs/document_${fileCounter}.${file.format}`;
      const filePath = `${fileName}`;

      const fileBuffer = Buffer.from(file.base64, "base64");
      fileCounter++;
      fs.writeFileSync(filePath, fileBuffer);

      attachments.push({
        filename: fileName,
        path: filePath,
      });
    }
    emailer.emailWithMultipleAttachment(to, resolved.subject, body, attachments, function (emailErr) {
      if (emailErr) {
        console.error(`Error sending email: ${emailErr}`);
      }
      //delete saved files
      attachments.forEach((file) => {
        fs.unlink(file.path, (unlinkErr) => {
          if (unlinkErr) {
            console.error(`Error deleting file ${file.path}: ${unlinkErr}`);
          } else {
            console.log(`File ${file.path} deleted`);
          }
        });
      });
    });

    return res.status(200).json({
      status: true,
      data:{},
      message:'Email sent successfully',
      responseCode : '000'
    });
  } catch (error) {
    return next(new ErrorResponse(`Something went wrong while Generating email`, 400));
  }
});

exports.workspaceStatusUpdate = asyncHandler( async (req, res, next) => {
  const {workspaceOrderStatus} = req.body; 
  const {id} = req.params; 
  const result = await updateOrder(req.params, {workspaceOrderStatus})
  if (!result) {
    return next(new ErrorResponse(`Something went wrong while updating the order`, 200))
  } else {
      const orderDetails=await findOneOrderById(id)
      if(workspaceOrderStatus=="COMPLETE"){
        const orderResponse = JSON.parse(orderDetails?.orderResponse)
        const startDate = moment().startOf('day').toDate();
        let endDate
        if(orderResponse?.planDetails?.billingCycle == "MONTHLY"){
         endDate = moment().add(29, 'days').endOf('day').toDate();
        } else {
         endDate = moment().add(364, 'days').endOf('day').toDate();
        }
        const subscriptionData={
          startDate,
          endDate,
          paymentRefId: orderDetails.corporateTxnId,
          price: orderDetails.amountInINR,
          billingType: orderResponse?.planDetails?.billingCycle,
          orderId: orderDetails.id,
          credentialId: orderDetails.credentialId,
        }
        await createSubscription(subscriptionData)
      }
      return res.status(200).json({
          status: true,
          data: {},
          message: 'Workspace status updated successfully',
          responseCode: '000'
      })
  }
})