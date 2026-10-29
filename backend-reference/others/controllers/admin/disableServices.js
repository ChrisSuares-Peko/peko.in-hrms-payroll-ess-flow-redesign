const { getExcel, Delete, findAll, create, find, transactionsAndCountExport } = require('../../models/use-cases/disableService')
const disableService = require('../../models/entities/disabledService')
// const async = require('async');
const { flatten } = require('../../utils/flatten')
const asyncHandler = require('../../middlewares/async')
const ErrorResponse = require('../../utils/error-response')
const puppeteer = require('puppeteer');
const fs = require("fs");
const { generateExcelBufferAndType } = require('../../utils/generateExcelBufferAndType')
const { reportPdfTemplate } = require('../../utils/reportTemplate')

exports.findAllTransactionsAndCount = asyncHandler(async (req, res, next) => {
   
    let { searchText, page, itemsPerPage } = req.query;

    const sort = req.query.sort && req.query.sort === 'ASC' ?  'ASC' : 'DESC' ;
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

    let params = { limit, offset, searchText, sort, sortField }
    const packageCashbackData = await findAll(params);
    if (!packageCashbackData) {
        return next(new ErrorResponse(`Something went wrong while getting all cashback`, 500))
    } else {
        let result = packageCashbackData.rows
        return res.json({
            'success': true,
            'data' : {
            'recordsTotal': packageCashbackData.count,
            'recordsFiltered': packageCashbackData.count,
            'data': result
            },
            'message' : 'Record fetched successfully',
            'responseCode' : '000'
        })
    }
})
exports.transactionsAndCountExcelCSV = asyncHandler(async (req, res, next) => {
   
    let { searchText } = req.query;
    const {type} = req.params;

    const sort = req.query.sort && req.query.sort === 'ASC' ?  'ASC' : 'DESC' ;
    let sortField = req.query.sortField || 'createdAt'
    let params = { searchText, sort, sortField }
    const data = await transactionsAndCountExport(params);
    if (!data) {
        return next(new ErrorResponse(`Something went wrong while generating report`, 500))
    } else if (data.length < 1) {
        return next(new ErrorResponse(`No data is available for export`, 500))
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
exports.transactionsAndCountPDF = asyncHandler(async (req, res, next) => {
   
    let { searchText } = req.query;

    const sort = req.query.sort && req.query.sort === 'ASC' ?  'ASC' : 'DESC' ;
    let sortField = req.query.sortField || 'createdAt'
    let params = { searchText, sort, sortField }
    const data = await transactionsAndCountExport(params);
    if (!data) {
        return next(new ErrorResponse(`Something went wrong while generating report`, 500))
    } else if (data.length < 1) {
        return next(new ErrorResponse(`No data is available for export`, 500))
    }
    const templateDetails = {
        title: 'Disable Service'
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

exports.createDisabledService = asyncHandler(async (req, res, next) => {
    const { serviceOperatorIds, credentialId } = req.body;

    let isServiceDisabled = await find({ serviceOperatorIds, credentialId });

    if (isServiceDisabled) {
        return next(new ErrorResponse(`Record already exists!`, 403));
    }
    const payload = serviceOperatorIds.map((id) => ({
        credentialId,
        serviceOperatorId: id,
    }));

    const result = await create(payload);
    if (!result) {
        return next(new ErrorResponse(`Something went wrong while creating cashback`, 500))
    } else {
        return res.status(200).json({
            'status': true,
            'data': result,
            'message': 'Record created successfully',
            'responseCode': '000'
        })
    }
})

exports.deleteDisableService = asyncHandler(async (req, res, next) => {
    let params = req.params
    let result = await Delete(params);
    if (!result) {
        return next(new ErrorResponse(`Something went wrong while delete cashback`, 500))
    } else {
        return res.status(200).json({
            'status': true,
            'data': {result},
            'message' : 'Record deleted successfully',
            'responseCode' : '000'
        })
    }
})

exports.getExcel = asyncHandler(async (req, res, next) => {
    let data = await getExcel()
    if (!data) {
        return next(new ErrorResponse(`Something went wrong while generating`, 200))
    } else {
        let result = data.map(function (t) {
            return flatten(t)
        })
        return res.status(200).json({
            'success': true,
            'data': result
        })
    }
})

exports.disableServicesStatus = asyncHandler(async (req, res) => {
    const params = req.params;
    const data = req.body;
    const result = await disableService.update(data, {
        where: {
            Id: params.id
        }
    });
    if (result[0] === 0) {
        return res.status(404).json({
            'status': false,
            'data': {},
            'message' : 'Something went wrong',
            'responseCode' : '001'
        })
    } else {
        return res.status(200).json({
            'status': true,
            'data': {result},
            'message' : 'Record updated successfully',
            'responseCode' : '000'
        })
    }
})