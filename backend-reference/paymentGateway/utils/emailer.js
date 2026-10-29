const nodemailer = require('nodemailer');
const Email = require('email-templates')
const fs = require('fs');
const path = require('path');
const { customLog } = require('./loggerHelper');
const sgMail = require("@sendgrid/mail");
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const STATIC_ASSETS_DIR = path.resolve(__dirname, '../public/assets');

function cleanupAttachmentFiles(files) {
  if (!Array.isArray(files)) return;
  files.forEach(f => {
    if (f && f.path) {
      // skip static assets (e.g. eSIM guideline pdf); only temp files are deleted
      if (path.resolve(f.path).startsWith(STATIC_ASSETS_DIR + path.sep)) return;
      fs.unlink(f.path, err => {
        if (err) customLog(null, 'error', { message: 'Failed to delete receipt file', path: f.path, error: err.message });
      });
    }
  });
}
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
  },
  connectionTimeout: 60000, // 60 seconds
  greetingTimeout: 30000, // 30 seconds
  socketTimeout: 60000, // 60 seconds
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

// Retry helper function with exponential backoff.
// No artificial timeout race here: it used to reject slow-but-alive sends while the SMTP
// delivery still completed in the background, so the retry produced duplicate emails.
// The transport's own connection/greeting/socket timeouts are the failure signal.
async function sendWithRetry(mailOptions, maxRetries = 3, retryDelay = 2000) {
  let lastError;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await transporter.sendMail(mailOptions);
    } catch (error) {
      lastError = error;
      const isTimeout = error.message?.includes('timeout') || error.code === 'ETIMEDOUT' || error.code === 'ECONNRESET';
      const isRetryable = isTimeout || error.code === 'ECONNREFUSED' || error.responseCode === 421;
      
      if (attempt < maxRetries && isRetryable) {
        const delay = retryDelay * Math.pow(2, attempt - 1); // Exponential backoff
        customLog(null, "info", { 
          message: `Email send attempt ${attempt} failed, retrying in ${delay}ms`, 
          error: error.message || error,
          to: mailOptions.to,
          attempt 
        });
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      throw error;
    }
  }
  throw lastError;
}

function email({ to, cc, subject, body }, func) {
  if (Array.isArray(to)) {
    to = to.join(",");
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
    ...(cc && { cc }),
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

async function emailWithAttachment(to, subject, body, fileName, path, cc, func) {
  const validation = validateRecipients(to);
  if (!validation.valid) {
    customLog(null, "error", { message: "Email validation failed", error: validation.error, to });
    if (func) func();
    return;
  }

  if (Array.isArray(to)) {
    to = to.join(",")
  }

  try {
    const buffer = await fs.promises.readFile(path);
    const msg = {
      from: process.env.NODE_ENV === 'production'
        ? "Peko" + `<${process.env.EMAILER_USER_PROD}>`
        : "Peko" + `<${process.env.EMAILER_USER_DEV}>`,
      to,
      subject,
      html: body,
      attachments: [{
        content: buffer.toString("base64"),
        filename: fileName,
        type: "application/octet-stream",
        disposition: "attachment",
      }],
      ...(cc && { cc }) // only include cc if it's defined
    };

    await sgMail.send(msg);
    customLog(null, "info", { message: "Email with attachment sent successfully", to });
    if (func) func();
  } catch (error) {
    customLog(null, "error", {
      error: error.response?.body || error.message || error,
      message: "Failed to send mail with attachment",
      to
    });
    if (func) func();
  }
}

// Each item in `files` is Nodemailer-shaped ({ filename, path }, from
// generateOrderInvoiceAttachments) — read and base64-encode it for SendGrid's own
// attachment format, which (unlike Nodemailer) can't take a local file path directly.
async function buildSendGridAttachments(files) {
  return Promise.all(files.map(async (file) => {
    let content;
    if (file.path) {
      const buffer = await fs.promises.readFile(file.path);
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
  }));
}

function emailWithMultipleAttachment(to, subject, body, files,cc, func) {
  if (typeof cc === 'function' && !func) {
    func = cc;
    cc = undefined;
  }

  const validation = validateRecipients(to);
  if (!validation.valid) {
    customLog(null, "error", { message: "Email validation failed", error: validation.error, to });
    if (func) func(new Error(validation.error));
    return;
  }

  if (Array.isArray(to)) {
    to = to.join(",")
  }
  // Drop falsy attachments (e.g. a failed receipt now returns null) so a generation
  // failure never reaches the user as a corrupted "Receipt.pdf"; the mail still sends.
  const attachments = Array.isArray(files) ? files.filter(Boolean) : [];

  buildSendGridAttachments(attachments)
    .then((sgAttachments) => {
      const msg = {
        from: process.env.NODE_ENV === 'production'
          ? "Peko" + `<${process.env.EMAILER_USER_PROD}>`
          : "Peko" + `<${process.env.EMAILER_USER_DEV}>`,
        to: to,
        subject: subject,
        html: body,
        attachments: sgAttachments,
        ...(cc && { cc }) // only include cc if it's defined
      };
      return sgMail.send(msg);
    })
    .then(() => {
      cleanupAttachmentFiles(attachments);
      if (func) func(null);
      customLog(null, "info", { message: "Email with multiple attachments sent successfully", to });
    })
    .catch((error) => {
      customLog(null, "error", {
        error: error.response?.body || error.message || error,
        message: "Failed to send mail with multiple attachments",
        to
      });
      if (func) func(error);
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
  }).then(console.log).catch(console.error)
}

function emailBcc(to, subject, body, fileName, path, func) {
  const validation = validateRecipients(to);
  if (!validation.valid) {
    customLog(null, "error", { message: "Email validation failed", error: validation.error, to });
    if (func) func();
    return;
  }

  if (Array.isArray(to)) {
    to = to.join(",")
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
  sendWithRetry(mailOptions)
    .then((info) => {
      if (func) func();
      customLog(null, "info", { message: "Email BCC sent successfully", to, response: info.response });
    })
    .catch((error) => {
      customLog(null, "error", { 
        error: error.message || error, 
        errorCode: error.code,
        message: "Failed to send mail BCC after retries", 
        to 
      });
      if (func) func();
    });
}
function emailWithExcel(to, subject, fileName, path,body) {
  const validation = validateRecipients(to);
  if (!validation.valid) {
    customLog(null, "error", { message: "Email validation failed", error: validation.error, to });
    return Promise.reject(new Error(validation.error));
  }

  console.log(fileName);
  console.log(path);
  if (Array.isArray(to)) {
    to = to.join(",")
  }
  const mailOptions = {
    from: process.env.NODE_ENV === 'production'
      ? "Peko" + `<${process.env.EMAILER_USER_PROD}>`
      : "Peko" + `<${process.env.EMAILER_USER_DEV}>`,
    to: to,
    subject: subject,
    html:body,
    attachments: [{
      filename: fileName,
      path: path
    }]
  };

  return sendWithRetry(mailOptions)
    .then((info) => {
      customLog(null, "info", { message: "Email with Excel sent successfully", to, response: info.response });
      return true;
    })
    .catch((error) => {
      customLog(null, "error", { 
        error: error.message || error, 
        errorCode: error.code,
        message: "Failed to send mail with Excel after retries", 
        to 
      });
      throw error;
    });
}
function emailWithoutData(to, subject,body, func) {
  const validation = validateRecipients(to);
  if (!validation.valid) {
    customLog(null, "error", { message: "Email validation failed", error: validation.error, to });
    if (func) func();
    return;
  }

  if (Array.isArray(to)) {
    to = to.join(",")
  }
  const mailOptions = {
    from: process.env.NODE_ENV === 'production'
      ? "Peko" + `<${process.env.EMAILER_USER_PROD}>`
      : "Peko" + `<${process.env.EMAILER_USER_DEV}>`,
    to: to,
    subject: subject,
    html: body,
  };

  sendWithRetry(mailOptions)
    .then((info) => {
      if (func) func();
      customLog(null, "info", { message: "Email sent successfully", to, response: info.response });
    })
    .catch((error) => {
      customLog(null, "error", { 
        error: error.message || error, 
        errorCode: error.code,
        message: "Failed to send mail after retries", 
        to 
      });
      if (func) func();
    });
}
async function sendEmailForPaymentLink(to, subject, body, corporateName) {
  const validation = validateRecipients(to);
  if (!validation.valid) {
    customLog(null, "error", { message: "Email validation failed", error: validation.error, to });
    throw new Error(validation.error);
  }

  const mailOptions = {
    from: process.env.NODE_ENV === 'production'
      ? corporateName + `<${process.env.EMAILER_USER_PROD}>`
      : corporateName + `<${process.env.EMAILER_USER_DEV}>`,
    to: to,
    subject: subject,
    html: body
  };

  try {
    await sendWithRetry(mailOptions);
    customLog(null, "info", { message: "Payment link email sent successfully", to });
    return true;
  } catch (error) {
    customLog(null, "error", { 
      error: error.message || error, 
      errorCode: error.code,
      message: "Failed to send payment link email after retries", 
      to 
    });
    throw error;
  }
}


module.exports.email = email;
module.exports.emailWithAttachment = emailWithAttachment;
module.exports.emailBcc = emailBcc;
module.exports.send = send;
module.exports.emailWithExcel=emailWithExcel;
module.exports.emailWithoutData=emailWithoutData;
module.exports.emailWithMultipleAttachment=emailWithMultipleAttachment;
module.exports.sendEmailForPaymentLink = sendEmailForPaymentLink;
