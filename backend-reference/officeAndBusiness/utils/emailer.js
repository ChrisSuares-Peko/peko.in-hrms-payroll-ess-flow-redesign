/* eslint-disable no-undef */
const nodemailer = require("nodemailer");
const Email = require("email-templates");
const fs = require("fs");
const path = require("path");

const sgMail = require("@sendgrid/mail");
const { customLog } = require("./loggerHelper");
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

async function sendEmailForPaymentLink(to, subject, body, corporateName) {
  const validation = validateRecipients(to);
  if (!validation.valid) {
    customLog(null, "error", { message: "Email validation failed", error: validation.error, to });
    throw new Error(validation.error);
  }

  const msg = {
    to,
    from: process.env.NODE_ENV === 'production'
      ? `${corporateName} <${process.env.EMAILER_USER_PROD}>`
      : `${corporateName} <${process.env.EMAILER_USER_DEV}>`,
    subject,
    html: body,
  };

  await sgMail.send(msg);
  return true;
}

// `from` lets a resolved admin template's own `sender` override the default —
// see services/emailTemplateResolver.js. Omitted/falsy keeps today's default.
function email(to, subject, body, func, from) {
  if (Array.isArray(to)) {
    to = to.join(",");
  }
  const fromEmail =
    from ||
    (process.env.NODE_ENV === "production"
      ? `Peko <${process.env.EMAILER_USER_PROD}>`
      : `Peko <${process.env.EMAILER_USER_DEV}>`);

  const msg = {
    to,
    from: fromEmail,
    subject,
    html: body,
  };

  sgMail
    .send(msg)
    .then(() => {
      customLog(null, "info", { message: "Email sent successfully" });
      if (func) func();
    })
    .catch((error) => {
      customLog(null, "error", { message: "SendGrid Error", error: error.response?.body || error });
    });
}

function emailWithCc(to, subject, body, cc, func) {
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

  if (cc && Array.isArray(cc) && cc.length > 0) {
    msg.cc = cc;
  }

  sgMail
    .send(msg)
    .then(() => {
      customLog(null, "info", { message: "Email (with CC) sent successfully" });
      if (func) func();
    })
    .catch((error) => {
      customLog(null, "error", { message: "SendGrid CC Error", error: error.response?.body || error });
    });
}

function emailWithoutData(to, subject, body, func) {
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
      if (func) func();
    })
    .catch((error) => {
      customLog(null, "error", { message: "SendGrid Error", error: error.response?.body || error });
      if (func) func(error);
    });
}

async function emailWithAttachment(to, subject, body, fileName, filePath, func) {
  const validation = validateRecipients(to);
  if (!validation.valid) {
    customLog(null, "error", { message: "Email validation failed", error: validation.error, to });
    if (func) func();
    return;
  }

  try {
    const buffer = await fs.readFile(filePath);
    const base64File = buffer.toString("base64");

    const msg = {
      from: process.env.NODE_ENV === 'production'
        ? `Peko <${process.env.EMAILER_USER_PROD}>`
        : `Peko <${process.env.EMAILER_USER_DEV}>`,
      to,
      subject,
      html: body,
      attachments: [
        {
          content: base64File,
          filename: fileName,
          type: "application/octet-stream",
          disposition: "attachment",
        },
      ],
    };

    await sgMail.send(msg);
    customLog(null, "info", { message: "Email with attachment sent successfully", to });
    if (func) func();
  } catch (error) {
    customLog(null, "error", { message: "Email with attachment error", error: error.response?.body || error });
    if (func) func(error);
  }
}

function send(data) {
  const validation = validateRecipients(data.to);
  if (!validation.valid) {
    customLog(null, "error", { message: "Email validation failed", error: validation.error, to: data.to });
    return Promise.reject(new Error(validation.error));
  }

  let attachments;
  if (data.attachments) {
    attachments = data.attachments;
  }
  const email = new Email({
    message: {
      from: process.env.NODE_ENV === 'production'
      ? "Peko" + `<${process.env.EMAILER_USER_PROD}>`
      : "Peko" + `<${process.env.EMAILER_USER_DEV}>`,
      attachments: attachments,
    },
    transport: transporter,
    views: {
      options: {
        extension: "ejs",
      },
    },
    juice: true,
    juiceResources: {
      preserveImportant: true,
      webResources: {
        relativeTo: path.join(__dirname, "..", "public", "assets"),
      },
    },
  });

  email
    .send({
      template: data.template,
      message: {
        to: data.to,
      },
      locals: data,
    })
    .then((info) => customLog(null, "info", { message: "Email template sent successfully", info }))
    .catch((error) => customLog(null, "error", { message: "Email template error", error }));
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
    attachments: [
      {
        filename: fileName,
        path: path,
      },
    ],
  };
  if (!path) {
    delete mailOptions.attachments;
  }
  transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      return customLog(null, "error", { message: "Email BCC error", error });
    }
    if (func) func();
    customLog(null, "info", { message: "Email BCC sent successfully", response: info.response });
  });
}

async function sendEmailWithCorporateName(to, subject, body, corporateName, fileName, filePath, func) {
  try {
    const msg = {
      to,
      from: process.env.NODE_ENV === "production"
        ? `${corporateName} <${process.env.EMAILER_USER_PROD}>`
        : `${corporateName} <${process.env.EMAILER_USER_DEV}>`,
      subject,
      html: body,
      trackingSettings: {
        clickTracking: {
          enable: false,
          enableText: false,
        },
      },
    };

    if (fileName && filePath) {
      filePath = path.join(__dirname, '..', filePath);
      const buffer = await fs.promises.readFile(filePath);
      const base64File = buffer.toString("base64");

      msg.attachments = [
        {
          content: base64File,
          filename: fileName,
          type: "application/octet-stream",
          disposition: "attachment",
        },
      ];
    }

    await sgMail.send(msg);

    if (func) func();
   return true;
  } catch (error) {
    customLog(null, "error", { message: "sendEmailWithCorporateName error", error: error.response?.body || error.message });
    throw error;
  }
}

// `cc` is optional (omitted/falsy = no CC). `from` lets a resolved admin template's own
// `sender` override the default — see services/emailTemplateResolver.js. Omitted/falsy
// keeps today's default, matching how `email()` already supports `from`.
function emailWithMultipleAttachment(to, subject, body, files, func, cc, from) {
  const validation = validateRecipients(to);
  if (!validation.valid) {
    customLog(null, "error", { message: "Email validation failed", error: validation.error, to });
    if (func) func(new Error(validation.error));
    return;
  }

  if (Array.isArray(to)) {
    to = to.join(",");
  }
  const attachmentFiles = Array.isArray(files) ? files.filter(Boolean) : [];

  const fromEmail =
    process.env.NODE_ENV === "production"
      ? `Peko <${process.env.EMAILER_USER_PROD}>`
      : `Peko <${process.env.EMAILER_USER_DEV}>`;

  Promise.all(
    (attachmentFiles || []).map(async (file) => {
      let content;
      if (file.path) {
        const buffer = await fs.readFile(file.path);
        content = buffer.toString("base64");
      } else if (file.content instanceof Buffer) {
        content = file.content.toString("base64");
      } else {
        content = file.content;
      }
      return {
        content,
        filename: file.filename,
        type: file.type || file.mimetype || "application/octet-stream",
        disposition: file.disposition || "attachment",
      };
    })
  )
    .then((attachments) => {
      const msg = {
        to,
        from: from || fromEmail,
        subject,
        html: body,
        attachments,
      };
      if (cc) msg.cc = cc;
      return sgMail.send(msg);
    })
    .then(() => {
      customLog(null, "info", { message: "Email with attachments sent successfully", to });
      if (func) func();
    })
    .catch((error) => {
      customLog(null, "error", { message: "SendGrid Attachment Error", error: error.response?.body || error });
      if (func) func(error);
    });
}

async function sendEmailWithCC(to, cc, subject, body, attachments = [], func) {
  try {
    const toEmails = Array.isArray(to) ? to : [to];
    const ccEmails = Array.isArray(cc) ? cc : [cc];

    const sgAttachments = [];

    for (const file of attachments) {
      let fileContent;

      if (file.path) {
        const buffer = await fs.readFile(file.path);
        fileContent = buffer.toString("base64");
      } else if (file.content) {
        fileContent =
          file.content instanceof Buffer
            ? file.content.toString("base64")
            : Buffer.from(file.content, "base64").toString("base64");
      } else {
        throw new Error("Attachment must have either path or content");
      }

      sgAttachments.push({
        filename: file.filename,
        content: fileContent,
        type: file.type || file.mimetype || "application/octet-stream",
        disposition: "attachment",
      });
    }

    const msg = {
      from: process.env.NODE_ENV === "production"
        ? `Peko <${process.env.EMAILER_USER_PROD}>`
        : `Peko <${process.env.EMAILER_USER_DEV}>`,
      to: toEmails,
      cc: ccEmails,
      subject,
      html: body,
      attachments: sgAttachments.length > 0 ? sgAttachments : undefined,
    };

    await sgMail.send(msg);

    if (func) func();
    customLog(null, "info", { message: "Email with CC sent successfully", to });
    return true;
  } catch (error) {
    customLog(null, "error", { message: "sendEmailWithCC error", error: error.response?.body || error.message });
    throw error;
  }
}

module.exports.email = email;
module.exports.emailWithCc = emailWithCc;
module.exports.emailWithAttachment = emailWithAttachment;
module.exports.emailBcc = emailBcc;
module.exports.send = send;
module.exports.emailWithMultipleAttachment = emailWithMultipleAttachment;
module.exports.emailWithoutData = emailWithoutData;
module.exports.sendEmailWithCorporateName = sendEmailWithCorporateName;
module.exports.sendEmailForPaymentLink = sendEmailForPaymentLink;
module.exports.sendEmailWithCC = sendEmailWithCC;
