const asyncHandler = require('../../middlewares/async');
const ErrorResponse = require('../../utils/error-response');
const kybDetails = require("../../models/entities/vendorPayout/kybDetails");
const puppeteer = require('puppeteer');
const fs = require("fs");
 const emailer = require('../../utils/emailer');
const { KYBDocUpdateEmail,KYBDocReuploadEmail,KYBdetailsCompletedEmail,reportPdfTemplate} = require('../../utils/emailTemplates');
const { findAllKYBDetails,updateKYBDetails,KYBDetailsExport } = require('../../models/use-cases/vendorPayout/kybDetails');
 const { generateExcelBufferAndType } = require('../../utils/generateExcelBufferAndType');
const { fetchPartnerDetails } = require('../../models/use-cases/systemUser');
const { partnerLogos } = require('../../utils/partnerLogos');
const { resolveEmailTemplate } = require('../../services/emailTemplateResolver');
const { EMAIL_TEMPLATE_KEYS, EMAIL_TEMPLATE_SERVICES } = require('../../utils/emailTemplateKeys');
const { v2LayoutVariables } = require('../../utils/emailTemplate/sharedLayout');
const { customLog } = require('../../utils/loggerHelper');

// Frontend base URL for links inside emails - req.headers.host would be this API's own
// host, not the corporate portal's. Matches the established pattern in
// payment/services/paymentLinks.js.
const frontendBaseUrl = process.env.NODE_ENV === 'production' ? process.env.PRODUCTION_URL : process.env.FRONTEND_STAGING_URL;
// Real corporate-user-facing KYB page (Peko-IN-Frontend: paths.invoice.index + paths.invoice.kyb).
// The old `${host}/system/corporate/corporate-tax-registration` link (copied from AE) pointed at
// an admin-only route the corporate recipient of this email can't access - not a design change,
// a broken-link fix.
const kybLink = `${frontendBaseUrl}/invoicing/kyb`;

 exports.findKYBDetails = asyncHandler(async (req, res, next) => {

    const page = parseInt(req.query.page) || 1;
    const itemsPerPage = parseInt(req.query.itemsPerPage) || 10;
    let searchText = req.query.searchText || '';
    const sort = req.query.sort && req.query.sort === 'ASC' ?  'ASC' : 'DESC' ;
    let sortField = req.query.sortField || 'createdAt'
    let from = req.query.from;
    let to = req.query.to;
    let params = {
        page,
        itemsPerPage,
        searchText,
        sort,
        sortField,
        from,
        to
    };


    const kybData = await findAllKYBDetails(params);

    if (!kybData) {
        return next(new ErrorResponse(`Something went wrong while getting all kyb details`, 400))
    } else {
        return res.status(200).json({
            status: true,
            data: {
                recordsTotal: kybData ? kybData.count : 0,
                rows: kybData ? kybData.rows : []
            },
            message: 'Fetched Successfully',
            responseCode: '000'
        });
    }

});
exports.KYBDetailsExcelCSV = asyncHandler(async (req, res, next) => {

    let searchText = req.query.searchText || '';
    const {type} = req.params;
    const sort = req.query.sort && req.query.sort === 'ASC' ?  'ASC' : 'DESC' ;
    let sortField = req.query.sortField || 'createdAt'
    let from = req.query.from;
    let to = req.query.to;
    let params = {
        searchText,
        sort,
        sortField,
        from,
        to,
    };


    const data = await KYBDetailsExport(params);

    if (!data) {
        return next(new ErrorResponse(`Something went wrong while generating report`, 500))
    } else if (data.length < 1) {
        return next(new ErrorResponse(`No data is available for export`, 409))
    } else {
        const {buffer, fileType} = await generateExcelBufferAndType(data,type)
        return res.status(200).json({
            'status': true,
            'data': {buffer, fileType},
            'message': 'Fetched excel/csv datas successfully',
            'responseCode': '000'
        })
    }

});

exports.KYBDocumentsPDF = asyncHandler(async (req, res, next) => {

    let searchText = req.query.searchText || '';
    const sort = req.query.sort && req.query.sort === 'ASC' ?  'ASC' : 'DESC' ;
    let sortField = req.query.sortField || 'createdAt'
    let from = req.query.from;
    let to = req.query.to;
    let params = {
        searchText,
        sort,
        sortField,
        from,
        to
    };


    const data = await KYBDetailsExport(params);

    if (!data) {
        return next(new ErrorResponse(`Something went wrong while generating report`, 500))
    } else if (data.length < 1) {
        return next(new ErrorResponse(`No data is available for export`, 409))
    }
    
    const templateDetails = {
        title: 'Vendor Payout'
    }
    const reportHtmlWithStyle = reportPdfTemplate(data,templateDetails);
    let random = new Date().valueOf();

    // Create a browser instance with Puppeteer
    const browser = await puppeteer.launch({
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    const page = await browser.newPage();

    // Set content to the page
    await page.setContent(reportHtmlWithStyle, { waitUntil: 'domcontentloaded' });

    // Generate PDF using Puppeteer
    const outputFile = `report-${random}.pdf`;
    await page.pdf({
        // scale: 0.2,
        path: outputFile,
        format: 'A4',
        preferCSSPageSize: true
    });

    console.log('PDF generated successfully!');

    const buffer = fs.readFileSync(outputFile);

    browser.close();

    fs.unlinkSync(outputFile);

    return res.status(200).json({
        status: true,
        message: 'report generated successfully.',
        data: {
            buffer,
            fileType: 'application/pdf'
        },
        responseCode: '000'
    });

});

exports.updateKYBDocStatus = asyncHandler(async (req, res, next) => {
    const { kybId } = req.params;
    let updateDetails = req.body
   
    let { status, remarks } = updateDetails
   
    if (!remarks && status == 'COMPLETED') {
        remarks = 'KYB details verification completed.'
    }
    const kybDetailsExist = await kybDetails.findOne({
        where: { id: kybId, },
      });
      if(!kybDetailsExist) return next(new ErrorResponse(`No kyb details found `, 400))
        
      const { offEmail, contactPersonName } = kybDetailsExist
      
    const result = await updateKYBDetails(kybId, updateDetails, req.user);
    if (!result.success) {
      return next(new ErrorResponse(result.message, 500));
    }

    // Best-effort: the KYB status update is already committed above, so a failure
    // anywhere in the partner lookup / template resolve / send chain below must not
    // fail this request or silently swallow the notification - same fire-and-forget
    // isolation convention as the other admin-triggered status emails in this codebase.
    try {
        let kybPartnerData;
        if (req.user.registeredBy) {
            kybPartnerData = await fetchPartnerDetails(req.user.registeredBy);
        } else {
            kybPartnerData = await partnerLogos();
        }
        const kybBrandingVariables = {
            branding: kybPartnerData?.branding || 'Peko',
            website: kybPartnerData?.website || 'https://www.peko.one',
            ...v2LayoutVariables(kybPartnerData),
        };

        let resolvedKybEmail;
        if (status == 'RE UPLOAD') {
            resolvedKybEmail = await resolveEmailTemplate({
                key: EMAIL_TEMPLATE_KEYS.KYB_DOC_REUPLOAD,
                service: EMAIL_TEMPLATE_SERVICES.KYB,
                variables: { name: contactPersonName, ...kybBrandingVariables },
                fallback: () => KYBDocReuploadEmail(contactPersonName, kybPartnerData),
                fallbackSubject: 'KYB Documents - Please reupload the documents',
                partnerId: req.user.registeredBy || null,
                logTraceId: req?.LogTraceId,
            });
        } else if (status == 'COMPLETED') {
            resolvedKybEmail = await resolveEmailTemplate({
                key: EMAIL_TEMPLATE_KEYS.KYB_DETAILS_COMPLETED,
                service: EMAIL_TEMPLATE_SERVICES.KYB,
                variables: { name: contactPersonName, ...kybBrandingVariables },
                fallback: () => KYBdetailsCompletedEmail(contactPersonName, kybPartnerData),
                fallbackSubject: 'KYB Documents successful',
                partnerId: req.user.registeredBy || null,
                logTraceId: req?.LogTraceId,
            });
        } else {
            resolvedKybEmail = await resolveEmailTemplate({
                key: EMAIL_TEMPLATE_KEYS.KYB_DOC_UPDATE,
                service: EMAIL_TEMPLATE_SERVICES.KYB,
                variables: { name: contactPersonName, status, remarks, kybLink, ...kybBrandingVariables },
                fallback: () => KYBDocUpdateEmail({ name: contactPersonName, status, remarks, kybLink, partnerDetails: kybPartnerData }),
                fallbackSubject: 'KYB Documents - Status update',
                partnerId: req.user.registeredBy || null,
                logTraceId: req?.LogTraceId,
            });
        }

        emailer.email(offEmail, resolvedKybEmail.subject, resolvedKybEmail.html, function () {
            customLog(req?.LogTraceId, "info", { message: "KYB status-update email sent to " + offEmail });
        });
    } catch (emailError) {
        customLog(req?.LogTraceId, "error", {
            message: "KYB status-update email failed to send",
            kybId,
            status,
            error: emailError?.message,
        });
    }

    return res.status(200).json({
        status: true,
        message: "Updated successfully",
        data: {},
        responseCode: '000'
    });


});
