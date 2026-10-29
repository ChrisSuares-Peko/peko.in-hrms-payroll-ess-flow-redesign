const {
  asyncHandler,
  getTransactionStatus,
  getPaymentLinksCount,
  getActivePaymentLinksCount,
  updatePaymentLinkStatus,
  getTotalAmountFromPaymentLink,
  findAllPaymentLinks,
  findAllPaymentLinksForExport,
  findPaymentLinkById,
  findInvoicePaymentLinkByInvoiceId,
  findAllPaymentQrs,
  findAllPaymentQrsForExport,
  findPaymentQrById,
  getPaymentQrsCount,
  getActivePaymentQrsCount,
  getTotalAmountFromPaymentQr,
  updatePaymentQrStatus,
  ErrorResponse,
  generateExcelBufferAndType,
  puppeteer,
  invoicingV2,
  syncLedgerEntryStatus,
  customLog,
  formatDateTimeInIST,
  buildUnifiedTransactions,
  PAYMENT_SUCCESS_STATUSES,
  PAYMENT_FAILED_STATUSES,
  normalizePaymentStatus,
  buildTransactionTimeline,
  parseTransactionKey,
  findInvoiceById,
  findInvoiceSettingsByCorporateUserId,
  invoiceCustomerV2,
  payoutReceiptTemplate,
} = require("./common");
const { escapeHtml } = require("../../../utils/htmlEscape");
const { getTransactionStatus: getNupayTransactionStatus } = require("../../../services/nupayGateway");

exports.getDashboardData = asyncHandler(async (req, res) => {
  const corporateUser = req.user?.id;
  if (!corporateUser) {
    return res.status(400).json({
      status: false,
      message: "Credential (user) id missing",
      responseCode: "001",
      data: {},
    });
  }

  try {
    const [
      pendingPaymentLinksCount,
      activePaymentLinksCount,
      totalAmountFromPaymentLinks,
      { rows: paymentLinkRows },
      pendingPaymentQrsCount,
      activePaymentQrsCount,
      totalAmountFromPaymentQrs,
      { rows: paymentQrRows },
    ] = await Promise.all([
      getPaymentLinksCount({ corporateUser }),
      getActivePaymentLinksCount({ corporateUser }),
      getTotalAmountFromPaymentLink({
        corporateUser,
        startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        endDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0, 23, 59, 59, 999)
      }),
      findAllPaymentLinks({ corporateUser, limit: 25, page: 0 }),
      getPaymentQrsCount({ corporateUser }),
      getActivePaymentQrsCount({ corporateUser }),
      getTotalAmountFromPaymentQr({
        corporateUser,
        startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        endDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0, 23, 59, 59, 999),
      }),
      findAllPaymentQrs({ corporateUser, limit: 25, page: 0 }),
    ]);

    const totalAmountThisMonth =
      Number(totalAmountFromPaymentLinks || 0) + Number(totalAmountFromPaymentQrs || 0);
    const pendingCount =
      Number(pendingPaymentLinksCount || 0) + Number(pendingPaymentQrsCount || 0);
    const activeCount =
      Number(activePaymentLinksCount || 0) + Number(activePaymentQrsCount || 0);

    const mergedTransactions = buildUnifiedTransactions({
      paymentLinkRows,
      paymentQrRows,
    }).slice(0, 10);

    const transactions = mergedTransactions.map((tx) => ({
      key: tx.key,
      source: tx.source,
      customerName: tx.customerName,
      customerPhone: tx.customerPhone,
      reference_id: tx.reference_id,
      decentro_txn_id: tx.decentro_txn_id,
      status: tx.status,
      createdAt: tx.createdAt,
      amount: tx.amount,
    }));

    return res.status(200).json({
      status: true,
      message: "Payment links count fetched successfully",
      responseCode: "000",
      data: {
        pendingPaymentLinksCount: pendingCount,
        activePaymentLinksCount: activeCount,
        totalAmountThisMonth,
        transactions
      },
    });
  } catch (e) {
    customLog(req?.LogTraceId, "error", { message: "Error in getDashboardData", error: e?.message });
    return res.status(500).json({
      status: false,
      message: "Failed to fetch payment links count",
      responseCode: "999",
      data: {},
    });
  }
});

// ── Onboarding ──────────────────────────────────────────────────────────────

// Sorts an array in-place by sortField ('createdAt' | 'amount' | 'status') and direction ('ASC' | 'DESC').
const sortRows = (rows, sortField, sort) => {
  rows.sort((a, b) => {
    let aVal, bVal;
    if (sortField === 'amount') {
      aVal = Number(a.amount || 0);
      bVal = Number(b.amount || 0);
    } else if (sortField === 'status') {
      aVal = String(a.status || '').toUpperCase();
      bVal = String(b.status || '').toUpperCase();
    } else {
      // createdAt (default)
      aVal = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      bVal = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    }
    if (aVal < bVal) return sort === 'ASC' ? -1 : 1;
    if (aVal > bVal) return sort === 'ASC' ? 1 : -1;
    return 0;
  });
};

// Filters an array by createdAt falling within [startDate, endDate] (both optional ISO strings).
const filterByDateRange = (rows, startDate, endDate) => {
  if (!startDate && !endDate) return rows;
  const start = startDate ? new Date(startDate).getTime() : null;
  const end = endDate ? new Date(new Date(endDate).getTime() + 24 * 60 * 60 * 1000).getTime() : null;
  return rows.filter(r => {
    const t = r.createdAt ? new Date(r.createdAt).getTime() : 0;
    if (start && t <= start) return false;
    if (end   && t >= end)   return false;
    return true;
  });
};

const normalizeJsonArray = (value) => {
  if (Array.isArray(value)) return value;
  if (typeof value !== "string") return [];

  try {
    const parsedValue = JSON.parse(value);
    return Array.isArray(parsedValue) ? parsedValue : [];
  } catch {
    return [];
  }
};

const getPrimaryInvoiceCustomerBank = (bankDetails) =>
  normalizeJsonArray(bankDetails).find((bank) => bank && typeof bank === "object") || {};

exports.getTransactions = asyncHandler(async (req, res) => {
  const corporateUser = req.user?.id;
  const accessKey  = req.query.accessKey  || 'payment_link';
  const sort       = req.query.sort       || 'DESC';
  const sortField  = req.query.sortField  || 'createdAt';
  const startDate  = req.query.startDate  || null;
  const endDate    = req.query.endDate    || null;
  const paymentMethod = req.query.paymentMethod || null;

  if (!corporateUser) {
    return res.status(400).json({ status: false, message: "Credential (user) id missing", responseCode: "001", data: {} });
  }

  if (accessKey === "invoice") {
    const page          = Math.max(1, parseInt(req.query.page)  || 1);
    const limit         = Math.min(100, parseInt(req.query.limit) || 10);
    const status        = req.query.status        || null;
    const search        = req.query.search        || null;
    
    const customer      = req.query.customer      || null;

    const paymentLinksData = await findAllPaymentLinks({
      corporateUser,
      page: 0,
      limit: 10000,
      status,
      search,
      accessKey,
    });

    let rows = (paymentLinksData?.rows || []).map(r => r.toJSON ? r.toJSON() : { ...r });

    // Batch-fetch paymentMode and invoiceNumber from invoicingV2 for all linked invoices
    const invoiceIds = [...new Set(rows.map(r => r.invoiceId).filter(Boolean))];
    const invoiceDataMap = {};
    if (invoiceIds.length > 0) {
      const invoices = await invoicingV2.findAll({
        where: { id: invoiceIds },
        attributes: ['id', 'paymentMode', 'invoiceNumber',"prefix"],
        raw: true,
      });
      invoices.forEach(inv => {
        invoiceDataMap[String(inv.id)] = {
          paymentMode: inv.paymentMode || null,
          invoiceNumber:inv.prefix+inv.invoiceNumber || null,
          invoiceId:inv.id
        };
      });
    }

    // Attach paymentMethod and invoiceNumber to each row from the corresponding invoice
    rows = rows.map(r => {
      const invData = r.invoiceId ? (invoiceDataMap[String(r.invoiceId)] || {}) : {};
      return {
        ...r,
        paymentMethod: invData.paymentMode || null,
        invoiceNumber: r.invoiceNumber || invData.invoiceNumber || null,
        invoiceId:r.invoiceId || invData.invoiceId
      };
    });

    // Apply paymentMethod filter
    if (paymentMethod) {
      rows = rows.filter(r => r.paymentMethod && r.paymentMethod.toUpperCase() === paymentMethod.toUpperCase());
    }

    // Apply customer filter (by name or phone)
    if (customer) {
      const lowerCustomer = customer.toLowerCase();
      rows = rows.filter(r =>
        (r.customerName && r.customerName.toLowerCase().includes(lowerCustomer)) ||
        (r.customerPhone && r.customerPhone.includes(customer))
      );
    }

    // Apply date range filter
    rows = filterByDateRange(rows, startDate, endDate);

    // Apply sort
    sortRows(rows, sortField, sort);

    const total      = rows.length;
    const startIndex = (page - 1) * limit;
    const paginatedRows = rows.slice(startIndex, startIndex + limit);

    const transactions = paginatedRows.map((tx) => ({
      key: `plink_${tx.id}`,
      source: 'payment_link',
      dateTime: tx.createdAt,
      transactionId: tx.transactionId || tx.decentro_txn_id || tx.reference_id || 'N/A',
      amount: Number(tx.amount || 0),
      status: String(tx.status || 'PENDING').toUpperCase(),
      reference: tx.purpose_message || 'N/A',
      customerName: tx.customerName || null,
      customerPhone: tx.customerPhone || null,
      paymentMethod: tx.paymentMethod || null,
      invoiceNumber: tx.invoiceNumber || null,
      invoiceId:tx.invoiceId
    }));

    return res.status(200).json({
      status: true,
      message: "Transactions fetched successfully",
      responseCode: "000",
      data: {
        transactions,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } else {
    const page   = Math.max(1, parseInt(req.query.page)  || 1);
    const limit  = Math.min(100, parseInt(req.query.limit) || 10);
    const status = req.query.status || null;
    const search = req.query.search || null;
    let paymentLinksData = { rows: [] };
    let paymentQrsData = { rows: [] };

    if(paymentMethod === "Payment Link") {
      paymentLinksData = await findAllPaymentLinks({
        corporateUser,
        page: 0,
        limit: 10000,
        status,
        search,
      });
    } else if(paymentMethod === "QR Code") {
      paymentQrsData = await findAllPaymentQrs({
        corporateUser,
        page: 0,
        limit: 10000,
        status,
        search,
      });
    } else {
      [paymentLinksData, paymentQrsData] = await Promise.all([
        findAllPaymentLinks({
          corporateUser,
          page: 0,
          limit: 10000,
          status,
          search,
        }),
        findAllPaymentQrs({
          corporateUser,
          page: 0,
          limit: 10000,
          status,
          search,
        }),
      ]);
    }

    let mergedTransactions = buildUnifiedTransactions({
      paymentLinkRows: paymentLinksData?.rows || [],
      paymentQrRows: paymentQrsData?.rows || [],
    });

    // Apply date range filter
    mergedTransactions = filterByDateRange(mergedTransactions, startDate, endDate);

    // Re-sort only when the requested order differs from the default (createdAt DESC)
    if (sortField !== 'createdAt' || sort !== 'DESC') {
      sortRows(mergedTransactions, sortField, sort);
    }

    const total      = mergedTransactions.length;
    const startIndex = (page - 1) * limit;
    const endIndex   = startIndex + limit;
    const paginatedRows = mergedTransactions.slice(startIndex, endIndex);

    const transactions = paginatedRows.map((tx) => ({
      key: tx.key,
      source: tx.source,
      dateTime: tx.createdAt,
      transactionId: tx.transactionId,
      amount: tx.amount,
      status: tx.status,
      reference: tx.reference,
      customerName: tx.customerName,
      customerPhone: tx.customerPhone,
    }));

    return res.status(200).json({
      status: true,
      message: "Transactions fetched successfully",
      responseCode: "000",
      data: {
        transactions,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  }
});

exports.exportTransactionsReport = asyncHandler(async (req, res, next) => {
  const corporateUser = req.user?.id;
  if (!corporateUser) {
    return res.status(400).json({
      status: false,
      message: "Credential (user) id missing",
      responseCode: "001",
      data: {},
    });
  }

  const { type } = req.params;
  if (type !== "excel") {
    return res.status(400).json({
      status: false,
      message: "Unsupported export type. Only excel is supported.",
      responseCode: "001",
      data: {},
    });
  }

  const status = req.query.status || null;
  const search = req.query.search || null;

  const [links, paymentQrs] = await Promise.all([
    findAllPaymentLinksForExport({
      corporateUser,
      status,
      search,
    }),
    findAllPaymentQrsForExport({
      corporateUser,
      status,
      search,
    }),
  ]);

  if (!links || !paymentQrs) {
    return next(new ErrorResponse("Something went wrong while generating report", 500));
  }

  const mergedRows = buildUnifiedTransactions({
    paymentLinkRows: links,
    paymentQrRows: paymentQrs,
  });

  if (mergedRows.length < 1) {
    return next(new ErrorResponse("No data is available for export", 409));
  }

  const exportRows = mergedRows.map((row) => ({
    "Date & Time": formatDateTimeInIST(row.createdAt) || "N/A",
    "Transaction ID": row.transactionId || "N/A",
    Source: row.source === "payment_qr" ? "Payment QR" : "Payment Link",
    Amount: row.amount ?? "N/A",
    Customer: row.customerName || "N/A",
    "Customer Phone": row.customerPhone || "N/A",
    Status: row.status || "N/A",
    Reference: row.reference || "N/A",
  }));

  const { buffer, fileType } = await generateExcelBufferAndType(exportRows, "excel");
  return res.status(200).json({
    status: true,
    data: { buffer, fileType },
    message: "Fetched transactions export successfully",
    responseCode: "000",
  });
});

exports.exportInvoiceTransactionsReport = asyncHandler(async (req, res, next) => {
  const corporateUser = req.user?.id;
  if (!corporateUser) {
    return res.status(400).json({
      status: false,
      message: "Credential (user) id missing",
      responseCode: "001",
      data: {},
    });
  }

  const { type } = req.params;
  if (!["excel", "csv", "pdf"].includes(type)) {
    return res.status(400).json({
      status: false,
      message: "Unsupported export type. Supported types: excel, csv, pdf.",
      responseCode: "001",
      data: {},
    });
  }

  const status = req.query.status || null;
  const search = req.query.search || null;
  const paymentMethod = req.query?.paymentMethod || null;
  const customer = req.query?.customer || null;
  // Add startDate and endDate filter support to exportInvoiceTransactionsReport
  const startDate = req.query.startDate ? new Date(req.query.startDate) : null;
  const endDate = req.query.endDate ? new Date(req.query.endDate) : null;

  const paymentLinksData = await findAllPaymentLinksForExport({
    corporateUser,
    status,
    search,
    accessKey: "invoice",
    startDate,
    endDate
  });

  if (!paymentLinksData) {
    return next(new ErrorResponse("Something went wrong while generating report", 500));
  }

  let rows = paymentLinksData.map(r => r.toJSON ? r.toJSON() : { ...r });

  // Batch-fetch paymentMode from invoicingV2 for all linked invoices
  const invoiceIds = [...new Set(rows.map(r => r.invoiceId).filter(Boolean))];
  const invoicePaymentModeMap = {};
  if (invoiceIds.length > 0) {
    const invoices = await invoicingV2.findAll({
      where: { id: invoiceIds },
      attributes: ['id', 'paymentMode'],
      raw: true,
    });
    invoices.forEach(inv => {
      invoicePaymentModeMap[String(inv.id)] = inv.paymentMode || null;
    });
  }

  rows = rows.map(r => ({
    ...r,
    paymentMethod: r.invoiceId ? (invoicePaymentModeMap[String(r.invoiceId)] || null) : null,
  }));

  // Apply paymentMethod filter
  if (paymentMethod) {
    rows = rows.filter(r => r.paymentMethod && r.paymentMethod.toUpperCase() === paymentMethod.toUpperCase());
  }

  // Apply customer filter (by name or phone)
  if (customer) {
    const lowerCustomer = customer.toLowerCase();
    rows = rows.filter(r =>
      (r.customerName && r.customerName.toLowerCase().includes(lowerCustomer)) ||
      (r.customerPhone && r.customerPhone.includes(customer))
    );
  }

  if (rows.length < 1) {
    return next(new ErrorResponse("No data is available for export", 409));
  }

  const exportRows = rows.map((row) => ({
    "Date & Time": formatDateTimeInIST(row.createdAt) || "N/A",
    "Transaction ID": row.transactionId || row.decentro_txn_id || row.reference_id || "N/A",
    Amount: row.amount ?? "N/A",
    Customer: row.customerName || "N/A",
    "Customer Phone": row.customerPhone || "N/A",
    "Payment Method": row.paymentMethod || "N/A",
    Status: String(row.status || "PENDING").toUpperCase(),
    Reference: row.purpose_message || "N/A",
  }));

  // ── PDF ──────────────────────────────────────────────────────────────────
  if (type === "pdf") {
    const columns = Object.keys(exportRows[0]);

    const headerCells = columns
      .map(col => `<th>${escapeHtml(col)}</th>`)
      .join("");

    const bodyRows = exportRows
      .map(row =>
        `<tr>${columns.map(col => `<td>${escapeHtml(row[col] ?? "")}</td>`).join("")}</tr>`
      )
      .join("");

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, sans-serif; font-size: 11px; color: #1f2937; padding: 24px; }
    h2 { font-size: 16px; margin-bottom: 16px; color: #111827; }
    table { width: 100%; border-collapse: collapse; }
    th {
      background: #f3f4f6; color: #374151; font-weight: 600;
      text-align: left; padding: 8px 10px;
      border: 1px solid #e5e7eb;
    }
    td { padding: 7px 10px; border: 1px solid #e5e7eb; color: #374151; }
    tr:nth-child(even) td { background: #f9fafb; }
  </style>
</head>
<body>
  <h2>Invoice Transactions Report</h2>
  <table>
    <thead><tr>${headerCells}</tr></thead>
    <tbody>${bodyRows}</tbody>
  </table>
</body>
</html>`;

    let browser;
    try {
      browser = await puppeteer.launch({ args: ["--no-sandbox", "--disable-setuid-sandbox"] });
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: "networkidle0" });
      const pdfBuffer = await page.pdf({ format: "A4", landscape: true, printBackground: true });
      return res.status(200).json({
        status: true,
        data: { buffer: pdfBuffer, fileType: "application/pdf" },
        message: "Fetched invoice transactions export successfully",
        responseCode: "000",
      });
    } finally {
      if (browser) await browser.close();
    }
  }

  // ── Excel / CSV ──────────────────────────────────────────────────────────
  const { buffer, fileType } = await generateExcelBufferAndType(exportRows, type);
  return res.status(200).json({
    status: true,
    data: { buffer, fileType },
    message: "Fetched invoice transactions export successfully",
    responseCode: "000",
  });
});

exports.exportInvoicePdf = asyncHandler(async (req, res, next) => {
  const corporateUser = req.user?.id;
  if (!corporateUser) {
    return res.status(400).json({
      status: false,
      message: "Credential (user) id missing",
      responseCode: "001",
      data: {},
    });
  }

  const { invoiceId } = req.params;
  if (!invoiceId) {
    return res.status(400).json({
      status: false,
      message: "invoiceId is required",
      responseCode: "001",
      data: {},
    });
  }

  const paymentLink = await findInvoicePaymentLinkByInvoiceId({
    invoiceId,
    corporateUser,
  });

  if (!paymentLink) {
    return res.status(404).json({
      status: false,
      message: "Invoice payment link not found",
      responseCode: "404",
      data: {},
    });
  }

  const invoice = await findInvoiceById({ id: invoiceId });

  if (!invoice) {
    return res.status(404).json({
      status: false,
      message: "Invoice not found",
      responseCode: "404",
      data: {},
    });
  }

  const inv = invoice.toJSON ? invoice.toJSON() : { ...invoice };
  const link = paymentLink.toJSON ? paymentLink.toJSON() : { ...paymentLink };
  const invoiceCustomer = inv.customerId
    ? await invoiceCustomerV2.findOne({
        where: {
          id: inv.customerId,
          corporateUserId: corporateUser,
        },
      })
    : null;
  const customer = invoiceCustomer?.toJSON
    ? invoiceCustomer.toJSON()
    : invoiceCustomer
      ? { ...invoiceCustomer }
      : {};
  const customerBank = getPrimaryInvoiceCustomerBank(customer.bankDetails);
  const invoiceNumber = `${inv.prefix || ""}${inv.invoiceNumber || ""}`;
  const html = payoutReceiptTemplate({
    receiptNo: invoiceNumber || inv.id,
    date: inv.invoiceDate || link.createdAt,
    referenceId: link.reference_id,
    transactionId: link.decentro_txn_id || link.transactionId,
    payoutStatus: link.status || inv.status,
    transferMode: inv.paymentMode || "Payment Link",
    beneficiaryName: customer.name || customerBank.accountHolderName || inv.name,
    bankName: "Payment Links",
    accountNumber: customerBank.accountNumber || customer.phoneNumber || inv.phoneNumber || inv.id,
    ifscCode: customerBank.ifscCode || customer.gstin || inv.gstNumber || "N/A",
    payoutAmount: link.amount || "-",
    companyName: customer.name || inv.name || "Peko",
  });

  let browser;
  try {
    browser = await puppeteer.launch({
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });
    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
    });

    return res.status(200).json({
      status: true,
      data: { buffer: pdfBuffer, fileType: "application/pdf" },
      message: "Invoice PDF generated successfully",
      responseCode: "000",
    });
  } catch (error) {
    return next(new ErrorResponse("Something went wrong while generating invoice PDF", 500));
  } finally {
    if (browser) {
      await browser.close();
    }
  }
});

exports.getInvoiceTransactionDetail = asyncHandler(async (req, res) => {
  const corporateUser = req.user?.id;
  if (!corporateUser) {
    return res.status(400).json({ status: false, message: "Credential (user) id missing", responseCode: "001", data: {} });
  }
  const { id } = req.params;
  const parsed = parseTransactionKey(id);

  if (!parsed?.source || !parsed?.id || parsed.source !== "payment_link") {
    return res.status(404).json({ status: false, message: "Invoice transaction not found", responseCode: "404", data: {} });
  }

  const link = await findPaymentLinkById({ id: parsed.id, corporateUser });

  if (!link) {
    return res.status(404).json({ status: false, message: "Invoice transaction not found", responseCode: "404", data: {} });
  }

  if (link.accessKey !== "invoice") {
    return res.status(404).json({ status: false, message: "Transaction is not linked to an invoice", responseCode: "404", data: {} });
  }

  let resolvedLinkStatus = normalizePaymentStatus(link.status);
  const isLinkPending = !PAYMENT_SUCCESS_STATUSES.has(resolvedLinkStatus) && !PAYMENT_FAILED_STATUSES.has(resolvedLinkStatus);

  if (isLinkPending && link.reference_id) {
    try {
      const decentroResult = await getTransactionStatus(link.reference_id);
      const providerStatus = String(decentroResult?.data?.transaction_status || "").trim().toUpperCase();
      if (providerStatus && providerStatus !== resolvedLinkStatus) {
        const updateResult = await updatePaymentLinkStatus({
          reference_id: link.reference_id,
          status: providerStatus,
          rawPayload: decentroResult,
          skipUnifiedSync: true,
        });
        if (updateResult?.statusChanged) {
          resolvedLinkStatus = normalizePaymentStatus(providerStatus);
          const ledgerStatus = PAYMENT_SUCCESS_STATUSES.has(providerStatus) ? "SUCCESS"
            : PAYMENT_FAILED_STATUSES.has(providerStatus) ? "FAILED" : null;
          if (ledgerStatus) {
            await syncLedgerEntryStatus(
              req,
              "getInvoiceTransactionDetail.link.ledgerStatusSync",
              { transactionId: link.decentro_txn_id, status: ledgerStatus },
              { referenceId: link.reference_id, corporateUser }
            );
          }
        }
      }
    } catch (statusErr) {
      customLog(req?.LogTraceId, "error", { message: "Error fetching invoice transaction status from provider", error: statusErr?.message });
      // Keep DB status if Decentro check fails
    }
  }

  // Fetch linked invoice details and seller GST in parallel
  const [invoiceSettings] = await Promise.all([
    findInvoiceSettingsByCorporateUserId({ corporateUserId: corporateUser }),
  ]);
  const sellerGstNo = invoiceSettings?.gstNo || null;

  let invoiceDetails = null;
  if (link.invoiceId) {
    const invoice = await findInvoiceById({ id: link.invoiceId });
    if (invoice) {
      const inv = invoice.toJSON ? invoice.toJSON() : { ...invoice };
      invoiceDetails = {
        id: inv.id,
        invoiceType: inv.invoiceType,
        invoiceNumber: (inv.prefix || "") + (inv.invoiceNumber || ""),
        prefix: inv.prefix,
        rawInvoiceNumber: inv.invoiceNumber,
        invoiceDate: inv.invoiceDate,
        dueDate: inv.dueDate,
        status: inv.status,
        currency: inv.currency,
        // Buyer details
        customerId: inv.customerId,
        name: inv.name,
        email: inv.email,
        phoneNumber: inv.phoneNumber,
        gstNumber: inv.gstNumber,
        address: inv.address,
        city: inv.city,
        state: inv.state,
        pincode: inv.pincode,
        country: inv.country,
        // Financial summary
        items: inv.items,
        subtotal: inv.subtotal,
        tax: inv.tax,
        discount: inv.discount,
        shippingCost: inv.shippingCost,
        totalAmount: inv.totalAmount,
        amountPaid: inv.amountPaid,
        amountDue: inv.amountDue,
        // Payment info
        paymentMode: inv.paymentMode,
        paymentDate: inv.paymentDate,
        // Seller GST from invoiceSettingsV2
        sellerGstNo,
        // Additional
        termsAndConditions: inv.termsAndConditions,
        notes: inv.notes,
        reminderSettings: inv.reminderSettings,
        createdAt: inv.createdAt,
        updatedAt: inv.updatedAt,
      };
    }
  }

  return res.status(200).json({
    status: true,
    message: "Invoice transaction detail fetched successfully",
    responseCode: "000",
    data: {
      sellerGstNo,
      // Payment link details
      paymentLink: {
        key: `plink_${link.id}`,
        id: `plink_${link.id}`,
        source: "payment_link",
        transactionId: link.transactionId || link.decentro_txn_id || link.reference_id || `PLINK-${link.id}`,
        decentro_txn_id: link.decentro_txn_id || null,
        reference_id: link.reference_id || null,
        dateTime: link.createdAt,
        amount: link.amount,
        status: resolvedLinkStatus,
        reference: link.purpose_message || link.reference_id || "—",
        customerName: link.customerName || "N/A",
        customerPhone: link.customerPhone || "N/A",
        paymentLink: link.paymentLink || null,
        client_url: link.client_url || null,
        purpose_message: link.purpose_message || "N/A",
        accessKey: link.accessKey,
        expireDate: link.expireDate || null,
        successOrFailDate: link.successOrFailDate || null,
        settledDate: link.settledDate || null,
        timeline: buildTransactionTimeline({
          createdAt: link.createdAt,
          status: resolvedLinkStatus,
          successOrFailDate: link.successOrFailDate,
          settledDate: link.settledDate,
        }),
      },
      // Invoice details (null if not linked)
      invoice: invoiceDetails,
    },
  });
});

exports.getTransactionDetail = asyncHandler(async (req, res) => {
  const corporateUser = req.user?.id;
  if (!corporateUser) {
    return res.status(400).json({ status: false, message: "Credential (user) id missing", responseCode: "001", data: {} });
  }

  const { id } = req.params;
  const parsed = parseTransactionKey(id);

  if (!parsed?.source || !parsed?.id) {
    return res.status(404).json({ status: false, message: "Transaction not found", responseCode: "404", data: {} });
  }

  if (parsed.source === "payment_qr") {
    const paymentQr = await findPaymentQrById({ id: parsed.id, corporateUser });

    if (!paymentQr) {
      return res.status(404).json({ status: false, message: "Transaction not found", responseCode: "404", data: {} });
    }

    let resolvedQrStatus = normalizePaymentStatus(paymentQr.status);
    const isQrPending = !PAYMENT_SUCCESS_STATUSES.has(resolvedQrStatus) && !PAYMENT_FAILED_STATUSES.has(resolvedQrStatus);

    if (isQrPending && paymentQr.reference_id) {
      try {
        const decentroResult = await getTransactionStatus(paymentQr.reference_id);
        const providerStatus = String(decentroResult?.data?.transaction_status || "").trim().toUpperCase();
        if (providerStatus && providerStatus !== resolvedQrStatus) {
          const updateResult = await updatePaymentQrStatus({
            reference_id: paymentQr.reference_id,
            status: providerStatus,
            rawPayload: decentroResult,
            skipUnifiedSync: true,
          });
          if (updateResult?.statusChanged) {
            resolvedQrStatus = normalizePaymentStatus(providerStatus);
            const ledgerStatus = PAYMENT_SUCCESS_STATUSES.has(providerStatus) ? "SUCCESS"
              : PAYMENT_FAILED_STATUSES.has(providerStatus) ? "FAILED" : null;
            if (ledgerStatus) {
              await syncLedgerEntryStatus(
                req,
                "getTransactionDetail.qr.ledgerStatusSync",
                { transactionId: paymentQr.decentro_txn_id, status: ledgerStatus },
                { referenceId: paymentQr.reference_id, corporateUser }
              );
            }
          }
        }
      } catch (statusErr) {
        customLog(req?.LogTraceId, "error", { message: "Error fetching QR transaction status from provider", error: statusErr?.message });
        // Keep DB status if Decentro check fails
      }
    }

    return res.status(200).json({
      status: true,
      message: "Transaction detail fetched successfully",
      responseCode: "000",
      data: {
        key: `pqr_${paymentQr.id}`,
        id: `pqr_${paymentQr.id}`,
        source: "payment_qr",
        transactionId: paymentQr.decentro_txn_id || paymentQr.reference_id || `QR-${paymentQr.id}`,
        dateTime: paymentQr.createdAt,
        amount: paymentQr.amount,
        status: resolvedQrStatus,
        reference: paymentQr.purpose_message || paymentQr.reference_id || "—",
        customerName: "N/A",
        customerPhone: "N/A",
        paymentAmount: paymentQr.amount,
        paymentLink: paymentQr.dynamic_qr_image || "",
        dynamic_qr_image: paymentQr.dynamic_qr_image || "",
        paymentMethod:"QR Code",
        purpose_message: paymentQr.purpose_message || "N/A",
        timeline: buildTransactionTimeline({
          createdAt: paymentQr.createdAt,
          status: resolvedQrStatus,
          successOrFailDate: paymentQr.successOrFailDate,
          settledDate: paymentQr.settledDate,
        }),
      },
    });
  }

  const link = await findPaymentLinkById({ id: parsed.id, corporateUser });

  if (!link) {
    return res.status(404).json({ status: false, message: "Transaction not found", responseCode: "404", data: {} });
  }

  let resolvedLinkStatus = normalizePaymentStatus(link.status);
  const isLinkPending = !PAYMENT_SUCCESS_STATUSES.has(resolvedLinkStatus) && !PAYMENT_FAILED_STATUSES.has(resolvedLinkStatus);

  if (isLinkPending && link.reference_id) {
    try {
      // NuPay links use the NuPay transactionEnquiry (with the merchant's own credentials);
      // legacy links keep the Decentro status check.
      let providerStatus = "";
      let providerRaw = null;
      if (link.vendor === "nupay") {
        const nupayResult = await getNupayTransactionStatus(link.reference_id, corporateUser);
        providerStatus = String(nupayResult?.transactionStatus || "").trim().toUpperCase();
        providerRaw = nupayResult?.providerResponse || nupayResult;
      } else {
        const decentroResult = await getTransactionStatus(link.reference_id);
        providerStatus = String(decentroResult?.data?.transaction_status || "").trim().toUpperCase();
        providerRaw = decentroResult;
      }
      if (providerStatus && providerStatus !== resolvedLinkStatus) {
        const updateResult = await updatePaymentLinkStatus({
          reference_id: link.reference_id,
          status: providerStatus,
          rawPayload: providerRaw,
          skipUnifiedSync: true,
        });
        if (updateResult?.statusChanged) {
          resolvedLinkStatus = normalizePaymentStatus(providerStatus);
          const ledgerStatus = PAYMENT_SUCCESS_STATUSES.has(providerStatus) ? "SUCCESS"
            : PAYMENT_FAILED_STATUSES.has(providerStatus) ? "FAILED" : null;
          if (ledgerStatus) {
            await syncLedgerEntryStatus(
              req,
              "getTransactionDetail.link.ledgerStatusSync",
              { transactionId: link.decentro_txn_id, status: ledgerStatus },
              { referenceId: link.reference_id, corporateUser }
            );
          }
        }
      }
    } catch (statusErr) {
      customLog(req?.LogTraceId, "error", { message: "Error fetching payment link transaction status from provider", error: statusErr?.message });
      // Keep DB status if the provider check fails
    }
  }

  return res.status(200).json({
    status: true,
    message: "Transaction detail fetched successfully",
    responseCode: "000",
    data: {
      key: `plink_${link.id}`,
      id: `plink_${link.id}`,
      source: "payment_link",
      transactionId: link.transactionId || link.decentro_txn_id || link.reference_id || `PLINK-${link.id}`,
      dateTime: link.createdAt,
      amount: link.amount,
      status: resolvedLinkStatus,
      reference: link.purpose_message || link.reference_id || '—',
      customerName: link.customerName || 'N/A',
      customerPhone: link.customerPhone || 'N/A',
      paymentAmount: link.amount,
      paymentLink: link.paymentLink,
      utr: link.utr || null,
      settlementUtr: link.settlementUtr || null,
      settledDate: link.settledDate || null,
      dynamic_qr_image: null,
      paymentMethod:"Payment Link",
      purpose_message: link.purpose_message || 'N/A',
      timeline: buildTransactionTimeline({
        createdAt: link.createdAt,
        status: resolvedLinkStatus,
        successOrFailDate: link.successOrFailDate,
        settledDate: link.settledDate,
      }),
    },
  });
});
