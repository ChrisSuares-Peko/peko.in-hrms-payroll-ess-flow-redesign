const {
     findAllServiceOperatorCount,
     updateServiceOperator,
     updateStatus,
     find,
     create,
     fetchServiceOperator,
     serviceOperatorAndCountExport,
     getPackageIdsForCashBack,
     checkCashbackServiceOperator,
     getServiceOperatorsWithOutCashBack,
} = require('../../models/use-cases/serviceOperator')
const asyncHandler = require('../../middlewares/async')
const ErrorResponse = require('../../utils/error-response')
const puppeteer = require('puppeteer')
const fs = require('fs')
const { generateExcelBufferAndType } = require('../../utils/generateExcelBufferAndType')
const { reportPdfTemplate } = require('../../utils/reportTemplate')
const { findOnePartnerPermissionData } = require('../../models/use-cases/partnerPermission');
const { uploadFile } = require('../../utils/commonUploadFile')
const { createOauthClient, updateOauthClient } = require('../../models/use-cases/oauth_clients')

exports.createServiceOperator = asyncHandler(async (req, res, next) => {
     const data = req.body
     const isServiceOperatorAvailable = await find(data)
     if (isServiceOperatorAvailable) {
          return next(new ErrorResponse(`Service Operator Already Exists with this name`, 403))
     }
     if (data.serviceImage && data.imageFormat) {
          const publicUrl = await uploadFile(data.serviceImage, 'serviceOperator', data.imageFormat);
          data.serviceImage = publicUrl
     }
     if (data.oidcDetails && data.oidcDetails.logo && data.oidcDetails.logoFormat) {
          const publicUrl = await uploadFile(data.oidcDetails.logo, 'oauth/clients', data.oidcDetails.logoFormat);
          data.oidcDetails.logo_uri = publicUrl
     }

     // record oidc client
     if (data.oidcDetails) {
          const oidc = await createOauthClient({ ...data.oidcDetails })
          data.oauthClientId = oidc.id
     }

     let result = await create(data)
     if (!result) {
          return next(new ErrorResponse(`Something went wrong while adding Service Operator`, 500))
     } else {
          return res.status(200).json({
               status: true,
               data: result,
               message: 'Service operator added succesfully',
               responseCode: '000',
          })
     }
})

exports.findAllServiceOperatorAndCount = asyncHandler(async (req, res, next) => {
     let { searchText, page, itemsPerPage } = req.query

     const sort = req.query.sort && req.query.sort === 'ASC' ? 'ASC' : 'DESC'
     let sortField = req.query.sortField || 'createdAt'

     // Parse page and itemsPerPage to integers (you can also use parseInt)
     page = page ? parseInt(page) : 1
     itemsPerPage = itemsPerPage ? parseInt(itemsPerPage) : null
     let limit = itemsPerPage

     // Calculate offset based on page and itemsPerPage
     let offset
     if (page && itemsPerPage) {
          offset = (page - 1) * itemsPerPage
     }

     let params = {
          limit,
          offset,
          searchText,
          sort,
          sortField,
     }

     const serviceOperatorData = await findAllServiceOperatorCount(params)
     if (!serviceOperatorData) {
          return next(new ErrorResponse(`Something went wrong while getting all Vendors from DB`, 200))
     } else {
          return res.status(200).json({
               success: true,
               data: {
                    data: serviceOperatorData ? serviceOperatorData.rows : 0,
                    recordsTotal: serviceOperatorData ? serviceOperatorData.count : 0,
                    recordsFiltered: serviceOperatorData ? serviceOperatorData.count : 0,
               },
               message: 'Service operator fetched successfully',
               responseCode: '000',
          })
     }
})

exports.serviceOperatorAndCountExcelCSV = asyncHandler(async (req, res, next) => {
     let { searchText } = req.query
     let { type } = req.params

     const sort = req.query.sort && req.query.sort === 'ASC' ? 'ASC' : 'DESC'
     let sortField = req.query.sortField || 'createdAt'
     let params = {
          searchText,
          sort,
          sortField,
     }

     const data = await serviceOperatorAndCountExport(params)
     if (!data) {
          return next(new ErrorResponse(`Something went wrong while generating report`, 500))
     } else if (data.length < 1) {
          return next(new ErrorResponse(`No data is available for export`, 500))
     } else {
          const { buffer, fileType } = await generateExcelBufferAndType(data, type)
          return res.status(200).json({
               status: true,
               data: { buffer, fileType },
               message: 'Fetched excel/csv datas successfully',
               responseCode: '000',
          })
     }
})
exports.serviceOperatorAndCountPDF = asyncHandler(async (req, res, next) => {
     let { searchText } = req.query

     const sort = req.query.sort && req.query.sort === 'ASC' ? 'ASC' : 'DESC'
     let sortField = req.query.sortField || 'createdAt'
     let params = {
          searchText,
          sort,
          sortField,
     }

     const data = await serviceOperatorAndCountExport(params)
     if (!data) {
          return next(new ErrorResponse(`Something went wrong while generating report`, 500))
     } else if (data.length < 1) {
          return next(new ErrorResponse(`No data is available for export`, 500))
     }

     const templateDetails = {
          title: 'Service Operators',
     }
     const reportHtmlWithStyle = reportPdfTemplate(data, templateDetails)
     let random = new Date().valueOf()

     // Create a browser instance with Puppeteer
     const browser = await puppeteer.launch({
          args: ['--no-sandbox', '--disable-setuid-sandbox'],
     })
     const page = await browser.newPage()

     // Set content to the page
     await page.setContent(reportHtmlWithStyle, { waitUntil: 'domcontentloaded' })

     // Generate PDF using Puppeteer
     const outputFile = `report-${random}.pdf`
     await page.pdf({
          scale: 0.7,
          path: outputFile,
          format: 'A4',
          preferCSSPageSize: true,
     })

     console.log('PDF generated successfully!')

     const buffer = fs.readFileSync(outputFile)

     browser.close()

     fs.unlinkSync(outputFile)

     return res.status(200).json({
          status: true,
          message: 'report generated successfully.',
          data: {
               buffer,
               fileType: 'application/pdf',
          },
          responseCode: '000',
     })
})

exports.updateServiceOperator = asyncHandler(async (req, res, next) => {
     let params = req.params
     let data = req.body
     const isServiceOperatorAvailable = await find(data)
     if (isServiceOperatorAvailable && isServiceOperatorAvailable.id != params.id) {
          return next(new ErrorResponse(`Service Operator Already Exists with this name`, 403))
     }
     if (data.serviceImage && data.imageFormat) {
          const publicUrl = await uploadFile(data.serviceImage, 'serviceOperator', data.imageFormat);
          data.serviceImage = publicUrl
     }
     if (data.oidcDetails && data.oidcDetails.logo && data.oidcDetails.logoFormat) {
          const publicUrl = await uploadFile(data.oidcDetails.logo, 'oauth/clients', data.oidcDetails.logoFormat);
          data.oidcDetails.logo_uri = publicUrl
     }

     // update oidc client
     if (data.oidcDetails) {
          if (data.oidcDetails.client_id) {
               await updateOauthClient(data.oidcDetails.client_id, { ...data.oidcDetails })
          } else {
               const oidc = await createOauthClient({ ...data.oidcDetails })
               data.oauthClientId = oidc.id
          }
     }

     const result = await updateServiceOperator(params, data)
     if (!result) {
          return next(new ErrorResponse(`Something went wrong while updating system user`, 500))
     } else {
          return res.status(200).json({
               status: true,
               data: {},
               message: 'Service operator updated successfully',
               responseCode: '000',
          })
     }
})

exports.fetchServiceOperator = asyncHandler(async (req, res, next) => {
     const { searchText = "", partnerId } = req.query;
     let result = await fetchServiceOperator(searchText)
     
     if (!result) {
         return next(new ErrorResponse(`Something went wrong while fetching specific vendor`, 500))
     }  let accessibleServices
     if(partnerId){
         const response = await findOnePartnerPermissionData(partnerId)
 
         if (!response || !response.status) {
             return next(new ErrorResponse(`Partner Account Inactive`, 400))
         }
 
         accessibleServices = response.permissions
     }
     if(accessibleServices){
         result = filterAccessibleResults(accessibleServices, result)
     }
         return res.status(200).json({
             'status': true,
             'data': {data:result},
             'message' : 'Service operator fetched successfully.' ,
             'responseCode' : '000'
         })
     
 })

exports.updateServiceOperatorStatus = asyncHandler(async (req, res, next) => {
     let params = req.params
     let data = req.body
     let result = await updateStatus(params, data)
     if (!result) {
          return next(new ErrorResponse(`Something went wrong while updating status`, 200))
     } else {
          return res.status(200).json({
               success: true,
               message: 'status updated successfully',
               data: 'Updated successfully',
          })
     }
})

exports.checkCashbackServiceOperator = asyncHandler(async (req, res, next) => {
     let { partnerId, packageId, serviceOperators } = req.query;
     partnerId = partnerId === "default" ? null : partnerId;

     const serviceOperatorIds = serviceOperators
          .split(",")
          .map(Number)
          .filter(Number.isFinite);
     const packageIds = await getPackageIdsForCashBack(partnerId, packageId);

     const alreadyPackageIds = [...new Set(packageIds.map(item => item.id))];

     const result = await checkCashbackServiceOperator(
          serviceOperatorIds,
          alreadyPackageIds
     );

     if (result.length === serviceOperatorIds.length) {
          return next(
               new ErrorResponse(`Cashback already exists in all service operators`, 400)
          );
     }

     const difference = serviceOperatorIds.filter(id => !result.includes(id));

     const getServiceOperatorsWithOutCashBackData =
          await getServiceOperatorsWithOutCashBack(difference);

     if (!getServiceOperatorsWithOutCashBackData.length) {
          return next(new ErrorResponse(`Service operators not found`, 404));
     }

     return res.status(200).json({
          status: true,
          data: { data: getServiceOperatorsWithOutCashBackData },
          message: "Service operator fetched successfully.",
          responseCode: "000",
     });
});
 function getAccessibleServiceProviderIds(services) {
     let serviceProviderIds = new Set();
     
     function traverse(services) {
         for (const service of services) {
             if (service.hasAccess) {
                 if (service.serviceProviderId) {
                     serviceProviderIds.add(service.serviceProviderId);
                 }
                 if (service.subServices && service.subServices.length > 0) {
                     traverse(service.subServices);
                 }
             }
         }
     }
     
     traverse(services);
     return serviceProviderIds;
 }
 
 function filterAccessibleResults(accessibleServices, result) {
     const allowedServiceProviderIds = getAccessibleServiceProviderIds(accessibleServices);
     return result.filter(item => allowedServiceProviderIds.has(item.id));
 }