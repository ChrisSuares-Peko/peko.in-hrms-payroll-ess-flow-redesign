const {
  findPeko,
  createRequest,
  findConnected,
  find,
} = require("../../models/use-cases/peko_connect");
const asyncHandler = require("../../middlewares/async");
const ErrorResponse = require("../../utils/error-response");
const emailer = require("../../utils/emailer");
const { createNotification } = require("../../models/use-cases/notification");
const {
  resolveConnectionRequestEmail,
} = require("../../utils/emailTemplates/peko_connect");
const { fetchPartnerDetails } = require("../../models/use-cases/systemUser");
const { partnerLogos } = require("../../utils/partnerLogos");
const { customLog } = require('../../utils/loggerHelper');


exports.findAllPeko = asyncHandler(async (req, res, next) => {
  let attributes = ['id', 'serviceProvider', 'tagline', 'rewards', 'logo']
  let result = await findPeko(attributes)
  if (!result || result.length < 1) {
      return next(new ErrorResponse(`Something went wrong while fetching service providers`, 500))
  } else {
      return res.status(200).json({
          'status': true,
          'data': { data: result },
          'message': 'Fetched all connects successfully',
          'responseCode': '000'
      })
  }
})

exports.createRequest = asyncHandler(async (req, res, next) => {
  const data = req.body
  let connectionData = await find({ id: req.body.connectId })
  data.serviceProvider = connectionData.serviceProvider
  delete data.connectId
  let result = await createRequest(data)
  if (!result) {
      return next(new ErrorResponse(`Something went wrong while submitting request`, 500))
  } else {
      const to = connectionData.email; // Set recipient email address
      const name = connectionData.serviceProvider; // Set recipient email address
      let partnerDetails;
      if(req?.user?.registeredBy){
        partnerDetails = await fetchPartnerDetails(req?.user?.registeredBy);
    } else {
        partnerDetails = await partnerLogos();
    }
      const { subject, html, sender } = await resolveConnectionRequestEmail(name, data, partnerDetails, {
        partnerId: req?.user?.registeredBy || null,
        logTraceId: req?.LogTraceId,
      });
      // Call email function to send email with payment details in the body
      emailer.email(to, subject, html, function () {
        customLog(req?.LogTraceId, "info", { message: "Email sent to " + to })
      }, sender);
      const notificationData = {
          notificationTitle: 'Connection Request submitted!',
          notificationBrief: 'Your Connection Request has been submitted successfully. The service provider will contact you soon.',
          notificationTo: [req.user.username],
          notificationCategory: 'CORPORATE',
          notificationBy: 'ADMIN'
      };
      createNotification(notificationData);
      return res.status(201).json({
          'status': true,
          'message': 'Request submitted successfully',
          'data': result,
          'responseCode': '000'
      })
  }
})

exports.findMyConnections = asyncHandler(async (req, res, next) => {
  let result = await findConnected({ id: req.user.id })
  if (!result || result.length < 1) {
      return next(new ErrorResponse(`Something went wrong while fetching connections`, 500))
  } else {
      return res.status(200).json({
          'status': true,
          'data': { data: result },
          'message': 'Successfully fetched all connections!',
          'responseCode': '000'
      })
  }
})

exports.findProviderDetails = asyncHandler(async (req, res, next) => {
  let params = req.params
  let exclude = ['createdAt', 'updatedAt', 'status']
  let result = await find(params, exclude)
  if (!result) {
      return next(new ErrorResponse(`Something went wrong while fetching connection details`, 500))
  } else {
      return res.status(200).json({
          'status': true,
          'data': { data: result },
          'message': 'Successfully fetched connection details!',
          'responseCode': '000'
      })
  }
})