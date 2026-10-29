const asyncHandler = require("../../middlewares/async");
const { findAllEsimRecordsCountAdmin, esimOrderExcelCSV } = require("../../models/use-cases/eSIM");
const ErrorResponse = require("../../utils/error-response");
const fs = require("fs");
const { generateExcelBufferAndType } = require("../../utils/generateExcelBufferAndType");
const { reportPdfTemplate } = require("../../utils/reportTemplate");
const { puppeteerPdfToFile } = require("../../utils/puppeteer");
const accessKey = 'esim'

// exports.findAllTransactionsAndCount = asyncHandler(async (req, res, next) => {
//     let { from, to, searchText, page, itemsPerPage } = req.query;
//     let corporateId = req.query.corporateId || undefined

//     const sort = req.query.sort && req.query.sort === 'DESC' ? 'DESC' : 'ASC';
//     let column = 'createdAt'
//     // Parse page and itemsPerPage to integers (you can also use parseInt)
//     page = page ? parseInt(page) : 1;
//     itemsPerPage = itemsPerPage ? parseInt(itemsPerPage) : null;
//     let limit = itemsPerPage

//     // Calculate offset based on page and itemsPerPage
//     let offset;
//     if (page && itemsPerPage) {
//         offset = (page - 1) * itemsPerPage;
//     }

//     let params = {
//         from,
//         to,
//         limit,
//         offset,
//         searchText,
//         sort,
//         column,
//         corporateId
//     }

//     const transactionsData = await findAllEsimRecordsCount(params);
//     if (!transactionsData) {
//         return next(new ErrorResponse(`Something went wrong while getting all transaction from DB`, 500))
//     } else {
//         return res.status(200).json({
//             'status': true,
//             'data': {
//                 result: transactionsData.rows,
//                 totalData: transactionsData.count
//             },
//             'message': 'fetched transactions successfully!!',
//             'responseCode': '000'
//         })
//     }
// })
exports.findAllTransactionsAndCount = asyncHandler(async (req, res, next) => {   

    let { from, to, searchText, page, itemsPerPage, partnerId} = req.query;

    const sort = req.query.sort && req.query.sort === 'DESC' ? 'DESC' : 'ASC';
    let sortField = req.query.sortField || 'transactionDate'

    // Parse page and itemsPerPage to integers (you can also use parseInt)
     page = page ? parseInt(page) : 1;
     itemsPerPage = itemsPerPage ? parseInt(itemsPerPage) : null;
     let limit = itemsPerPage 
  
    // Calculate offset based on page and itemsPerPage
    let offset;
    if (page && itemsPerPage) {
      offset = (page - 1) * itemsPerPage;
    }

    let serviceAttribute = []
    let credentialAttribute = ['name','username']
    let transactionAttribute = []
    // let orderAttribute = ['id', 'amountInINR', 'paymentMode', 'status', 'orderResponse', "transactionDate"]
    let orderAttribute = ['id', 'amountInINR', 'paymentMode', 'status', 'orderResponse', "transactionDate",'providerId', 'corporateTxnId']

    let params ={
        from,
        to,
        accessKey,
        searchText,
        sort,
        limit,
        offset,
        serviceAttribute,
        credentialAttribute,
        transactionAttribute,
        orderAttribute,
        sortField,
        partnerId
    }
    
    const transactionsData = await findAllEsimRecordsCountAdmin(params);

    if (!transactionsData) {
        return next(new ErrorResponse(`Something went wrong while getting all orders from DB`, 500))
    } else {
        return res.status(200).json({
            'status': true,
            'data': {
                result:transactionsData.rows,
            totalData:transactionsData.count
            },
            'message': 'fetched orders successfully!!',
            'responseCode': '000'
        })
    }
})
exports.esimOrderGenerateExcelCSV = asyncHandler(async (req, res, next) => {   

    let { from, to, searchText } = req.query;
    const {type} = req.params;

    const sort = req.query.sort && req.query.sort === 'DESC' ? 'DESC' : 'ASC';
    let sortField = req.query.sortField || 'transactionDate'

    let serviceAttribute = []
    let credentialAttribute = ['name','username']
    let transactionAttribute = []
    // let orderAttribute = ['id', 'amountInINR', 'paymentMode', 'status', 'orderResponse', "transactionDate"]
    let orderAttribute = ['id', 'amountInINR', 'paymentMode', 'status', 'orderResponse', "transactionDate",'providerId', 'corporateTxnId']

    let params ={
        from,
        to,
        accessKey,
        searchText,
        sort,
        serviceAttribute,
        credentialAttribute,
        transactionAttribute,
        orderAttribute,
        sortField
    }
    
    const data = await esimOrderExcelCSV(params);

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
exports.esimOrderGeneratePDF = asyncHandler(async (req, res, next) => {   

    let { from, to, searchText } = req.query;

    const sort = req.query.sort && req.query.sort === 'DESC' ? 'DESC' : 'ASC';
    let sortField = req.query.sortField || 'transactionDate'

    let serviceAttribute = []
    let credentialAttribute = ['name','username']
    let transactionAttribute = []
    // let orderAttribute = ['id', 'amountInINR', 'paymentMode', 'status', 'orderResponse', "transactionDate"]
    let orderAttribute = ['id', 'amountInINR', 'paymentMode', 'status', 'orderResponse', "transactionDate",'providerId', 'corporateTxnId']

    let params ={
        from,
        to,
        accessKey,
        searchText,
        sort,
        serviceAttribute,
        credentialAttribute,
        transactionAttribute,
        orderAttribute,
        sortField
    }
    
    const data = await esimOrderExcelCSV(params);

    if (!data) {
    return next(new ErrorResponse(`Something went wrong while generating report`, 500))
  } else if (data.length < 1) {
    return next(new ErrorResponse(`No data is available for export`, 500))
    }
    
    const templateDetails = {
        title: 'eSIM Report'
    }
    const reportHtmlWithStyle = reportPdfTemplate(data,templateDetails);
    let random = new Date().valueOf();
    const outputFile = `report-${random}.pdf`;

    // Use browser pooling for PDF generation
    const { status, buffer } = await puppeteerPdfToFile({
        html: reportHtmlWithStyle,
        outputFile,
        options: {
            scale: 0.6,
            format: 'A4',
            preferCSSPageSize: true
        }
    });

    // Clean up temp file
    try {
        if (fs.existsSync(outputFile)) {
            fs.unlinkSync(outputFile);
        }
    } catch (unlinkError) {
        // Ignore cleanup errors
    }

    if (!status || !buffer) {
        return next(new ErrorResponse('Failed to generate PDF', 500));
    }

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