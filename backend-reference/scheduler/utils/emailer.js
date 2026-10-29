const nodemailer = require('nodemailer');
const Email = require('email-templates')
const path = require('path');
const { customLog } = require('./loggerHelper');
const sgMail = require("@sendgrid/mail");
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
  },
  connectionTimeout: 60000, // 60 seconds
  greetingTimeout: 30000, // 30 seconds
  socketTimeout: 60000, // 60 seconds
  maxConnections: 5,
  maxMessages: 100
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

// Retry helper function with exponential backoff
async function sendWithRetry(mailOptions, maxRetries = 3, retryDelay = 2000) {
  let lastError;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error(`Email send timeout after ${poolConfig.socketTimeout}ms`));
        }, poolConfig.socketTimeout);
        
        transporter.sendMail(mailOptions, (error, info) => {
          clearTimeout(timeout);
          if (error) {
            reject(error);
          } else {
            resolve(info);
          }
        });
      });
    } catch (error) {
      lastError = error;
      const isTimeout = error.message?.includes('timeout') || error.code === 'ETIMEDOUT' || error.code === 'ECONNRESET';
      const isRetryable = isTimeout || error.code === 'ECONNREFUSED' || error.responseCode === 421;
      
      if (attempt < maxRetries && isRetryable) {
        const delay = retryDelay * Math.pow(2, attempt - 1); // Exponential backoff
        console.warn(`Email send attempt ${attempt} failed, retrying in ${delay}ms`, error.message || error);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      throw error;
    }
  }
  throw lastError;
}

function email(to, subject, body, func) {
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
      customLog(null, "info", { message: "Email sent successfully" });
      if (func) func();
    })
    .catch((error) => {
      customLog(null, "error", { message: "SendGrid Error", error: error.response?.body || error });
    });
}

function emailWithoutData(to, subject,body, func) {
  const validation = validateRecipients(to);
  if (!validation.valid) {
    console.error("Email validation failed:", validation.error, "to:", to);
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
  };

  transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      return customLog(null, "error", { error, message: "Email sending error" });
    }
    if (func) func();
    customLog(null, "info", { message: "Email sent successfully", response: info.response });
  });
}

function emailWithAttachment(to, subject, body, fileName, path, func) {
  const validation = validateRecipients(to);
  if (!validation.valid) {
    console.error("Email validation failed:", validation.error, "to:", to);
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

  sendWithRetry(mailOptions)
    .then((info) => {
      if (func) func();
      customLog(null, "info", { message: "Email sent successfully", response: info.response });
    })
    .catch((error) => {
      console.error('Failed to send email after retries:', error.message || error, 'to:', to);
      if (func) func();
    });
}
function emailWithExcel(to, subject, fileName, path, body) {
  const validation = validateRecipients(to);
  if (!validation.valid) {
    console.error("Email validation failed:", validation.error, "to:", to);
    return Promise.reject(new Error(validation.error));
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

  return new Promise((resolve, reject) => {
    transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
        customLog(null, "error", { error, message: "Email sending error" });
        reject(error);
      } else {
        customLog(null, "info", { message: "Email sent successfully", response: info.response });
        resolve(true);
      }
    });
  });
}

function emailWithExcelAdmin(to, subject, fileName, path, body) {
  const validation = validateRecipients(to);
  if (!validation.valid) {
    console.error("Email validation failed:", validation.error, "to:", to);
    return Promise.reject(new Error(validation.error));
  }

  const mailOptions = {
    from: process.env.NODE_ENV === 'production'
      ? "Peko" + `<${process.env.EMAILER_USER_PROD}>`
      : "Peko" + `<${process.env.EMAILER_USER_DEV}>`,
    to: to,
    subject: subject,
    html: body,
  };
  if (fileName && path) {
    mailOptions.attachments = [
      {
        filename: fileName,
        path: path,
      }
    ];
  }
  return sendWithRetry(mailOptions)
    .then((info) => {
      customLog(null, "info", { message: "Email sent successfully", to, response: info.response });
      return true;
    })
    .catch((error) => {
      console.error('Failed to send email with Excel after retries:', error.message || error, 'to:', to);
      throw error;
    });
}

function emailWithMultipleAttachment(to, subject, body, files, func) {
  const validation = validateRecipients(to);
  if (!validation.valid) {
    console.error("Email validation failed:", validation.error, "to:", to);
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

  sendWithRetry(mailOptions)
    .then((info) => {
      if (func) func();
      customLog(null, "info", { message: "Email sent successfully", response: info.response });
    })
    .catch((error) => {
      console.error('Failed to send email after retries:', error.message || error, 'to:', to);
      if (func) func();
    });
}

function send(data) {
  const validation = validateRecipients(data.to);
  if (!validation.valid) {
    console.error("Email validation failed:", validation.error, "to:", data.to);
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
    .then((info) => {
      customLog(null, "info", { message: "Email template sent successfully", info });
    })
    .catch((error) => {
      console.error('Failed to send email template:', error.message || error);
    });
}

function emailBcc(to, subject, body, fileName, path, func) {
  const validation = validateRecipients(to);
  if (!validation.valid) {
    console.error("Email validation failed:", validation.error, "to:", to);
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
      return customLog(null, "error", { error, message: "Email sending error" });
    }
    if (func) func()
    customLog(null, "info", { message: "Email sent successfully", response: info.response });
  })
}

module.exports.email = email;
module.exports.emailWithAttachment = emailWithAttachment;
module.exports.emailBcc = emailBcc;
module.exports.send = send;
module.exports.emailWithMultipleAttachment = emailWithMultipleAttachment;
module.exports.emailWithExcel = emailWithExcel;
module.exports.emailWithExcelAdmin = emailWithExcelAdmin;
module.exports.emailWithoutData = emailWithoutData;