const { findAllWalletTransactions, walletExcelCSV } = require('../../models/use-cases/transaction')
// let sequelize = require('../../configs/database')
// const { flatten } = require('../../utils/flatten')
const asyncHandler = require('../../middlewares/async')
const ErrorResponse = require('../../utils/error-response')
const puppeteer = require('puppeteer');
const fs = require("fs");
const { generateExcelBufferAndType } = require('../../utils/generateExcelBufferAndType')
const { reportPdfTemplate } = require('../../utils/reportTemplate')
const transaction = require('../../models/entities/transaction')
const { dispatchJournalRetry } = require('../../utils/bull/queue/accountingQueues')
const { Op } = require('sequelize')

exports.findAllWalletReports = asyncHandler(async (req, res, next) => {
  
    let userId = req.query.corporateId || undefined

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
    const transactionsData = await findAllWalletTransactions(params);
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

exports.retryWalletTransferJournal = asyncHandler(async (req, res, next) => {
    const entry = await transaction.findOne({
        where: { id: req.params.id, transactionCategory: { [Op.in]: ['FUND TRANSFER', 'FUND REVERSAL'] } },
        raw: true,
    });
    if (!entry) return next(new ErrorResponse('Wallet transfer not found', 404));
    if (entry.journalRecordStatus?.walletTransfer === true) {
        return res.status(200).json({ status: true, data: { success: true, skipped: true }, message: 'Journal is already recorded', responseCode: '000' });
    }

    const result = await dispatchJournalRetry({
        type: 'walletTransfer',
        corporateTxnId: entry.corporateTxnId,
        credentialId: entry.credentialId,
        amount: entry.transactionType === 'CREDIT' ? entry.creditAmount : entry.debitAmount,
        direction: entry.transactionType === 'CREDIT' ? 'credit' : 'debit',
        occurredAt: entry.transactionDate,
    });
    return res.status(200).json({
        status: true,
        data: result,
        message: result?.success ? 'Journal retried successfully' : result?.reason || 'Journal retry failed',
        responseCode: '000',
    });
})

exports.generateExcelCSV = async (req, res, next) => {
    let userId = req.query.corporateId || undefined

    let { from, to, searchText } = req.query;
    const {type} = req.params;

    const sort = req.query.sort && req.query.sort === 'ASC' ?  'ASC' : 'DESC' ;
    let sortField = req.query.sortField || 'createdAt'
    let params = { from, to, searchText, sort, sortField, userId }
    let data = await walletExcelCSV(params)
    
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
    let userId = req.query.corporateId || undefined

    let { from, to, searchText } = req.query;

    const sort = req.query.sort && req.query.sort === 'ASC' ?  'ASC' : 'DESC' ;
    let sortField = req.query.sortField || 'createdAt'
    let params = { from, to, searchText, sort, sortField, userId }
    let data = await walletExcelCSV(params)
    
    if (!data) {
    return next(new ErrorResponse(`Something went wrong while generating report`, 400))
  } else if (data.length < 1) {
    return next(new ErrorResponse(`No data is available for export`, 400))
    }
    const templateDetails = {
        title: 'Wallet Report'
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
        scale: 0.8,
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
}
