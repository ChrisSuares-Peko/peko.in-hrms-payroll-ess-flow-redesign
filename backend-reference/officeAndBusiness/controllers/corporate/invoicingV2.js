const { createInvoice, findInvoice, findAllInvoicesAndCount, createManualPaymentRecord, findAllInvoicePayments, findAllManualPaymentsAndCount, findManualPaymentById, deleteManualPaymentRecord, findAllReceiptsAndCount, updateInvoice, updateCreditNoteStatus, fetchAllCustomersForInvoice, getInvoiceDashboard, getNextInvoiceNumber, getSalesOrderDashboard, getQuotationDashboard, getPaymentsDashboardOverview, getPaymentsDashboardTopCustomers, getPaymentsDashboardDueThisWeek, getPaymentsDashboardRecentActivity, findQuotationByToken, getSalesDashboard, getRecentTransactions: getSalesRecentTransactions, getNextCreditNoteNumber, getCreditNoteStats } = require("../../models/use-cases/invoicingV2");
const { findSettings: findInvoiceSettings } = require("../../models/use-cases/invoiceSettingsV2");
const { findTemplateForDownload } = require("../../models/use-cases/invoiceTemplete");
const { findDefaultBankAccount } = require("../../models/use-cases/bankDetails");
const { renderInvoiceTemplate } = require("../../utils/renderInvoiceTemplate");
const { createInvoiceCustomerV2, checkEmailExistV2, checkPhoneNumberExistV2 } = require("../../models/use-cases/invoiceCustomerV2");
const asyncHandler = require("../../middlewares/async");
const ErrorResponse = require("../../utils/error-response");
const { customLog } = require("../../utils/loggerHelper");
const fs = require("fs");
const puppeteer = require("puppeteer");

// Fix 3: reuse a single Puppeteer browser instance across requests
let _browser = null;
async function getBrowser() {
    if (!_browser) {
        _browser = await puppeteer.launch({ args: ["--no-sandbox", "--disable-setuid-sandbox"], headless: "new" });
        _browser.on("disconnected", () => { _browser = null; });
    }
    return _browser;
}
const { completeRemindersByInvoice } = require("../../models/use-cases/invoiceGuideline");
const { invoicingV2Template } = require("../../utils/invoicingV2Templete");
const { creditNoteTemplate } = require("../../utils/creditNoteTemplate");
const { sendEmailWithCorporateName } = require("../../utils/emailer");
const { resolveInvoiceEmailTemplate } = require("../../utils/emailTemplates/invoicingV2");
const { v4: uuidv4 } = require("uuid");
const { resolveQuotationEmailTemplate } = require("../../utils/emailTemplates/documentEmailTemplate");
const { paymentReceiptPdfTemplate, resolvePaymentReceiptEmailTemplate } = require("../../utils/emailTemplates/paymentReceiptTemplate");
const { fetchPartnerDetails } = require("../../models/use-cases/systemUser");
const { partnerLogos } = require("../../utils/partnerLogos");

exports.getNextInvoiceNumber = asyncHandler(async (req, res, next) => {
    try {
        const corporateUserId = req.user.corporateId;
        const nextNumber = await getNextInvoiceNumber(corporateUserId);
        return res.status(200).json({
            status: true,
            data: { nextNumber },
            message: "Next invoice number fetched successfully",
            responseCode: "000",
        });
    } catch (error) {
        customLog(req?.LogTraceId, "error", { message: error?.message });
        next(new ErrorResponse(error.message, 500));
    }
});

// GET /invoicing/v2/dashboard
// Returns total invoices, total paid and total due amount
exports.getInvoiceDashboard = asyncHandler(async (req, res, next) => {
    try {
        const corporateUserId = req.user.corporateId;

        const dashboard = await getInvoiceDashboard(corporateUserId);

        return res.status(200).json({
            status: true,
            data: dashboard,
            message: "Invoice dashboard fetched successfully",
            responseCode: "000",
        });
    } catch (error) {
        customLog(req?.LogTraceId, "error", { message: error?.message });
        next(new ErrorResponse(error.message, 500));
    }
});

exports.findAllInvoicesAndCount = asyncHandler(async (req, res, next) => {
    try {
        let { from, to, searchText, page, itemsPerPage, status, sortField, documentType, customerId, invoiceType, hasEInvoice, linkedInvoiceId } = req.query;
        let userId = req.user.corporateId;
        const sort = req.query.sort && req.query.sort === "ASC" ? "ASC" : "DESC";

        // Parse page and itemsPerPage to integers (you can also use parseInt)
        page = page ? parseInt(page) : 1;
        itemsPerPage = itemsPerPage ? parseInt(itemsPerPage) : null;
        let limit = itemsPerPage;

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
            sortField: sortField || 'id',
            userId,
            status: status ? status.split(',').map(s => s.trim().toUpperCase()) : null,
            documentType: documentType ? documentType.toUpperCase() : 'INVOICE',
            customerId: customerId ? parseInt(customerId) : null,
            invoiceType: invoiceType ? invoiceType.toUpperCase() : null,
            hasEInvoice,
            linkedInvoiceId: linkedInvoiceId ? parseInt(linkedInvoiceId) : null,
        };

        if (req.user.role === "CORPORATE_SUB_USER" && req.user.subCorporateId) {
            params.subCorporateUserId = req.user.subCorporateId;
        }

        const invoiceData = await findAllInvoicesAndCount(params);
        customLog(req?.LogTraceId, "info", { message: "params in invoicingV2", params });

        if (!invoiceData) {
            return next(new ErrorResponse("Something went wrong while getting all invoices from database", 400));
        }

        return res.status(200).json({
            status: true,
            data: {
                invoiceData: invoiceData ? invoiceData.rows : [],
                recordsTotal: invoiceData ? invoiceData.count : 0,
            },
            message: "All invoices fetched successfully",
            responseCode: "000",
        });
    } catch (error) {
        customLog(req?.LogTraceId, "error", { message: error?.message, data: error?.response?.data });
        next(new ErrorResponse(error.message, 500));
    }
});

exports.downloadInvoice = asyncHandler(async (req, res) => {
    try {
        const { invoiceId } = req.params;

        if (!invoiceId) {
            return res.status(400).json({
                status: false,
                message: "Invoice ID not provided",
                data: {},
                responseCode: "001",
            });
        }

        const params = { id: invoiceId, corporateUserId: req.user.corporateId };
        if (req.user.role === "CORPORATE_SUB_USER" && req.user.subCorporateId) {
            params.subCorporateUserId = req.user.subCorporateId;
        }
        const result = await findInvoice(params);

        if (!result) {
            return res.status(500).json({
                status: false,
                message: "Invoice details not found.",
                data: {},
                responseCode: "001",
            });
        }

        // Fetch invoice settings for signature, and the corporate's default (primary) bank
        // account for the Bank Details section — everything else on `biller` comes from corporateUser
        const settings = await findInvoiceSettings(result.corporateUserId);
        const cu = result.corporateUser || {};
        // bankdetails.credentialId is the login/auth id (credentials.id), NOT corporateUsers.id —
        // corporateUser.belongsTo(credential) is what exposes that id here as cu.credentialId.
        const bankAccount = await findDefaultBankAccount({ id: cu.credentialId });
        result.biller = {
            name:               cu.companyName || cu.name  || '',
            address:            cu.poBox       || '',
            city:               cu.city        || '',
            state:              cu.state       || '',
            phoneNumber:        cu.mobileNo    || '',
            email:              cu.email       || '',
            gstNumber:          cu.gstNumber   || '',
            logo:               cu.logo        || null,
            signatureUrl:       settings?.signatureUrl || null,
            accountHolderName:  bankAccount?.accountHolderName || '',
            bankName:           bankAccount?.bankName || '',
            accountNumber:      bankAccount?.accountNumber || '',
            ifscCode:           bankAccount?.ifscCode || '',
        };

        const templateSettings = settings?.templateSettings
            ? (typeof settings.templateSettings === "string"
                ? JSON.parse(settings.templateSettings)
                : settings.templateSettings)
            : null;

        let invoiceHtmlWithStyle;
        if (templateSettings?.templateId) {
            const template = await findTemplateForDownload(templateSettings.templateId);
            if (template?.body) {
                invoiceHtmlWithStyle = renderInvoiceTemplate(template.body, result);
            }
        }
        if (!invoiceHtmlWithStyle) {
            invoiceHtmlWithStyle = invoicingV2Template(result);
        }

        const random = new Date().valueOf();

        const browser = await puppeteer.launch({
            args: ["--no-sandbox", "--disable-setuid-sandbox"],
            headless: "new",
        });
        const page = await browser.newPage();
        await page.setContent(invoiceHtmlWithStyle);

        const outputFile = `Invoice-${random}.pdf`;
        await page.pdf({
            path: outputFile,
            format: "A4",
            preferCSSPageSize: true,
        });

        customLog(req?.LogTraceId, "info", { message: "PDF generated successfully!" });

        const pdfBuffer = fs.readFileSync(outputFile);
        browser.close();
        fs.unlinkSync(outputFile);

        // FOR TESTING - view PDF directly in Postman
        // res.setHeader("Content-Type", "application/pdf");
        // res.setHeader("Content-Disposition", `inline; filename="Invoice-${result.invoiceNumber}.pdf"`);
        // return res.send(pdfBuffer);

        return res.status(200).json({
            status: true,
            message: "PDF generated successfully.",
            data: { pdfBuffer },
            responseCode: "000",
        });
    } catch (error) {
        customLog(req?.LogTraceId, "error", { message: error?.message, data: error?.response?.data });
        return res.status(500).json({
            status: false,
            message: "Error generating PDF",
            data: {},
            responseCode: "001",
        });
    }
});

exports.downloadCreditNote = asyncHandler(async (req, res) => {
    try {
        const { invoiceId } = req.params;

        if (!invoiceId) {
            return res.status(400).json({ status: false, message: "Credit note ID not provided", data: {}, responseCode: "001" });
        }

        const params = { id: invoiceId, corporateUserId: req.user.corporateId };
        if (req.user.role === "CORPORATE_SUB_USER" && req.user.subCorporateId) {
            params.subCorporateUserId = req.user.subCorporateId;
        }
        const result = await findInvoice(params);

        if (!result || result.documentType !== 'CREDIT_NOTE') {
            return res.status(404).json({ status: false, message: "Credit note not found.", data: {}, responseCode: "001" });
        }

        const cu = result.corporateUser || {};
        const biller = {
            name: cu.companyName || cu.name || '',
            phoneNumber: cu.mobileNo || '',
            email: cu.email || '',
            gstNumber: cu.gstNumber || '',
            logo: cu.logo || null,
        };

        // creditNoteDetails may be a JSON string when raw:true
        const cnDetails = typeof result.creditNoteDetails === 'string'
            ? JSON.parse(result.creditNoteDetails)
            : (result.creditNoteDetails || {});

        // Fetch linked invoice date/due date for the DETAILS column
        let linkedInvoiceDate = '';
        let linkedInvoiceDueDate = '';
        const linkedId = cnDetails.linkedInvoiceId || result.linkedInvoiceId;
        if (linkedId) {
            const linked = await findInvoice({ id: linkedId, corporateUserId: req.user.corporateId });
            if (linked) {
                linkedInvoiceDate = linked.invoiceDate || '';
                linkedInvoiceDueDate = linked.dueDate || '';
            }
        }

        const html = creditNoteTemplate({ ...result, biller, creditNoteDetails: cnDetails, linkedInvoiceDate, linkedInvoiceDueDate });

        const random = new Date().valueOf();
        const browser = await puppeteer.launch({ args: ["--no-sandbox", "--disable-setuid-sandbox"], headless: "new" });
        const page = await browser.newPage();
        await page.setContent(html, { waitUntil: 'networkidle0' });

        const outputFile = `CreditNote-${random}.pdf`;
        await page.pdf({ path: outputFile, format: "A4", preferCSSPageSize: true });

        browser.close();
        const pdfBuffer = fs.readFileSync(outputFile);
        fs.unlinkSync(outputFile);

        return res.status(200).json({
            status: true,
            message: "Credit note PDF generated successfully.",
            data: { pdfBuffer },
            responseCode: "000",
        });
    } catch (error) {
        customLog(req?.LogTraceId, "error", { message: error?.message, data: error?.response?.data });
        return res.status(500).json({ status: false, message: "Error generating credit note PDF", data: {}, responseCode: "001" });
    }
});

exports.createInvoice = asyncHandler(async (req, res, next) => {
    try {
        const data = {
            ...req.body,
            corporateUserId: req.user.corporateId,
            shippingCost: req.body.shippingCost === '' ? null : req.body.shippingCost,
            amountPaid: req.body.amountPaid === '' ? null : req.body.amountPaid,
        }

        // Cash sale: no customer on record. name/address/city/state/pincode/country/
        // phoneNumber may be absent entirely — never assume any of them exist below.
        data.cashSale = req.body?.isCashSale === true;
        delete data.isCashSale;

        // Exchange rate only applies to foreign-currency invoices; INR is always 1:1.
        if (!data.currency || data.currency === 'INR') {
            data.conversionRate = 1;
        }

        if (!Array.isArray(req.body.items) || req.body.items.length === 0) {
            return next(new ErrorResponse("At least one item is required", 400));
        }

        const isCreditNote = data.documentType === 'CREDIT_NOTE';
        const fromQuotationId = req.body.fromQuotationId;
        let linkedInvoice;

        // Block re-conversion of an already converted quotation
        if (fromQuotationId && (!data.documentType || data.documentType === 'INVOICE')) {
            const sourceQuotation = await findInvoice({ id: fromQuotationId, corporateUserId: data.corporateUserId });
            if (!sourceQuotation) return next(new ErrorResponse("Source quotation not found", 404));
            if (sourceQuotation.status === 'CONVERTED') {
                return next(new ErrorResponse("This quotation has already been converted to an invoice", 400));
            }
        }

        // Credit note specific validation — multiple credit notes are allowed against one
        // invoice, as long as no single line item is credited past its originally-invoiced
        // quantity (matched by itemId) and shipping isn't credited past its original amount.
        if (isCreditNote) {
            linkedInvoice = await findInvoice({ id: data.linkedInvoiceId, corporateUserId: data.corporateUserId, documentType: 'INVOICE' });
            if (!linkedInvoice) return next(new ErrorResponse("Linked invoice not found", 404));

            const linkedItemsById = {};
            for (const item of linkedInvoice.items || []) {
                if (item.itemId) linkedItemsById[item.itemId] = item;
            }

            const existingCreditNotes = await findAllInvoicesAndCount({
                userId: data.corporateUserId,
                documentType: 'CREDIT_NOTE',
                linkedInvoiceId: linkedInvoice.id,
            });

            const creditedQtyByItemId = {};
            let alreadyCreditedShipping = 0;
            for (const creditNote of existingCreditNotes?.rows || []) {
                for (const item of creditNote.items || []) {
                    if (!item.itemId) continue;
                    creditedQtyByItemId[item.itemId] = (creditedQtyByItemId[item.itemId] || 0) + (parseFloat(item.quantity) || 0);
                }
                alreadyCreditedShipping += parseFloat(creditNote.shippingCost) || 0;
            }

            for (const requestedItem of data.items || []) {
                const linkedItem = requestedItem.itemId ? linkedItemsById[requestedItem.itemId] : null;
                if (!linkedItem) {
                    return next(new ErrorResponse(`Item "${requestedItem.name}" was not found on the original invoice`, 400));
                }

                const originalQuantity = parseFloat(linkedItem.quantity) || 0;
                const alreadyCreditedQuantity = creditedQtyByItemId[requestedItem.itemId] || 0;
                const availableQuantity = originalQuantity - alreadyCreditedQuantity;
                const requestedQuantity = parseFloat(requestedItem.quantity) || 0;
                if (requestedQuantity > availableQuantity) {
                    return next(new ErrorResponse(`Requested quantity for "${requestedItem.name}" (${requestedQuantity}) exceeds the available creditable quantity (${availableQuantity})`, 400));
                }

                // linkedItem.unitPrice may be INR-converted (foreign-currency invoice) —
                // compare against the as-entered figure instead.
                const linkedUnitPrice = linkedItem.originalUnitPrice ?? linkedItem.unitPrice;
                if (parseFloat(requestedItem.unitPrice) !== parseFloat(linkedUnitPrice)) {
                    return next(new ErrorResponse(`Price for "${requestedItem.name}" does not match the original invoice`, 400));
                }
            }

            const originalShipping = parseFloat(linkedInvoice.shippingCost) || 0;
            const availableShipping = originalShipping - alreadyCreditedShipping;
            const requestedShipping = parseFloat(data.shippingCost) || 0;
            if (requestedShipping > availableShipping) {
                return next(new ErrorResponse(`Requested shipping cost (${requestedShipping}) exceeds the available creditable shipping cost (${availableShipping})`, 400));
            }

            // Type, currency, and exchange rate are never independently settable on a credit
            // note — always inherited from the linked invoice, ignoring whatever the request sent.
            data.invoiceType = linkedInvoice.invoiceType;
            data.currency = linkedInvoice.currency;
            data.conversionRate = linkedInvoice.conversionRate;
            data.taxType = linkedInvoice.taxType;
            data.creditNoteDetails = {
                reason: data.reason,
                additionalDetails: data.additionalDetails || '',
                linkedInvoiceNumber: linkedInvoice.invoiceNumber,
                linkedInvoicePrefix: linkedInvoice.prefix || '',
            };
            data._linkedInvoiceId = linkedInvoice.id;
        }

        const invoiceExists = await findInvoice({
            invoiceNumber: data.invoiceNumber,
            corporateUserId: data.corporateUserId,
            documentType: data.documentType || 'INVOICE',
        });

        let invoiceNumberUpdated = false;
        if (invoiceExists) {
            if (isCreditNote) {
                data.invoiceNumber = await getNextCreditNoteNumber(data.corporateUserId);
            } else if (!data.autoUpdateDocumentNumber) {
                return next(new ErrorResponse("Invoice number already exists", 400));
            } else {
                data.invoiceNumber = await getNextInvoiceNumber(data.corporateUserId);
                invoiceNumberUpdated = true;
            }
        }

        if (!isCreditNote && data.dueDate && new Date(data.dueDate) < new Date(data.invoiceDate)) {
            return next(new ErrorResponse("Due date cannot be before invoice date", 400));
        }

        let subtotal = 0, discountTotal = 0, taxTotal = 0;
        for (const item of data.items) {
            const gross    = parseFloat(item.quantity || 0) * parseFloat(item.unitPrice || 0);
            // taxRate is 'EXPORT_0'/'EXEMPTED' on an international item — not a number,
            // so parseFloat(...) itself is NaN; `|| 0` must guard the parse result, not
            // the raw string (a truthy non-numeric string short-circuits `||` before parsing).
            const taxRate  = parseFloat(item.taxRate) || 0;
            const discount = parseFloat(item.discount || 0);

            if (item.taxMode === 'Inclusive') {
                const base         = taxRate > 0 ? gross / (1 + taxRate / 100) : gross;
                const afterDiscount = gross * (1 - discount / 100);
                const baseAfterDisc = taxRate > 0 ? afterDiscount / (1 + taxRate / 100) : afterDiscount;
                subtotal      += base;
                discountTotal += base * (discount / 100);
                taxTotal      += afterDiscount - baseAfterDisc;
            } else {
                subtotal      += gross;
                discountTotal += gross * (discount / 100);
                taxTotal      += gross * (1 - discount / 100) * (taxRate / 100);
            }
        }
        const shipping = parseFloat(data.shippingCost || 0);
        const paid     = parseFloat(data.amountPaid   || 0);

        data.subtotal    = parseFloat(subtotal.toFixed(2));
        data.discount    = parseFloat(discountTotal.toFixed(2));
        data.tax         = parseFloat(taxTotal.toFixed(2));
        data.totalAmount = parseFloat((subtotal - discountTotal + taxTotal + shipping).toFixed(2));
        data.amountDue   = Math.max(parseFloat((data.totalAmount - paid).toFixed(2)), 0);

        // Multi-currency: recompute to an INR-equivalent for internal stats/dashboards/
        // aging, so invoices in different currencies stay comparable. The as-entered
        // figures are preserved in original* — PDF/email/UI must always show those,
        // never the converted numbers or the rate itself. Matches Peko-AE's toAed().
        let paidForPaymentRecord = paid;
        const conversionRate = parseFloat(data.conversionRate) || 1;
        if (data.currency && data.currency !== 'INR' && conversionRate !== 1) {
            const toInr = (value) => +(parseFloat(value || 0) * conversionRate).toFixed(2);

            data.items = data.items.map((item) => ({
                ...item,
                originalUnitPrice: item.unitPrice,
                originalNetAmount: item.netAmount,
                unitPrice: String(toInr(item.unitPrice)),
                netAmount: String(toInr(item.netAmount)),
            }));

            data.originalSubtotal    = data.subtotal;
            data.originalDiscount    = data.discount;
            data.originalTax         = data.tax;
            data.originalTotalAmount = data.totalAmount;
            data.originalAmountDue   = data.amountDue;
            data.originalAmountPaid  = paid;

            data.subtotal    = toInr(data.subtotal);
            data.discount    = toInr(data.discount);
            data.tax         = toInr(data.tax);
            data.totalAmount = toInr(data.totalAmount);
            data.amountDue   = toInr(data.amountDue);
            data.amountPaid  = toInr(paid);
            paidForPaymentRecord = data.amountPaid;
        }

        if (paid > 0 && data.amountDue === 0 && (!data.documentType || data.documentType === 'INVOICE')) {
            data.status = "PAID";
        } else if (paid > 0 && data.amountDue > 0 && (!data.documentType || data.documentType === 'INVOICE')) {
            data.status = "PARTIAL";
        }

        if (req.user.role === "CORPORATE_SUB_USER" && req.user.subCorporateId) {
            data.subCorporateUserId = req.user.subCorporateId;
        }

        if (data.saveCustomer && data.email) {
            const emailAlreadyExists = await checkEmailExistV2(data.email, data.corporateUserId);
            if (emailAlreadyExists) {
                return next(new ErrorResponse("Customer with this email already exists", 403));
            }
        }

        if (data.saveCustomer && data.phoneNumber) {
            const phoneAlreadyExists = await checkPhoneNumberExistV2(data.phoneNumber, data.corporateUserId);
            if (phoneAlreadyExists) {
                return next(new ErrorResponse("This phone number is already associated with a customer", 403));
            }
        }

        const result = await createInvoice(data);

        if (!result) {
            return next(new ErrorResponse("Something went wrong while creating invoice", 500));
        }

        // If the invoice was created with an amount already marked as paid, record it as a
        // manual payment too — otherwise the invoice shows "Amount Paid" but the Payments
        // history table underneath (which reads from manualPayment, not the invoice's own
        // amountPaid column) would show nothing for it.
        if (paid > 0 && (!data.documentType || data.documentType === 'INVOICE')) {
            const paymentRecord = await createManualPaymentRecord({
                invoiceId: result.id,
                corporateUserId: data.corporateUserId,
                amount: paidForPaymentRecord,
                originalAmount: paidForPaymentRecord !== paid ? paid : null,
                paymentMethod: data.paymentMode,
                paymentDate: data.invoiceDate,
                referenceId: null,
                notes: null,
            });
            if (paymentRecord) {
                await paymentRecord.update({ receiptNo: `RC-${result.invoiceNumber}-${paymentRecord.id}` });
            }
        }

        // After creating a credit note, mark original invoice so no duplicate can be created,
        // and reduce its remaining due amount by the credit note's value. If that brings the
        // due amount to 0, flip status to PAID (the credit note has fully settled it). Whether
        // any of that credit still needs to be physically refunded to the customer is tracked
        // on the credit note itself (its own PENDING/REFUNDED status), not on the invoice.
        if (isCreditNote && data._linkedInvoiceId) {
            const newAmountDue = Math.max(0, parseFloat((Number(linkedInvoice.amountDue) - data.totalAmount).toFixed(2)));

            const invoiceUpdate = { isCreditNoteCreated: true, amountDue: newAmountDue };
            if (newAmountDue === 0) {
                invoiceUpdate.status = "PAID";
            }
            await updateInvoice(
                { id: data._linkedInvoiceId, corporateUserId: data.corporateUserId },
                invoiceUpdate
            );
        }

        // After converting a quotation to invoice, mark the quotation as CONVERTED
        if (fromQuotationId && (!data.documentType || data.documentType === 'INVOICE')) {
            await updateInvoice({ id: fromQuotationId, corporateUserId: data.corporateUserId }, { status: 'CONVERTED' });
        }

        if (data.email && (!data.documentType || data.documentType === 'INVOICE')) {
            try {
                const settings = await findInvoiceSettings(data.corporateUserId);
                const fullInvoice = await findInvoice({ id: result.id });
                const cu = fullInvoice?.corporateUser || {};
                // bankdetails.credentialId is the login/auth id, not corporateUsers.id — see note above.
                const bankAccount = await findDefaultBankAccount({ id: cu.credentialId });

                fullInvoice.biller = {
                    name:         cu.companyName || cu.name  || '',
                    address:      cu.poBox       || '',
                    city:         cu.city        || '',
                    state:        cu.state       || '',
                    phoneNumber:  cu.mobileNo    || '',
                    email:        cu.email       || '',
                    gstNumber:    cu.gstNumber   || '',
                    logo:         cu.logo        || null,
                    signatureUrl: settings?.signatureUrl || null,
                    accountHolderName: bankAccount?.accountHolderName || '',
                    bankName:          bankAccount?.bankName || '',
                    accountNumber:     bankAccount?.accountNumber || '',
                    ifscCode:          bankAccount?.ifscCode || '',
                };

                const creationTemplateSettings = settings?.templateSettings
                    ? (typeof settings.templateSettings === 'string'
                        ? JSON.parse(settings.templateSettings)
                        : settings.templateSettings)
                    : null;
                let invoiceHtml;
                if (creationTemplateSettings?.templateId) {
                    const tmpl = await findTemplateForDownload(creationTemplateSettings.templateId);
                    if (tmpl?.body) invoiceHtml = renderInvoiceTemplate(tmpl.body, fullInvoice);
                }
                if (!invoiceHtml) invoiceHtml = invoicingV2Template(fullInvoice);

                const browser = await puppeteer.launch({ args: ["--no-sandbox", "--disable-setuid-sandbox"], headless: "new" });
                const page = await browser.newPage();
                await page.setContent(invoiceHtml);
                const pdfBuffer = await page.pdf({ format: "A4", preferCSSPageSize: true });
                await browser.close();

                const corporateName = cu.companyName || cu.name || 'Peko';
                const invoiceLabel = data.prefix ? `${data.prefix}-${data.invoiceNumber}` : data.invoiceNumber;
                const partnerDetails = req.user?.registeredBy ? await fetchPartnerDetails(req.user.registeredBy) : await partnerLogos();
                const { subject: emailSubject, html: emailBody } = await resolveInvoiceEmailTemplate({
                    customerName:   data.name || (data.cashSale ? 'Cash Sale' : 'N/A'),
                    invoiceNumber:  invoiceLabel,
                    invoiceDate:    data.invoiceDate,
                    dueDate:        data.dueDate,
                    amountDue:      result.amountDue,
                    corporateName,
                    corporateEmail: cu.email       || '',
                    corporatePhone: cu.mobileNo    || '',
                    invoiceType:    data.invoiceType,
                    currency:       data.currency  || '',
                }, `Invoice #${invoiceLabel} from ${corporateName}`, req?.LogTraceId, req.user?.registeredBy || null, partnerDetails);

                const tempPdfPath = `Invoice-${uuidv4()}.pdf`;
                fs.writeFileSync(tempPdfPath, pdfBuffer);
                sendEmailWithCorporateName(
                    data.email,
                    emailSubject,
                    emailBody,
                    corporateName,
                    `Invoice-${invoiceLabel}.pdf`,
                    tempPdfPath,
                    () => { try { fs.unlinkSync(tempPdfPath); } catch (e) { customLog(req?.LogTraceId, "error", { message: "Failed to delete temp PDF", error: e?.message }); } }
                );
            } catch (emailErr) {
                customLog(req?.LogTraceId, "error", { message: "Failed to send invoice email", error: emailErr?.message });
            }
        }

        if (data.saveCustomer) {
            await createInvoiceCustomerV2({
                corporateUserId: data.corporateUserId,
                name: data.name,
                gstin: data.gstNumber || null,
                phoneNumber: data.phoneNumber,
                email: data.email || null,
                primaryAddress: data.address,
                primaryCity: data.city,
                primaryState: data.state,
                primaryPincode: data.pincode || null,
                primaryCountry: data.country || 'India',
            });
        }

        return res.status(200).json({
            status: true,
            message: isCreditNote
                ? "Credit note created successfully"
                : invoiceNumberUpdated
                    ? `Invoice number was already in use. Invoice generated successfully with updated number ${data.invoiceNumber}`
                    : "Invoice generated successfully",
            data: { id: result.id },
            responseCode: "000",
        });
    } catch (error) {
        customLog(req?.LogTraceId, "error", { message: error?.message, data: error?.response?.data });
        next(new ErrorResponse(error.message, 400))
    }
});

exports.editInvoice = asyncHandler(async (req, res, next) => {
    try {
        const corporateUserId = req.user.corporateId;
        const { invoiceId } = req.params;

        const invoice = await findInvoice({ id: invoiceId, corporateUserId });

        if (!invoice) {
            return next(new ErrorResponse("Invoice not found", 404));
        }

        if (["PAID", "CANCELLED", "ACCEPTED", "COMPLETED"].includes(invoice.status)) {
            return next(new ErrorResponse(`Cannot edit a ${invoice.status.toLowerCase()} invoice`, 400));
        }

        // Check invoice number uniqueness (exclude current invoice)
        if (req.body.invoiceNumber && req.body.invoiceNumber !== invoice.invoiceNumber) {
            const invoiceExists = await findInvoice({ invoiceNumber: req.body.invoiceNumber, corporateUserId });
            if (invoiceExists) {
                return next(new ErrorResponse("Invoice number already exists", 400));
            }
        }

        if (new Date(req.body.dueDate) < new Date(req.body.invoiceDate)) {
            return next(new ErrorResponse("Due date cannot be before invoice date", 400));
        }

        // Exclude id from update to prevent primary key modification
        const { id, ...updateData } = req.body; // eslint-disable-line no-unused-vars

        updateData.cashSale = req.body?.isCashSale === true;
        delete updateData.isCashSale;

        // Exchange rate only applies to foreign-currency invoices; INR is always 1:1.
        if (!updateData.currency || updateData.currency === 'INR') {
            updateData.conversionRate = 1;
        }

        if (updateData.shippingCost === '') updateData.shippingCost = null;
        if (updateData.amountPaid === '') updateData.amountPaid = null;

        const items = Array.isArray(updateData.items) ? updateData.items : [];
        let subtotal = 0, discountTotal = 0, taxTotal = 0;
        for (const item of items) {
            const gross    = parseFloat(item.quantity || 0) * parseFloat(item.unitPrice || 0);
            // taxRate is 'EXPORT_0'/'EXEMPTED' on an international item — see note in createInvoice.
            const taxRate  = parseFloat(item.taxRate) || 0;
            const discount = parseFloat(item.discount || 0);

            if (item.taxMode === 'Inclusive') {
                const base          = taxRate > 0 ? gross / (1 + taxRate / 100) : gross;
                const afterDiscount = gross * (1 - discount / 100);
                const baseAfterDisc = taxRate > 0 ? afterDiscount / (1 + taxRate / 100) : afterDiscount;
                subtotal      += base;
                discountTotal += base * (discount / 100);
                taxTotal      += afterDiscount - baseAfterDisc;
            } else {
                subtotal      += gross;
                discountTotal += gross * (discount / 100);
                taxTotal      += gross * (1 - discount / 100) * (taxRate / 100);
            }
        }
        const shipping  = parseFloat(updateData.shippingCost || 0);
        const paid      = parseFloat(updateData.amountPaid || 0);

        updateData.subtotal    = parseFloat(subtotal.toFixed(2));
        updateData.discount    = parseFloat(discountTotal.toFixed(2));
        updateData.tax         = parseFloat(taxTotal.toFixed(2));
        updateData.totalAmount = parseFloat((subtotal - discountTotal + taxTotal + shipping).toFixed(2));

        // Any credit notes already issued against this invoice must keep reducing amountDue —
        // otherwise re-deriving it as totalAmount - paid on every edit silently erases them.
        const creditNotesResult = await findAllInvoicesAndCount({
            userId: corporateUserId,
            documentType: 'CREDIT_NOTE',
            linkedInvoiceId: invoiceId,
        });
        const creditedTotal = (creditNotesResult?.rows || []).reduce(
            (sum, cn) => sum + (parseFloat(cn.totalAmount) || 0),
            0
        );

        // Multi-currency: linked credit notes' totalAmount is stored INR-equivalent (they
        // inherit this invoice's own rate) — convert back to this invoice's currency so the
        // subtraction below is apples-to-apples with the as-entered totalAmount.
        const editConversionRate = parseFloat(updateData.conversionRate) || 1;
        const isForeignCurrency = !!updateData.currency && updateData.currency !== 'INR' && editConversionRate !== 1;
        const creditedTotalOriginal = isForeignCurrency ? creditedTotal / editConversionRate : creditedTotal;

        let amountDue = Math.max(parseFloat((updateData.totalAmount - creditedTotalOriginal - paid).toFixed(2)), 0);

        // Same INR-equivalent recompute as createInvoice — original* preserves the
        // as-entered figures for display.
        if (isForeignCurrency) {
            const toInr = (value) => +(parseFloat(value || 0) * editConversionRate).toFixed(2);

            updateData.items = items.map((item) => ({
                ...item,
                originalUnitPrice: item.unitPrice,
                originalNetAmount: item.netAmount,
                unitPrice: String(toInr(item.unitPrice)),
                netAmount: String(toInr(item.netAmount)),
            }));

            updateData.originalSubtotal    = updateData.subtotal;
            updateData.originalDiscount    = updateData.discount;
            updateData.originalTax         = updateData.tax;
            updateData.originalTotalAmount = updateData.totalAmount;
            updateData.originalAmountDue   = amountDue;
            updateData.originalAmountPaid  = paid;

            updateData.subtotal    = toInr(updateData.subtotal);
            updateData.discount    = toInr(updateData.discount);
            updateData.tax         = toInr(updateData.tax);
            updateData.totalAmount = toInr(updateData.totalAmount);
            updateData.amountPaid  = toInr(paid);
            amountDue = toInr(amountDue);
        }

        if (paid > 0 && amountDue === 0 && (!invoice.documentType || invoice.documentType === 'INVOICE')) {
            updateData.status = "PAID";
        } else if (paid > 0 && amountDue > 0 && (!invoice.documentType || invoice.documentType === 'INVOICE')) {
            updateData.status = "PARTIAL";
        }

        const updated = await updateInvoice(
            { id: invoiceId, corporateUserId },
            { ...updateData, amountDue }
        );

        if (!updated) {
            return next(new ErrorResponse("Something went wrong while updating invoice", 500));
        }

        if (updateData.status === "PAID") await completeRemindersByInvoice(invoiceId);

        customLog(req?.LogTraceId, "info", { message: "Invoice updated", invoiceId });

        return res.status(200).json({
            status: true,
            message: "Invoice updated successfully",
            data: {},
            responseCode: "000",
        });
    } catch (error) {
        customLog(req?.LogTraceId, "error", { message: error?.message, data: error?.response?.data });
        next(new ErrorResponse(error.message, 500));
    }
});

exports.deleteInvoice = asyncHandler(async (req, res, next) => {
    try {
        const corporateUserId = req.user.corporateId;
        const { invoiceId } = req.params;

        const invoice = await findInvoice({ id: invoiceId, corporateUserId });

        if (!invoice) {
            return next(new ErrorResponse("Invoice not found", 404));
        }

        if (invoice.status === "PAID") {
            return next(new ErrorResponse("Cannot delete a paid invoice", 400));
        }

         if (invoice.status === "ACCEPTED") {
            return next(new ErrorResponse("Cannot delete a accepted quotation", 400));
        }

         if (invoice.status === "COMPLETED") {
            return next(new ErrorResponse("Cannot delete a completed sales order", 400));
        }

        await updateInvoice(
            { id: invoiceId, corporateUserId },
            { status: "CANCELLED" }
        );

        customLog(req?.LogTraceId, "info", { message: "Invoice deleted", invoiceId });

        return res.status(200).json({
            status: true,
            message: "Invoice deleted successfully",
            data: {},
            responseCode: "000",
        });
    } catch (error) {
        customLog(req?.LogTraceId, "error", { message: error?.message, data: error?.response?.data });
        next(new ErrorResponse(error.message, 500));
    }
});

exports.getInvoiceById = asyncHandler(async (req, res, next) => {
    try {
        const corporateUserId = req.user.corporateId;
        const { invoiceId } = req.params;

        const invoice = await findInvoice({ id: invoiceId, corporateUserId });

        if (!invoice) {
            return next(new ErrorResponse("Invoice not found", 404));
        }

        // Build rendered HTML for preview
        const settings = await findInvoiceSettings(invoice.corporateUserId);
        const cu = invoice.corporateUser || {};
        // bankdetails.credentialId is the login/auth id, not corporateUsers.id — see note above.
        const bankAccount = await findDefaultBankAccount({ id: cu.credentialId });
        invoice.biller = {
            name:              cu.companyName || cu.name || '',
            address:           cu.poBox       || '',
            city:              cu.city        || '',
            state:             cu.state       || '',
            phoneNumber:       cu.mobileNo    || '',
            email:             cu.email       || '',
            gstNumber:         cu.gstNumber   || '',
            logo:              cu.logo        || null,
            signatureUrl:      settings?.signatureUrl || null,
            accountHolderName: bankAccount?.accountHolderName || '',
            bankName:          bankAccount?.bankName || '',
            accountNumber:     bankAccount?.accountNumber || '',
            ifscCode:          bankAccount?.ifscCode || '',
        };

        const templateSettings = settings?.templateSettings
            ? (typeof settings.templateSettings === "string"
                ? JSON.parse(settings.templateSettings)
                : settings.templateSettings)
            : null;

        let invoiceHtml;
        if (templateSettings?.templateId) {
            const template = await findTemplateForDownload(templateSettings.templateId);
            if (template?.body) {
                invoiceHtml = renderInvoiceTemplate(template.body, invoice);
            }
        }
        if (!invoiceHtml) {
            invoiceHtml = invoicingV2Template(invoice);
        }

        const invoiceData = invoice.toJSON ? invoice.toJSON() : { ...invoice };

        return res.status(200).json({
            status: true,
            message: "Invoice fetched successfully",
            data: { ...invoiceData, invoiceHtml },
            responseCode: "000",
        });
    } catch (error) {
        customLog(req?.LogTraceId, "error", { message: error?.message, data: error?.response?.data });
        next(new ErrorResponse(error.message, 500));
    }
});

exports.recordManualPayment = asyncHandler(async (req, res, next) => {
    try {
        const corporateUserId = req.user.corporateId
        const { invoiceId } = req.params
        const { amount, paymentMethod, paymentDate, referenceId, notes } = req.body

        const invoice = await findInvoice({ id: invoiceId, corporateUserId, documentType: 'INVOICE' })

        if (!invoice) {
            return next(new ErrorResponse("Invoice not found", 404))
        }

        if (invoice.status === "PAID") {
            return next(new ErrorResponse("Invoice already paid", 400))
        }

        // `amount` is entered in the invoice's own currency (matches the Amount Due the
        // user sees) — convert to an INR-equivalent for the canonical fields, same as at
        // invoice creation, keeping the as-entered figure in original*.
        const conversionRate = invoice.currency && invoice.currency !== 'INR'
            ? parseFloat(invoice.conversionRate) || 1
            : 1;
        const toInr = (value) => +(parseFloat(value || 0) * conversionRate).toFixed(2);

        const originalPaid = Number(amount)
        const currentOriginalAmountDue = Number(invoice.originalAmountDue ?? invoice.amountDue)

        if (!originalPaid || originalPaid <= 0) {
            return next(new ErrorResponse("Invalid amount", 400))
        }

        if (originalPaid > currentOriginalAmountDue) {
            return next(new ErrorResponse(`Amount cannot exceed the due amount of ${currentOriginalAmountDue}`, 400))
        }

        const paid = toInr(originalPaid)
        const currentAmountDue = Number(invoice.amountDue)

        const newAmountPaid = Number(invoice.amountPaid || 0) + paid
        const newAmountDue = Math.max(0, currentAmountDue - paid)
        const newOriginalAmountPaid = conversionRate !== 1
            ? Number(invoice.originalAmountPaid || 0) + originalPaid
            : null
        const newOriginalAmountDue = conversionRate !== 1
            ? Math.max(0, currentOriginalAmountDue - originalPaid)
            : null
        const newStatus = newAmountDue === 0 ? "PAID" : "PARTIAL"

        const paymentRecord = await createManualPaymentRecord({
            invoiceId: Number(invoiceId),
            corporateUserId,
            amount: paid,
            originalAmount: conversionRate !== 1 ? originalPaid : null,
            paymentMethod,
            paymentDate,
            referenceId: referenceId || null,
            notes: notes || null,
        })

        if (!paymentRecord) {
            return next(new ErrorResponse("Something went wrong while recording payment", 500))
        }

        // Generate receiptNo now that we have the auto-increment id
        const receiptNo = `RC-${invoice.invoiceNumber}-${paymentRecord.id}`
        await paymentRecord.update({ receiptNo })

        await updateInvoice(
            { id: invoiceId, corporateUserId },
            {
                amountPaid: newAmountPaid,
                amountDue: newAmountDue,
                ...(conversionRate !== 1 && {
                    originalAmountPaid: newOriginalAmountPaid,
                    originalAmountDue: newOriginalAmountDue,
                }),
                status: newStatus,
                paymentMode: paymentMethod || invoice.paymentMode,
                paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
                notes: notes ? `${invoice.notes || ""}\n${notes}` : invoice.notes,
            }
        )

        if (newStatus === "PAID") await completeRemindersByInvoice(invoiceId);

        customLog(req?.LogTraceId, "info", { message: "Manual payment recorded", invoiceId, amountPaid: paid, newStatus })

        return res.status(200).json({
            status: true,
            message: "Manual payment recorded successfully",
            data: {
                invoiceId: Number(invoiceId),
                amountPaid: conversionRate !== 1 ? newOriginalAmountPaid : newAmountPaid,
                amountDue: conversionRate !== 1 ? newOriginalAmountDue : newAmountDue,
                status: newStatus,
            },
            responseCode: "000",
        })

    } catch (error) {
        customLog(req?.LogTraceId, "error", { message: error?.message, data: error?.response?.data });
        next(new ErrorResponse(error.message, 500));
    }
})

exports.updateCreditNoteStatus = asyncHandler(async (req, res, next) => {
    try {
        const corporateUserId = req.user.corporateId
        const { invoiceId } = req.params
        const { status } = req.body

        const creditNote = await findInvoice({ id: invoiceId, corporateUserId, documentType: 'CREDIT_NOTE' })
        if (!creditNote) {
            return next(new ErrorResponse("Credit note not found", 404))
        }

        await updateCreditNoteStatus({ id: invoiceId, corporateUserId, status })

        customLog(req?.LogTraceId, "info", { message: "Credit note status updated", invoiceId, status })

        return res.status(200).json({
            status: true,
            message: "Credit note status updated successfully",
            data: { invoiceId: Number(invoiceId), status },
            responseCode: "000",
        })
    } catch (error) {
        customLog(req?.LogTraceId, "error", { message: error?.message, data: error?.response?.data });
        next(new ErrorResponse(error.message, 500));
    }
})

exports.getInvoicePayments = asyncHandler(async (req, res, next) => {
    try {
        const corporateUserId = req.user.corporateId
        const { invoiceId } = req.params

        const invoice = await findInvoice({ id: invoiceId, corporateUserId })
        if (!invoice) {
            return next(new ErrorResponse("Invoice not found", 404))
        }

        const payments = await findAllInvoicePayments(invoiceId)

        return res.status(200).json({
            status: true,
            data: payments,
            message: "Payments fetched successfully",
            responseCode: "000",
        })
    } catch (error) {
        customLog(req?.LogTraceId, "error", { message: error?.message });
        next(new ErrorResponse(error.message, 500));
    }
})

// Centralized "Payments Received" ledger: every payment across all invoices, with the
// date/mode/customer filters and the total received the page needs.
exports.getAllReceipts = asyncHandler(async (req, res, next) => {
    try {
        const userId = req.user.corporateId
        let { page, itemsPerPage, mode, customerName, from, to } = req.query
        const sort = req.query.sort && req.query.sort === "ASC" ? "ASC" : "DESC"

        page = page ? parseInt(page) : 1
        itemsPerPage = itemsPerPage ? parseInt(itemsPerPage) : 10
        const limit = itemsPerPage
        const offset = (page - 1) * itemsPerPage

        const { count, rows, totalReceived } = await findAllReceiptsAndCount({
            userId,
            mode,
            customerName,
            from,
            to,
            limit,
            offset,
            sort,
        })

        const receipts = rows.map(row => ({
            id: row.id,
            date: row.date,
            amount: row.originalAmount ?? row.amount,
            mode: row.mode,
            referenceId: row.referenceId,
            notes: row.notes,
            receiptNo: row.receiptNo,
            invoiceId: row.invoice?.id,
            prefix: row.invoice?.prefix,
            invoiceNumber: row.invoice?.invoiceNumber,
            currency: row.invoice?.currency,
            customerName: row.invoice?.name || (row.invoice?.cashSale ? 'Cash Sale' : 'N/A'),
            customerEmail: row.invoice?.email,
            customerPhone: row.invoice?.phoneNumber,
        }))

        return res.status(200).json({
            status: true,
            data: {
                receipts,
                recordsTotal: count,
                totalReceived,
            },
            message: "Receipts fetched successfully",
            responseCode: "000",
        })
    } catch (error) {
        customLog(req?.LogTraceId, "error", { message: error?.message });
        next(new ErrorResponse(error.message, 500));
    }
})

// Global (cross-invoice) manual payments listing, for the "Invoice Payments" tab.
exports.getAllManualPayments = asyncHandler(async (req, res, next) => {
    try {
        const userId = req.user.corporateId
        let { page, itemsPerPage, searchText, from, to, sortField } = req.query
        const sort = req.query.sort && req.query.sort === "ASC" ? "ASC" : "DESC"

        page = page ? parseInt(page) : 1
        itemsPerPage = itemsPerPage ? parseInt(itemsPerPage) : 10
        const limit = itemsPerPage
        const offset = (page - 1) * itemsPerPage

        const { count, rows } = await findAllManualPaymentsAndCount({
            userId,
            searchText,
            from,
            to,
            limit,
            offset,
            sort,
            sortField: sortField || 'paymentDate',
        })

        const payments = rows.map(row => ({
            paymentId: row.id,
            amount: row.originalAmount ?? row.amount,
            paymentMethod: row.paymentMethod,
            paymentDate: row.paymentDate,
            referenceId: row.referenceId,
            notes: row.notes,
            receiptNo: row.receiptNo,
            invoiceId: row.invoicing?.id,
            prefix: row.invoicing?.prefix,
            invoiceNumber: row.invoicing?.invoiceNumber,
            invoiceDate: row.invoicing?.invoiceDate,
            totalAmount: row.invoicing?.originalTotalAmount ?? row.invoicing?.totalAmount,
            currency: row.invoicing?.currency,
            customerName: row.invoicing?.name || (row.invoicing?.cashSale ? 'Cash Sale' : 'N/A'),
            customerEmail: row.invoicing?.email,
            customerPhone: row.invoicing?.phoneNumber,
        }))

        return res.status(200).json({
            status: true,
            data: { payments, recordsTotal: count },
            message: "Manual payments fetched successfully",
            responseCode: "000",
        })
    } catch (error) {
        customLog(req?.LogTraceId, "error", { message: error?.message });
        next(new ErrorResponse(error.message, 500));
    }
})

exports.deleteInvoicePayment = asyncHandler(async (req, res, next) => {
    try {
        const corporateUserId = req.user.corporateId
        const { invoiceId, paymentId } = req.params

        const invoice = await findInvoice({ id: invoiceId, corporateUserId })
        if (!invoice) {
            return next(new ErrorResponse("Invoice not found", 404))
        }

        const [affected] = await deleteManualPaymentRecord({ id: paymentId, invoiceId })
        if (!affected) {
            return next(new ErrorResponse("Payment record not found", 404))
        }

        // Recalculate amountPaid and amountDue from non-deleted payments only
        const allPayments = await findAllInvoicePayments(invoiceId)
        const totalPaid = allPayments
            .filter(p => !p.isDeleted)
            .reduce((sum, p) => sum + Number(p.amount), 0)

        // Any credit notes already issued against this invoice must keep reducing amountDue —
        // otherwise re-deriving it as totalAmount - totalPaid here silently erases them.
        const creditNotesResult = await findAllInvoicesAndCount({
            userId: corporateUserId,
            documentType: 'CREDIT_NOTE',
            linkedInvoiceId: invoiceId,
        })
        const creditedTotal = (creditNotesResult?.rows || []).reduce(
            (sum, cn) => sum + (parseFloat(cn.totalAmount) || 0),
            0
        )

        const newAmountDue = Math.max(0, Number(invoice.totalAmount) - creditedTotal - totalPaid)
        const newStatus = newAmountDue === 0 ? "PAID" : totalPaid === 0 ? "PENDING" : "PARTIAL"

        // Multi-currency: keep original* (as-entered figures, for display) in sync too.
        const deleteConversionRate = invoice.currency && invoice.currency !== 'INR'
            ? parseFloat(invoice.conversionRate) || 1
            : 1;
        const originalUpdate = deleteConversionRate !== 1 ? {
            originalAmountPaid: +(totalPaid / deleteConversionRate).toFixed(2),
            originalAmountDue: +(newAmountDue / deleteConversionRate).toFixed(2),
        } : {};

        await updateInvoice(
            { id: invoiceId, corporateUserId },
            { amountPaid: totalPaid, amountDue: newAmountDue, status: newStatus, ...originalUpdate }
        )

        customLog(req?.LogTraceId, "info", { message: "Manual payment deleted", invoiceId, paymentId })

        return res.status(200).json({
            status: true,
            message: "Payment deleted successfully",
            data: { invoiceId: Number(invoiceId), amountPaid: totalPaid, amountDue: newAmountDue, status: newStatus },
            responseCode: "000",
        })
    } catch (error) {
        customLog(req?.LogTraceId, "error", { message: error?.message });
        next(new ErrorResponse(error.message, 500));
    }
})

exports.getSalesOrderDashboard = asyncHandler(async (req, res, next) => {
    try {
        const corporateUserId = req.user.corporateId;
        const dashboard = await getSalesOrderDashboard(corporateUserId);
        return res.status(200).json({
            status: true,
            data: dashboard,
            message: "Sales order dashboard fetched successfully",
            responseCode: "000",
        });
    } catch (error) {
        customLog(req?.LogTraceId, "error", { message: error?.message });
        next(new ErrorResponse(error.message, 500));
    }
});

exports.getQuotationDashboard = asyncHandler(async (req, res, next) => {
    try {
        const corporateUserId = req.user.corporateId;
        const dashboard = await getQuotationDashboard(corporateUserId);
        return res.status(200).json({
            status: true,
            data: dashboard,
            message: "Quotation dashboard fetched successfully",
            responseCode: "000",
        });
    } catch (error) {
        customLog(req?.LogTraceId, "error", { message: error?.message });
        next(new ErrorResponse(error.message, 500));
    }
});

exports.fetchAllCustomersForInvoice = asyncHandler(async (req, res, next) => {
    try {
        const corporateUserId = req.user.corporateId;

        const customers = await fetchAllCustomersForInvoice(corporateUserId);

        return res.status(200).json({
            status: true,
            message: "Customers fetched successfully",
            data: customers,
            responseCode: "000",
        });
    } catch (error) {
        customLog(req?.LogTraceId, "error", { message: error?.message, data: error?.response?.data });
        next(new ErrorResponse(error.message, 500));
    }
});

exports.updateSalesOrderStatus = asyncHandler(async (req, res, next) => {
    try {
        const corporateUserId = req.user.corporateId;
        const { invoiceId } = req.params;
        const { status } = req.body;

        const invoice = await findInvoice({ id: invoiceId, corporateUserId });

        if (!invoice) {
            return next(new ErrorResponse("Invoice not found", 404));
        }

        if (invoice.documentType === "SALES_ORDER") {
            if (["CANCELLED", "COMPLETED"].includes(invoice.status)) {
                return next(new ErrorResponse(`Cannot update status of a ${invoice.status.toLowerCase()} sales order`, 400));
            }
        } else if (invoice.documentType === "INVOICE") {
            if (status !== "PAID") {
                return next(new ErrorResponse("Only PAID status is allowed for invoices", 400));
            }
            if (invoice.status === "PAID") {
                return next(new ErrorResponse("Invoice is already marked as paid", 400));
            }
            if (["CANCELLED"].includes(invoice.status)) {
                return next(new ErrorResponse(`Cannot mark a ${invoice.status.toLowerCase()} invoice as paid`, 400));
            }
        } else {
            return next(new ErrorResponse("Status update not supported for this document type", 400));
        }

        const updateData = { status };

        if (invoice.documentType === "INVOICE" && status === "PAID") {
            const currentAmountDue = Number(invoice.amountDue || 0);

            // "Mark as Paid" used to flip the invoice to PAID/amountDue=0 without ever writing a
            // manualPayment row — the Payments history table (which reads from manualPayment, not
            // the invoice's own amountPaid column) stayed empty even though the invoice said Paid.
            // Auto-record the remaining due amount as a manual payment so the two stay consistent,
            // same as recordManualPayment does for a payment entered through "Add Payment".
            if (currentAmountDue > 0) {
                const paymentRecord = await createManualPaymentRecord({
                    invoiceId: Number(invoiceId),
                    corporateUserId,
                    amount: currentAmountDue,
                    originalAmount: invoice.originalAmountDue ?? null,
                    paymentMethod: "OTHERS",
                    paymentDate: new Date().toISOString().slice(0, 10),
                    referenceId: null,
                    notes: "Auto-recorded via Mark as Paid",
                });

                if (!paymentRecord) {
                    return next(new ErrorResponse("Something went wrong while recording payment", 500));
                }

                await paymentRecord.update({ receiptNo: `RC-${invoice.invoiceNumber}-${paymentRecord.id}` });
            }

            updateData.amountDue = "0.00";
            updateData.amountPaid = invoice.totalAmount;
            if (invoice.originalAmountDue != null) {
                updateData.originalAmountDue = "0.00";
                updateData.originalAmountPaid = invoice.originalTotalAmount;
            }
            updateData.paymentMode = invoice.paymentMode || "OTHERS";
            updateData.paymentDate = new Date();
        }

        const updated = await updateInvoice(
            { id: invoiceId, corporateUserId },
            updateData
        );

        if (!updated) {
            return next(new ErrorResponse("Something went wrong while updating status", 500));
        }

        if (status === "PAID") await completeRemindersByInvoice(invoiceId);

        customLog(req?.LogTraceId, "info", { message: "Status updated", invoiceId, status });

        return res.status(200).json({
            status: true,
            message: "Status updated successfully",
            data: { invoiceId: Number(invoiceId), status },
            responseCode: "000",
        });
    } catch (error) {
        customLog(req?.LogTraceId, "error", { message: error?.message, data: error?.response?.data });
        next(new ErrorResponse(error.message, 500));
    }
});

// GET /invoicing/v2/sales/dashboard
exports.getSalesDashboard = asyncHandler(async (req, res, next) => {
    try {
        const corporateUserId = req.user.corporateId;
        const data = await getSalesDashboard(corporateUserId);
        return res.status(200).json({
            status: true,
            data,
            message: "Sales dashboard fetched successfully",
            responseCode: "000",
        });
    } catch (error) {
        customLog(req?.LogTraceId, "error", { message: error?.message });
        next(new ErrorResponse(error.message, 500));
    }
});

// GET /invoicing/v2/sales/recent-transactions?limit=10
exports.getSalesRecentTransactions = asyncHandler(async (req, res, next) => {
    try {
        const corporateUserId = req.user.corporateId;
        let { page, itemsPerPage } = req.query;
        page = page ? parseInt(page) : 1;
        itemsPerPage = itemsPerPage ? parseInt(itemsPerPage) : 5;
        const recentTransactions = await getSalesRecentTransactions(corporateUserId, page, itemsPerPage);
        return res.status(200).json({
            status: true,
            data: {
                recentTransactions: recentTransactions ? recentTransactions.rows : [],
                recordsTotal: recentTransactions ? recentTransactions.count : 0,
            },
            message: "Recent transactions fetched successfully",
            responseCode: "000",
        });
    } catch (error) {
        customLog(req?.LogTraceId, "error", { message: error?.message });
        next(new ErrorResponse(error.message, 500));
    }
});

// GET /invoicing/v2/payments/dashboard
exports.getPaymentsDashboardOverview = asyncHandler(async (req, res, next) => {
    try {
        const corporateUserId = req.user.corporateId;
        const dashboard = await getPaymentsDashboardOverview(corporateUserId);
        return res.status(200).json({
            status: true,
            data: dashboard,
            message: "Payments dashboard fetched successfully",
            responseCode: "000",
        });
    } catch (error) {
        customLog(req?.LogTraceId, "error", { message: error?.message });
        next(new ErrorResponse(error.message, 500));
    }
});

// GET /invoicing/v2/payments/dashboard/top-customers
exports.getPaymentsDashboardTopCustomers = asyncHandler(async (req, res, next) => {
    try {
        const corporateUserId = req.user.corporateId;
        const data = await getPaymentsDashboardTopCustomers(corporateUserId);
        return res.status(200).json({
            status: true,
            data,
            message: "Top customers fetched successfully",
            responseCode: "000",
        });
    } catch (error) {
        customLog(req?.LogTraceId, "error", { message: error?.message });
        next(new ErrorResponse(error.message, 500));
    }
});

// GET /invoicing/v2/payments/dashboard/due-this-week
exports.getPaymentsDashboardDueThisWeek = asyncHandler(async (req, res, next) => {
    try {
        const corporateUserId = req.user.corporateId;
        let { page, itemsPerPage } = req.query;
        page = page ? parseInt(page) : 1;
        itemsPerPage = itemsPerPage ? parseInt(itemsPerPage) : 5;
        const data = await getPaymentsDashboardDueThisWeek(corporateUserId, page, itemsPerPage);
        return res.status(200).json({
            status: true,
            data: {
                dueThisWeek: data.dueThisWeek,
                recordsTotal: data.recordsTotal,
            },
            message: "Due this week fetched successfully",
            responseCode: "000",
        });
    } catch (error) {
        customLog(req?.LogTraceId, "error", { message: error?.message });
        next(new ErrorResponse(error.message, 500));
    }
});

// GET /invoicing/v2/payments/dashboard/recent-activity
exports.getPaymentsDashboardRecentActivity = asyncHandler(async (req, res, next) => {
    try {
        const corporateUserId = req.user.corporateId;
        let { page, itemsPerPage } = req.query;
        page = page ? parseInt(page) : 1;
        itemsPerPage = itemsPerPage ? parseInt(itemsPerPage) : 5;
        const data = await getPaymentsDashboardRecentActivity(corporateUserId, page, itemsPerPage);
        return res.status(200).json({
            status: true,
            data: {
                recentActivity: data.recentActivity,
                recordsTotal: data.recordsTotal,
            },
            message: "Recent activity fetched successfully",
            responseCode: "000",
        });
    } catch (error) {
        customLog(req?.LogTraceId, "error", { message: error?.message });
        next(new ErrorResponse(error.message, 500));
    }
});

// POST /invoicing/v2/:invoiceId/send-email
// Sends document email with PDF attachment to the customer.
// For QUOTATION: includes Accept/Reject buttons. For INVOICE/SALES_ORDER: PDF only.
exports.sendDocumentEmail = asyncHandler(async (req, res, next) => {
    try {
        const corporateUserId = req.user.corporateId;
        const { invoiceId } = req.params;
        const { email: bodyEmail } = req.body || {};

        // Fix 1: fetch invoice and settings in parallel
        const [doc, settings] = await Promise.all([
            findInvoice({ id: invoiceId, corporateUserId }),
            findInvoiceSettings(corporateUserId),
        ]);

        if (!doc) {
            return next(new ErrorResponse("Document not found", 404));
        }

        const recipientEmail = bodyEmail || doc.email;
        if (!recipientEmail) {
            return next(new ErrorResponse("Customer email not found on this document", 400));
        }
        doc.email = recipientEmail;

        // Block sending based on document type + status
        const blockedStatuses = {
            INVOICE:     ["CANCELLED"],
            SALES_ORDER: ["CANCELLED"],
            QUOTATION:   ["ACCEPTED", "REJECTED", "CANCELLED"],
        };
        if ((blockedStatuses[doc.documentType] || []).includes(doc.status)) {
            return next(new ErrorResponse(`Cannot send email for a ${doc.status.toLowerCase()} document`, 400));
        }

        const docLabels = { INVOICE: "Invoice", SALES_ORDER: "Sales Order", QUOTATION: "Quotation" };
        const docLabel = docLabels[doc.documentType] || "Document";
        const docNumber = `${doc.prefix || ''}${doc.invoiceNumber}`;
        const cu = doc.corporateUser || {};
        const companyName = settings?.businessName || cu.name || "Peko";

        doc.biller = {
            name:         companyName,
            address:      settings?.address      || '',
            city:         settings?.city         || cu.city      || '',
            state:        settings?.state        || cu.state     || '',
            pincode:      settings?.pincode      || '',
            phoneNumber:  settings?.phoneNumber  || cu.mobileNo  || '',
            email:        settings?.email        || cu.email     || '',
            gstNumber:    settings?.gstNo        || cu.gstNumber || '',
            logo:         settings?.logoUrl      || cu.logo      || null,
            signatureUrl: settings?.signatureUrl || null,
        };

        // Build email body based on document type
        const partnerDetails = req.user?.registeredBy ? await fetchPartnerDetails(req.user.registeredBy) : await partnerLogos();
        let emailBody;
        let emailSubject = `${docLabel} from ${companyName}`;
        if (doc.documentType === "QUOTATION") {
            let { quotationToken } = doc;
            if (!quotationToken) {
                quotationToken = uuidv4();
                await updateInvoice({ id: invoiceId, corporateUserId }, { quotationToken });
            }
            const baseUrl = process.env.NODE_ENV === "staging" ? process.env.STAGING_URL : process.env.PRODUCTION_URL;
            const resolved = await resolveQuotationEmailTemplate({
                quotationNumber: docNumber,
                customerName: doc.name,
                totalAmount: doc.originalTotalAmount ?? doc.totalAmount,
                currency: doc.currency || null,
                invoiceDate: doc.invoiceDate,
                dueDate: doc.dueDate,
                companyName,
                acceptUrl: `${baseUrl}/api/v1/quotation/respond?token=${quotationToken}&action=accept`,
                rejectUrl: `${baseUrl}/api/v1/quotation/respond?token=${quotationToken}&action=reject`,
            }, emailSubject, req?.LogTraceId, req.user.registeredBy || null, partnerDetails);
            emailBody = resolved.html;
            emailSubject = resolved.subject;
        } else {
            const resolved = await resolveInvoiceEmailTemplate({
                customerName:   doc.name || (doc.cashSale ? 'Cash Sale' : 'N/A'),
                invoiceNumber:  docNumber,
                invoiceDate:    doc.invoiceDate,
                dueDate:        doc.dueDate,
                amountDue:      doc.amountDue,
                corporateName:  companyName,
                corporateEmail: settings?.email || cu.email || '',
                corporatePhone: settings?.phoneNumber || cu.mobileNo || '',
                invoiceType:    doc.invoiceType,
                currency:       doc.currency || '',
                docLabel,
            }, emailSubject, req?.LogTraceId, req.user?.registeredBy || null, partnerDetails);
            emailBody = resolved.html;
            emailSubject = resolved.subject;
        }

        // Fix 3: reuse browser singleton instead of launching a new one
        const random = new Date().valueOf();
        const pdfPath = `${docLabel.replace(' ', '')}-${random}.pdf`;
        const emailTemplateSettings = settings?.templateSettings
            ? (typeof settings.templateSettings === 'string'
                ? JSON.parse(settings.templateSettings)
                : settings.templateSettings)
            : null;
        let invoiceHtmlForEmail;
        if (emailTemplateSettings?.templateId) {
            const tmpl = await findTemplateForDownload(emailTemplateSettings.templateId);
            if (tmpl?.body) invoiceHtmlForEmail = renderInvoiceTemplate(tmpl.body, doc);
        }
        if (!invoiceHtmlForEmail) invoiceHtmlForEmail = invoicingV2Template(doc);

        const browser = await getBrowser();
        const page = await browser.newPage();
        try {
            await page.setContent(invoiceHtmlForEmail);
            await page.pdf({ path: pdfPath, format: "A4", preferCSSPageSize: true });
        } finally {
            await page.close();
        }

        // Fix 2: respond immediately, send email in background
        res.status(200).json({
            status: true,
            message: `${docLabel} email sent successfully`,
            data: {},
            responseCode: "000",
        });

        sendEmailWithCorporateName(
            doc.email,
            emailSubject,
            emailBody,
            companyName,
            `${docLabel.replace(' ', '')}-${docNumber}.pdf`,
            pdfPath,
            (err) => {
                if (err) customLog(req?.LogTraceId, "error", { message: `Failed to send ${docLabel} email`, error: err?.message });
                else customLog(req?.LogTraceId, "info", { message: `${docLabel} email sent`, invoiceId, to: doc.email });
                fs.unlink(pdfPath, () => {});
            }
        );
    } catch (error) {
        customLog(req?.LogTraceId, "error", { message: error?.message, data: error?.response?.data });
        next(new ErrorResponse(error.message, 500));
    }
});

// GET /api/v1/quotation/respond?token=xxx&action=accept|reject
// Public endpoint — no auth required. Called when customer clicks Accept/Reject in email.
exports.respondToQuotation = asyncHandler(async (req, res) => {
    try {
        const { token, action } = req.query;

        if (!token || !["accept", "reject"].includes(action)) {
            return res.status(400).send(responseHtml("Invalid Request", "The link you followed is invalid or incomplete.", false));
        }

        const quotation = await findQuotationByToken(token);

        if (!quotation) {
            return res.status(404).send(responseHtml("Not Found", "Quotation not found. The link may be invalid.", false));
        }

        if (["ACCEPTED", "REJECTED", "CANCELLED"].includes(quotation.status)) {
            const label = quotation.status.charAt(0) + quotation.status.slice(1).toLowerCase();
            return res.status(200).send(responseHtml("Already Responded", `This quotation has already been ${label}.`, false));
        }

        const newStatus = action === "accept" ? "ACCEPTED" : "REJECTED";
        await updateInvoice({ id: quotation.id }, { status: newStatus });

        const title = action === "accept" ? "Quotation Accepted" : "Quotation Rejected";
        const message = action === "accept"
            ? "Thank you! You have successfully accepted the quotation. The business will be notified."
            : "You have rejected the quotation. The business will be notified.";

        return res.status(200).send(responseHtml(title, message, true));
    } catch (error) {
        return res.status(500).send(responseHtml("Error", "Something went wrong. Please try again later.", false));
    }
});

function responseHtml(title, message, success) {
    const color = success ? "#34a853" : "#ea4335";
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;">
  <div style="background:#fff;border-radius:8px;box-shadow:0 2px 12px rgba(0,0,0,0.1);padding:48px 40px;max-width:420px;width:100%;text-align:center;">
    <div style="width:56px;height:56px;border-radius:50%;background:${color};margin:0 auto 24px;display:flex;align-items:center;justify-content:center;">
      <span style="color:#fff;font-size:26px;line-height:56px;">${success ? "&#10003;" : "&#10007;"}</span>
    </div>
    <h2 style="margin:0 0 12px;color:#222;font-size:20px;">${title}</h2>
    <p style="margin:0;color:#555;font-size:14px;line-height:1.6;">${message}</p>
    <p style="margin:24px 0 0;color:#aaa;font-size:12px;">Powered by <a href="https://peko.one" style="color:#1a73e8;text-decoration:none;">Peko</a></p>
  </div>
</body>
</html>`;
}

exports.downloadManualPaymentReceipt = asyncHandler(async (req, res, next) => {
    try {
        const corporateUserId = req.user.corporateId;
        const { invoiceId, paymentId } = req.params;

        const [invoice, payment] = await Promise.all([
            findInvoice({ id: invoiceId, corporateUserId }),
            findManualPaymentById({ id: paymentId, invoiceId }),
        ]);
        if (!invoice) return next(new ErrorResponse("Invoice not found", 404));
        if (!payment) return next(new ErrorResponse("Payment record not found", 404));

        const cu = invoice.corporateUser || {};
        const billerName = cu.companyName || cu.name || 'Peko';
        const receiptNo = payment.receiptNo || `RC-${invoice.invoiceNumber}-${payment.id}`;
        const paymentDate = new Date(payment.paymentDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
        const amount = Number(payment.originalAmount ?? payment.amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        const currency = invoice.currency || 'INR';

        const html = paymentReceiptPdfTemplate({ receiptNo, paymentDate, amount, currency, invoice, payment, billerName, cu });

        const browser = await getBrowser();
        const page = await browser.newPage();
        try {
            await page.setContent(html);
            const pdfBuffer = Buffer.from(await page.pdf({ format: 'A4', preferCSSPageSize: true }));
            return res.status(200).json({
                status: true,
                message: 'Receipt generated successfully',
                data: { pdfBuffer, receiptNo },
                responseCode: '000',
            });
        } finally {
            await page.close();
        }
    } catch (error) {
        customLog(req?.LogTraceId, 'error', { message: error?.message });
        next(new ErrorResponse(error.message, 500));
    }
});

exports.sendManualPaymentReceiptEmail = asyncHandler(async (req, res, next) => {
    try {
        const corporateUserId = req.user.corporateId;
        const { invoiceId, paymentId } = req.params;

        const [invoice, payment] = await Promise.all([
            findInvoice({ id: invoiceId, corporateUserId }),
            findManualPaymentById({ id: paymentId, invoiceId }),
        ]);
        if (!invoice) return next(new ErrorResponse("Invoice not found", 404));
        if (!invoice.email) return next(new ErrorResponse("Customer email not found on this invoice", 400));
        if (!payment) return next(new ErrorResponse("Payment record not found", 404));

        const cu = invoice.corporateUser || {};
        const billerName = cu.companyName || cu.name || 'Peko';
        const receiptNo = payment.receiptNo || `RC-${invoice.invoiceNumber}-${payment.id}`;
        const paymentDate = new Date(payment.paymentDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
        const amount = Number(payment.originalAmount ?? payment.amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

        const partnerDetails = req.user?.registeredBy ? await fetchPartnerDetails(req.user.registeredBy) : await partnerLogos();
        const { subject: emailSubject, html: emailBody } = await resolvePaymentReceiptEmailTemplate({
            receiptNo,
            paymentDate,
            amount,
            invoiceNumber: invoice.invoiceNumber,
            customerName: invoice.name || (invoice.cashSale ? 'Cash Sale' : 'N/A'),
            billerName,
        }, `Payment Receipt ${receiptNo} from ${billerName}`, req?.LogTraceId, req.user.registeredBy || null, partnerDetails);

        res.status(200).json({ status: true, message: 'Receipt email sent successfully', data: {}, responseCode: '000' });

        sendEmailWithCorporateName(
            invoice.email,
            emailSubject,
            emailBody,
            billerName,
            null,
            null,
            (err) => {
                if (err) customLog(req?.LogTraceId, 'error', { message: 'Failed to send receipt email', error: err?.message });
                else customLog(req?.LogTraceId, 'info', { message: 'Receipt email sent', invoiceId, to: invoice.email });
            }
        );
    } catch (error) {
        customLog(req?.LogTraceId, 'error', { message: error?.message });
        next(new ErrorResponse(error.message, 500));
    }
});

exports.updateReminderSettings = asyncHandler(async (req, res, next) => {
    try {
        const corporateUserId = req.user.corporateId;
        const { invoiceId } = req.params;
        const { reminders } = req.body;

        const invoice = await findInvoice({ id: invoiceId, corporateUserId });

        if (!invoice) {
            return next(new ErrorResponse("Invoice not found", 404));
        }

        if (invoice.status === "PAID" || invoice.status === "CANCELLED") {
            return next(new ErrorResponse(`Cannot update reminder settings for a ${invoice.status.toLowerCase()} invoice`, 400));
        }

        if (reminders && reminders.length > 10) {
            return next(new ErrorResponse("Cannot add more than 10 reminders", 400));
        }

        // Build reminder array — each entry stores interval, flags, createdAt and next scheduled date
        const now = new Date();
        const reminderSettings = reminders && reminders.length > 0
            ? reminders.map(reminder => {
                const nextReminderDate = new Date(now);
                nextReminderDate.setDate(nextReminderDate.getDate() + reminder.reminderInterval);
                return {
                    reminderInterval: reminder.reminderInterval,
                    sendSMS: reminder.sendSMS ?? false,
                    sendEmail: reminder.sendEmail ?? false,
                    createdAt: now.toISOString(),
                    nextReminderDate: nextReminderDate.toISOString(),
                };
            })
            : [];

        const updated = await updateInvoice(
            { id: invoiceId, corporateUserId },
            { reminderSettings }
        );

        if (!updated) {
            return next(new ErrorResponse("Something went wrong while updating reminder settings", 500));
        }

        customLog(req?.LogTraceId, "info", { message: "Reminder settings updated", invoiceId, reminderSettings });

        return res.status(200).json({
            status: true,
            message: "Reminder settings updated successfully",
            data: { invoiceId: Number(invoiceId), reminders: reminderSettings },
            responseCode: "000",
        });
    } catch (error) {
        customLog(req?.LogTraceId, "error", { message: error?.message, data: error?.response?.data });
        next(new ErrorResponse(error.message, 500));
    }
});
// ─── Credit Note Controllers ──────────────────────────────────────────────────

exports.getNextCreditNoteNumber = asyncHandler(async (req, res, next) => {
    try {
        const corporateUserId = req.user.corporateId;
        const nextNumber = await getNextCreditNoteNumber(corporateUserId);
        return res.status(200).json({
            status: true,
            data: { nextNumber },
            message: "Next credit note number fetched successfully",
            responseCode: "000",
        });
    } catch (error) {
        customLog(req?.LogTraceId, "error", { message: error?.message });
        next(new ErrorResponse(error.message, 500));
    }
});

exports.getCreditNoteDashboard = asyncHandler(async (req, res, next) => {
    try {
        const corporateUserId = req.user.corporateId;
        const stats = await getCreditNoteStats(corporateUserId);
        return res.status(200).json({
            status: true,
            data: stats,
            message: "Credit note dashboard fetched successfully",
            responseCode: "000",
        });
    } catch (error) {
        customLog(req?.LogTraceId, "error", { message: error?.message });
        next(new ErrorResponse(error.message, 500));
    }
});


