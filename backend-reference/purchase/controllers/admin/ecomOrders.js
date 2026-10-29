const { findAllOrdersCount, findLatestFiveOrders, findStatusCountEcommerce, findOneTransaction,ordersExport } = require("../../models/use-cases/transaction");
const { updateOrder, getExcel } = require("../../models/use-cases/order");
const { findAllOndcOrdersForAdmin, findDistinctOndcVendorNames, findOndcOrderByIdAdmin } = require("../../models/use-cases/ondc_order");
const { findOndcOrderIdsWithNonTerminalIssues } = require("../../models/use-cases/ondc_issue");
const { findPayoutAttemptsForOrder } = require("../../models/use-cases/ondc_seller_payout");
const { evaluateRefundEligibility } = require("../../services/ondcOrderRefund");
const corporateUser = require("../../models/entities/corporateUser");
const credential = require("../../models/entities/credential");

/**
 * Batch-resolves each row's corporateUserId to a display name. Sub-corporate-
 * user-owned orders (corporateUserId null, subCorporateUserId set) fall back
 * to "-" for now — same simplification as ecomIssues.js's enrichIssuesForAdmin.
 */
const enrichOndcOrdersWithCorporateName = async (rows) => {
  const ids = [...new Set(rows.map((r) => r.corporateUserId).filter(Boolean))];
  const corporates = ids.length
    ? await corporateUser.findAll({ where: { id: ids }, attributes: ["id", "name"], raw: true })
    : [];
  const nameById = new Map(corporates.map((c) => [c.id, c.name]));
  return rows.map((row) => ({ ...row, corporateName: nameById.get(row.corporateUserId) || "-" }));
};

const { TERMINAL_ISSUE_STATUSES } = require("../../utils/ondcIgmStatus");

const asyncHandler = require("./../../middlewares/async");
const ErrorResponse = require("./../../utils/error-response");
const { fetchCounts, fetchVendorsByProductIds, fetchOneProductId } = require("../../models/use-cases/products");
// const { fetchVendorDetails } = require('../../models/use-cases/vendors');
// const { findOneWithCredentialId } = require("../../models/use-cases/corporateUser");
const { generateExcelBufferAndType } = require("../../utils/generateExcelBufferAndType");
const { reportPdfTemplate } = require("../../utils/reportTemplate");
const puppeteer = require("puppeteer");
const fs = require("fs");
const emailer = require('../../utils/emailer')
const { createLeanPayoutRequest } = require("../corporate/lean");
const { refundWalletTransaction } = require("../../utils/walletTransaction");
const { refundCardTransaction } = require("../corporate/payment_gateway");
const { orderStatusChangeTemplate } = require("../../utils/emailTemplate/ecommerce");
const { orderCancellFromSellerTemplet } = require("../../utils/templatesForEmails");
const { fetchPartnerDetails } = require("../../models/use-cases/systemUser");
const { customLog } = require("../../utils/loggerHelper");
const { resolveEmailTemplate } = require("../../services/emailTemplateResolver");
const { EMAIL_TEMPLATE_KEYS, EMAIL_TEMPLATE_SERVICES } = require("../../utils/emailTemplateKeys");
const { v2LayoutVariables } = require("../../utils/emailTemplate/sharedLayout");

exports.findAllOrders = asyncHandler(async (req, res, next) => {

let { from, to, searchText, page, itemsPerPage } = req.query;

let status = req.query.status || undefined

const sort = req.query.sort && req.query.sort === 'ASC' ?  'ASC' : 'DESC' ;
 let sortField = req.query.sortField || 'createdAt'


// Parse page and itemsPerPage to integers (you can also use parseInt)
page = page ? parseInt(page) : 1;
itemsPerPage = itemsPerPage ? parseInt(itemsPerPage) : null;
let length = itemsPerPage

// Calculate offset based on page and itemsPerPage
let start;
if (page && itemsPerPage) {
    start = (page - 1) * itemsPerPage;
}


  let params = {
       start,
       from,
       to,
       length,
       searchText,
       sort,
       sortField,
       status,
  }
  const transactionsData = await findAllOrdersCount(params);
  if (!transactionsData) {
    return next(new ErrorResponse(`Something went wrong while getting all orders from DB`, 500));
  } else {
    return res.status(200).json({
      status: true,
      data: {
      recordsTotal: transactionsData.count,
      recordsFiltered: transactionsData.count,
      data: transactionsData.rows },
      message: 'Orders fetched successfully',
      responseCode: '000'
    });
  }
});

exports.findLatestOrder = asyncHandler(async (req, res, next) => {
  const length = 5;
  const draw = parseInt(req.query.draw);
  const order = 'DESC';
  const column = 'createdAt';
  const serviceCategory = 'Office Supplies';
  let params = {
    length,
    draw,
    order,
    column,
    serviceCategory
  };
  const transactionsData = await findLatestFiveOrders(params);
  if (!transactionsData) {
    return next(new ErrorResponse(`Something went wrong while getting latest orders from DB`, 200));
  } else {
    return res.status(200).json({
      success: true,
      draw: draw,
      recordsTotal: transactionsData.count,
      recordsFiltered: transactionsData.count,
      data: transactionsData.rows,
    });
  }
});
exports.ordersExcelCSV = asyncHandler(async (req, res, next) => {
  let { from, to, searchText } = req.query;
  const { type } = req.params;
  let status = req.query.status || undefined;

  const sort = req.query.sort && req.query.sort === "ASC" ? "ASC" : "DESC";
  let sortField = req.query.sortField || "createdAt";

  let params = {
    from,
    to,
    searchText,
    sort,
    sortField,
    status,
  };
  const data = await ordersExport(params);
  if (!data) {
    return next(new ErrorResponse(`Something went wrong while generating report`, 500));
  } else if (data.length < 1) {
    return next(new ErrorResponse(`No data is available for export`, 500));
  } else {
    const { buffer, fileType } = await generateExcelBufferAndType(data, type);
    return res.status(200).json({
      status: true,
      data: { buffer, fileType },
      message: "Fetched excel/csv datas successfully",
      responseCode: "000",
    });
  }
});

exports.ordersPDF = asyncHandler(async (req, res, next) => {
  let { from, to, searchText } = req.query;
  let status = req.query.status || undefined;

  const sort = req.query.sort && req.query.sort === "ASC" ? "ASC" : "DESC";
  let sortField = req.query.sortField || "createdAt";

  let params = {
    from,
    to,
    searchText,
    sort,
    sortField,
    status,
  };
  const data = await ordersExport(params);
  if (!data) {
    return next(new ErrorResponse(`Something went wrong while generating report`, 400));
  } else if (data.length < 1) {
    return next(new ErrorResponse(`No data is available for export`, 400));
  }

  const templateDetails = {
    title: 'Orders'
  }
  const reportHtmlWithStyle = reportPdfTemplate(data,templateDetails);
  let random = new Date().valueOf();

  // Create a browser instance with Puppeteer
  const browser = await puppeteer.launch({
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  const page = await browser.newPage();

  // Set content to the page
  await page.setContent(reportHtmlWithStyle, { waitUntil: "domcontentloaded" });

  // Generate PDF using Puppeteer
  const outputFile = `report-${random}.pdf`;
  await page.pdf({
    scale: 0.6,
    path: outputFile,
    format: "A4",
    preferCSSPageSize: true,
  });

  const buffer = fs.readFileSync(outputFile);

  browser.close();

  fs.unlinkSync(outputFile);

  return res.status(200).json({
    status: true,
    message: "report generated successfully.",
    data: {
      buffer,
      fileType: "application/pdf",
    },
    responseCode: "000",
  });
});

// Shared helper for the 3 orderStatusChangeTemplate call sites below (CONFIRMED/ONPROGRESS,
// SHIPPED, COMPLETED) -- one named helper per hard rule 4 (multiple call sites, same file).
// Admin body deliberately omits the product list/pricing breakdown, matching AE's own real
// resolveOrderStatusChangeTemplate (only orderId/status/name/date/trackLink/surcharge are
// exposed as flat scalars there too).
async function sendOrderStatusChangeEmail(to, subject, { orderId, status, name, date, trackExist, trackLink, surcharge, templateDetails, fallbackArgs, logTraceId }) {
  const dateObj = new Date(date);
  const orderDate = new Intl.DateTimeFormat('en-US', {
    month: 'numeric', day: 'numeric', year: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric', hour12: true,
  }).format(dateObj);
  const deliveryDateObj = new Date(dateObj);
  deliveryDateObj.setDate(dateObj.getDate() + 5);
  const deliveryDate = deliveryDateObj.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const trackButton = trackExist
    ? `<tr><td align="left" style="padding-bottom:32px;word-break:break-word;">
        <div class="content-text" style="font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;padding-bottom:16px;">To track your order, please visit the Office Supplies section on ${templateDetails?.branding || 'Peko'}.</div>
        <table border="0" cellpadding="0" cellspacing="0" role="presentation"><tbody><tr>
          <td align="center" bgcolor="#181818" style="border-radius:12px;">
            <a href="${trackLink}" target="_blank" style="display:inline-block;padding:14px 28px;font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:12px;">Track your order</a>
          </td>
        </tr></tbody></table>
      </td></tr>`
    : '<!-- no track button -->';

  const resolved = await resolveEmailTemplate({
    key: EMAIL_TEMPLATE_KEYS.ECOM_ORDER_STATUS_CHANGE,
    service: EMAIL_TEMPLATE_SERVICES.ECOM,
    variables: {
      orderId,
      status,
      name,
      orderDate,
      deliveryDate,
      trackButtonBlock: trackButton,
      surcharge,
      ...v2LayoutVariables(templateDetails),
    },
    fallback: () => orderStatusChangeTemplate(...fallbackArgs),
    fallbackSubject: subject,
    logTraceId,
  });
  emailer.email(to, resolved.subject, resolved.html, function () {
    customLog(logTraceId, "info", { message: "Email sent to " + to });
  });
}

exports.updateOrder = async (req, res, next) => {
  //let params = req.params;
  try{

  
  let data = req.body;
  let trackingDetails = req.body.trackingDetails
  let selectedVendor = req.body.selectedVendor
  let { corporateTxnId } = req.query
  const transaction = await findOneTransaction({ corporateTxnId })
  if(!transaction){
    return next(new ErrorResponse(`Transaction not found`, 400));
  }
let params ={
  id: transaction.order.id
}
 let shipmentStatus = transaction.order.shipmentStatus
 let orderResponse = transaction.order.orderResponse
 orderResponse = JSON.parse(orderResponse)
 let pastStatus = transaction.order.ecomOrderStatus
 let ecomOrderStatus = data.ecomOrderStatus
 let statusDetails = {
  "Comments": ecomOrderStatus,
   "UpdateCode": pastStatus, 
   "UpdateDateTime": new Date()
 }
 shipmentStatus.push(statusDetails)
 if(trackingDetails){
   orderResponse.trackingDetails =  trackingDetails
  }
if(selectedVendor){
  for (const key in selectedVendor) {
    let productDetails = await fetchOneProductId(key)
     let productVendor = productDetails?.vendors
     if(productVendor){
      const foundDetails = productVendor.find(data => data.id == selectedVendor[key]);
      if(foundDetails){

        orderResponse.products.forEach(product => {
          if (product.productId == key) {
            product.vendorId = foundDetails.id ;
            product.vendorName = foundDetails.name ;
            product.vendorPrice = foundDetails.price ;
          } 
        });

      }
     } 
}
}
orderResponse = JSON.stringify(orderResponse)
let updatedData = {
  orderResponse,
  ecomOrderStatus
}
  const result = await updateOrder(params, updatedData);
  if (!result) {
    return next(new ErrorResponse(`Something went wrong while updating the order`, 500));
  } else {
    let status = updatedData.ecomOrderStatus
     const surcharge = transaction.commissionDetails.surcharge
     let details =  JSON.parse(updatedData.orderResponse) ;
     let email = transaction.credential.email
     let name = transaction?.credential?.name
     let orderDate = transaction?.createdAt
     let templateDetails;
     templateDetails = await fetchPartnerDetails(transaction?.credential?.registeredBy)
     if(status == 'CONFIRMED' || status == 'ONPROGRESS'){
      let trackExist = false
      const to = email;
      const subject = "Order Updations";
      await sendOrderStatusChangeEmail(to, subject, {
        productList: details.products,
        orderId: corporateTxnId,
        status,
        name,
        date: orderDate,
        trackExist,
        trackLink: details.trackingDetails.trackingWebsite,
        surcharge,
        templateDetails,
        fallbackArgs: [details.products, corporateTxnId, status, name, orderDate, trackExist, details.trackingDetails.trackingWebsite, surcharge, templateDetails],
        logTraceId: req?.LogTraceId,
      });
     }
     if(status == 'SHIPPED' ){
      let trackExist = true
      const to = email;
      const subject = "Order Updations";
      await sendOrderStatusChangeEmail(to, subject, {
        productList: details.products,
        orderId: corporateTxnId,
        status,
        name,
        date: orderDate,
        trackExist,
        trackLink: details.trackingDetails.trackingWebsite,
        surcharge,
        templateDetails,
        fallbackArgs: [details.products, corporateTxnId, status, name, orderDate, trackExist, false, details.trackingDetails.trackingWebsite, templateDetails],
        logTraceId: req?.LogTraceId,
      });
     }

     if(status == 'COMPLETED' ){
      let statusTxt = 'DELIVERED'
      let trackExist = false
      const to = email;
      const subject = "Order Updations";
      await sendOrderStatusChangeEmail(to, subject, {
        productList: details.products,
        orderId: corporateTxnId,
        status: statusTxt,
        name,
        date: orderDate,
        trackExist,
        trackLink: details.trackingDetails?.trackingWebsite,
        surcharge,
        templateDetails,
        fallbackArgs: [details.products, corporateTxnId, statusTxt, name, orderDate, trackExist, false],
        logTraceId: req?.LogTraceId,
      });
     }

     if(status == 'CANCELLED' ){

      orderDate = new Date(orderDate).toLocaleString('en-US', { month: 'long', day: 'numeric', year: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric', hour12: true })
      const host = templateDetails?.baseUrl;

      const trackLink = `${host}/office-supplies/order-history`
      const to = email;
      const subject = "Your order has been cancelled";
      const resolvedCancelledBySeller = await resolveEmailTemplate({
        key: EMAIL_TEMPLATE_KEYS.ECOM_ORDER_CANCELLED_BY_SELLER,
        service: EMAIL_TEMPLATE_SERVICES.ECOM,
        variables: { name, orderId: corporateTxnId, date: orderDate, trackLink, ...v2LayoutVariables(templateDetails) },
        fallback: () => orderCancellFromSellerTemplet(name, corporateTxnId, orderDate, trackLink, templateDetails),
        fallbackSubject: subject,
        logTraceId: req?.LogTraceId,
      });
      const body = resolvedCancelledBySeller.html;
      emailer.email(to, resolvedCancelledBySeller.subject, body, function () {
        customLog(req?.LogTraceId, "info", { message: "Email sent to " + to })
      });

      let updateDetails = {
        corporateTxnId,
        status: "REFUNDED",
        providerId: "Not Available",
        message: "Refund initiated",
        registeredById: req.user.registeredBy,
        orderResponse
      }
    
      let paymentData
      if (transaction) {
        paymentData = JSON.parse(transaction?.order?.paymentModeResponse)
      }
    
    
    
    if (transaction.order.paymentMode == "BANK" || transaction.order.paymentMode == "BANK + WALLET") {
        let leanAmount = paymentData.leanAmount
        let destinationIdLean = req.body.corporateBank ///it need to be come form req.body 
        //>>>>>>>>>>>>>LEAN REFUND CODE STARTS<<<<<<<<<<<<<<<<
        const { status, message } = await createLeanPayoutRequest(leanAmount, req.user.id, params.id, updateDetails, destinationIdLean);
        if (!status) return next(new ErrorResponse(message || `Something went wrong while returning bank transaction`, 200));
    
        /**
         * if status false we needed to send an email to used that ur refund process is faild please raise a ticket
         */
    
        /**
         * await refundWalletTransaction(updateDetails)
         * this is refundWalletTransaction is needed to be called after the admin authorization.
         * this called after the webhook from lean. 
         */
    
      } else if (transaction.order.paymentMode == "WALLET") {
        //cancel with  wallet refund 
        await refundWalletTransaction(updateDetails)
    
      } else if (transaction.order.paymentMode == "PAYMENT GATEWAY" || transaction.order.paymentMode == "PAYMENT GATEWAY + WALLET") {
        //cancel with  payment gateway refund 
        let refundPGResponse = await refundCardTransaction(req, paymentData)
        if (refundPGResponse?.state == 'REVERSED' || refundPGResponse?.state == 'REFUNDED') {
          await refundWalletTransaction(updateDetails)
        } else {
          return next(new ErrorResponse(`Something went wrong while returning card transaction`, 500));
        }
      } else {
        return next(new ErrorResponse(`Something went wrong while returning.`, 500));
      }

     }
    
    return res.status(200).json({
      status: true,
      message: "Order updated successfully",
      data: {},
      responseCode: '000'
    });
  }
}catch(err){
  customLog(req?.LogTraceId, "error", { data: err })

  return res.status(400).json({
    status: false,
    message: "Somtthing went wrong",
    data: {},
    responseCode: '001'
  });
}
};

exports.fetchEcommerceOrdersByStatus = async (req, res, next) => {
  const serviceCategory = "Office Supplies"
  const result = await findStatusCountEcommerce({serviceCategory})
  const products = await fetchCounts();
  if (!result) {
    return next(new ErrorResponse(`Something went wrong while fetching counts by status`, 200));
  } else {
    const totalCount = result.reduce((sum, order) => sum + order.count, 0);
    const countsByStatus = result.reduce((acc, item) => {
        acc[item.ecomOrderStatus] = item.count;
      return acc;
    }, {});
    return res.status(200).json({
      success: true,
      data: {...countsByStatus,TOTAL: totalCount,PRODUCTSCOUNT:products.count },
      message: "Ecommerce status count fetched successfully",
    });
  }
}

exports.getExcel = async (req, res) => {
  try {
    const from = req.query.fromDate;
    const to = req.query.toDate;
    let order = req.query.orderCol,
      column = "transactionDate"; //req.query.column
    let params = {
      from,
      to,
      order,
      column,
    };
    let data = await getExcel(params);
    res.send(data);
  } catch (e) {
    res.send(e.message);
  }
};

exports.fetchProductVendors = asyncHandler(async (req, res, next) => {
  let produtIds = req.body.productIds
  let vendors = await fetchVendorsByProductIds(produtIds)
//   const type = "ECOMMERCE";
  // let result = await fetchVendorDetails(searchText, type, vendors)
  if (!vendors) {
      return next(new ErrorResponse(`Something went wrong while fetching specific vendor`, 500))
  } else {
      return res.status(200).json({
          'status': true,
          'data': vendors,
          'message' : 'Vendor fetched successfully',
          'responseCode': '000'
      })
  }
})

/**
 * "All orders" tab — the real ONDC order rows (Order State + separate
 * Fulfilment, Seller, etc. — see OndcStatusTag.tsx on the frontend for the
 * exact label/color vocabulary these rows are rendered with). Distinct from
 * findAllOrders above, which serves the older wallet-transaction order model.
 *
 * needsAttention=true restricts to orders with a currently-open (non-terminal)
 * linked ONDC issue. NOTE: there is no pending cancellation/return-request
 * queue in this codebase yet (see findOndcOrdersForAdminAction's own comment),
 * so that half of "needs attention" is intentionally not included here.
 */
/**
 * Is this order past its delivery promise, and by how much?
 *
 * Deliberately NOT `evaluateRefundEligibility(...).eligible` — that also encodes
 * refund mechanics (no paymentRef, payout already released, nothing left to refund),
 * so an order can be genuinely late while ineligible. Ops needs to see lateness.
 * `dueBy` is the seller's ETA, or placed + fallback when the BPP declared no TAT.
 */
const decorateDelay = (row, dueBy, now = new Date()) => {
  const isDelayed = Boolean(
    dueBy && !row.deliveredAt && row.orderState !== "Cancelled" && dueBy <= now
  );
  return {
    isDelayed,
    dueBy: dueBy || null,
    daysOverdue: isDelayed
      ? Math.max(0, Math.floor((now.getTime() - dueBy.getTime()) / 86400000))
      : 0,
  };
};

exports.findAllOndcOrders = asyncHandler(async (req, res, next) => {
  let { from, to, searchText, page, itemsPerPage, status, sellerName } = req.query;
  const needsAttention = req.query.needsAttention === "true";
  const delayedOnly = req.query.delayedOnly === "true";
  // Return Requests tab — any order with return activity, in-flight or completed.
  const returnsOnly = req.query.returnsOnly === "true";
  const sort = req.query.sort && req.query.sort === "ASC" ? "ASC" : "DESC";
  const sortField = req.query.sortField || "createdAt";

  page = page ? parseInt(page) : 1;
  itemsPerPage = itemsPerPage ? parseInt(itemsPerPage) : 10;
  const offset = (page - 1) * itemsPerPage;

  let orderIds;
  if (needsAttention) {
    orderIds = await findOndcOrderIdsWithNonTerminalIssues(TERMINAL_ISSUE_STATUSES);
    if (!orderIds.length) {
      return res.status(200).json({
        status: true,
        data: { recordsTotal: 0, recordsFiltered: 0, data: [] },
        message: "Orders fetched successfully",
        responseCode: "000",
      });
    }
  }

  const result = await findAllOndcOrdersForAdmin({
    status, sellerName, searchText, orderIds, from, to, delayedOnly, returnsOnly, sort, sortField, offset, limit: itemsPerPage,
  });
  if (!result) {
    return next(new ErrorResponse(`Something went wrong while getting all orders from DB`, 500));
  }
  const named = await enrichOndcOrdersWithCorporateName(result.rows);
  // Same refund predicate the detail endpoint and the write path use, so the list's
  // Refund action can never offer something the service would reject. Pure function
  // over columns already on the row — no extra queries.
  const now = new Date();
  const data = named.map((row) => {
    const { eligible, refundableAmount, dueBy } = evaluateRefundEligibility(row, now);
    return { ...row, refundEligible: eligible, refundableAmount, ...decorateDelay(row, dueBy, now) };
  });
  return res.status(200).json({
    status: true,
    data: { recordsTotal: result.recordsTotal, recordsFiltered: result.recordsTotal, data },
    message: "Orders fetched successfully",
    responseCode: "000",
  });
});

/** Seller/vendor dropdown options for the All-orders toolbar filter. */
exports.findAllOndcOrdersVendors = asyncHandler(async (req, res, next) => {
  const vendors = await findDistinctOndcVendorNames();
  if (!vendors) {
    return next(new ErrorResponse(`Something went wrong while fetching sellers`, 500));
  }
  return res.status(200).json({
    status: true,
    data: vendors,
    message: "Sellers fetched successfully",
    responseCode: "000",
  });
})

const fetchAllOndcOrdersForExport = async (req) => {
  const { from, to, searchText, status, sellerName } = req.query;
  // Forwarded so an export matches what the operator is looking at. (needsAttention
  // is still dropped here — it's an id-set pre-query, not a WHERE, so it needs the
  // same lookup the list endpoint does.)
  const delayedOnly = req.query.delayedOnly === "true";
  const sort = req.query.sort === "ASC" ? "ASC" : "DESC";
  const sortField = req.query.sortField || "createdAt";
  const result = await findAllOndcOrdersForAdmin({
    status, sellerName, searchText, from, to, delayedOnly, sort, sortField, offset: 0, limit: 10000,
  });
  return enrichOndcOrdersWithCorporateName(result.rows);
};

exports.ondcOrdersExcelCSV = asyncHandler(async (req, res, next) => {
  const { type } = req.params;
  const data = await fetchAllOndcOrdersForExport(req);
  if (!data.length) {
    return next(new ErrorResponse(`No data is available for export`, 500));
  }
  const { buffer, fileType } = await generateExcelBufferAndType(data, type);
  return res.status(200).json({
    status: true,
    data: { buffer, fileType },
    message: "Fetched excel/csv datas successfully",
    responseCode: "000",
  });
});

exports.ondcOrdersPDF = asyncHandler(async (req, res, next) => {
  const data = await fetchAllOndcOrdersForExport(req);
  if (!data.length) {
    return next(new ErrorResponse(`No data is available for export`, 400));
  }

  const reportHtmlWithStyle = reportPdfTemplate(data, { title: "Orders" });
  const random = new Date().valueOf();
  const browser = await puppeteer.launch({ args: ["--no-sandbox", "--disable-setuid-sandbox"] });
  const page = await browser.newPage();
  await page.setContent(reportHtmlWithStyle, { waitUntil: "domcontentloaded" });
  const outputFile = `report-${random}.pdf`;
  await page.pdf({ scale: 0.6, path: outputFile, format: "A4", preferCSSPageSize: true });
  const buffer = fs.readFileSync(outputFile);
  browser.close();
  fs.unlinkSync(outputFile);

  return res.status(200).json({
    status: true,
    message: "report generated successfully.",
    data: { buffer, fileType: "application/pdf" },
    responseCode: "000",
  });
});

/**
 * Single ONDC order (admin, unscoped by buyer) for the order-detail page.
 * The stored row already carries the full detail (items, quote incl. line
 * items/GST, billing, payment, fulfillments, cancel/return fields, and the
 * seller-payout hold columns) — this only adds the corporate name + code
 * (credential.username, the "Corporate ID" shown as CORP-xxx), which aren't
 * columns on ondcOrders, plus the payout ledger.
 */
exports.getOndcOrderByIdAdmin = asyncHandler(async (req, res, next) => {
  const order = await findOndcOrderByIdAdmin(req.params.id);
  if (!order) {
    return next(new ErrorResponse(`Order not found`, 404));
  }
  let corporateName = "-";
  let corporateCode = null;
  if (order.corporateUserId) {
    const corporate = await corporateUser.findOne({
      where: { id: order.corporateUserId },
      attributes: ["id", "name"],
      include: [{ model: credential, attributes: ["username"] }],
    });
    if (corporate) {
      corporateName = corporate.name || "-";
      corporateCode = corporate.credential ? corporate.credential.username : null;
    }
  }

  // Every settlement-timing call made to Cashfree for this order's seller.
  // payoutStatus is only the CURRENT state; this is how it got there. Non-fatal —
  // the page must still render if the ledger is unreadable.
  let payoutHistory = [];
  try {
    payoutHistory = await findPayoutAttemptsForOrder({ ondcOrderId: order.id });
  } catch (error) {
    customLog(req?.LogTraceId, "error", {
      scope: "easySplit",
      flow: "payoutHold",
      message: "Could not load the seller payout ledger for the admin order detail",
      ondcOrderId: order.id,
      error: error?.message || error,
    }, "VENDOR");
  }

  // Whether the Refund action is available, computed with the SAME predicate the
  // write path enforces (services/ondcOrderRefund.js) so the UI can never offer a
  // refund the service would reject. Derived server-side deliberately: it keeps the
  // payout internals (payoutStatus/payoutDueAt) out of the admin UI.
  //
  // The reason ships too, so the screen can show a DISABLED Refund button explaining
  // why rather than hiding it and leaving an admin guessing whether it exists.
  const { eligible: refundEligible, refundableAmount, reason: refundIneligibleReason } =
    evaluateRefundEligibility(order);

  return res.status(200).json({
    status: true,
    data: {
      ...order,
      corporateName,
      corporateCode,
      payoutHistory,
      refundEligible,
      refundableAmount,
      refundIneligibleReason,
    },
    message: "Order fetched successfully",
    responseCode: "000",
  });
});
