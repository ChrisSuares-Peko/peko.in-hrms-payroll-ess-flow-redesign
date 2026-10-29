/* eslint-disable no-undef */
const fs = require('fs');
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


const transporter = nodemailer.createTransport(poolConfig);

const SENDGRID_TIMEOUT_MS = 60000;
let sendGridKeyMissingLogged = false;

const trimmed = (value) => (value || '').trim();

function sendGridApiKey() {
  if (trimmed(process.env.EMAILVIA).toLowerCase() !== 'sendgrid') return '';
  const apiKey = trimmed(process.env.SENDGRID_API_KEY);
  if (!apiKey && !sendGridKeyMissingLogged) {
    sendGridKeyMissingLogged = true;
    customLog(null, 'error', { action: 'email:sendgridKeyMissing', message: 'EMAILVIA is sendgrid but SENDGRID_API_KEY is not set, sending over SMTP' });
  }
  return apiKey;
}

function sendGridMailbox() {
  const mailbox = process.env.NODE_ENV === 'production' ? process.env.EMAILER_USER_PROD : process.env.EMAILER_USER_DEV;
  return trimmed(mailbox) || 'support@peko.one';
}

function addressList(value) {
  const list = Array.isArray(value) ? value : String(value || '').split(',');
  return list.map((address) => String(address || '').trim()).filter(Boolean);
}

function uniqueAddresses(addresses, taken) {
  return addresses.filter((address) => {
    const key = address.toLowerCase();
    if (taken.has(key)) return false;
    taken.add(key);
    return true;
  });
}

async function sendGridAttachments(attachments) {
  const files = Array.isArray(attachments) ? attachments.filter(Boolean) : [];
  return Promise.all(files.map(async (file) => {
    let content;
    if (file.path) {
      content = await fs.promises.readFile(file.path);
    } else if (Buffer.isBuffer(file.content)) {
      content = file.content;
    } else {
      content = Buffer.from(String(file.content ?? ''), file.encoding || 'utf8');
    }
    const filename = path.basename(String(file.filename || file.path || 'attachment'));
    return {
      content: content.toString('base64'),
      filename,
      type: file.contentType || (/\.pdf$/i.test(filename) ? 'application/pdf' : 'application/octet-stream'),
      disposition: 'attachment',
    };
  }));
}

function deliver(mailOptions, callback) {
  const apiKey = sendGridApiKey();
  if (!apiKey) {
    transporter.sendMail(mailOptions, callback);
    return;
  }

  sgMail.setApiKey(apiKey);
  sgMail.setTimeout(SENDGRID_TIMEOUT_MS);
  const mailbox = sendGridMailbox();
  const requestedTo = addressList(mailOptions.to);
  const requestedBcc = addressList(mailOptions.bcc);
  const taken = new Set();
  const to = uniqueAddresses(requestedTo.length === 0 && requestedBcc.length > 0 ? [mailbox] : requestedTo, taken);
  const cc = uniqueAddresses(addressList(mailOptions.cc), taken);
  const bcc = uniqueAddresses(requestedBcc, taken);

  sendGridAttachments(mailOptions.attachments)
    .then((attachments) => sgMail.send({
      from: `Peko<${mailbox}>`,
      to,
      subject: mailOptions.subject,
      html: mailOptions.html,
      ...(cc.length && { cc }),
      ...(bcc.length && { bcc }),
      ...(attachments.length && { attachments }),
    }))
    .then(([response]) => {
      callback(null, { response: `${response?.statusCode} ${response?.headers?.['x-message-id'] || ''}`.trim() });
    })
    .catch((error) => {
      customLog(null, 'error', {
        action: 'email:sendgridFailed',
        to,
        subject: mailOptions.subject,
        error: error?.response?.body || error?.message || error,
      });
      callback(error);
    });
}

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

  const mailOptions = {
    to,
    from: fromEmail,
    subject,
    html: body,
  };

  deliver(mailOptions, function (error, info) {
    if (error) {
      return console.log(error);
    }
    if (func) func();
    console.log('Message sent: ' + info.response);
  });
}

function emailWithCc(to, subject, body, cc, func) {
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

  const mailOptions = {
    to,
    from: fromEmail,
    subject,
    html: body,
  };

  if (cc && Array.isArray(cc) && cc.length > 0) { // Check if cc argument is provided
    mailOptions.cc = cc; // Add cc property if available
  }

  deliver(mailOptions, function (error, info) {
    if (error) {
      return console.log(error);
    }
    if (func) func();
    console.log('Message sent: ' + info.response);
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

  deliver(mailOptions, function (error, info) {
    if (error) {
      return customLog(null, "error", { message: "Email with attachment error", error });
    }
    if (func) func();
    customLog(null, "info", { message: "Email with attachment sent successfully", response: info.response });
  });
}

function emailWithMultipleAttachment(to, subject, body, files, cc, func) {
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
    to = to.join(",");
  }
  const attachments = Array.isArray(files) ? files.filter(Boolean) : [];

  const mailOptions = {
    from: process.env.NODE_ENV === 'production'
      ? "Peko" + `<${process.env.EMAILER_USER_PROD}>`
      : "Peko" + `<${process.env.EMAILER_USER_DEV}>`,
    to: to,
    subject: subject,
    html: body,
    attachments: attachments,
  };
  if (cc) {
    mailOptions.cc = cc;
  }
  if (attachments.length === 0) {
    delete mailOptions.attachments;
  }

  deliver(mailOptions, function (error, info) {
    if (error) {
      customLog(null, "error", { message: "Email with multiple attachments error", error });
      if (func) func(error);
      return;
    }
    if (func) func();
    customLog(null, "info", { message: "Email with multiple attachments sent successfully", response: info.response });
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
  deliver(mailOptions, function (error, info) {
    if (error) {
      return customLog(null, "error", { message: "Email BCC error", error });
    }
    if (func) func()
    customLog(null, "info", { message: "Email BCC sent successfully", response: info.response });
  })
}


module.exports.email = email;
module.exports.emailWithAttachment = emailWithAttachment;
module.exports.emailWithMultipleAttachment = emailWithMultipleAttachment;
module.exports.emailBcc = emailBcc;
module.exports.send = send;
module.exports.emailWithCc = emailWithCc;
