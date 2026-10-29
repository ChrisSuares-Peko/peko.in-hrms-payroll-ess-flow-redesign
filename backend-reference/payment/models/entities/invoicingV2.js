"use strict";
const Sequelize = require("sequelize");
const sequelizeConfig = require("../../configs/database/index");
const corporateUser = require("./corporateUser");
const SubCorporateUser = require("./subCorporateUsers");
const InvoiceCustomerV2 = require("./invoiceCustomerV2");

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

    // Buyer Details
    customerId: {
        type: Sequelize.BIGINT,
        allowNull: true,
        defaultValue: null,
    },
    name: {
        type: Sequelize.STRING,
        allowNull: false,
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
    email: {
        type: Sequelize.STRING,
        allowNull: false,
    },
    phoneNumber: {
        type: Sequelize.STRING,
        allowNull: false,
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
    invoiceDate: {
        type: Sequelize.DATEONLY,
        allowNull: false,
    },
    dueDate: {
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

    // Status
    status: {
        type: Sequelize.ENUM("PENDING", "PAID", "CANCELLED", "OVERDUE"),
        defaultValue: "PENDING",
    },

    // Invoice Reminders: [{ reminderInterval, sendSMS, sendEmail, createdAt, nextReminderDate }]
    reminderSettings: {
        type: Sequelize.JSON,
        defaultValue: [],
    },
});

invoicingV2.belongsTo(corporateUser);
invoicingV2.belongsTo(SubCorporateUser);
invoicingV2.belongsTo(InvoiceCustomerV2, { foreignKey: 'customerId' });
InvoiceCustomerV2.hasMany(invoicingV2, { foreignKey: 'customerId' });

module.exports = invoicingV2;

 