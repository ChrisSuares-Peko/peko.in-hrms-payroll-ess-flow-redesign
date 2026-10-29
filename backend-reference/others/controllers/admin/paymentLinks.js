const asyncHandler = require("../../middlewares/async");
const { findAllPaymentLinkOrders, paymentLinkOrdersExcelCSVData } = require("../../models/use-cases/paymentLink");
const ErrorResponse = require("../../utils/error-response");
const { generateExcelBufferAndType } = require("../../utils/generateExcelBufferAndType");
const { reportPdfTemplate } = require("../../utils/reportTemplate");
const puppeteer = require('puppeteer');
const fs = require("fs");

exports.findAllPaymentLinksOrdersAndCount = asyncHandler(async (req, res, next) => {

    let { from, to, searchText, page, itemsPerPage, status } = req.query;
    let corporateId = req.query.corporateId || undefined
    let registeredBy = req.user.registeredBy
    const sort = req.query.sort && req.query.sort === 'ASC' ? 'ASC' : 'DESC';
    let sortField = req.query.sortField || 'id'

    // Parse page and itemsPerPage to integers (you can also use parseInt)
    page = page ? parseInt(page) : 1;
    itemsPerPage = itemsPerPage ? parseInt(itemsPerPage) : null;
    let limit = itemsPerPage

    // Calculate offset based on page and itemsPerPage
    let offset;
    if (page && itemsPerPage) {
        offset = (page - 1) * itemsPerPage;
    }

    let params = {
        from,
        to,
        searchText,
        sort,
        limit,
        offset,
        corporateId,
        sortField,
        registeredBy,
        status
    }

    const paymentLinksData = await findAllPaymentLinkOrders(params);
    if (!paymentLinksData) {
        return next(new ErrorResponse(`Something went wrong while getting payment link orders`, 500))
    } else {
        return res.status(201).json({
            'status': true,
            'data': {
                'recordsTotal': paymentLinksData.count,
                'data': paymentLinksData.rows
            },
            'message': 'Payment link orders fetched successfully',
            'responseCode': '000'

        })
    }
})

exports.paymentLinksOrdersGenerateExcelCSV = asyncHandler(async (req, res, next) => {

    let { from, to, searchText, status } = req.query;
    let corporateId = req.query.corporateId || undefined
    let registeredBy = req.user.registeredBy
    const sort = req.query.sort && req.query.sort === 'ASC' ? 'ASC' : 'DESC';
    let sortField = req.query.sortField || 'id'
    const { type } = req.params;

    let params = {
        from,
        to,
        searchText,
        sort,
        corporateId,
        sortField,
        registeredBy,
        status
    }
    const data = await paymentLinkOrdersExcelCSVData(params);
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
})
exports.paymentLinksOrdersGeneratePDF = asyncHandler(async (req, res, next) => {

    let { from, to, searchText, status } = req.query;
    let corporateId = req.query.corporateId || undefined
    let registeredBy = req.user.registeredBy
    const sort = req.query.sort && req.query.sort === 'ASC' ? 'ASC' : 'DESC';
    let sortField = req.query.sortField || 'id'

    let params = {
        from,
        to,
        searchText,
        sort,
        corporateId,
        sortField,
        registeredBy,
        status
    }
    const data = await paymentLinkOrdersExcelCSVData(params);
    if (!data) {
        return next(new ErrorResponse(`Something went wrong while generating report`, 500))
    } else if (data.length < 1) {
        return next(new ErrorResponse(`No data is available for export`, 500))
    }
    const templateDetails = {
        title: 'Payment Links Report'
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
        scale: 0.8,
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
})