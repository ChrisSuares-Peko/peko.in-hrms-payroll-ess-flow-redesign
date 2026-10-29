const { default: puppeteer } = require("puppeteer");
const asyncHandler = require("../../middlewares/async");
const { findAllPendingSignUps, pendingSignUpsExport, findById, update } = require("../../models/use-cases/signUpActivityLog");
const ErrorResponse = require("../../utils/error-response");
const { generateExcelBufferAndType } = require("../../utils/generateExcelBufferAndType");
const { reportPdfTemplate } = require("../../utils/reportTemplate");
const fs = require("fs");
const { startOfDay, endOfDay } = require("../../utils/formatter");
const { customLog } = require("../../utils/loggerHelper");
const { resolvePartnerScope } = require("../../utils/partnerScope");

exports.findAllPendingSignUpsAndCount = asyncHandler(async (req, res, next) => {

    let { searchText, page, itemsPerPage, from, to,status = 'PENDING' } = req.query;
    const { partnerId } = resolvePartnerScope(req);
    // partnerId = partnerId === 'default' ? "" : partnerId
    const sort = req.query.sort && req.query.sort === 'ASC' ? 'ASC' : 'DESC';
    let sortField = req.query.sortField || 'createdAt'

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
        limit,
        offset,
        searchText,
        sort,
        sortField,
        from: startOfDay(from),
        to: endOfDay(to),
        partnerId,
        status
    }
    const pendingSignUpsData = await findAllPendingSignUps(params);
    if (!pendingSignUpsData) {
        return next(new ErrorResponse(`Something went wrong while getting all pending sign ups from database`, 500))
    } else {
        return res.status(200).json({
            'status': true,
            'data': {
                'recordsTotal': pendingSignUpsData ? pendingSignUpsData.count : 0,
                'data': pendingSignUpsData ? pendingSignUpsData.rows : 0
            },
            'message': 'Records fetched successfully',
            'responseCode': '000'
        })
    }
})

exports.pendingSignUpsExcelCSV = asyncHandler(async (req, res, next) => {

    let { searchText, from, to, status = 'PENDING' } = req.query;
    const { partnerId } = resolvePartnerScope(req);
    const { type } = req.params;

    const sort = req.query.sort && req.query.sort === 'ASC' ? 'ASC' : 'DESC';
    let sortField = req.query.sortField || 'createdAt'
    // partnerId = partnerId === 'default' ? "" : partnerId

    let params = {
        searchText,
        sort,
        sortField,
        from: startOfDay(from),
        to: endOfDay(to),
        partnerId,
        status
    }
    const data = await pendingSignUpsExport(params);
    if (!data) {
    return next(new ErrorResponse(`Something went wrong while generating report`, 500))
  } else if (data.length < 1) {
    return next(new ErrorResponse(`No data is available for export`, 409))
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

exports.pendingSignUpsPDF = asyncHandler(async (req, res, next) => {

    let { searchText, from, to, status = 'PENDING' } = req.query;
    const { partnerId } = resolvePartnerScope(req);

    const sort = req.query.sort && req.query.sort === 'ASC' ? 'ASC' : 'DESC';
    let sortField = req.query.sortField || 'createdAt'
    // partnerId = partnerId === 'default' ? "" : partnerId

    let params = {
        searchText,
        sort,
        sortField,
        from: startOfDay(from),
        to: endOfDay(to),
        partnerId,
        status
    }
    const data = await pendingSignUpsExport(params);
    if (!data) {
    return next(new ErrorResponse(`Something went wrong while generating report`, 500))
  } else if (data.length < 1) {
    return next(new ErrorResponse(`No data is available for export`, 409))
    }

    const reportHtmlWithStyle = reportPdfTemplate(data, { title: "Pending Sign ups Report" });
    let random = new Date().valueOf();

    // Create a browser instance with Puppeteer
    const browser = await puppeteer.launch({
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    const page = await browser.newPage();

    // Set content to the page
    await page.setContent(reportHtmlWithStyle, { waitUntil: 'domcontentloaded' });

    // Generate PDF using Puppeteer
    const outputFile = `Pending Sign ups-${random}.pdf`;
    await page.pdf({
        scale: 0.5,
        path: outputFile,
        format: 'A4',
        preferCSSPageSize: true
    });

    customLog(
        req?.LogTraceId,
        "info",
        { message: `PDF generated successfully` },
        
      );

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

exports.updatePendingSignUp = asyncHandler(async (req, res, next) => {
    let params = req.params
    let {id} = params
    const { status, remarks } = req.body
    const data = { status, remarks }

    let isUsernameAvailable = await findById(id)
    if (!isUsernameAvailable) {
        return next(new ErrorResponse(`This Pending signUp request Id not found`, 400))
    }

    let result = await update(params, data);
    if (!result) {
        return next(new ErrorResponse(`Something went wrong while updating Pending signUp request`, 400))
    } else {
        return res.status(200).json({
            'status': true,
            'message': 'Pending SignUp Reuqest updated successfully',
            'data': { },
            'responseCode': '000'
        })
    }
})