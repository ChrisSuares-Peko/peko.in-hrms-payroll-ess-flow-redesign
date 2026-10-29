/* eslint-disable no-undef */
const nodemailer = require('nodemailer');
const Email = require('email-templates')
const path = require('path')
const poolConfig = {
  pool: true,
  host: 'smtp-mail.outlook.com',
  port: 587,
  secureConnection: false,
  auth: {
    user: 'support@peko.one',
    pass: 'Peko@123'
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

// `from` lets a resolved admin template's own `sender` override the default —
// see services/emailTemplateResolver.js. Omitted/falsy keeps today's default.
function email(to, subject, body, func, from) {
  const validation = validateRecipients(to);
  if (!validation.valid) {
    console.error("Email validation failed:", validation.error, "to:", to);
    if (func) func();
    return;
  }

  const mailOptions = {
    from: from || "Peko" + '<support@peko.one>',
    to: to,
    subject: subject,
    html: body
  };

  transporter.sendMail(mailOptions, function (error, info) {
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
    console.error("Email validation failed:", validation.error, "to:", to);
    if (func) func();
    return;
  }

  const mailOptions = {
    from: "Peko" + '<support@peko.one>',
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
      return console.log(error);
    }
    if (func) func();
    console.log('Message sent: ' + info.response);
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
      from: "Peko" + '<support@peko.one>',
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
    console.error("Email validation failed:", validation.error, "to:", to);
    if (func) func();
    return;
  }

  const mailOptions = {
    from: "Peko" + '<be_support@peko.one>',
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
      return console.log(error)
    }
    if (func) func()
    console.log('Message sent: ' + info.response)
  })
}
function emailWithExcel(to, subject, fileName, path,body) {
  const validation = validateRecipients(to);
  if (!validation.valid) {
    console.error("Email validation failed:", validation.error, "to:", to);
    return Promise.reject(new Error(validation.error));
  }

  console.log(fileName);
  console.log(path);

  const mailOptions = {
    from: "Peko" + '<support@peko.one>',
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
        console.log(error);
        reject(error);
      } else {
        console.log('Message sent: ' + info.response);
        resolve(true);
      }
    });
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
    from: "Peko" + "<support@peko.one>",
    to: to,
    subject: subject,
    html: body,
  };

  transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      return console.log(error);
    }
    if (func) func();
    console.log("Message sent: " + info.response);
  });
}

// `from` (7th param, after `func`) lets a resolved admin template's own `sender`
// override the default — see services/emailTemplateResolver.js. Omitted/falsy
// keeps today's default.
function emailWithMultipleAttachment(to, subject, body, files, cc, func, from) {
  if (typeof cc === 'function' && !func) {
    func = cc;
    cc = undefined;
  }

  const validation = validateRecipients(to);
  if (!validation.valid) {
    console.error("Email validation failed:", validation.error, "to:", to);
    if (func) func(new Error(validation.error));
    return;
  }

  if (Array.isArray(to)) to = to.join(',');

  const mailOptions = {
    from: from || 'Peko' + '<support@peko.one>',
    to,
    subject,
    html: body,
    attachments: files,
    ...(cc && { cc }),
  };

  transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      console.log(error);
      if (func) func(error);
      return;
    }
    if (func) func(null, info);
    console.log('Message sent: ' + info.response);
  });
}



module.exports.email = email;
module.exports.emailWithAttachment = emailWithAttachment;
module.exports.emailBcc = emailBcc;
module.exports.send = send;
module.exports.emailWithExcel=emailWithExcel;
module.exports.emailWithoutData=emailWithoutData;
module.exports.emailWithMultipleAttachment=emailWithMultipleAttachment;


