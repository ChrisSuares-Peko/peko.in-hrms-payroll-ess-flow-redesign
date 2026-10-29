"use strict";

const fs = require("fs");
const puppeteer = require("puppeteer");
const sequelizeConfig = require("../configs/database/index");
const { QueryTypes } = require("sequelize");
const { customLog } = require("../utils/loggerHelper");
const { renderInvoiceTemplate } = require("../utils/renderInvoiceTemplate");
const { invoicingTemplete } = require("../utils/invoiceTemplate");
const emailer = require("../utils/emailer");
const { generateInvoiceEmailTemplate } = require("../utils/emailTemplates/invoicingV2");
const { partnerLogos } = require("../utils/partnerLogos");
const { resolveEmailTemplate } = require("./emailTemplateResolver");
const { EMAIL_TEMPLATE_KEYS, EMAIL_TEMPLATE_SERVICES } = require("../utils/emailTemplateKeys");
const { v2LayoutVariables } = require("../utils/emailTemplate/sharedLayout");

function calcNextRunDate(fromDate, frequency) {
    const date = new Date(fromDate);
    const { every, unit } = frequency;
    switch (unit) {
        case "DAYS":
            date.setDate(date.getDate() + every);
            break;
        case "WEEKS":
            date.setDate(date.getDate() + every * 7);
            break;
        case "MONTHS":
            date.setMonth(date.getMonth() + every);
            break;
        case "QUARTERS":
            date.setMonth(date.getMonth() + every * 3);
            break;
        case "YEARS":
            date.setFullYear(date.getFullYear() + every);
            break;
    }
    return date.toISOString().split("T")[0];
}

function shouldEnd(endCondition, completedRuns, nextRunDate) {
    const ec = typeof endCondition === "string" ? JSON.parse(endCondition) : endCondition || {};
    if (!ec || ec.type === "FOREVER") return false;
    if (ec.type === "AFTER" && completedRuns >= ec.runs) return true;
    if (ec.type === "ON" && nextRunDate > ec.date) return true;
    return false;
}

async function getNextInvoiceNo(corporateUserId) {
    const [result] = await sequelizeConfig.query(
        `SELECT MAX(CAST(invoiceNumber AS UNSIGNED)) AS maxNum
         FROM invoicings
         WHERE corporateUserId = :corporateUserId`,
        { replacements: { corporateUserId }, type: QueryTypes.SELECT }
    );
    return (parseInt(result?.maxNum) || 0) + 1;
}

async function buildHtmlForInvoice(row, corporateUserId) {
    const [[settingsRow], [profileRow]] = await Promise.all([
        sequelizeConfig.query(
            `SELECT bankDetails, signatureUrl, templateSettings FROM invoiceSettings WHERE corporateUserId = :corporateUserId LIMIT 1`,
            { replacements: { corporateUserId }, type: QueryTypes.SELECT }
        ),
        sequelizeConfig.query(
            `SELECT logo, companyName, name, email FROM corporateUsers WHERE id = :corporateUserId LIMIT 1`,
            { replacements: { corporateUserId }, type: QueryTypes.SELECT }
        ),
    ]);

    const parseCol = (v) => (v && typeof v === "string" ? JSON.parse(v) : v || null);
    const templateSettings = parseCol(settingsRow?.templateSettings);
    const templateId = templateSettings?.templateId || null;

    let templateBody = null;
    if (templateId) {
        const [tplRow] = await sequelizeConfig.query(
            `SELECT body FROM invoiceTempletes WHERE id = :templateId LIMIT 1`,
            { replacements: { templateId }, type: QueryTypes.SELECT }
        );
        templateBody = tplRow?.body || null;
    }

    if (!templateBody) return invoicingTemplete(row);

    const signatureUrl = settingsRow?.signatureUrl || "";
    const signatureHtml = signatureUrl
        ? `<img src="${signatureUrl}" style="width:100%;height:100%;object-fit:contain;" />`
        : `<span style="font-size:8.5pt;color:rgba(0,0,0,0.25);">Authorised Signature</span>`;
    const bank = parseCol(settingsRow?.bankDetails) || {};

    return renderInvoiceTemplate(templateBody, row, {
        signatureHtml,
        accountHolderName: bank.accountHolderName || "",
        bankName: bank.bankName || "",
        bankAccount: bank.accountNumber || "",
        bankIfsc: bank.ifsc || "",
        settingsLogoUrl: profileRow?.logo || "",
    });
}

async function sendAutoInvoiceEmail(row, corporateUserId, invoice) {
    const html = await buildHtmlForInvoice(row, corporateUserId);
    const random = new Date().valueOf();
    const outputFile = `Invoice-recurring-${random}.pdf`;

    const browser = await puppeteer.launch({
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
        headless: "new",
    });
    try {
        const page = await browser.newPage();
        await page.setContent(html, { waitUntil: "networkidle0" });
        await page.pdf({ path: outputFile, format: "A4", preferCSSPageSize: true });

        const fullNo = `${invoice.prefix || ""}${invoice.invoiceNumber}`;
        const subject = `Invoice ${fullNo} from ${invoice.companyName || ""}`;

        const [corporateProfile] = await sequelizeConfig.query(
            `SELECT logo, email FROM corporateUsers WHERE id = :corporateUserId LIMIT 1`,
            { replacements: { corporateUserId }, type: QueryTypes.SELECT }
        );
        // corporateUsers has no registeredBy/partner column to look up fetchPartnerDetails
        // with - brand off the biller's own logo/name (already fetched for this invoice)
        // instead, falling back to generic Peko branding only if even that's missing.
        const partnerData = corporateProfile?.logo
            ? { branding: invoice.companyName || "Peko", website: "https://www.peko.one", logo: corporateProfile.logo }
            : await partnerLogos();
        // partnerData.branding above is the biller's own company name, not a genuine Peko
        // reseller partner - force Peko branding for the footer so its partner-icon-hiding
        // gate doesn't fire for every biller.
        const footerSafePartnerData = { ...partnerData, branding: 'Peko' };

        const templateFields = {
            customerName: row.name || "",
            invoiceNumber: fullNo,
            invoiceDate: invoice.invoiceDate || "",
            dueDate: invoice.dueDate || "",
            amountDue: String(row.totalAmount || "0"),
            corporateName: invoice.companyName || "",
            corporateEmail: corporateProfile?.email || "",
            invoiceType: "DOMESTIC",
            currency: "INR",
        };
        // currencySymbol mirrors generateInvoiceEmailTemplate's own invoiceType/currency
        // ternary - the admin-stored template can't run that computation itself, so it's
        // resolved once here and passed as a flat value.
        const currencySymbol = templateFields.invoiceType === "DOMESTIC" ? "₹" : (templateFields.currency || "₹");
        const resolved = await resolveEmailTemplate({
            key: EMAIL_TEMPLATE_KEYS.INVOICE_PDF_SHARE,
            service: EMAIL_TEMPLATE_SERVICES.SCHEDULER,
            variables: {
                docLabel: "Invoice",
                customerName: templateFields.customerName,
                invoiceNumber: templateFields.invoiceNumber,
                invoiceDate: templateFields.invoiceDate,
                dueDate: templateFields.dueDate,
                amountDue: templateFields.amountDue,
                corporateName: templateFields.corporateName,
                corporateEmail: templateFields.corporateEmail,
                currencySymbol,
                branding: partnerData?.branding || "Peko",
                website: partnerData?.website || "https://www.peko.one",
                ...v2LayoutVariables(footerSafePartnerData),
            },
            fallback: () => generateInvoiceEmailTemplate({ ...templateFields, partnerDetails: footerSafePartnerData }),
            fallbackSubject: subject,
        });

        emailer.emailWithAttachment(
            row.email,
            resolved.subject,
            resolved.html,
            "invoice.pdf",
            outputFile,
            () => {
                browser.close();
                try { fs.unlinkSync(outputFile); } catch (_) { /* ignore */ }
            }
        );
    } catch (err) {
        await browser.close();
        try { fs.unlinkSync(outputFile); } catch (_) { /* ignore */ }
        throw err;
    }
}

exports.processRecurringInvoices = async () => {
    try {
        const today = new Date().toISOString().split("T")[0];

        const schedules = await sequelizeConfig.query(
            `SELECT ir.*, i.name, i.email, i.phoneNumber, i.address, i.gstNumber,
                    i.taxType, i.invoiceType, i.items, i.subtotal, i.tax, i.discount,
                    i.shippingCost, i.totalAmount, i.termsAndConditions, i.notes,
                    i.paymentMode, i.prefix AS sourcePrefix, i.customerId AS sourceCustomerId,
                    COALESCE(i.city, c.primaryCity) AS city,
                    COALESCE(i.state, c.primaryState) AS state,
                    COALESCE(i.pincode, c.primaryPincode) AS pincode,
                    COALESCE(i.country, c.primaryCountry, '') AS country,
                    i.currency,
                    cu.companyName, cu.name AS billerName
             FROM invoiceRecurrings ir
             INNER JOIN invoicings i ON i.id = ir.sourceInvoiceId
             LEFT JOIN corporateUsers cu ON cu.id = ir.corporateUserId
             LEFT JOIN invoiceCustomerV2s c ON c.id = i.customerId
             WHERE ir.status = 'ACTIVE'
               AND ir.nextRunDate IS NOT NULL
               AND ir.nextRunDate <= :today`,
            { replacements: { today }, type: QueryTypes.SELECT }
        );

        customLog(null, "info", {
            message: `Recurring scheduler: ${schedules.length} schedule(s) due`,
        });

        for (const sched of schedules) {
            try {
                const frequency =
                    typeof sched.frequency === "string"
                        ? JSON.parse(sched.frequency)
                        : sched.frequency;

                const items =
                    typeof sched.items === "string"
                        ? sched.items
                        : JSON.stringify(sched.items || []);

                let currentRunDate = sched.nextRunDate;
                let completedRuns = sched.completedRuns || 0;
                const existing =
                    typeof sched.generatedInvoices === "string"
                        ? JSON.parse(sched.generatedInvoices)
                        : sched.generatedInvoices || [];
                const newEntries = [];

                while (
                    currentRunDate <= today &&
                    !shouldEnd(sched.endCondition, completedRuns, currentRunDate)
                ) {
                    const invoiceNo = await getNextInvoiceNo(sched.corporateUserId);

                    const dueDateObj = new Date(currentRunDate);
                    dueDateObj.setDate(dueDateObj.getDate() + 15);
                    const dueDate = dueDateObj.toISOString().split("T")[0];

                    const amountDue = parseFloat(sched.totalAmount || 0);

                    const [newInvoiceId] = await sequelizeConfig.query(
                        `INSERT INTO invoicings
                            (corporateUserId, subCorporateUserId, customerId, documentType, invoiceType, taxType,
                             name, email, phoneNumber, address, gstNumber,
                             city, state, pincode, country, currency,
                             prefix, invoiceNumber, invoiceDate, dueDate,
                             items, subtotal, tax, discount, shippingCost, totalAmount,
                             amountPaid, amountDue, status,
                             termsAndConditions, notes, paymentMode,
                             recurringId, createdAt, updatedAt)
                         VALUES
                            (:corporateUserId, :subCorporateUserId, :customerId, 'INVOICE', :invoiceType, :taxType,
                             :name, :email, :phoneNumber, :address, :gstNumber,
                             :city, :state, :pincode, :country, :currency,
                             :prefix, :invoiceNumber, :invoiceDate, :dueDate,
                             :items, :subtotal, :tax, :discount, :shippingCost, :totalAmount,
                             '0', :amountDue, 'PENDING',
                             :termsAndConditions, :notes, :paymentMode,
                             :recurringId, NOW(), NOW())`,
                        {
                            replacements: {
                                corporateUserId: sched.corporateUserId,
                                subCorporateUserId: sched.subCorporateUserId || null,
                                customerId: sched.sourceCustomerId || null,
                                invoiceType: sched.invoiceType || "DOMESTIC",
                                taxType: sched.taxType || null,
                                name: sched.name || "",
                                email: sched.email || "",
                                phoneNumber: sched.phoneNumber || "",
                                address: sched.address || "",
                                gstNumber: sched.gstNumber || null,
                                city: sched.city || null,
                                state: sched.state || null,
                                pincode: sched.pincode || null,
                                country: sched.country || "",
                                currency: sched.currency || "INR",
                                prefix: sched.sourcePrefix || null,
                                invoiceNumber: String(invoiceNo),
                                invoiceDate: currentRunDate,
                                dueDate,
                                items,
                                subtotal: sched.subtotal || "0",
                                tax: sched.tax || "0",
                                discount: sched.discount || "0",
                                shippingCost: sched.shippingCost || "0",
                                totalAmount: sched.totalAmount || "0",
                                amountDue: String(amountDue),
                                termsAndConditions: sched.termsAndConditions || "",
                                notes: sched.notes || "",
                                paymentMode: sched.paymentMode || "CASH",
                                recurringId: sched.id,
                            },
                            type: QueryTypes.INSERT,
                        }
                    );

                    // Auto-send email if enabled
                    if (sched.autoSend && sched.email) {
                        const invoiceRow = {
                            id: newInvoiceId,
                            name: sched.name,
                            email: sched.email,
                            totalAmount: sched.totalAmount,
                            items: sched.items,
                            subtotal: sched.subtotal,
                            tax: sched.tax,
                            taxType: sched.taxType,
                        };
                        const fullNo = `${sched.sourcePrefix || ""}${invoiceNo}`;
                        const invoiceMeta = {
                            prefix: sched.sourcePrefix || "",
                            invoiceNumber: fullNo,
                            invoiceDate: currentRunDate,
                            dueDate,
                            companyName: sched.companyName || sched.billerName || "",
                        };
                        sendAutoInvoiceEmail(invoiceRow, sched.corporateUserId, invoiceMeta)
                            .then(() =>
                                customLog(null, "info", {
                                    message: `Auto-send success schedule ${sched.id}: ${fullNo} → ${sched.email}`,
                                })
                            )
                            .catch((err) =>
                                customLog(null, "error", {
                                    message: `Auto-send failed schedule ${sched.id}: ${err.message}`,
                                })
                            );
                    }

                    completedRuns++;
                    newEntries.push({
                        invoiceId: newInvoiceId,
                        invoiceNo,
                        prefix: sched.sourcePrefix || "",
                        createdAt: today,
                        invoiceDate: currentRunDate,
                        total: sched.totalAmount || "0",
                    });

                    currentRunDate = calcNextRunDate(currentRunDate, frequency);
                }

                if (!newEntries.length) continue;

                const nextRunDate = currentRunDate;
                const ended = shouldEnd(sched.endCondition, completedRuns, nextRunDate);

                await sequelizeConfig.query(
                    `UPDATE invoiceRecurrings
                     SET completedRuns = :completedRuns,
                         nextRunDate   = :nextRunDate,
                         status        = :status,
                         generatedInvoices = :generatedInvoices,
                         updatedAt     = NOW()
                     WHERE id = :id`,
                    {
                        replacements: {
                            completedRuns,
                            nextRunDate: ended ? null : nextRunDate,
                            status: ended ? "ENDED" : "ACTIVE",
                            generatedInvoices: JSON.stringify([...existing, ...newEntries]),
                            id: sched.id,
                        },
                        type: QueryTypes.UPDATE,
                    }
                );

                customLog(null, "info", {
                    message: `Recurring ${sched.id}: ${newEntries.length} invoice(s) created. Next: ${ended ? "ENDED" : nextRunDate}`,
                });
            } catch (err) {
                customLog(null, "error", {
                    message: `Recurring error schedule ${sched.id}: ${err.message}`,
                });
            }
        }
    } catch (error) {
        customLog(null, "error", {
            message: "processRecurringInvoices error: " + error.message,
        });
    }
};
