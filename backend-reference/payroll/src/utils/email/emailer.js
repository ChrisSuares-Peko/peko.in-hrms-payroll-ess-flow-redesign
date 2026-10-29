const nodemailer = require('nodemailer');
const sgMail = require("@sendgrid/mail");
const { customLog } = require('../loggerHelper');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const poolConfig = {
    pool: true,
    host: process.env.NODE_ENV === 'production' ? process.env.EMAILER_HOST_PROD : process.env.EMAILER_HOST_DEV,
    port: 587,
    secureConnection: false,
    auth: {
      user: process.env.NODE_ENV === 'production' ? process.env.EMAILER_USER_PROD : process.env.EMAILER_USER_DEV,
      pass: process.env.NODE_ENV === 'production' ? process.env.EMAILER_PASS_PROD : process.env.EMAILER_PASS_DEV,
    },
    tls: {
        ciphers: 'SSLv3'
    }
};

// var poolConfig = {
//   pool: true,
//   host: 'smtp.zoho.com',
//   port: 465,
//   secure: true,
//   auth: {
//     user: 'support@eresolute.com',
//     pass: '7UyD1sSvmDNK'
//   }
// };

const transporter = nodemailer.createTransport(poolConfig);

// Validate email recipients
function validateRecipients(to) {
    if (!to) {
        return { valid: false, error: "No recipients defined" };
    }
    if (Array.isArray(to)) {
        const validEmails = to.filter(email => email && email.trim());
        if (validEmails.length === 0) {
            return { valid: false, error: "No valid recipients in array" };
        }
    } else if (typeof to === 'string') {
        if (!to.trim()) {
            return { valid: false, error: "Recipient email is empty" };
        }
    }
    return { valid: true };
}

async function email(to, subject, body, func) {
    const validation = validateRecipients(to);
    if (!validation.valid) {
        customLog(null, "error", { message: "Email validation failed", error: validation.error, to });
        if (func) func();
        return { status: false, message: validation.error };
    }

    const fromEmail =
        process.env.NODE_ENV === "production"
            ? `Peko <${process.env.EMAILER_USER_PROD}>`
            : `Peko <${process.env.EMAILER_USER_DEV}>`;

    const msg = {
        to,
        from: fromEmail,
        subject,
        html: body,
    };

    try {
        await sgMail.send(msg);
        customLog(null, "info", { message: "Email sent successfully", to });
        if (func) func();
        return { status: true, message: "Success" };
    } catch (error) {
        customLog(null, "error", { message: "SendGrid Error", error: error.response?.body || error });
        return { status: false, message: error?.message || 'Failed to send email' };
    }
}

async function emailWithAttachment(to, subject, body, fileName, path, func) {
    const validation = validateRecipients(to);
    if (!validation.valid) {
        customLog(null, "error", { message: "Email validation failed", error: validation.error, to });
        if (func) func();
        return { status: false, message: validation.error };
    }

    const mailOptions = {
        from: process.env.NODE_ENV === 'production'
            ? "Peko" + `<${process.env.EMAILER_USER_PROD}>`
            : "Peko" + `<${process.env.EMAILER_USER_DEV}>`,
        to: to,
        subject: subject,
        html: body,
        attachments: [{
            filename: fileName,
            path: path
        }]
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        customLog(null, "info", { message: "Email with attachment sent successfully", to, response: info.response });
        if (func) func();
        return { status: true, message: "Success" };
    } catch (error) {
        customLog(null, "error", { message: "Email with attachment error", error: error?.message || error });
        return { status: false, message: error?.message || 'Failed to send email with attachment' };
    }
}

async function emailWithAttachmentBulk(to, subject, body, attachments, func) {
    const validation = validateRecipients(to);
    if (!validation.valid) {
        customLog(null, "error", { message: "Email validation failed", error: validation.error, to });
        if (func) func();
        return { status: false, message: validation.error };
    }

    const mailOptions = {
        from: process.env.NODE_ENV === 'production'
            ? "Peko" + `<${process.env.EMAILER_USER_PROD}>`
            : "Peko" + `<${process.env.EMAILER_USER_DEV}>`,
        to: to,
        subject: subject,
        html: body,
        attachments: attachments
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        customLog(null, "info", { message: "Bulk email with attachments sent successfully", to, response: info.response });
        if (func) func();
        return { status: true, message: "Success" };
    } catch (error) {
        customLog(null, "error", { message: "Bulk email with attachment error", error: error?.message || error });
        return { status: false, message: error?.message || 'Failed to send email with attachment' };
    }
}

function emailWithMultipleAttachment(to, subject, body, files, func) {
    const validation = validateRecipients(to);
    if (!validation.valid) {
        customLog(null, "error", { message: "Email validation failed", error: validation.error, to });
        if (func) func();
        return;
    }

    const mailOptions = {
        from: process.env.NODE_ENV === 'production'
            ? "Peko" + `<${process.env.EMAILER_USER_PROD}>`
            : "Peko" + `<${process.env.EMAILER_USER_DEV}>`,
        to: to,
        subject: subject,
        html: body,
        attachments: files
    };

    transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
            return customLog(null, "error", { message: "Email with multiple attachments error", error });
        }
        if (func) func();
        customLog(null, "info", { message: "Email with multiple attachments sent successfully", response: info.response });
    });
}

function emailBcc(to, subject, body, fileName, path, func) {
    const validation = validateRecipients(to);
    if (!validation.valid) {
        customLog(null, "error", { message: "Email validation failed", error: validation.error, to });
        if (func) func();
        return;
    }

    const mailOptions = {
        from: process.env.NODE_ENV === 'production'
            ? "Peko" + `<${process.env.EMAILER_USER_PROD}>`
            : "Peko" + `<${process.env.EMAILER_USER_DEV}>`,
        bcc: to,
        subject: subject,
        html: body,
        attachments: [{
            filename: fileName,
            path: path
        }]
    }
    if (!path) {
        delete mailOptions.attachments
    }
    transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
            return customLog(null, "error", { message: "Email BCC error", error });
        }
        if (func) func()
        customLog(null, "info", { message: "Email BCC sent successfully", response: info.response });
    })
}

module.exports.email = email;
module.exports.emailWithAttachment = emailWithAttachment;
module.exports.emailBcc = emailBcc;
module.exports.emailWithMultipleAttachment = emailWithMultipleAttachment;
module.exports.emailWithAttachmentBulk = emailWithAttachmentBulk;
