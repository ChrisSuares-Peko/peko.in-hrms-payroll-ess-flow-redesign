
const asyncHandler = require('../../middlewares/async')
const ErrorResponse = require('../../utils/error-response')
const puppeteer = require('puppeteer');
const fs = require("fs");
const { generateExcelBufferAndType } = require('../../utils/generateExcelBufferAndType');
const { reportPdfTemplate } = require('../../utils/reportTemplate');
const { fetchAllBrandingDetails,brandingExports ,updateStatusForBranding, updateBrandingData} = require('../../models/use-cases/systemUser');

exports.findAllBranding = asyncHandler(async (req, res, next) => {
    let { from, to, searchText, page, itemsPerPage } = req.query;

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


    let params = {
        from,
        to,
        searchText,
        sort,
        limit,
        offset,
        sortField
    }

    const permissions = await fetchAllBrandingDetails(params)

    if (!permissions) {
        return next(new ErrorResponse(`Something went wrong while getting branding`, 500))
    } else {
        return res.status(200).json({
            'status': true,
            'message': 'Data fetched successfully',
            'data': permissions,
           'responseCode' : '000'
    })
    }
})

exports.updateBranding = asyncHandler(async (req, res, next) => {
    const data = req.body
    let {id} = req.params

    const updatedData={
        ...data,
        assets:{}
    }
    let result = await updateBrandingData(id,updatedData)
   
    if (!result) {
        return next(new ErrorResponse(`Something went wrong while updating branding`, 500))
    } else {
        return res.status(200).json({
            'status': true,
            'message': 'Branding updated successfully',
            'data': {},
            'responseCode' : '000'
        })
    }
})
exports.updateBrandingStatus = asyncHandler(async (req, res, next) => {
    const data = req.body
    let {id} = req.params
    const params={
        id,
        status:data.status
    }
    let result = await updateStatusForBranding(params)
   
    if (!result) {
        return next(new ErrorResponse(`Something went wrong while updating branding`, 500))
    } else {
        return res.status(200).json({
            'status': true,
            'message': 'Status updated successfully',
            'data': {},
            'responseCode' : '000'
        })
    }
})

exports.brandingExcelCSV = asyncHandler(async (req, res, next) => {
    let { from, to, searchText } = req.query;
    const {type} = req.params;

    const sort = req.query.sort && req.query.sort === 'ASC' ?  'ASC' : 'DESC' ;
    let sortField = req.query.sortField || 'createdAt'
    


    let params = {
        from,
        to,
        searchText,
        sort,
        sortField
    }

    const data = await brandingExports(params)

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

exports.brandingPDF = asyncHandler(async (req, res, next) => {
    let { from, to, searchText } = req.query;

    const sort = req.query.sort && req.query.sort === 'ASC' ?  'ASC' : 'DESC' ;
    let sortField = req.query.sortField || 'createdAt'
    


    let params = {
        from,
        to,
        searchText,
        sort,
        sortField
    }

    const data = await brandingExports(params)

    if (!data) {
    return next(new ErrorResponse(`Something went wrong while generating report`, 500))
  } else if (data.length < 1) {
    return next(new ErrorResponse(`No data is available for export`, 500))
    }
    
    const templateDetails = {
        title: 'Branding Report'
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
        scale: 0.6,
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
