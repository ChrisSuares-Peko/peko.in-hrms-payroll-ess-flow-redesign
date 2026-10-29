const puppeteer = require('puppeteer');
const fs = require("fs");
const asyncHandler = require("../../middlewares/async");
const { findAllAddOnAndCount, AddOnsExport } = require("../../models/use-cases/whatsappBusiness");
const ErrorResponse = require("../../utils/error-response");
const { generateExcelBufferAndType } = require("../../utils/generateExcelBufferAndType");
const { reportPdfTemplate } = require("../../utils/reportTemplate");

exports.findAllAddOnsAndCount = asyncHandler(async (req, res, next) => {
    let { searchText, page, itemsPerPage, from, to,status } = req.query;
    // let corporateId = req.user.id

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
        from, 
        to, 
        limit,
        offset,
        searchText,
        sort,
        sortField,
        status
    }
    const addOnData = await findAllAddOnAndCount(params);

    if (!addOnData) {
        return next(new ErrorResponse(`Something went wrong while getting all addOnData from DB`, 500))

    } else {
        return res.status(200).json({
            'status': true,
            'data' : {
                'recordsTotal': addOnData ? addOnData.count : 0,
                'recordsFiltered': addOnData ? addOnData.count : 0,
                'data': addOnData ? addOnData.rows : 0 
            },
            'message' : 'addOn fetched successfully.',
            'responseCode' : '000'
        })
    }
});

exports.AddOnsExcelCSV = asyncHandler(async (req, res, next) => {

    let { from, to, searchText,status }= req.query
    const { type } = req.params;
    const sort = req.query.sort && req.query.sort === 'ASC' ? 'ASC' : 'DESC';
    let sortField = req.query.sortField || 'createdAt'

    let params = {
        from,
        to,
        searchText,
        sort,
        sortField,
        status
    };


    const addOnData = await AddOnsExport(params);

    if (!addOnData) {
        return next(new ErrorResponse(`Something went wrong while generating report`, 500))
    } else if (addOnData.length < 1) {
        return next(new ErrorResponse(`No data is available for export`, 500))
    } else {
        const { buffer, fileType } = await generateExcelBufferAndType(addOnData, type)
        return res.status(200).json({
            'status': true,
            'data': { buffer, fileType },
            'message': 'Fetched excel/csv datas successfully',
            'responseCode': '000'
        })
    }

});

exports.AddOnsPDF = asyncHandler(async (req, res, next) => {

    let { from, to, searchText,status }= req.query
    const sort = req.query.sort && req.query.sort === 'ASC' ? 'ASC' : 'DESC';
    let sortField = req.query.sortField || 'createdAt'

    let params = {
        from,
        to,
        searchText,
        sort,
        sortField,
        status
    };


    const data = await AddOnsExport(params);

    if (!data) {
        return next(new ErrorResponse(`Something went wrong while generating report`, 500))
    } else if (data.length < 1) {
        return next(new ErrorResponse(`No data is available for export`, 500))
    }

    const templateDetails = {
        title: 'WhatsApp Add ons Report'
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
        scale: 0.6,
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