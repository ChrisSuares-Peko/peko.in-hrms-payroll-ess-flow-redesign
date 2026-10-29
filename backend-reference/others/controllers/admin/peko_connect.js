const asyncHandler = require("../../middlewares/async")
const { findAllConnections, connectionExcelCSVData } = require("../../models/use-cases/peko_connect")
const ErrorResponse = require("../../utils/error-response");
const puppeteer = require('puppeteer');
const fs = require("fs");
const { generateExcelBufferAndType } = require("../../utils/generateExcelBufferAndType");
const { reportPdfTemplate } = require("../../utils/reportTemplate");
const { customLog } = require("../../utils/loggerHelper");

exports.findAllConnectionsAndCount = asyncHandler(async (req, res, next) => {

    let { searchText, page, itemsPerPage } = req.query;

    let registeredBy = req.user.registeredBy

    const sort = req.query.sort && req.query.sort === 'DESC' ? 'DESC' : 'ASC';
    
    let sortField = req.query.sortField || 'createdAt'
    let partnerId = req.query.partnerId  || undefined 
    let corporateId = req.query.corporateId|| undefined
    let from = req.query.from;
    let to = req.query.to;
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
        sort,
        searchText,
        sortField,
        registeredBy,
        from,
        to,
        corporateId,
        partnerId
    }
    const callBackData = await findAllConnections(params);
    if (!callBackData) {
        return next(new ErrorResponse(`Something went wrong while getting all call back requests`, 500))
    } else {
        return res.status(200).json({
            'status': true,
            'data': {
                'recordsTotal': callBackData ? callBackData.count : 0,
                'recordsFiltered': callBackData ? callBackData.count : 0,
                'data': callBackData ? callBackData.rows : 0
            },
            'message': 'connects fetched successfully',
            'responseCode': '000'

        })
    }
})

exports.connectionGenerateExcelCSV = asyncHandler(async (req, res, next) => {

    let { searchText} = req.query;
    const {type} = req.params
    let from = req.query.from;
    let to = req.query.to;
    const sort = req.query.sort && req.query.sort === 'DESC' ? 'DESC' : 'ASC';
    let sortField = req.query.sortField || 'createdAt'
    let registeredBy = req.user.registeredBy
    let params = {
        sort,
        searchText,
        sortField,
        registeredBy,
        from,
        to
    }
    const data = await connectionExcelCSVData(params);
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
})
exports.connectionGeneratePDF = asyncHandler(async (req, res, next) => {

    let { searchText} = req.query;

    const sort = req.query.sort && req.query.sort === 'DESC' ? 'DESC' : 'ASC';
    let sortField = req.query.sortField || 'createdAt'
    let registeredBy = req.user.registeredBy
    let from = req.query.from;
    let to = req.query.to;
    let params = {
        sort,
        searchText,
        sortField,
        registeredBy,
        from,
        to
    }
    const data = await connectionExcelCSVData(params);
    if (!data) {
    return next(new ErrorResponse(`Something went wrong while generating report`, 500))
  } else if (data.length < 1) {
    return next(new ErrorResponse(`No data is available for export`, 409))
    }
    
    const templateDetails = {
        title: 'Connection Requests Report'
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