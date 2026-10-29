const asyncHandler = require('../../middlewares/async');
const ErrorResponse = require('../../utils/error-response');
const puppeteer = require('puppeteer');
const fs = require("fs");
const emailer = require('../../utils/emailer');
const { corporateTaxRegistrationUpdateEmail, corporateTaxRegistrationCompletedEmail, corporateTaxRegistrationDocReuploadEmail } = require('../../utils/emailTemplates/corporateTax');
const { findAllCorporateTaxRegistration, findOneRegistration, updateRegistration, corporateTaxRegistrationExport } = require('../../models/use-cases/corporateTaxRegistration');
const { generateExcelBufferAndType } = require('../../utils/generateExcelBufferAndType');
const { reportPdfTemplate } = require('../../utils/reportTemplate');
const { createNotification } = require('../../models/use-cases/notification');
const { fetchPartnerDetails } = require('../../models/use-cases/systemUser');

exports.findAllCorporateTaxRegistrationAndCount = asyncHandler(async (req, res, next) => {

    const page = parseInt(req.query.page) || 1;
    const itemsPerPage = parseInt(req.query.itemsPerPage) || 10;
    let searchText = req.query.searchText || '';
    const sort = req.query.sort && req.query.sort === 'ASC' ?  'ASC' : 'DESC' ;
    let sortField = req.query.sortField || 'createdAt'
    const from =req.query.from
    const to =req.query.to
    let params = {
        page,
        itemsPerPage,
        searchText,
        sort,
        sortField,
        from,
        to
    };


    const registrationData = await findAllCorporateTaxRegistration(params, false, ['createdAt', 'status', 'companyName', 'contactPerson', 'email', 'tradeLicenseDoc', 'id', 'remarks' ,'emiratesIDDoc', 'phoneNumber', 'passportDoc', 'taxPeriod', 'corporateGovernanceDoc', 'taxCertificateDoc']);

    if (!registrationData) {
        return next(new ErrorResponse(`Something went wrong while getting all registrations`, 400))
    } else {
        return res.status(200).json({
            status: true,
            data: {
                recordsTotal: registrationData ? registrationData.count : 0,
                rows: registrationData ? registrationData.rows : []
            },
            message: 'Fetched Successfully',
            responseCode: '000'
        });
    }

});
exports.corporateTaxRegistrationExcelCSV = asyncHandler(async (req, res, next) => {

    let searchText = req.query.searchText || '';
    const {type} = req.params;
    const sort = req.query.sort && req.query.sort === 'ASC' ?  'ASC' : 'DESC' ;
    let sortField = req.query.sortField || 'createdAt'
    const from =req.query.from
    const to =req.query.to
    let params = {
        searchText,
        sort,
        sortField,
        from,
        to
    };


    const data = await corporateTaxRegistrationExport(params);

    if (!data) {
        return next(new ErrorResponse(`Something went wrong while generating report`, 500))
    } else if (data.length < 1) {
        return next(new ErrorResponse(`No data is available for export`, 409
        ))
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

exports.corporateTaxRegistrationPDF = asyncHandler(async (req, res, next) => {

    let searchText = req.query.searchText || '';
    const sort = req.query.sort && req.query.sort === 'ASC' ?  'ASC' : 'DESC' ;
    let sortField = req.query.sortField || 'createdAt'
    const from =req.query.from
    const to =req.query.to
    let params = {
        searchText,
        sort,
        sortField,
        from,
        to
    };


    const data = await corporateTaxRegistrationExport(params);

    if (!data) {
        return next(new ErrorResponse(`Something went wrong while generating report`, 500))
    } else if (data.length < 1) {
        return next(new ErrorResponse(`No data is available for export`, 204))
    }
    
    const templateDetails = {
        title: 'Corporate Tax Registrations'
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
        scale: 0.2,
        path: outputFile,
        format: 'A4',
        preferCSSPageSize: true
    });

   

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

exports.updateTaxRegistrationStatus = asyncHandler(async (req, res, next) => {
    let registrationId = req.params.registrationId
    let updateDetails = req.body
    const existing = await findOneRegistration(registrationId)
    console.log("🚀 ~ exports.updateTaxRegistrationStatus=asyncHandler ~ existing:", existing)
    if(!existing) return next(new ErrorResponse(`No registration found `, 400))
    let { status, remarks } = updateDetails
    const { email, contactPerson } = existing
    const registeredBy=existing.credential.registeredBy
    if (!remarks && status == 'COMPLETED') {
        remarks = 'Corporate tax registration completed.'
    }

    let partnerDetails;
    partnerDetails = await fetchPartnerDetails(registeredBy);
    
    const result = await updateRegistration(registrationId, updateDetails);
    if (!result) {
        return next(new ErrorResponse(`Something went wrong while updating `, 400))
    }

    let host = `${req.protocol}://${req.headers.host}`;
    if (process.env.NODE_ENV === 'staging') {
        host = 'https://uae.peko.one'
    } else {
        host = `https://uatae.pekoapp.com`;
    }
    let subject = "Corporate tax registration - Status update"; // Set email subject
    let emailBody = corporateTaxRegistrationUpdateEmail({name:contactPerson, status, remarks, host }, partnerDetails)
    if (status == 'RE UPLOAD') {
        emailBody = corporateTaxRegistrationDocReuploadEmail(contactPerson, partnerDetails)
        subject = 'Corporate tax registration - Please reupload the documents'
    } else if (status == 'COMPLETED') {
        subject = 'Corporate tax registration successful'
        emailBody = corporateTaxRegistrationCompletedEmail(contactPerson, partnerDetails)
    }

    emailer.email(email, subject, emailBody, function () {
        console.log("Email sent to " + email);
    });

    if (status == 'COMPLETED') {
        const notificationData = {
            notificationTitle: `Corporate tax registration completed.`,
            notificationBrief: `Your corporate tax registration process has been completed successfully.`,
            notificationTo: [existing.credential.username], // Replace with the user ID or username to send the notification to
            notificationCategory: 'CORPORATE', // Replace with the relevant category
            notificationBy: 'ADMIN' // Replace with the user or system that triggered the notification
        };
        createNotification(notificationData);
    }

    return res.status(200).json({
        status: true,
        message: "Updated successfully",
        data: {},
        responseCode: '000'
    });


});
