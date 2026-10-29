const asyncHandler = require("../../middlewares/async");
const {  updateAllCorporateDocuments } = require("../../models/use-cases/corporateDocuments");
const { findAllInvoiceSuppliers, collectorKybExport, updateSupplierStatus } = require("../../models/use-cases/invoiceSupplier");
const { sendCollectorAgreement } = require("../../services/collectorEsign");
const fs = require("fs");
const { resolveCollectorKybRejectedEmail, resolveCollectorKybApprovedEmail } = require("../../utils/emailTemplates/KYBTemplate");
const ErrorResponse = require("../../utils/error-response");
const { generateExcelBufferAndType } = require("../../utils/generateExcelBufferAndType");
const { reportPdfTemplate } = require("../../utils/reportTemplate");
const puppeteer = require('puppeteer');
const emailer = require('../../utils/emailer');
const { fetchPartnerDetails } = require("../../models/use-cases/systemUser");


exports.findAllCollectorKybAndCount = asyncHandler(async (req, res, next) => {

    const page = parseInt(req.query.page) || 1;
    const itemsPerPage = parseInt(req.query.itemsPerPage) || 10;
    let searchText = req.query.searchText || '';
    const sort = req.query.sort && req.query.sort === 'ASC' ? 'ASC' : 'DESC';
    let sortField = req.query.sortField || 'createdAt'

    let params = {
        page,
        itemsPerPage,
        searchText,
        sort,
        sortField
    };

    const kybData = await findAllInvoiceSuppliers(params);

    if (!kybData) {
        return next(new ErrorResponse(`Something went wrong while getting user kyb details`, 400))
    }

    // // 1. Fetch all documents in one query
    // const corporateUserIds = kybData.rows.map(item => item.corporateUserId);
    // const documentNames = documentFields.map(doc => doc.fieldName)
    // const corporateDocuments = await findAllCorporateDocuments({ corporateUserId: corporateUserIds, documentNames })

    // // 2. Transform documents into an object grouped by corporateUserId
    // const documentsByUserId = corporateDocuments.reduce((acc, doc) => {
    //     if (!acc[doc.corporateUserId]) {
    //         acc[doc.corporateUserId] = {};
    //     }
    //     acc[doc.corporateUserId][doc.documentName] = doc.document;
    //     return acc;
    // }, {});

    // // 3. Merge documents with kybData
    // const finalKybData = kybData.rows.map(item => ({
    //     ...item,
    //     documents: documentsByUserId[item.corporateUserId] || {}
    // }));

    return res.status(200).json({
        status: true,
        data: {
            recordsTotal: kybData ? kybData.count : 0,
            rows: kybData.rows ? kybData.rows : []
        },
        message: 'Fetched Successfully',
        responseCode: '000'
    });
});

exports.updateKybStatus = asyncHandler(async (req, res, next) => {
    const corporateId = req.params.corporateId
    const { kybStatus } = req.body
    const rejectReason = req.body.rejectReason || null

    const data = await updateSupplierStatus({ corporateId, kybStatus, rejectReason })
    if (!data.isUpdated) {
        return next(new ErrorResponse(`Something went wrong while updating status `, 400))
    }

    const supplierData = data.supplierData
    const userData = supplierData.corporateUser
    const to = userData.email;

    const params = {
        corporateUserId: userData.id,
        documentNames: ['Trade_License', 'Articles_Of_Association', 'Emirates_ID', 'Passport', 'Bank_Letter'],
    }

    let partnerData;
    partnerData = await fetchPartnerDetails(userData?.credential?.registeredBy)

    if (kybStatus === 'REJECTED') {
        const { subject, html, sender } = await resolveCollectorKybRejectedEmail(userData.name, rejectReason, partnerData, {
            partnerId: userData?.credential?.registeredBy || null, logTraceId: req?.LogTraceId,
        })
        emailer.email(to, subject, html, undefined, sender);
        await updateAllCorporateDocuments({ ...params, documentStatus: 'REJECTED' })
        const uploadedDocuments = supplierData.supplierDetails.uploadedDocuments
        const changedUploadedStatus = Object.keys(uploadedDocuments).reduce((acc, key) => {
            acc[key] = { ...uploadedDocuments[key], isUploaded: false };
            return acc;
        }, {});
        supplierData.supplierDetails = {
            ...supplierData.supplierDetails,
            uploadedDocuments: changedUploadedStatus
        }
        supplierData.agreementDetails = {
            ...supplierData.agreementDetails,
            count: 0
        }
        await supplierData.save()
    }


    if (kybStatus === 'DOCUMENT UPLOADED') {
        await sendCollectorAgreement(userData, supplierData)
    }

    if (kybStatus === 'APPROVED') {
        let partnerDetails;
        partnerDetails = await fetchPartnerDetails(supplierData?.corporateUser?.credential?.registeredBy);
        const frontendUrl = partnerDetails.baseUrl

        const { subject, html, sender } = await resolveCollectorKybApprovedEmail(userData.name, frontendUrl, partnerDetails, {
            partnerId: supplierData?.corporateUser?.credential?.registeredBy || null, logTraceId: req?.LogTraceId,
        })
        emailer.email(to, subject, html, function () {
            console.log("Email sent to " + to);
        }, sender);
        await updateAllCorporateDocuments({ ...params, documentStatus: 'VERIFIED' })
    }

    return res.status(200).json({
        status: true,
        data: {},
        message: 'Status Updated Successfully',
        responseCode: '000'
    });
})

exports.collectorKybExcelCSV = asyncHandler(async (req, res, next) => {

    let searchText = req.query.searchText || '';
    const { type } = req.params;
    const sort = req.query.sort && req.query.sort === 'ASC' ? 'ASC' : 'DESC';
    let sortField = req.query.sortField || 'createdAt'

    let params = {
        searchText,
        sort,
        sortField
    };


    const data = await collectorKybExport(params);

    if (!data) {
        return next(new ErrorResponse(`Something went wrong while generating report`, 500))
    } else if (data.length < 1) {
        return next(new ErrorResponse(`No data is available for export`, 500))
    } else {
        const { buffer, fileType } = await generateExcelBufferAndType(data, type)
        return res.status(200).json({
            'status': true,
            'data': { buffer, fileType },
            'message': 'Fetched excel/csv datas successfully',
            'responseCode': '000'
        })
    }

});

exports.collectorKybPDF = asyncHandler(async (req, res, next) => {

    let searchText = req.query.searchText || '';
    const sort = req.query.sort && req.query.sort === 'ASC' ? 'ASC' : 'DESC';
    let sortField = req.query.sortField || 'createdAt'

    let params = {
        searchText,
        sort,
        sortField
    };


    const data = await collectorKybExport(params);

    if (!data) {
        return next(new ErrorResponse(`Something went wrong while generating report`, 500))
    } else if (data.length < 1) {
        return next(new ErrorResponse(`No data is available for export`, 500))
    }

    const templateDetails = {
        title: 'Collector KYB'
    }
    const reportHtmlWithStyle = reportPdfTemplate(data, templateDetails);
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