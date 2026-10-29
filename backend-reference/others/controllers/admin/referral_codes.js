const {
     create,
     // findOne,
     updateReferralCode,
     deleteReferralCode,
     findAllReferralCodesAndCount,
     getExcelCSVData,
     findOneWithReferalcode,
     referralCodesAndCountExport,
    findReferralReportCount,
    findReferralReportExcel,
    findGeneralReferralReportExcel,
    fetchReferralReward,
    updateReferralReward,
    findAllWithReferalcodePartnerID
} = require('../../models/use-cases/referral_codes')
const asyncHandler = require('../../middlewares/async')
const ErrorResponse = require('../../utils/error-response')
const puppeteer = require('puppeteer');
const fs = require("fs");
const { authenticate } = require('../../utils/validatePassword')
const { generateExcelBufferAndType,generateMultipleExcelBufferAndType } = require('../../utils/generateExcelBufferAndType');
const { reportPdfTemplate } = require('../../utils/reportTemplate');

exports.createReferralCode = asyncHandler(async (req, res, next) => {
    const data = req.body
    let isCodeAvailable = await findOneWithReferalcode(data.referralCode, data.partnerId)
    if (isCodeAvailable) {
        return next(new ErrorResponse(`Referral code already exists`, 403))
    }
    let result = await create(data)
    if (!result) {
        return next(new ErrorResponse(`Something went wrong while adding referral code`, 500))
    } else {
        return res.status(200).json({
            'status': true,
            'message': 'Referral code added successfully',
            'data': result,
            'responseCode': '000'
        })
    }
})

exports.findAllReferralCodesAndCount = asyncHandler(async (req, res, next) => {

    let { searchText, page, itemsPerPage } = req.query;

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
        sortField
    }
    const codeData = await findAllReferralCodesAndCount(params);

    if (!codeData) {
        return next(new ErrorResponse(`Something went wrong while getting all referral codes from database`, 500))
    } else {
        return res.status(200).json({
            'status': true,
            'data': {
                'recordsTotal': codeData ? codeData.count : 0,
                'recordsFiltered': codeData ? codeData.count : 0,
                'data': codeData ? codeData.rows : 0
            },
            'message': 'Referral codes fetched successfully',
            'responseCode': '000'
        })
    }
})
exports.findAllReferralCodes = asyncHandler(async (req, res, next) => {

    let { searchText,partnerId } = req.query;

    const sort = req.query.sort && req.query.sort === 'ASC' ? 'ASC' : 'DESC';
    let sortField = req.query.sortField || 'createdAt'


    let params = {
        searchText,
        sort,
        sortField
    }
    const codeData = await findAllWithReferalcodePartnerID(params,partnerId);

    if (!codeData) {
        return next(new ErrorResponse(`Something went wrong while getting all referral codes from database`, 500))
    } else {
        return res.status(200).json({
            'status': true,
            'data': {
                'data': codeData ? codeData.rows : 0
            },
            'message': 'Referral codes fetched successfully',
            'responseCode': '000'
        })
    }
})
exports.referralCodesAndCountExcelCSV = asyncHandler(async (req, res, next) => {
     let { searchText } = req.query;
    const { type } = req.params;

     const sort = req.query.sort && req.query.sort === 'ASC' ? 'ASC' : 'DESC';
     let sortField = req.query.sortField || 'createdAt'
     let params = {
          searchText,
          sort,
          sortField,
     }
    const data = await referralCodesAndCountExport(params);

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

exports.referralCodesAndCountPDF = asyncHandler(async (req, res, next) => {

    let { searchText } = req.query;

    const sort = req.query.sort && req.query.sort === 'ASC' ? 'ASC' : 'DESC';
    let sortField = req.query.sortField || 'createdAt'
    let params = {
        searchText,
        sort,
        sortField
    }
    const data = await referralCodesAndCountExport(params);

    if (!data) {
        return next(new ErrorResponse(`Something went wrong while generating report`, 500))
    } else if (data.length < 1) {
        return next(new ErrorResponse(`No data is available for export`, 500))
    }

    const templateDetails = {
        title: 'Referral Code'
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

exports.updateReferralCode = asyncHandler(async (req, res, next) => {
    let params = req.params
    let data = req.body
    let isCodeAvailable = await findOneWithReferalcode(data.referralCode, data.partnerId)
    if (isCodeAvailable && isCodeAvailable.id != params.id) {
        return next(new ErrorResponse(`Referral code already exists`, 403))
    }
    const result = await updateReferralCode(params, data);
    if (!result) {
        return next(new ErrorResponse(`Something went wrong while updating the referral code`, 500))
    } else {
        return res.status(200).json({
            'status': true,
            'message': 'Referral code updated successfully',
            'data': {},
            'responseCode': '000'
        })
    }
})

exports.updateStatus = asyncHandler(async (req, res, next) => {
    let params = req.params
    let data = req.body

    let result = await updateReferralCode(params, data);
    if (!result) {
        return next(new ErrorResponse(`Something went wrong while updating status`, 500))
    } else {
        return res.status(200).json({
            'status': true,
            'message': 'Status updated successfully',
            'data': {},
            'responseCode': '000'
        })
    }
})

exports.deleteReferralCode = asyncHandler(async (req, res, next) => {
    let params = req.params
    const result = await deleteReferralCode(params);
    if (!result) {
        return next(new ErrorResponse(`Something went wrong while deleting the referral code`, 500))
    } else {
        return res.status(200).json({
            'status': true,
            'message': 'Referral code deleted successfully',
            'data': {},
            'responseCode': '000'
        })
    }
})

exports.getExcel = asyncHandler(async (req, res, next) => {
    const { password } = req.query
    let isAuthenticated = await authenticate({ credentialId: 1, password: password })
    if (!isAuthenticated) {
        return res.status(401).json({ success: false, message: 'Unauthorized: Invalid password.' });
    }
    let result = await getExcelCSVData()
    if (!result) {
        return next(new ErrorResponse(`Something went wrong while fetching excel/CSV data`, 200))
    } else {
        return res.status(200).json({
            'success': true,
            'data': result
        })
    }
})

exports.referralCountReports = asyncHandler(async (req, res) => {

    let { fromDate, toDate, partnerId, referralCode } = req.query;

    // Parse page and itemsPerPage to integers (you can also use parseInt)
    let params = {
        fromDate,
        toDate,
        partnerId,
        referralCode
    }
    const codeData = await findReferralReportCount(params);
    return res.status(200).json({
        'status': true,
        'data': {
            'count': codeData
        },
        'message': 'Referral codes fetched successfully',
        'responseCode': '000'
    })
})

exports.referralCountReportsExcel = asyncHandler(async (req, res, next) => {

    let { fromDate, toDate, partnerId, referralCode } = req.query;

    // Parse page and itemsPerPage to integers (you can also use parseInt)
    let params = {
        fromDate,
        toDate,
        partnerId,
        referralCode
    }
    const data = await findReferralReportExcel(params);

    if (!data) {
        return next(new ErrorResponse(`Something went wrong while generating report`, 500))
    } else if (data.length < 1) {
        return next(new ErrorResponse(`No data is available for export`, 500))
    } 
    else {
        const { buffer, fileType } = await generateExcelBufferAndType(data, 'excel')
        return res.status(200).json({
            'status': true,
            'data': { buffer, fileType },
            'message': 'Fetched excel/csv datas successfully',
            'responseCode': '000'
        })
    }
})
exports.generalReferralReportsExcel = asyncHandler(async (req, res, next) => {

    let { fromDate, toDate, partnerId } = req.query;
    let params = {
        fromDate,
        toDate,
        partnerId
    }
    const data1 = await findReferralReportExcel(params);
    const data2 = await findGeneralReferralReportExcel(params);

    if (!data1) {
        return next(new ErrorResponse(`Something went wrong while generating report`, 500))
    } else if (data1.length < 1) {
        return next(new ErrorResponse(`No data is available for export`, 500))
    } 
    else {
        const { buffer, fileType } = await generateMultipleExcelBufferAndType(data1,data2 ,'excel')
        return res.status(200).json({
            'status': true,
            'data': { buffer, fileType },
            'message': 'Fetched excel/csv datas successfully',
            'responseCode': '000'
        })
    }
})

exports.fetchReferralReward = async (req, res) => {
    try {
        const serviceReward = await fetchReferralReward();
        return res.status(200).json({
            status: true,
            data: { reward: serviceReward?.reward},
            message: 'Referral reward fetched successfully',
            responseCode: '000'
        })

    } catch (error) {
        return res.status(500).json({
            status: false,
            data: {},
            message: 'something went wrong.',
            responseCode: '001'
        })
    }
}

exports.updateReferralReward = async (req, res) => {
    try {
        const { reward } = req.body;
        
        const serviceReward = await updateReferralReward(reward);
        return res.status(200).json({
            status: true,
            data: { reward: serviceReward?.reward},
            message: 'Referral reward updated successfully',
            responseCode: '000'
        })

    } catch (error) {
        return res.status(500).json({
            status: false,
            data: {},
            message: 'something went wrong.',
            responseCode: '001'
        })
    }
}