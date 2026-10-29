const { taxInvoiceTemplate, paymentReceiptTemplate } = require('./invoiceTemplate');
const { renderPdf } = require('./puppeteerPool');
const { customLog } = require('./loggerHelper');

// Renders a stored pekoInvoiceDetails payload (invoiceData / receiptData) to a
// PDF buffer via the shared puppeteer pool. `type` is 'Invoice' or 'Receipt'.
// `label` names the output file (e.g. 'Plan-Tax-Invoice' for the on-behalf-of-vendor
// invoice) — defaults to `type` for the original single-invoice/receipt callers.
// Errors (including the pool's retryable PDF_QUEUE_FULL 503) propagate to the
// controller, which owns the HTTP error mapping.
exports.generateInvoiceOrReceiptPdf = async (data, type, label = type) => {
    let htmlWithStyle = null;
    if (type === 'Invoice') {
        htmlWithStyle = taxInvoiceTemplate(data);
    } else {
        htmlWithStyle = paymentReceiptTemplate(data);
    }

    const pdfBuffer = await renderPdf(htmlWithStyle);
    customLog(null, 'info', { message: `${type} PDF generated successfully` });

    return {
        filename: `${label}-${new Date().valueOf()}.pdf`,
        content: pdfBuffer,
    };
};
