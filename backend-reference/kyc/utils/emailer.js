/* eslint-disable no-undef */
const nodemailer = require('nodemailer');
const Email = require('email-templates')
const path = require('path')
const sgMail = require("@sendgrid/mail");
const { customLog } = require('./loggerHelper');
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

function email(to, subject, body, func) {
  const validation = validateRecipients(to);
  if (!validation.valid) {
    customLog(null, "error", { message: "Email validation failed", error: validation.error, to });
    if (func) func();
    return;
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

  sgMail
    .send(msg)
    .then(() => {
      customLog(null, "info", { message: "Email sent successfully", to });
      if (func) func();
    })
    .catch((error) => {
      customLog(null, "error", { message: "SendGrid Error", error: error.response?.body || error });
    });
}

function emailWithAttachment(to, subject, body, fileName, path, func) {
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
    attachments: [{
      filename: fileName,
      path: path
    }]
  };

  transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      return customLog(null, "error", { message: "Email with attachment error", error });
    }
    if (func) func();
    customLog(null, "info", { message: "Email with attachment sent successfully", response: info.response });
  });
}

function send(data) {
  const validation = validateRecipients(data.to);
  if (!validation.valid) {
    customLog(null, "error", { message: "Email validation failed", error: validation.error, to: data.to });
    return Promise.reject(new Error(validation.error));
  }

  let attachments
  if (data.attachments) {
    attachments = data.attachments
  }
  const email = new Email({
    message: {
      from: process.env.NODE_ENV === 'production'
      ? "Peko" + `<${process.env.EMAILER_USER_PROD}>`
      : "Peko" + `<${process.env.EMAILER_USER_DEV}>`,
      attachments: attachments
    },
    transport: transporter,
    views: {
      options: {
        extension: 'ejs'
      }
    },
    juice: true,
    juiceResources: {
      preserveImportant: true,
      webResources: {
        relativeTo: path.join(__dirname, '..', 'public', 'assets')
      }
    }
  })

  email.send({
    template: data.template,
    message: {
      to: data.to
    },
    locals: data
  })
    .then((info) => customLog(null, "info", { message: "Email template sent successfully", info }))
    .catch((error) => customLog(null, "error", { message: "Email template error", error }))
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
module.exports.send = send;
