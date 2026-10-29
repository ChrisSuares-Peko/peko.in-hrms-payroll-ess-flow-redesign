"use strict";
const Sequelize = require("sequelize");
const sequelizeConfig = require("../../configs/database/index");
const corporateUser = require("./corporateUser");
const SubCorporateUser = require("./subCorporateUsers");
const InvoiceCustomerV2 = require("./invoiceCustomerV2");
const invoiceRecurring = require("./invoiceRecurring");

const invoicingV2 = sequelizeConfig.define("invoicings", {
    id: {
        type: Sequelize.BIGINT,
        primaryKey: true,
        autoIncrement: true,
    },

    // DOMESTIC | INTERNATIONAL
    invoiceType: {
        type: Sequelize.ENUM("DOMESTIC", "INTERNATIONAL"),
        defaultValue: "DOMESTIC",
    },

    // Intra-State | Inter-State
    taxType: {
        type: Sequelize.ENUM("Intra-State", "Inter-State"),
        allowNull: true,
        defaultValue: null,
    },

    // Buyer Details
    customerId: {
        type: Sequelize.BIGINT,
        allowNull: true,
        defaultValue: null,
    },
    // Nullable so a cash-sale invoice (no customer on record) can omit it
    name: {
        type: Sequelize.STRING,
        allowNull: true,
    },
    gstNumber: {
        type: Sequelize.STRING,
        allowNull: true, // only for DOMESTIC
    },
    address: {
        type: Sequelize.TEXT,
        allowNull: true,
    },
    city: {
        type: Sequelize.STRING,
        allowNull: true, // DOMESTIC + INTERNATIONAL
    },
    state: {
        type: Sequelize.STRING,
        allowNull: true, // DOMESTIC + INTERNATIONAL
    },
    pincode: {
        type: Sequelize.STRING,
        allowNull: true, // only for DOMESTIC
    },
    country: {
        type: Sequelize.STRING,
        allowNull: true, // only for INTERNATIONAL
    },
    // Nullable for the same reason as name — optional on a cash-sale invoice
    email: {
        type: Sequelize.STRING,
        allowNull: true,
    },
    phoneNumber: {
        type: Sequelize.STRING,
        allowNull: true,
    },

    // Document Type: INVOICE | SALES_ORDER | QUOTATION | CREDIT_NOTE
    documentType: {
        type: Sequelize.ENUM("INVOICE", "SALES_ORDER", "QUOTATION", "CREDIT_NOTE"),
        allowNull: false,
        defaultValue: "INVOICE",
    },

    // Credit Note fields
    linkedInvoiceId: {
        type: Sequelize.BIGINT,
        allowNull: true,
        defaultValue: null,
    },
    creditNoteDetails: {
        type: Sequelize.JSON,
        allowNull: true,
        defaultValue: null,
    },
    isCreditNoteCreated: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
    },

    // Invoice Details
    prefix: {
        type: Sequelize.STRING,
        allowNull: true,
        defaultValue: null,
    },
    invoiceNumber: {
        type: Sequelize.STRING,
        allowNull: false,
    },
    // currency is only used for INTERNATIONAL invoices; DOMESTIC is always INR
    currency: {
        type: Sequelize.STRING,
        allowNull: true,
        defaultValue: null,
    },
    // Rate billed at (1 <currency> = conversionRate INR). Required only when currency isn't
    // INR; stays 1 for DOMESTIC. Matches Peko-AE's conversionRate pattern.
    conversionRate: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false,
        defaultValue: 1,
    },
    invoiceDate: {
        type: Sequelize.DATEONLY,
        allowNull: false,
    },
    dueDate: {
        type: Sequelize.DATEONLY,
        allowNull: true,
    },
    dateOfSupply: {
        type: Sequelize.DATEONLY,
        allowNull: true,
    },

    // Items array: [{ name, hsn, quantity, unit, unitPrice, discount, taxRate, netAmount }]
    items: {
        type: Sequelize.JSON,
        defaultValue: [],
    },

    // Financial Summary
    subtotal: {
        type: Sequelize.DECIMAL(12, 2),
        defaultValue: 0.0,
    },
    tax: {
        type: Sequelize.DECIMAL(12, 2),
        defaultValue: 0.0,
    },
    discount: {
        type: Sequelize.DECIMAL(12, 2),
        defaultValue: 0.0,
    },
    shippingCost: {
        type: Sequelize.DECIMAL(12, 2),
        defaultValue: 0.0,
    },
    totalAmount: {
        type: Sequelize.DECIMAL(12, 2),
        defaultValue: 0.0,
    },
    amountPaid: {
        type: Sequelize.DECIMAL(12, 2),
        defaultValue: 0.0,
    },
    amountDue: {
        type: Sequelize.DECIMAL(12, 2),
        defaultValue: 0.0,
    },
    // As-entered figures in the invoice's own currency; null for INR invoices.
    originalSubtotal: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: true,
        defaultValue: null,
    },
    originalTax: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: true,
        defaultValue: null,
    },
    originalDiscount: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: true,
        defaultValue: null,
    },
    originalTotalAmount: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: true,
        defaultValue: null,
    },
    originalAmountPaid: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: true,
        defaultValue: null,
    },
    originalAmountDue: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: true,
        defaultValue: null,
    },

    // Payment
    paymentMode: {
        type: Sequelize.STRING,
        allowNull: true,
    },

    paymentDate: {
        type: Sequelize.DATEONLY,
        allowNull: true,
    },

    // Additional Information
    termsAndConditions: {
        type: Sequelize.TEXT,
        allowNull: true,
    },
    notes: {
        type: Sequelize.TEXT,
        allowNull: true,
    },

    saveCustomer: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },

    // Cash sale: a walk-in customer with no record. Relaxes name/email/phoneNumber to
    // optional and swaps the "Cash Sale" label in wherever the customer name is shown.
    cashSale: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },

    // Status
    // REFUNDED only applies to CREDIT_NOTE rows (PENDING | REFUNDED), set via the credit-note
    // status dropdown — it does not apply to invoices.
    status: {                 //FOR INVOICE                              //FOR QUOTATION                    //FOR SALES
        type: Sequelize.ENUM("PENDING", "PAID", "CANCELLED", "OVERDUE", "REJECTED", "APPROVED", "ACCEPTED", "COMPLETED", "PARTIAL", "CONVERTED", "REFUNDED"),
        defaultValue: "PENDING",
    },

    // Invoice Reminders: [{ reminderInterval, sendSMS, sendEmail, createdAt, nextReminderDate }]
    reminderSettings: {
        type: Sequelize.JSON,
        defaultValue: [],
    },

    // Quotation accept/reject token — generated only for QUOTATION documents, used in email action links
    quotationToken: {
        type: Sequelize.UUID,
        allowNull: true,
        defaultValue: null,
    },

    eInvoiceId: {
        type: Sequelize.BIGINT,
        allowNull: true,
        defaultValue: null,
    },

    // Backlink to the recurring schedule that owns this source invoice
    recurringId: {
        type: Sequelize.BIGINT,
        allowNull: true,
        defaultValue: null,
    },
});

invoicingV2.belongsTo(corporateUser);
invoicingV2.belongsTo(SubCorporateUser);
invoicingV2.belongsTo(InvoiceCustomerV2, { foreignKey: 'customerId' });
InvoiceCustomerV2.hasMany(invoicingV2, { foreignKey: 'customerId' });

// Credit note self-reference: a CREDIT_NOTE row points to the original invoice
invoicingV2.belongsTo(invoicingV2, { foreignKey: 'linkedInvoiceId', as: 'linkedInvoice' });

// Recurring: source invoice backlink to its schedule
invoicingV2.belongsTo(invoiceRecurring, { foreignKey: 'recurringId', as: 'recurring' });

// Recurring: schedule points to its template (source) invoice
invoiceRecurring.belongsTo(invoicingV2, { foreignKey: 'sourceInvoiceId', as: 'sourceInvoice' });

module.exports = invoicingV2;
