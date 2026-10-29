const { renderPdf } = require('./puppeteerPool');
const { paymentReceiptTemplate } = require('./invoiceTemplate');
const { generatePekoReceiptId } = require('./generatePekoInvoiceId');
const { formattedDateOnly } = require('./formatter');
const { customLog } = require('./loggerHelper');

// Legacy bare-receipt generator kept for vendor-connected flows (WhatsApp, softwares,
// business emails, hike, domain & hosting, company incorporation). Renders with the
// NEW paymentReceiptTemplate, mapped from the payload callers already send:
// { paymentDate, paymentMode, referenceNumber, billTo, paidAmount }.
exports.generatePekoReceipt = async (data) => {
    try {
        // Same numbering series as the new invoice/receipt system.
        const receiptNo = await generatePekoReceiptId();
        const amount = Number(data?.paidAmount);
        const html = paymentReceiptTemplate({
            receiptNo,
            paymentDateTime: formattedDateOnly(data?.paymentDate),
            paymentMode: data?.paymentMode,
            customerName: data?.billTo,
            orderNumber: data?.referenceNumber,
            paymentType: data?.paymentType,
            itemServicePrice: data?.itemServicePrice,
            platformFee: data?.platformFee,
            paidAmount: Number.isFinite(amount) ? amount.toFixed(2) : data?.paidAmount,
        });
        const content = await renderPdf(html, { printBackground: true });
        return {
            filename: `Receipt-${Date.now()}-${Math.random().toString(36).slice(2)}.pdf`,
            content,
        };
    } catch (error) {
        // Never attach a non-PDF as "Receipt.pdf" — it reaches the user as a corrupted file.
        // Return null so the email is sent without the receipt; the emailer drops falsy attachments.
        customLog(null, 'error', {
            message: 'generatePekoReceipt: render failed — skipping receipt attachment',
            scope: 'pdf-receipt',
            error: error?.message,
            stack: error?.stack,
        });
        return null;
    }
};
