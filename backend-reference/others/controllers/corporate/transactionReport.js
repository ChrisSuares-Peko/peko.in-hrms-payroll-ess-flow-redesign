// const { findAllTransactionsCount } = require('/models/use-cases/transaction')


const {
  findAllTransactions,
  // transactionDetails,
  findAllWalletTransactionsCount,
  findAllOrdersCount,
  transactionExcelCSV,
  transactionPDF,
  findAllPartnerTransactions,
  findAllVendorTransactions,
  findAllWorkspaceOrders,
  getDataExcelCSV,
  findAllSubscriptionOrders,
  transactionReports,
  findAllTransaction,
  vendorTransactionsExcelCSV,
  transactionsExcelCSV,
  workspaceOrdersExcelCSVData,
  subscriptionOrdersExcelCSVData,
  
  findAllCustomerSubscriptionOrders,
  subscriptionTransactionsExcelCSV,
  findOneOrderDetails,
  findTransactionCategoryByTxnId,
  getTransactionReport,
  getTransactionReportExcel,
  findSubscriptionTransactionStatusByTxnId
} = require('../../models/use-cases/transaction');
const { findOne: findCorporateUser } = require('../../models/use-cases/corporateUser');
const { updateOrder: updatePekoInvoiceDetails } = require('../../models/use-cases/order');
const { generateInvoiceOrReceiptPdf } = require('../../utils/pekoRecieptHelper');
const { generatePekoReceiptId } = require('../../utils/generatePekoInvoiceId');
const { formattedDateOnly } = require('../../utils/formatter');
const { resolvePartnerScope } = require('../../utils/partnerScope');
// const {
//     flatten
// } = require('./../../utils/flatten')
const asyncHandler = require('./../../middlewares/async')
const ErrorResponse = require('./../../utils/error-response');
const { generateExcelBufferAndType } = require('../../utils/generateExcelBufferAndType');
const { reportPdfTemplate } = require('../../utils/reportTemplate');
const { isPdfBuffer } = require('../../utils/pdfHelper');
const { customLog } = require('../../utils/loggerHelper');
const { renderPdf } = require('../../utils/puppeteerPool');
const { categoryForAccessKey } = require('../../utils/serviceCategory');
const { derivePaymentInstrument } = require('../../utils/paymentInstrument');

const isFilledObject = (value) => !!(
    value &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    Object.keys(value).length > 0
);

// True when the order's stored pekoInvoiceDetails carries a corporate tax invoice: Peko's platform fee
// invoice, the plan invoice issued on behalf of the vendor, or both.
const hasStoredInvoice = (pekoInvoiceDetails) => {
    let details = pekoInvoiceDetails;
    if (typeof details === 'string') {
        try {
            details = JSON.parse(details);
        } catch {
            return false;
        }
    }
    return isFilledObject(details?.corporate?.invoiceData) || isFilledObject(details?.corporate?.planInvoiceData);
};


exports.findAllTransactionsAndCount = asyncHandler(async (req, res, next) => {

  let { from, to, searchText, page, itemsPerPage } = req.query;
  let corporateId = req.user.id

  let categoryName = req.query.categoryName ? decodeURIComponent(req.query.categoryName) : undefined;
  let accessKey = req.query.accessKey ? decodeURIComponent(req.query.accessKey) : undefined;
  const sort = req.query.sort && req.query.sort === 'DESC' ? 'DESC' : 'ASC';
  const filter = req.query.filter || undefined;
   let sortField = req.query.sortField || 'corporateTxnId'
  // Parse page and itemsPerPage to integers (you can also use parseInt)
  page = page ? parseInt(page) : 1;
  itemsPerPage = itemsPerPage ? parseInt(itemsPerPage) : null;
  let limit = itemsPerPage

  // Calculate offset based on page and itemsPerPage
  let offset;
  if (page && itemsPerPage) {
      offset = (page - 1) * itemsPerPage;
  }

  let serviceAttribute = ["id", "serviceProvider"];
  let credentialAttribute = [];
  let transactionAttribute = ["id", "transactionDate", "corporateTxnId", "transactionCategory", "corporateCashback"];
  let orderAttribute = ["id", "amountInINR", "paymentMode", "paymentModeResponse", "status","orderResponse","pekoInvoiceDetails"];

  let params = {
      from,
      to,
      categoryName,
      accessKey,
      searchText,
      sort,
      filter,
      limit,
      offset,
      corporateId,
      serviceAttribute,
      credentialAttribute,
      transactionAttribute,
      orderAttribute,
      sortField

  }

  if (req.user.role === 'CORPORATE_SUB_USER' && req.user.subCorporateId) {
      params.subCorporateUserId = req.user.subCorporateId;
  }

  const transactionsData = await findAllTransactions(params);
  if (!transactionsData) {
      return next(new ErrorResponse(`Something went wrong while getting all corporate from DB`, 500))
  } else {
      // Expose only an isInvoice boolean (a stored tax invoice exists for the
      // order) — the pekoInvoiceDetails JSON itself stays server-side.
      const rows = (transactionsData.rows || []).map((row) => {
          const isInvoice = hasStoredInvoice(row?.order?.pekoInvoiceDetails);
          if (row?.order) {
              row.order.paymentInstrument = derivePaymentInstrument(row.order.paymentModeResponse, row.order.paymentMode);
              delete row.order.pekoInvoiceDetails;
          }
          return { ...row, isInvoice };
      });
      return res.status(200).json({
          'status': true,
          'data': {
              result: rows,
              totalData: transactionsData.count
          },
          'message': 'fetched transactions successfully!!',
          'responseCode': '000'
      })
  }
})

exports.findAllTransactionsAndCountCorporateSide = asyncHandler(async (req, res, next) => {

    let { from, to, searchText = "", page, itemsPerPage } = req.query;
    // corporateId is never taken from the query string — this is the corporate's own
    // session (requireOwnCorporate enforces :corporateId === req.user.id upstream), so
    // a query override would let any corporate pull another corporate's report.
    let corporateId = req.user.id

  let registeredBy = req.user.registeredBy

  let categoryName = req.query.categoryName ? decodeURIComponent(req.query.categoryName) : undefined;
  const sort = req.query.sort && req.query.sort === 'ASC' ? 'ASC' : 'DESC';
  let sortField = req.query.sortField || 'corporateTxnId'
  const filter = req.query.filter || undefined;

  // Parse page and itemsPerPage to integers (you can also use parseInt)
  page = page ? parseInt(page) : 1;
  itemsPerPage = itemsPerPage ? parseInt(itemsPerPage) : null;
  let limit = itemsPerPage

  // Calculate offset based on page and itemsPerPage
  let offset;
  if (page && itemsPerPage) {
      offset = (page - 1) * itemsPerPage;
  }

  let serviceAttribute = ['id', 'serviceProvider', 'serviceCategory']
  let credentialAttribute = ['name', 'email', 'username','registeredBy']
  let transactionAttribute = ['id', 'transactionDate', 'corporateTxnId', 'transactionCategory', 'corporateCashback', 'totalCashback', 'systemCashback', 'balance', 'remarks', 'status', 'credentialId', 'creditAmount', 'debitAmount', 'transactionType']
  let orderAttribute = ['id', 'amountInINR', 'paymentMode', 'accountNo', 'status']

  let params = {
      from,
      to,
      categoryName,
      searchText,
      sort,
      filter,
      limit,
      offset,
      corporateId,
      serviceAttribute,
      credentialAttribute,
      transactionAttribute,
      orderAttribute,
      sortField,
      registeredBy
  }

  const transactionsData = await findAllTransactions(params);
  if (!transactionsData) {
      return next(new ErrorResponse(`Something went wrong while getting all corporate from DB`, 500))
  } else {
      return res.status(200).json({
          'status': true,
          'data': {
              result: transactionsData.rows,
              totalData: transactionsData.count
          },
          'message': 'fetched transactions successfully!!',
          'responseCode': '000'
      })
  }
})

/**
* excel or csv downloads of corporate transaction and cashback
*/
exports.corporateTransactionGenerateExcelCSV = asyncHandler(async (req, res, next) => {

  let { from, to, searchText,title } = req.query;
  const {type} = req.params
  
  // corporateId is never taken from the query string — this is the corporate's own
  // session (requireOwnCorporate enforces :corporateId === req.user.id upstream), so
  // a query override would let any corporate pull another corporate's report.
  let corporateId = req.user.id
  
  let registeredBy = req.user.registeredBy

  let categoryName = req.query.categoryName ? decodeURIComponent(req.query.categoryName) : undefined;
  const sort = req.query.sort && req.query.sort === 'ASC' ? 'ASC' : 'DESC';
  let sortField = req.query.sortField || 'corporateTxnId'
  const filter = req.query.filter || undefined;

  let serviceAttribute = ['id', 'serviceProvider', 'serviceCategory']
  let credentialAttribute = ['name', 'email', 'username']
  let transactionAttribute = ['id', 'transactionDate', 'corporateTxnId', 'transactionCategory', 'corporateCashback', 'totalCashback', 'systemCashback', 'balance', 'remarks', 'status', 'credentialId', 'creditAmount', 'debitAmount', 'transactionType']
  let orderAttribute = ['id', 'amountInINR', 'paymentMode', 'paymentModeResponse', 'accountNo', 'status']
  const cashbackFilter = (title == "Cashbacks") ? true : false;
  let params = {
      from,
      to,
      categoryName,
      accessKey: req.query.accessKey ? decodeURIComponent(req.query.accessKey) : undefined,
      searchText,
      sort,
      filter,
      corporateId,
      serviceAttribute,
      credentialAttribute,
      transactionAttribute,
      orderAttribute,
      sortField,
      registeredBy,
      cashbackFilter
  }
  customLog(req?.LogTraceId, "info", { params, title })
  let data;
  if(title==="Transactions")
   data= await transactionsExcelCSV(params,'corporateTransaction');
  else
   data = await transactionsExcelCSV(params,'corporateCashback');
  if (!data) {
  return next(new ErrorResponse(`Something went wrong while generating report`, 500))
} else if (data.length < 1) {
  return next(new ErrorResponse(`No data is available for export`, 500))
  } else {
      const {buffer, fileType} = await generateExcelBufferAndType(data,type)
      return res.status(200).json({
          'status': true,
          'data': {buffer, fileType},
          'message': 'Fetched excel/csv data successfully',
          'responseCode': '000'
      })
  }
})
/**
* pdf download of corporate report of transaction and cashback
*/
exports.corporateTransactionGeneratePDF = asyncHandler(async (req, res, next) => {

  let { from, to, searchText,title} = req.query;
  // corporateId is never taken from the query string — this is the corporate's own
  // session (requireOwnCorporate enforces :corporateId === req.user.id upstream), so
  // a query override would let any corporate pull another corporate's report.
  let corporateId = req.user.id

  let registeredBy = req.user.registeredBy

  let categoryName = req.query.categoryName ? decodeURIComponent(req.query.categoryName) : undefined;
  const sort = req.query.sort && req.query.sort === 'ASC' ? 'ASC' : 'DESC';
  let sortField = req.query.sortField || 'corporateTxnId'
  const filter = req.query.filter || undefined;

  let serviceAttribute = ['id', 'serviceProvider', 'serviceCategory']
  let credentialAttribute = ['name', 'email', 'username']
  let transactionAttribute = ['id', 'transactionDate', 'corporateTxnId', 'transactionCategory', 'corporateCashback', 'totalCashback', 'systemCashback', 'balance', 'remarks', 'status', 'credentialId', 'creditAmount', 'debitAmount', 'transactionType']
  let orderAttribute = ['id', 'amountInINR', 'paymentMode', 'paymentModeResponse', 'accountNo', 'status']

  const cashbackFilter = (title == "Cashbacks") ? true : false;
  let params = {
      from,
      to,
      categoryName,
      accessKey: req.query.accessKey ? decodeURIComponent(req.query.accessKey) : undefined,
      searchText,
      sort,
      filter,
      corporateId,
      serviceAttribute,
      credentialAttribute,
      transactionAttribute,
      orderAttribute,
      sortField,
      registeredBy,
      cashbackFilter
  }

  let data;
  if(title==="Transactions")
   data= await transactionsExcelCSV(params,'corporateTransaction');
  else
   data = await transactionsExcelCSV(params,'corporateCashback');
  if (!data) {
      return next(new ErrorResponse(`Something went wrong while generating report`, 500))
    } else if (data.length < 1) {
      return next(new ErrorResponse(`No data is available for export`, 500))
  }
  const templateDetails = {
      title: title === 'Transactions' ? 'Transactions Report' : 'Cashback Report'
    };
    
  const reportHtmlWithStyle = reportPdfTemplate(data,templateDetails);

  const buffer = await renderPdf(reportHtmlWithStyle, { scale: 0.6 });
  customLog(req?.LogTraceId, "info", { message: "PDF generated successfully!" })

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
exports.corporateGenerateExcelCSV = asyncHandler(async (req, res, next) => {

  let { from, to, searchText } = req.query;
  const {type} = req.params
  // corporateId is never taken from the query string — this is the corporate's own
  // session (requireOwnCorporate enforces :corporateId === req.user.id upstream), so
  // a query override would let any corporate pull another corporate's report.
  let corporateId = req.user.id
  
  let registeredBy = req.user.registeredBy

  let categoryName = req.query.categoryName ? decodeURIComponent(req.query.categoryName) : undefined;
  const sort = req.query.sort && req.query.sort === 'ASC' ? 'ASC' : 'DESC';
  let sortField = req.query.sortField || 'corporateTxnId'
  const filter = req.query.filter || undefined;

  let serviceAttribute = ['id', 'serviceProvider', 'serviceCategory']
  let credentialAttribute = ['name', 'email', 'username']
  let transactionAttribute = ['id', 'transactionDate', 'corporateTxnId', 'transactionCategory', 'corporateCashback', 'totalCashback', 'systemCashback', 'balance', 'remarks', 'status', 'credentialId', 'creditAmount', 'debitAmount', 'transactionType']
  let orderAttribute = ['id', 'amountInINR', 'paymentMode', 'accountNo', 'status']

  let params = {
      from,
      to,
      categoryName,
      searchText,
      sort,
      filter,
      corporateId,
      serviceAttribute,
      credentialAttribute,
      transactionAttribute,
      orderAttribute,
      sortField,
      registeredBy
  }

  const data = await transactionsExcelCSV(params,'corporate');
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

exports.corporateGeneratePDF = asyncHandler(async (req, res, next) => {

  let { from, to, searchText } = req.query;
  // corporateId is never taken from the query string — this is the corporate's own
  // session (requireOwnCorporate enforces :corporateId === req.user.id upstream), so
  // a query override would let any corporate pull another corporate's report.
  let corporateId = req.user.id

  let registeredBy = req.user.registeredBy

  let categoryName = req.query.categoryName ? decodeURIComponent(req.query.categoryName) : undefined;
  const sort = req.query.sort && req.query.sort === 'ASC' ? 'ASC' : 'DESC';
  let sortField = req.query.sortField || 'corporateTxnId'
  const filter = req.query.filter || undefined;

  let serviceAttribute = ['id', 'serviceProvider', 'serviceCategory']
  let credentialAttribute = ['name', 'email', 'username']
  let transactionAttribute = ['id', 'transactionDate', 'corporateTxnId', 'transactionCategory', 'corporateCashback', 'totalCashback', 'systemCashback', 'balance', 'remarks', 'status', 'credentialId', 'creditAmount', 'debitAmount', 'transactionType']
  let orderAttribute = ['id', 'amountInINR', 'paymentMode', 'accountNo', 'status']

  let params = {
      from,
      to,
      categoryName,
      searchText,
      sort,
      filter,
      corporateId,
      serviceAttribute,
      credentialAttribute,
      transactionAttribute,
      orderAttribute,
      sortField,
      registeredBy
  }

  const data = await transactionsExcelCSV(params,'corporate');
  if (!data) {
      return next(new ErrorResponse(`Something went wrong while generating report`, 500))
    } else if (data.length < 1) {
      return next(new ErrorResponse(`No data is available for export`, 500))
  }
  const templateDetails = {
      title: 'Corporate Report'
  }
  const reportHtmlWithStyle = reportPdfTemplate(data,templateDetails);

  const buffer = await renderPdf(reportHtmlWithStyle, { scale: 0.6 });
  customLog(req?.LogTraceId, "info", { message: "PDF generated successfully!" })

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

exports.findAllPartnerTransactionsAndCount = asyncHandler(async (req, res, next) => {
  const from = req.query.fromDate
  const to = req.query.toDate
  // corporateId comes only from the authenticated session — see the comment on the
  // other corporateId assignments in this file for why the query string is never used.
  const corporateId = req.user.id

  const start = parseInt(req.query.start)
  const details = req.query.details || true
  const length = parseInt(req.query.length)
  const draw = parseInt(req.query.draw)
  const categoryName = req.query.serviceCategoryName
  let searchText = req.query.search.value
  let order = req.query.orderCol,
      column = 'transactionDate' //req.query.column
  let partnerId = req.user.registeredBy == 1 ? null : req.user.registeredBy

  let params = {
      corporateId,
      categoryName,
      partnerId,
      from,
      to,
      start,
      length,
      draw,
      searchText,
      order,
      details,
      column
  }
  const transactionsData = await findAllPartnerTransactions(params);
  if (!transactionsData) {
      return next(new ErrorResponse(`Something went wrong while getting all corporate from DB`, 200))
  } else {
      let finalData = []
      transactionsData.rows.forEach((data) => {
          finalData.push({
              "TransactionDate": data.transactionDate ? data.transactionDate : "Not Available",
              "TransactionID": data.corporateTxnId ? data.corporateTxnId : "Not Available",
              "User": data.credential.name ? data.credential.name : "Not Available",
              "Username": data.credential.username ? data.credential.username : "Not Available",
              "ServiceName": data.serviceOperator.serviceProvider ? data.serviceOperator.serviceProvider : "Not Available",
              "ServiceCategory": data.serviceOperator.serviceCategory ? data.serviceOperator.serviceCategory : "Not Available",
              "Amount": data.order.baseAmount ? data.order.baseAmount : "Not Available",
              "CashbackEarned": data.corporateCashback ? data.corporateCashback : "Not Available",
              "TotalCommission": data.totalCashback ? data.totalCashback : "Not Available",
              "SystemShared": data.systemCashback ? data.systemCashback : "Not Available",
              "Status": data.status ? data.status : "Not Available",
          });

      })
      return res.status(200).json({
          'success': true,
          'draw': draw,
          'recordsTotal': transactionsData.count,
          'recordsFiltered': transactionsData.count,
          'data': finalData
      })
  }
})

exports.findAllInsightsAndCount = asyncHandler(async (req, res, next) => {
  const from = req.query.fromDate
  const to = req.query.toDate
  // corporateId comes only from the authenticated session — see the comment on the
  // other corporateId assignments in this file for why the query string is never used.
  const corporateId = req.user.id
  const start = parseInt(req.query.start)
  const details = req.query.details || false
  const length = parseInt(req.query.length)
  const draw = parseInt(req.query.draw)
  const categoryName = 'Other'
  let searchText = req.query.search.value
  let order = req.query.orderCol,
      column = 'transactionDate' //req.query.column
  let params = {
      corporateId,
      categoryName,
      from,
      to,
      start,
      length,
      draw,
      searchText,
      order,
      details,
      column
  }
  const transactionsData = await findAllTransactions(params);
  if (!transactionsData) {
      return next(new ErrorResponse(`Something went wrong while getting all corporate from DB`, 200))
  } else {
      return res.status(200).json({
          'success': true,
          'draw': draw,
          'recordsTotal': transactionsData.count,
          'recordsFiltered': transactionsData.count,
          'data': transactionsData.rows
      })
  }
})

exports.findAllVendorTransactionsAndCount = asyncHandler(async (req, res, next) => {

  const vendorId = parseInt(req.params.vendorId) || parseInt(req.query.vendorId)

  let { from, to, searchText, page, itemsPerPage } = req.query;

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
  let params = {
      vendorId,
      from,
      to,
      limit,
      offset,
      searchText,
      sort,
      sortField
  }
  const transactionsData = await findAllVendorTransactions(params);
  if (!transactionsData) {
      return next(new ErrorResponse(`Something went wrong while getting all corporate from DB`, 200))
  } else {
      return res.status(200).json({
          'status': true,
          'data': {
              'recordsTotal': transactionsData.count,
              'recordsFiltered': transactionsData.count,
              'data': transactionsData.rows
          },
          'message': 'vendor reports fetched successfully',
          'responseCode': '000'

      })
  }
})

exports.vendorGenerateExcelCSV = asyncHandler(async (req, res, next) => {

  const vendorId = parseInt(req.params.vendorId) || parseInt(req.query.vendorId)

  let { from, to, searchText } = req.query;
  const {type} = req.params

  const sort = req.query.sort && req.query.sort === 'DESC' ? 'DESC' : 'ASC';
  let sortField = req.query.sortField || 'transactionDate'

  let params = {
      vendorId,
      from,
      to,
      searchText,
      sort,
      sortField
  }
  const data = await vendorTransactionsExcelCSV(params);
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

exports.vendorGeneratePDF = asyncHandler(async (req, res, next) => {

  const vendorId = parseInt(req.params.vendorId) || parseInt(req.query.vendorId)

  let { from, to, searchText } = req.query;

  const sort = req.query.sort && req.query.sort === 'DESC' ? 'DESC' : 'ASC';
  let sortField = req.query.sortField || 'transactionDate'

  let params = {
      vendorId,
      from,
      to,
      searchText,
      sort,
      sortField
  }
  const data = await vendorTransactionsExcelCSV(params);
  if (!data) {
      return next(new ErrorResponse(`Something went wrong while generating report`, 500))
    } else if (data.length < 1) {
      return next(new ErrorResponse(`No data is available for export`, 500))
  }
  const templateDetails = {
      title: 'Vendors Report'
  }
  const reportHtmlWithStyle = reportPdfTemplate(data,templateDetails);

  const buffer = await renderPdf(reportHtmlWithStyle, { scale: 0.7 });
  customLog(req?.LogTraceId, "info", { message: "PDF generated successfully!" })

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

exports.transactionReports = asyncHandler(async (req, res, next) => {
    const credentialId = req.user.id;
    const { fromDate: from, toDate: to } = req.query;
  
    const data = await transactionReports({ credentialId, from, to });
  
    if (!data || data.length < 1) {
      return next(new ErrorResponse('No transactions available', 400))
    }
  
    return res.status(200).json({
      status: true,
      data: { data },
      message: 'Fetched all transactions successfully',
      responseCode: '000',
    })
  });
  

// Renders the requested document for an order row. Invoice downloads require the stored
// pekoInvoiceDetails.corporate.invoiceData and/or planInvoiceData (written at payment time);
// receipt downloads fall back to generating one retroactively from the order row
// and persisting it, so orders that predate this feature stay downloadable.
const generateTransactionDocument = async (result, type, traceId) => {
  let pekoInvoiceDetails = result?.pekoInvoiceDetails ?? {};
  if (typeof pekoInvoiceDetails === 'string') {
      try {
          pekoInvoiceDetails = JSON.parse(pekoInvoiceDetails);
      } catch {
          pekoInvoiceDetails = {};
      }
  }

  if (type === 'invoice') {
      if (!hasStoredInvoice(pekoInvoiceDetails)) {
          return { invoiceUnavailable: true };
      }
      const { invoiceData, planInvoiceData } = pekoInvoiceDetails.corporate;

      // Peko's platform fee invoice, and on Agent/Principal Markup orders the actual service/plan invoice
      // issued on behalf of the vendor. Download whichever exist (both when both do), like the
      // order-confirmation email; an order can carry only the plan invoice.
      const invoices = [];
      // Only an invoice made of platform fee rows is the platform fee invoice; a subscription's also lists the plan.
      const platformFeeOnly = Array.isArray(invoiceData?.items) && invoiceData.items.length > 0
          && invoiceData.items.every((item) => String(item?.description || '').startsWith('Platform Fee'));
      if (isFilledObject(invoiceData)) invoices.push({ label: platformFeeOnly ? 'Invoice-on-Platform-Fee' : 'Invoice', contentPdf: await generateInvoiceOrReceiptPdf(invoiceData, 'Invoice') });
      if (isFilledObject(planInvoiceData)) invoices.push({ label: 'Invoice', contentPdf: await generateInvoiceOrReceiptPdf(planInvoiceData, 'Invoice', 'Invoice') });
      const [{ contentPdf, label }, ...additionalDocuments] = invoices;
      return { contentPdf, label, additionalDocuments };
  }

  let receiptData = pekoInvoiceDetails?.corporate?.receiptData;
  if (!receiptData || Object.keys(receiptData).length === 0) {
      const pekoReceiptId = await generatePekoReceiptId();

      const corporateInfo = await findCorporateUser(
          { corporateId: result?.credentialId },
          ['name', 'mobileNo', 'contactPersonName']
      );

      const paymentDate = formattedDateOnly(result?.transactionDate);

      // Orders store payment mode uppercase (e.g. "PAYMENT GATEWAY") — display it
      // in title case on the receipt ("Payment Gateway").
      const displayPaymentMode = String(result?.paymentMode || '')
          .toLowerCase()
          .replace(/\b\w/g, (c) => c.toUpperCase());

      // Corporate-card operators carry no serviceCategory — the sibling transaction
      // row's transactionCategory, then the operator catalogue keyed by accessKey,
      // are the fallbacks before giving up with 'Other'.
      let paymentType = result?.serviceOperator?.serviceCategory;
      if (!paymentType) {
          paymentType = await findTransactionCategoryByTxnId(result?.corporateTxnId);
      }
      if (!paymentType) {
          paymentType = categoryForAccessKey(result?.serviceOperator?.accessKey) || 'Other';
      }

      // Orders store the paid total in amountInINR and the fee in surcharge — the item
      // price is their difference, so the receipt rows always sum to the amount paid.
      const paidTotal = Number(result?.amountInINR ?? 0);
      const surchargeAmount = Number(result?.surcharge);
      const hasBreakup = paidTotal > 0 && Number.isFinite(surchargeAmount)
          && surchargeAmount >= 0 && surchargeAmount <= paidTotal;

      receiptData = {
          receiptNo: pekoReceiptId,
          customerName: corporateInfo?.name || corporateInfo?.contactPersonName
              || result?.credential?.name || result?.credential?.username,
          customerNumber: corporateInfo?.mobileNo,
          orderNumber: result?.corporateTxnId,
          lineOfBusiness: 'Portal',
          paymentType,
          paymentDateTime: paymentDate,
          paymentMode: displayPaymentMode || result?.paymentMode,
          ...(hasBreakup ? {
              itemServicePrice: (paidTotal - surchargeAmount).toFixed(2),
              platformFee: surchargeAmount.toFixed(2),
          } : {}),
          paidAmount: paidTotal.toFixed(2),
      };

      await updatePekoInvoiceDetails(
          { id: result.id },
          {
              pekoInvoiceDetails: {
                  ...pekoInvoiceDetails,
                  corporate: {
                      ...(pekoInvoiceDetails?.corporate || {}),
                      receiptData,
                  },
              },
          }
      );
      customLog(traceId, 'info', {
          message: 'Retroactive receipt generated and persisted',
          scope: 'invoice-download',
          orderId: result?.id,
      });
  }
  return { contentPdf: await generateInvoiceOrReceiptPdf(receiptData, 'Receipt') };
};

// Shared handler for the transactions + subscription-orders download endpoints:
// GET .../download/:transactionId/:type and .../subscriptionOrdersDownload/:transactionId/:type?
const handleTransactionDocumentDownload = async (req, res) => {
  try {
      const transactionId = req.params.transactionId;
      // Default to receipt so the pre-existing type-less routes keep working.
      const type = String(req.params.type || 'receipt').toLowerCase() === 'invoice' ? 'invoice' : 'receipt';

      // Scope the lookup to the requesting user so a transaction can only be
      // downloaded by its owner (sub-users are further scoped to their own orders).
      const params = { transactionId, credentialId: req.user.id };
      if (req.user.role === 'CORPORATE_SUB_USER' && req.user.subCorporateId) {
          params.subCorporateUserId = req.user.subCorporateId;
      }

      const result = await findOneOrderDetails(params);

      // Same 404 for "not found" and "not owned" so the response can't be used to
      // probe which transaction ids exist. responseCode '003' keeps the FE
      // interceptor silent (no /404 redirect, no duplicate toast) — the hook owns
      // the user-facing message.
      if (!result) {
          return res.status(404).json({
              status: false,
              message: 'Transaction details not found.',
              data: {},
              responseCode: '003'
          });
      }

      const { contentPdf, label, invoiceUnavailable, additionalDocuments } = await generateTransactionDocument(result, type, req?.LogTraceId);

      if (invoiceUnavailable) {
          return res.status(404).json({
              status: false,
              message: 'Invoice not available for this transaction.',
              data: {},
              responseCode: '003'
          });
      }

      const pdfBuffer = contentPdf?.content;

      if (!isPdfBuffer(pdfBuffer)) {
          customLog(req?.LogTraceId, "error", {
              message: 'findTransactionDetails: could not produce a valid PDF',
              scope: 'invoice-download',
              transactionId,
          });
          return res.status(500).json({
              status: false,
              message: 'Could not generate a valid document, please try again later.',
              data: {},
              responseCode: '003'
          });
      }

      // Additional invoices (e.g. Plan-Tax-Invoice) are best-effort: a bad one is dropped
      // rather than failing the whole download, since the primary invoice is already valid.
      const additionalInvoices = (additionalDocuments || [])
          .filter((doc) => isPdfBuffer(doc.contentPdf?.content))
          .map((doc) => ({ label: doc.label, pdfBuffer: doc.contentPdf.content }));

      return res.status(200).json({
          status: true,
          message: `${type === 'invoice' ? 'Invoice' : 'Receipt'} generated successfully.`,
          data: {
              pdfBuffer,
              ...(label && { label }),
              ...(additionalInvoices.length > 0 && { additionalInvoices }),
          },
          responseCode: '000'
      });

  } catch (error) {
      // The PDF render pool throws a retryable 503 when its queue is full.
      if (error?.code === 'PDF_QUEUE_FULL' || error?.status === 503) {
          customLog(req?.LogTraceId, "error", { message: error?.message, scope: 'invoice-download', code: 'PDF_QUEUE_FULL' })
          return res.status(503).json({
              status: false,
              message: 'Service is busy, please try again in a moment.',
              data: {},
              responseCode: '003'
          });
      }
      customLog(req?.LogTraceId, "error", { message: error?.message, data: error?.response?.data })
      return res.status(500).json({
          status: false,
          message: 'Something went wrong, please try again later.',
          data: {},
          responseCode: '003'
      });
  }
};

exports.findTransactionDetails = asyncHandler(handleTransactionDocumentDownload)

exports.generateExcelCSV = asyncHandler(async (req, res, next) => {
  const {from,to} = req.query
  const {type} = req.params
  let order = req.query.sort??'ASC', column = 'transactionDate' //req.query.column
  let params = {
      from,
      to,
      order,
      column
  }
  let data = await transactionExcelCSV(params)
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

exports.generatePDF = asyncHandler(async (req, res, next) => {
  try {
      const {from,to} = req.query
      let order = req.query.sort??'ASC', column = 'transactionDate' //req.query.column
      let params = {
          from,
          to,
          order,
          column
      }
      const data = await transactionPDF(params);
      if (!data || data.length < 1) {
          return next(new ErrorResponse(`Something went wrong while generating pdf`, 500))
      }

      const reportHtmlWithStyle = reportPdfTemplate(data);

      const pdfBuffer = await renderPdf(reportHtmlWithStyle);
      customLog(req?.LogTraceId, "info", { message: "PDF generated successfully!" })

      return res.status(200).json({
          status: true,
          message: 'report generated successfully.',
          data: {
              pdfBuffer,
          },
          responseCode: '000'
      });
  } catch (error) {
      customLog(req?.LogTraceId, "error", { message: error?.message, data: error?.response?.data })
      return next(new ErrorResponse(`Error generating transactions report.`, 500))
  }

})

exports.findAllWalletReports = async (req, res) => {
  const from = req.query.fromDate
  const to = req.query.toDate
  const start = parseInt(req.query.start)
  const length = parseInt(req.query.length)
  const draw = parseInt(req.query.draw)
  let searchText = req.query.search.value
  let userId = req.query.credentialId
  let order = req.query.orderCol,
      column = req.query.column
  const transactionsData = await findAllWalletTransactionsCount(start, from, to, length, draw, searchText, order, column, userId);
  if (!transactionsData) {
      return res.json({
          'draw': draw,
          'recordsTotal': 0,
          'recordsFiltered': 0,
          'data': 0
      })
  } else {
      /*let result = transactionsData.rows.map(function (t) {
          return flatten(t)
      })*/
      return res.json({
          'draw': draw,
          'recordsTotal': transactionsData.count,
          'recordsFiltered': transactionsData.count,
          data: transactionsData.rows
      })
  }
};

exports.findAllOrders = asyncHandler(async (req, res, next) => {
  const from = req.query.fromDate
  const to = req.query.toDate
  const start = parseInt(req.query.start)
  const length = parseInt(req.query.length)
  const draw = parseInt(req.query.draw)
  let searchText = req.query.search.value
  let userId = req.user.id
  let order = req.query.orderCol,
      column = req.query.column
  let params = {
      start,
      from,
      to,
      length,
      draw,
      searchText,
      order,
      column,
      userId
  }
  const transactionsData = await findAllOrdersCount(params);
  if (!transactionsData) {
      return next(new ErrorResponse(`Something went wrong while getting all orders from DB`, 500))
  } else {
      return res.status(200).json({
          'success': true,
          'draw': draw,
          'recordsTotal': transactionsData.count,
          'recordsFiltered': transactionsData.count,
          'data': transactionsData.rows
      })
  }
})

exports.findAllWorkspaceOrdersAndCount = asyncHandler(async (req, res, next) => {

    let { from, to, searchText, page, itemsPerPage, partnerId } = req.query;

    let registeredBy = req.user.registeredBy

    const sort = req.query.sort && req.query.sort === 'DESC' ? 'DESC' : 'ASC';
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
        registeredBy,
        partnerId
    }
    const transactionsData = await findAllWorkspaceOrders(params);
    if (!transactionsData) {
        return next(new ErrorResponse(`Something went wrong while getting all orders from DB`, 500))
    } else {
        return res.status(200).json({
            'status': true,
            'data': {
                'recordsTotal': transactionsData.count,
                'recordsFiltered': transactionsData.count,
                'data': transactionsData.rows
            },
            'message': 'Records fetched successfully',
            'responseCode': '000'
        })
    }
})
exports.workspaceOrdersGenerateExcelCSV = asyncHandler(async (req, res, next) => {

    let { from, to, searchText,partnerId} = req.query;
    const {type} = req.params;

    const sort = req.query.sort && req.query.sort === 'DESC' ? 'DESC' : 'ASC';
    let sortField = req.query.sortField || 'createdAt'
    let registeredBy = req.user.registeredBy
    let params = {
        from,
        to,
        searchText,
        sort,
        sortField,
        registeredBy,
        partnerId
    }
    const data = await workspaceOrdersExcelCSVData(params);
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

exports.workspaceOrdersGeneratePDF = asyncHandler(async (req, res, next) => {

    let { from, to, searchText,partnerId} = req.query;

    const sort = req.query.sort && req.query.sort === 'DESC' ? 'DESC' : 'ASC';
    let sortField = req.query.sortField || 'createdAt'
    let registeredBy = req.user.registeredBy
    let params = {
        from,
        to,
        searchText,
        sort,
        sortField,
        registeredBy,
        partnerId
    }
    const data = await workspaceOrdersExcelCSVData(params);
    if (!data) {
        return next(new ErrorResponse(`Something went wrong while generating report`, 500))
      } else if (data.length < 1) {
        return next(new ErrorResponse(`No data is available for export`, 409))
    }
    
    const templateDetails = {
        title: 'Workspace Orders Report'
    }
    const reportHtmlWithStyle = reportPdfTemplate(data,templateDetails);

    const buffer = await renderPdf(reportHtmlWithStyle, { scale: 0.8 });
    customLog(req?.LogTraceId, "info", { message: "PDF generated successfully!" })

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
/*exports.findAllWorkspaceOrdersAndCount = asyncHandler(async (req, res, next) => {
  const from = req.query.fromDate
  const to = req.query.toDate
  // corporateId comes only from the authenticated session — see the comment on the
  // other corporateId assignments in this file for why the query string is never used.
  const corporateId = req.user.id
  const start = parseInt(req.query.start)
  const details = req.query.details || false
  const length = parseInt(req.query.length)
  const draw = parseInt(req.query.draw)
  let searchText = req.query.search.value
  let order = req.query.orderCol,
      column = 'transactionDate' //req.query.column
  let params = {
      corporateId,
      from,
      to,
      start,
      length,
      draw,
      searchText,
      order,
      details,
      column
  }
  const transactionsData = await findAllWorkspaceOrders(params);
  if (!transactionsData) {
      return next(new ErrorResponse(`Something went wrong while getting all corporate from DB`, 200))
  } else {
      return res.status(200).json({
          'success': true,
          'draw': draw,
          'recordsTotal': transactionsData.count,
          'recordsFiltered': transactionsData.count,
          'data': transactionsData.rows
      })
  }

})*/

exports.findAllRewards = asyncHandler(async (req, res, next) => {
  const corporateId = parseInt(req.params.corporateId)
  const transactionsData = await findAllTransaction({
      corporateId
  });
  if (!transactionsData) {
      return next(new ErrorResponse(`Something went wrong while getting all corporate from DB`, 500))
  } else {
      return res.status(200).json({
          'status': true,
          'data': transactionsData,
          'message': 'Fetched all rewards successfully',
          'responseCode': '000'
      })
  }
})

exports.findAllSubscriptionsOrdersAndCount = asyncHandler(async (req, res, next) => {

  let { from, to, searchText, page, itemsPerPage,corporateId } = req.query;

  const sort = req.query.sort && req.query.sort === 'DESC' ? 'DESC' : 'ASC';
  
  let sortField = req.query.sortField || 'createdAt'

  let registeredBy = req.user.registeredBy

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
      corporateId,
      registeredBy
  }
  const transactionsData = await findAllSubscriptionOrders(params);
  if (!transactionsData) {
      return next(new ErrorResponse(`Something went wrong while getting subscriptions orders from DB`, 500))
  } else {
      return res.status(201).json({
          'status': true,
          'data': {
              'recordsTotal': transactionsData.count,
              'recordsFiltered': transactionsData.count,
              'data': transactionsData.rows
          },
          'message': 'subscription orders fetched successfully',
          'responseCode': '000'

      })
  }
})

exports.subscriptionOrdersGenerateExcelCSV = asyncHandler(async (req, res, next) => {

  let { from, to, searchText,corporateId } = req.query;
  const {type} = req.params;

  const sort = req.query.sort && req.query.sort === 'DESC' ? 'DESC' : 'ASC';
  
  let sortField = req.query.sortField || 'createdAt'

  let registeredBy = req.user.registeredBy

  let params = {
      from,
      to,
      searchText,
      sort,
      sortField,
      corporateId,
      registeredBy
  }
  const data = await subscriptionOrdersExcelCSVData(params);
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
exports.subscriptionOrdersGeneratePDF = asyncHandler(async (req, res, next) => {

  let { from, to, searchText,corporateId } = req.query;

  const sort = req.query.sort && req.query.sort === 'DESC' ? 'DESC' : 'ASC';
 
  let sortField = req.query.sortField || 'createdAt'

  let registeredBy = req.user.registeredBy

  let params = {
      from,
      to,
      searchText,
      sort,
      sortField,
      corporateId,
      registeredBy
  }
  const data = await subscriptionOrdersExcelCSVData(params);
  if (!data) {
      return next(new ErrorResponse(`Something went wrong while generating report`, 500))
    } else if (data.length < 1) {
      return next(new ErrorResponse(`No data is available for export`, 500))
  }
  const templateDetails = {
      title: 'Software Order Report'
  }
  const reportHtmlWithStyle = reportPdfTemplate(data,templateDetails);

  const buffer = await renderPdf(reportHtmlWithStyle, { scale: 0.8 });
  customLog(req?.LogTraceId, "info", { message: "PDF generated successfully!" })

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

exports.getExcel = asyncHandler(async (req, res, next) => {
  const from = req.query.fromDate
  const to = req.query.toDate
  const corporateId = parseInt(req.params.corporateId)
  let categoryName = req.query.categoryType || null
  let order = req.query.orderCol || 'DESC'
  const details = req.query.details || false

  let params = {
      corporateId,
      from,
      to,
      order,
      categoryName,
      details
  }
  let result = await getDataExcelCSV(params)
  if (!result) {
      return next(new ErrorResponse(`Something went wrong while fetching excelCSV data`, 500))
  } else {
      return res.status(200).json({
          'status': true,
          'data': result,
          'message': 'Fetched excel/csv datas successfully',
          'responseCode': '000'
      })
  }
})

exports.findAllTransactionsAndCountCashback = asyncHandler(async (req, res, next) => {

  let { from, to, searchText, page, itemsPerPage } = req.query;
  let corporateId = req.user.id

  let categoryName = req.query.categoryName ? decodeURIComponent(req.query.categoryName) : undefined;
  const sort = req.query.sort && req.query.sort === 'DESC' ? 'DESC' : 'ASC';
  const filter = "SUCCESS"
   let sortField = req.query.sortField || 'corporateTxnId'
   
  // Parse page and itemsPerPage to integers (you can also use parseInt)
  page = page ? parseInt(page) : 1;
  itemsPerPage = itemsPerPage ? parseInt(itemsPerPage) : null;
  let limit = itemsPerPage

  // Calculate offset based on page and itemsPerPage
  let offset;
  if (page && itemsPerPage) {
      offset = (page - 1) * itemsPerPage;
  }

  let serviceAttribute = ['id', 'serviceProvider']
  let credentialAttribute = []
  let transactionAttribute = ['id', 'transactionDate', 'corporateTxnId', 'transactionCategory', 'corporateCashback']
  let orderAttribute = ['id', 'amountInINR', 'paymentMode', 'status']
  const cashbackFilter=true
  let params = {
      from,
      to,
      categoryName,
      searchText,
      sort,
      filter,
      limit,
      offset,
      corporateId,
      serviceAttribute,
      credentialAttribute,
      transactionAttribute,
      orderAttribute,
      sortField,
      cashbackFilter
  }
  if (req.user.role === 'CORPORATE_SUB_USER' && req.user.subCorporateId) {
    params.subCorporateUserId = req.user.subCorporateId;
}
  const transactionsData = await findAllTransactions(params);
  if (!transactionsData) {
      return next(new ErrorResponse(`Something went wrong while getting all corporate from DB`, 500))
  } else {
      return res.status(200).json({
          'status': true,
          'data': {
              result: transactionsData.rows,
              totalData: transactionsData.count
          },
          'message': 'fetched transactions successfully!!',
          'responseCode': '000'
      })
  }   
})

exports.findAllSubscriptionOrdersCount = asyncHandler(async (req, res, next) => {

    let { from, to, searchText, page, itemsPerPage } = req.query;
    let corporateId = req.user.id
    let categoryName = req.query.categoryName
    ? decodeURIComponent(req.query.categoryName).trim()
    : undefined;
  
  if (!categoryName || categoryName.toUpperCase() === "ALL") {
    categoryName = undefined;
  }
      const sort = req.query.sort && req.query.sort === 'DESC' ? 'DESC' : 'ASC';
    const filter = req.query.filter || undefined;
     let sortField = req.query.sortField || 'corporateTxnId'
    // Parse page and itemsPerPage to integers (you can also use parseInt)
    page = page ? parseInt(page) : 1;
    itemsPerPage = itemsPerPage ? parseInt(itemsPerPage) : null;
    let limit = itemsPerPage

    // Calculate offset based on page and itemsPerPage
    let offset;
    if (page && itemsPerPage) {
        offset = (page - 1) * itemsPerPage;
    }

    let serviceAttribute = ['id', 'serviceProvider']
    let credentialAttribute = ['name']

    let params = {
        from,
        to,
        categoryName,
        searchText,
        sort,
        filter,
        limit,
        offset,
        corporateId,
        serviceAttribute,
        credentialAttribute,
        sortField
    }

    if (req.user.role === 'CORPORATE_SUB_USER' && req.user.subCorporateId) {
        params.subCorporateUserId = req.user.subCorporateId;
    }

    const transactionsData = await findAllCustomerSubscriptionOrders(params);
    if (!transactionsData) {
        return next(new ErrorResponse(`Something went wrong while getting all corporate from DB`, 500))
    } else {
        // Expose only an isInvoice boolean — the pekoInvoiceDetails JSON stays server-side.
        const rows = (transactionsData.rows || []).map((row) => {
            const isInvoice = hasStoredInvoice(row?.pekoInvoiceDetails);
            delete row.pekoInvoiceDetails;
            return {
                ...row,
                isInvoice,
                paymentInstrument: derivePaymentInstrument(row.paymentModeResponse, row.paymentMode),
            };
        });
        return res.status(200).json({
            'status': true,
            'data': {
                result: rows,
                totalData: transactionsData.count
            },
            'message': 'fetched transactions successfully!!',
            'responseCode': '000'
        })
    }
})

exports.corporateSubscriptionTransactionGeneratePDF = asyncHandler(async (req, res, next) => {

  let { from, to, searchText} = req.query;
  // corporateId is never taken from the query string — this is the corporate's own
  // session (requireOwnCorporate enforces :corporateId === req.user.id upstream), so
  // a query override would let any corporate pull another corporate's report.
  let corporateId = req.user.id

  let registeredBy = req.user.registeredBy

  let categoryName = req.query.categoryName ? decodeURIComponent(req.query.categoryName) : undefined;
  const sort = req.query.sort && req.query.sort === 'ASC' ? 'ASC' : 'DESC';
  let sortField = req.query.sortField || 'corporateTxnId'
  const filter = req.query.filter || undefined;

  let serviceAttribute = ['id', 'serviceProvider']
  let credentialAttribute = ['name']

  let params = {
      from,
      to,
      categoryName,
      searchText,
      sort,
      filter,
      corporateId,
      serviceAttribute,
      credentialAttribute,
      sortField,
      registeredBy,
  }

  const data= await subscriptionTransactionsExcelCSV(params);
  if (!data) {
      return next(new ErrorResponse(`Something went wrong while generating report`, 500))
    } else if (data.length < 1) {
      return next(new ErrorResponse(`No data is available for export`, 500))
  }

  const reportHtmlWithStyle = reportPdfTemplate(data,{title:'Subscription Transaction Report'});

  const buffer = await renderPdf(reportHtmlWithStyle, { scale: 0.6 });
  customLog(req?.LogTraceId, "info", { message: "PDF generated successfully!" })

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

exports.corporateSubscriptionTransactionGenerateExcelCSV = asyncHandler(async (req, res, next) => {

  let { from, to, searchText } = req.query;
  const {type} = req.params;
  // corporateId is never taken from the query string — this is the corporate's own
  // session (requireOwnCorporate enforces :corporateId === req.user.id upstream), so
  // a query override would let any corporate pull another corporate's report.
  let corporateId = req.user.id

  let registeredBy = req.user.registeredBy

  let categoryName = req.query.categoryName ? decodeURIComponent(req.query.categoryName) : undefined;
  const sort = req.query.sort && req.query.sort === 'ASC' ? 'ASC' : 'DESC';
  let sortField = req.query.sortField || 'corporateTxnId'
  const filter = req.query.filter || undefined;

  let serviceAttribute = ['id', 'serviceProvider']
  let credentialAttribute = ['name']
  let params = {
      from,
      to,
      categoryName,
      searchText,
      sort,
      filter,
      corporateId,
      serviceAttribute,
      credentialAttribute,
      sortField,
      registeredBy
  }
  const data= await subscriptionTransactionsExcelCSV(params);
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

// Subscription-orders download — same order lookup and document generation as
// the transactions download; kept as a separate export for its own route.
exports.findSubscriptionDetails = asyncHandler(handleTransactionDocumentDownload);
  

exports.getTransactionReport = asyncHandler(async (req, res, next) => {

  let { from, to, searchText, page, itemsPerPage } = req.query;
  // corporateId is never taken from the query string — this is the corporate's own
  // session (requireOwnCorporate enforces :corporateId === req.user.id upstream), so
  // a query override would let any corporate pull another corporate's report.
  let corporateId = req.user.id

  let registeredBy = req.user.registeredBy
  const partnerId = resolvePartnerScope(req).partnerId

  let categoryName = req.query.categoryName ? decodeURIComponent(req.query.categoryName) : undefined;
  const sort = req.query.sort && req.query.sort === 'ASC' ? 'ASC' : 'DESC';
  let sortField = req.query.sortField || 'transactionDate'
  const filter = req.query.filter || undefined;

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
      categoryName,
      searchText,
      sort,
      filter,
      limit,
      offset,
      corporateId,
      sortField,
      registeredBy,
      partnerId
  }

  const transactionsData = await getTransactionReport(params);
  if (!transactionsData) {
      return next(new ErrorResponse(`Something went wrong while getting transaction report`, 500))
  } else {
      return res.status(200).json({
          'status': true,
          'data': {
              'recordsTotal': transactionsData.count,
              'recordsFiltered': transactionsData.count,
              'data': transactionsData.rows
          },
          'message': 'fetched transactions reports successfully!!',
          'responseCode': '000'
      })
  }
})

exports.getTransactionReportExcelCSV = asyncHandler(async (req, res, next) => {

  let { searchText, from, to } = req.query;
  const {type} = req.params;

  const sort = req.query.sort && req.query.sort === 'ASC' ? 'ASC' : 'DESC';
  let sortField = req.query.sortField || 'transactionDate'
  let registeredBy = req.user.registeredBy
  const partnerId = resolvePartnerScope(req).partnerId

  let params = {
      searchText,
      sort,
      sortField,
      from,
      to,
      registeredBy,
      partnerId
  }
  const data = await getTransactionReportExcel(params);
  if (!data) {
      return next(new ErrorResponse(`Something went wrong while transaction report`, 500))
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

exports.getTransactionReportPDF = asyncHandler(async (req, res, next) => {

  let { searchText, from, to } = req.query;

  const sort = req.query.sort && req.query.sort === 'ASC' ? 'ASC' : 'DESC';
  let sortField = req.query.sortField || 'transactionDate'
  let registeredBy = req.user.registeredBy
  const partnerId = resolvePartnerScope(req).partnerId

  let params = {
      searchText,
      sort,
      sortField,
      from,
      to,
      registeredBy,
      partnerId
  }
  const data = await getTransactionReportExcel(params);
  if (!data) {
      return next(new ErrorResponse(`Something went wrong while generating report`, 500))
  } else if (data.length < 1) {
      return next(new ErrorResponse(`No data is available for export`, 500))
  }
  const templateDetails = {
      title: 'Transaction Report'
  }
  const reportHtmlWithStyle = reportPdfTemplate(data,templateDetails);

  const buffer = await renderPdf(reportHtmlWithStyle, { scale: 0.7 });
  customLog(req?.LogTraceId, "info", { message: "PDF generated successfully!" })

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

exports.getSubscriptionTransactionStatus = asyncHandler(async (req, res) => {
  const { transactionId } = req.params;
  const { paymentRefId } = req.query;
  const corporateId = req.user.id;

  const result = await findSubscriptionTransactionStatusByTxnId({ transactionId, paymentRefId, corporateId });

  if (!result) {
    // Webhook hasn't fired yet — return PENDING so the frontend keeps polling.
    // Never return 404 here; the ApiClient interceptor would redirect the page.
    return res.status(200).json({
      status: true,
      message: 'Transaction pending.',
      data: { corporateTxnId: transactionId, status: 'PENDING' },
      responseCode: '000',
    });
  }

  const rawStatus = result.status.toUpperCase();
  const status = rawStatus === 'FAILURE' ? 'FAILED' : rawStatus;

  return res.status(200).json({
    status: true,
    message: 'Transaction status fetched successfully.',
    data: {
      corporateTxnId: result.corporateTxnId,
      status,
    },
    responseCode: '000',
  });
});
