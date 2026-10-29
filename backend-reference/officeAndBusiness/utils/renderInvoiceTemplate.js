"use strict";

function parse(val) {
    if (!val) return {};
    return typeof val === "string" ? JSON.parse(val) : val;
}

// F-OAB-15: invoice fields are user-supplied and get rendered into PDF/email HTML. Escape
// them so injected markup (e.g. <iframe src=internal> SSRF, or email XSS) renders as inert
// text. Entity-escaping is transparent for legitimate plain-text values.
function escapeHtml(v) {
    return String(v)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

function safe(v) {
    return v == null ? "" : escapeHtml(v);
}

function safeText(v) {
    if (!v) return "";
    let s = String(v);
    if (s.startsWith('"') && s.endsWith('"')) {
        try { s = JSON.parse(s); } catch (e) { /* keep original */ }
    }
    return escapeHtml(s.replace(/\\n/g, "\n"));
}

function fmt(val) {
    return parseFloat(val || 0).toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
}

function formatDate(d) {
    if (!d) return "";
    return new Date(d).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric",
    });
}

function numberToWords(n) {
    const ones = [
        "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight",
        "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen",
        "Sixteen", "Seventeen", "Eighteen", "Nineteen",
    ];
    const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

    function below1000(num) {
        if (num === 0) return "";
        if (num < 20) return ones[num];
        if (num < 100) return tens[Math.floor(num / 10)] + (num % 10 ? " " + ones[num % 10] : "");
        return ones[Math.floor(num / 100)] + " Hundred" + (num % 100 ? " " + below1000(num % 100) : "");
    }

    const num = Math.floor(n);
    if (!num) return "Zero";

    const crore = Math.floor(num / 10000000);
    const lakh = Math.floor((num % 10000000) / 100000);
    const thousand = Math.floor((num % 100000) / 1000);
    const remainder = num % 1000;

    let result = "";
    if (crore) result += below1000(crore) + " Crore ";
    if (lakh) result += below1000(lakh) + " Lakh ";
    if (thousand) result += below1000(thousand) + " Thousand ";
    if (remainder) result += below1000(remainder);

    return result.trim() + " Only";
}

const TAX_RATE_LABELS = { EXPORT_0: "0% Export", EXEMPTED: "Exempted" };

function buildItemsHtml(items, invoiceType, taxType, currencySymbol) {
    const list = Array.isArray(items) ? items : [];

    const rows = list.map((item, i) => {
        const name = safe(item.name || item.description || "");
        const hsn = safe(item.hsn || "");
        const unit = safe(item.unit || "");
        const unitPrice = parseFloat(item.unitPrice || item.price || 0);
        const qty = parseFloat(item.quantity || item.qty || 1);
        const discPct = parseFloat(item.discount || 0);
        const rawTaxRate = item.taxRate || item.vatPercent || 0;
        const taxRate = parseFloat(rawTaxRate) || 0;
        const taxRateLabel = TAX_RATE_LABELS[rawTaxRate] || `${taxRate}%`;
        const lineTotal = parseFloat(item.netAmount || item.amount || 0);

        const taxMode = item.taxMode || "Exclusive";
        let taxable;
        if (taxMode === "Inclusive") {
            taxable = taxRate > 0 ? lineTotal / (1 + taxRate / 100) : lineTotal;
        } else {
            taxable = unitPrice * qty * (1 - discPct / 100);
        }

        return `
        <tr>
            <td>${i + 1}</td>
            <td>${name}</td>
            <td>${hsn}</td>
            <td>${qty}</td>
            <td>${unit}</td>
            <td>${currencySymbol} ${fmt(unitPrice)}</td>
            <td>${discPct > 0 ? discPct + "%" : "-"}</td>
            <td>${currencySymbol} ${fmt(taxable)}</td>
            <td>${taxRateLabel}</td>
            <td>${currencySymbol} ${fmt(lineTotal)}</td>
        </tr>`;
    });

    return rows.join("");
}

function buildTaxSummaryHtml(items, taxType, taxAmount, currencySymbol, invoiceType) {
    // International invoices carry no GST — show no tax line at all.
    if (invoiceType === "INTERNATIONAL") return "";

    const isInterState = taxType === "Inter-State";

    if (isInterState) {
        const igst = parseFloat(taxAmount || 0);
        return `<div class="summ-row"><span class="summ-lbl">IGST</span><span>${currencySymbol} ${fmt(igst)}</span></div>`;
    }

    // Intra-State: split total tax equally into CGST + SGST
    const totalTax = parseFloat(taxAmount || 0);
    const half = totalTax / 2;
    return `
        <div class="summ-row"><span class="summ-lbl">CGST</span><span>${currencySymbol} ${fmt(half)}</span></div>
        <div class="summ-row"><span class="summ-lbl">SGST</span><span>${currencySymbol} ${fmt(half)}</span></div>`;
}

function buildTemplateData(invoice, extraData = {}) {
    const cu = invoice.biller || {};
    const rawItems = Array.isArray(invoice.items)
        ? invoice.items
        : parse(invoice.items);

    const isInternational = invoice.invoiceType === "INTERNATIONAL";
    const currencySymbol = isInternational ? (invoice.currency || "") : "₹";

    // For a foreign-currency invoice, the stored totals/item prices are INR-equivalent
    // (for internal stats) — always show the as-entered figures to the customer, never
    // the converted numbers or the rate itself.
    const subtotal    = invoice.originalSubtotal    ?? invoice.subtotal;
    const discount     = invoice.originalDiscount    ?? invoice.discount;
    const tax          = invoice.originalTax         ?? invoice.tax;
    const totalAmt     = invoice.originalTotalAmount ?? invoice.totalAmount;
    const amountPaid   = invoice.originalAmountPaid  ?? invoice.amountPaid;
    const amountDue    = invoice.originalAmountDue   ?? invoice.amountDue;
    const items = rawItems.map(item => ({
        ...item,
        unitPrice: item.originalUnitPrice ?? item.unitPrice,
        netAmount: item.originalNetAmount ?? item.netAmount,
    }));

    const billerAddress = [cu.address, cu.city, cu.state, cu.pincode]
        .filter(Boolean)
        .join(", ");
    const customerAddress = [
        invoice.address,
        invoice.city,
        invoice.state,
        invoice.pincode,
        invoice.country,
    ]
        .filter(Boolean)
        .join(", ");

    const headingMap = {
        INVOICE: "TAX INVOICE",
        SALES_ORDER: "SALES ORDER",
        QUOTATION: "QUOTATION",
    };

    const prefix = invoice.prefix || "";
    const invoiceNo = invoice.invoiceNumber || "";
    const fullInvoiceNo = prefix ? `${prefix}${invoiceNo}` : invoiceNo;

    const totalAmountNum = parseFloat(totalAmt || 0);

    return {
        // Biller
        logoUrl: safe(cu.logo || extraData.settingsLogoUrl || ""),
        logoHtml: (cu.logo || extraData.settingsLogoUrl)
            ? `<img src="${escapeHtml(cu.logo || extraData.settingsLogoUrl)}" class="company-logo" alt="logo" />`
            : "",
        companyName: safe(cu.name),
        companyAddress: safe(billerAddress),
        companyMobile: safe(cu.phoneNumber),
        companyEmail: safe(cu.email),
        companyGSTIN: safe(cu.gstNumber),
        companyGstinHtml: cu.gstNumber
            ? `<div class="company-gstin">GSTIN: ${safe(cu.gstNumber)}</div>`
            : "",
        signatureHtml: cu.signatureUrl
            ? `<img src="${escapeHtml(cu.signatureUrl)}" style="max-width:160px;max-height:96px;object-fit:contain;" />`
            : '<span style="font-size:8.5pt;color:rgba(0,0,0,0.25);">Authorised Signature</span>',

        // Customer
        customerName: safe(invoice.name),
        customerEmail: safe(invoice.email),
        customerMobile: safe(invoice.phoneNumber),
        customerAddress: safe(customerAddress),
        customerGSTIN: safe(invoice.gstNumber),

        // Invoice details
        invoiceName: safe(headingMap[invoice.documentType] || "TAX INVOICE"),
        prefix: safe(prefix),
        invoiceNo: safe(fullInvoiceNo),
        fullInvoiceNo: safe(fullInvoiceNo),
        invoiceDate: formatDate(invoice.invoiceDate),
        dueDate: formatDate(invoice.dueDate),
        currency: currencySymbol,

        // Payment
        subTotal: `${currencySymbol} ${fmt(subtotal)}`,
        discount: `${currencySymbol} ${fmt(discount)}`,
        taxAmount: `${currencySymbol} ${fmt(tax)}`,
        shipping: `${currencySymbol} ${fmt(invoice.shippingCost)}`,
        total: `${currencySymbol} ${fmt(totalAmt)}`,
        amountPaid: `${currencySymbol} ${fmt(amountPaid)}`,
        amountDue: `${currencySymbol} ${fmt(amountDue)}`,
        amountInWords: numberToWords(totalAmountNum),

        // Bank
        bankIfsc: safe(cu.ifscCode || cu.ifsc || ""),
        bankAccount: safe(cu.bankAccountNumber || cu.accountNumber || ""),
        bankName: safe(cu.bankName || ""),
        accountHolderName: safe(cu.accountHolderName || ""),

        // Address
        billingAddress: safe(customerAddress),
        shippingAddress: safe([invoice.shippingAddress, invoice.shippingCity, invoice.shippingState, invoice.shippingPincode].filter(Boolean).join(", ") || customerAddress),
        dateOfSupply: invoice.dateOfSupply ? formatDate(invoice.dateOfSupply) : '',

        // Notes
        notes: safeText(invoice.notes),
        termsConditions: safeText(invoice.termsAndConditions),

        // Items
        itemsHtml: buildItemsHtml(
            items,
            invoice.invoiceType,
            invoice.taxType,
            currencySymbol
        ),
        itemCount: items.length,

        // Tax summary (CGST+SGST or IGST)
        taxSummaryHtml: buildTaxSummaryHtml(items, invoice.taxType, tax, currencySymbol, invoice.invoiceType),

        ...extraData,
    };
}

function renderTemplate(html, data) {
    return html.replace(/{{(\w+)}}/g, (_, key) => {
        if (data[key] === undefined) return "";
        return String(data[key]).replace(/\$/g, "$$$$");
    });
}

exports.renderInvoiceTemplate = (templateHtml, invoice, extraData = {}) => {
    const data = buildTemplateData(invoice, extraData);
    return renderTemplate(templateHtml, data);
};

exports.renderTemplate = renderTemplate;
