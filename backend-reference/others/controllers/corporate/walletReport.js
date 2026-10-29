const {  walletExcelCSV, findPekoWalletTransactions } = require('../../models/use-cases/transaction')
const asyncHandler = require('../../middlewares/async')
const ErrorResponse = require('../../utils/error-response')
const { generateExcelBufferAndType } = require('../../utils/generateExcelBufferAndType')
const { reportPdfTemplate } = require('../../utils/reportTemplate')
const { renderPdf } = require('../../utils/puppeteerPool')

exports.findAllWalletReports = asyncHandler(async (req, res, next) => {
  
    let userId = req.user.id;

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

    let params = { from, to, limit, offset, searchText, sort, sortField, userId }
    const transactionsData = await findPekoWalletTransactions(params, [ "PAYMENT", "CREDIT"]);
    if (!transactionsData) {
        return next(new ErrorResponse(`Something went wrong while getting all system from DB`, 500))
    } else {
        return res.status(200).json({
            'status': true,
            'data': {
            'recordsTotal': transactionsData.count,
            'recordsFiltered': transactionsData.count,
            'data': transactionsData.rows },
            'message' : 'Reports fetched successfully',
            'responseCode' : '000'
        })
    }
})

exports.generateExcelCSV = async (req, res, next) => {
    let userId = req.user.id;

    let { from, to, searchText } = req.query;
    const {type} = req.params;

    const sort = req.query.sort && req.query.sort === 'ASC' ?  'ASC' : 'DESC' ;
    let sortField = req.query.sortField || 'createdAt'
    let params = { from, to, searchText, sort, sortField, userId }
    let data = await walletExcelCSV(params,[ "PAYMENT", "CREDIT"], [
        "Transaction Date",
        "Transaction ID",
        "Amount",
        "Type",
        "Payment Mode",
        "Status"
      ])
    
    if (!data) {
    return next(new ErrorResponse(`Something went wrong while generating report`, 500))
  } else if (data.length < 1) {
    return next(new ErrorResponse(`No data is available for export`, 500))
      }else{
        const {buffer, fileType} = await generateExcelBufferAndType(data,type)
        return res.status(200).json({
            'status': true,
            'data': {buffer, fileType},
            'message': 'Fetched excel/csv datas successfully',
            'responseCode': '000'
        })
      }
}

exports.generatePDF = async (req, res, next) => {
    let userId = req.user.id;

    let { from, to, searchText } = req.query;

    const sort = req.query.sort && req.query.sort === 'ASC' ?  'ASC' : 'DESC' ;
    let sortField = req.query.sortField || 'createdAt'
    let params = { from, to, searchText, sort, sortField, userId }
    let data = await walletExcelCSV(params, [ "PAYMENT", "CREDIT"],[
        "Transaction Date",
        "Transaction ID",
        "Amount",
        "Type",
        "Payment Mode",
        "Status"
      ])
    
    if (!data) {
    return next(new ErrorResponse(`Something went wrong while generating report`, 400))
  } else if (data.length < 1) {
    return next(new ErrorResponse(`No data is available for export`, 400))
    }
    const templateDetails = {
        title: 'Wallet Transactions History'
    }
    const reportHtmlWithStyle = reportPdfTemplate(data,templateDetails);

    const buffer = await renderPdf(reportHtmlWithStyle, { scale: 0.8 });

    return res.status(200).json({
        status: true,
        message: 'report generated successfully.',
        data: {
            buffer,
            fileType: 'application/pdf'
        },
        responseCode: '000'
    });
}