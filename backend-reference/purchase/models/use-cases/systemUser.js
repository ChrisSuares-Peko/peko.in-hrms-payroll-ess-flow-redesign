/* eslint-disable no-unused-vars */
const systemUser = require("./../entities/systemUser");
const credential = require("./../entities/credential");
const wallet = require("./../entities/wallet");
const sequelize = require("../../configs/database/index");
//const sequelize = require('sequelize')
// const moment = require('moment')
const { Op } = require("sequelize");
const emailer = require("../../utils/emailer");
const asyncHandler = require("./../../middlewares/async");
const { setNewPasswordTemplate } = require("../../utils/templatesForEmails");
const partnerLogos = require("../../public/partnerLogos");
const { customLog } = require("../../utils/loggerHelper");
// const ErrorResponse = require('./../../utils/error-response')

exports.create = asyncHandler(async (params, req = undefined) => {
  let transaction;
  try {
    transaction = await sequelize.transaction();
  const details = await credential.create(params, {
    transaction: transaction,
  });
  const user = await systemUser.create(
    {
      ...params,
      credentialId: details.id,
    },
    {
      transaction: transaction,
    }
  );
  await transaction.commit();
  //Get reset token
  const resetToken = details.getResetPasswordToken();
  credential.update(
    {
      passwordResetToken: resetToken.resetPasswordToken,
      passwordResetExpires: resetToken.resetPasswordExpire,
    },
    {
      where: {
        id: details.id,
      },
    }
  );

  const baseUrl = user.portalUrl && user.portalUrl.trim() !== "" ? user.portalUrl : `${req.protocol}://${req.get("host")}`;
  const resetUrl = `${baseUrl}/system/reset/${resetToken.resetPasswordToken}`;
  // const message = `Set a new password for your peko account before login.\n\n
  // \n If above button is not working, then click below link: \n\n \n <br>
  // ${resetUrl}`;
  const message = `Please create a new password for your Peko account before logging in.\n\n
    \n If the button above is unresponsive, you may click on the link below.\n\n \n <br>
    ${resetUrl}`;
  let filePath, webUrl;
  let environment = process.env.NODE_ENV;
  if (environment === "production") {
    filePath = "http://162.243.172.106:4444/assets/images/logo/logo.png";
    webUrl = "http://uat.kash31.com";
  } else {
    filePath = "http://162.243.172.106:4444/assets/images/logo/logo.png";
    webUrl = "http://uat.kash31.com";
  }

  const to = params.email; // Set recipient email address
  const subject = "Set New Password"; // Set email subject
  const body = setNewPasswordTemplate({ resetUrl, message });
  // Call email function to send email with payment details in the body
  emailer.email(to, subject, body, function () {
    console.log("Email sent to " + to);
  });
  return user;
  } catch (error) {
    if (transaction) await transaction.rollback();
    console.error("Error during system user creation:", error);
    return false;
  }
});

exports.findOne = asyncHandler(async (params) => {
  return await systemUser.findOne({
    where: {
      credentialId: params.id,
    },
  });
});

exports.find = asyncHandler(async (params) => {
  return await systemUser.findOne({
    where: {
      email: params.email,
    },
  });
});

exports.findAll = asyncHandler(async (params) => {
  return await systemUser.findAll({
    where: {
      id: params.id,
    },
  });
});

exports.update = asyncHandler(async (params, data) => {
  let transaction;
  try {
    let transaction = await sequelize.transaction();
    await credential.update(data, {
      where: {
        id: params.id,
      },
      transaction: transaction,
    });

    await systemUser.update(data, {
      where: {
        credentialId: params.id,
      },
      transaction: transaction,
    });

    await transaction.commit();
    return true;
  } catch (error) {
    if (transaction) await transaction.rollback();
      console.error("Error updating system user:", error);
      return false;
  }
});

exports.deleteOne = asyncHandler(async (params) => {
  return await systemUser.destroy({
    where: {
      id: params.id,
    },
  });
});

exports.updateStatus = asyncHandler(async (req, res, next) => {
  const params = req.params;
  const data = req.body;
  return await systemUser.update(data, {
    where: {
      id: params.id,
    },
  });
});
/*exports.updateStatus = async (req, res, next) => {
    const params = req.params;
    const data = req.body;
  
    // Fetch the current system user record
    const systemUserRecord = await systemUser.findByPk(params.id);
  
    // Update the status based on its current value
    const newStatus = systemUserRecord.status === 0 ? 1 : 0;
    data.status = newStatus;
  
    // Update the system user record with the new status value
    await systemUser.update(data, {
      where: {
        id: params.id
      }
    });
  
    // Return the updated system user record
    const updatedSystemUserRecord = await systemUser.findByPk(params.id);
    return res.status(200).json(updatedSystemUserRecord);
  };
  */

exports.findAllAndCount = asyncHandler(async (params) => {
  let { start, length, draw, searchText, order, column, userId } = params;
  const sortableColumns = ["id", "username", "name", "role", "email", "isActive"];
  // Convert column index to column name
  if (column >= 0 && column < sortableColumns.length) {
    column = sortableColumns[column];
  } else {
    column = "createdAt"; // Default column name if invalid index is provided
  }

  let data = await systemUser.findAndCountAll({
    include: [
      {
        model: credential,

        where: {
          id: {
            [Op.ne]: userId,
          },
          // [Op.or]: [{
          //     username: {
          //         [Op.like]: '%' + searchText + '%'
          //     }
          // }]
        },
        attributes: ["username", "role", "name"],
      },
    ],
    where: {
      [Op.or]: [
        {
          id: {
            [Op.like]: "%" + searchText + "%",
          },
        },
        {
          email: {
            [Op.like]: "%" + searchText + "%",
          },
        },
        {
          "$credential.username$": {
            [Op.like]: "%" + searchText + "%",
          },
        },
        {
          "$credential.name$": {
            [Op.like]: "%" + searchText + "%",
          },
        },
        {
          "$credential.role$": {
            [Op.like]: "%" + searchText + "%",
          },
        },
      ],
    },
    order: [[column, order]],
    limit: length,
    offset: start,
    raw: true,
    nest: true,
  });
  let credentialIds = [];
  for (let i = 0; i < data.rows.length; i++) {
    credentialIds.push(data.rows[i].credentialId);
  }
  let walletData = await wallet.findAll({
    where: {
      credentialId: {
        [Op.in]: credentialIds,
      },
    },
    raw: true,
  });
  let walletObj = {};
  for (let val of walletData) {
    walletObj[val.credentialId] = val.balance;
  }
  for (let i = 0; i < data.rows.length; i++) {
    if (walletObj[data.rows[i].credentialId]) {
      data.rows[i].balance = walletObj[data.rows[i].credentialId];
    }
  }
  return data;
});

exports.excelCsvData = asyncHandler(async (params) => {
  let { order, column, userId } = params;

  let data = await systemUser.findAndCountAll({
    include: [
      {
        model: credential,
        where: {
          id: {
            [Op.ne]: userId,
          },
          // role: 'ADMIN',
        },
        attributes: ["username", "role", "name"],
      },
    ],
    order: [[column, order]],
    attributes: ["id", "isActive", "email", "credentialId"],
    raw: true,
    nest: true,
  });
  let credentialIds = [];
  for (let i = 0; i < data.rows.length; i++) {
    credentialIds.push(data.rows[i].credentialId);
  }
  let walletData = await wallet.findAll({
    where: {
      credentialId: {
        [Op.in]: credentialIds,
      },
    },
    raw: true,
  });
  let walletObj = {};
  for (let val of walletData) {
    walletObj[val.credentialId] = val.balance;
  }
  for (let i = 0; i < data.rows.length; i++) {
    if (walletObj[data.rows[i].credentialId]) {
      data.rows[i].balance = walletObj[data.rows[i].credentialId];
    }
  }
  let finalData = [];
  data.rows.forEach(function (limitData) {
    finalData.push({
      Id: limitData.id,
      username: limitData.credential.username ? limitData.credential.username : "Not Available",
      Name: limitData.credential.name ? limitData.credential.name : "Not Available",
      Email: limitData.email ? limitData.email : "Not Available",
      Status: limitData.isActive == 1 ? "True" : "false",
    });
  });
  return finalData;
});

exports.fetchByRole = asyncHandler(async (params) => {
  const whereClause = {};

  if (params.searchText) {
    whereClause[Op.or] = [
      {
        "$systemUser.email$": {
          [Op.like]: "%" + params.searchText + "%",
        },
      },
      {
        "$credential.name$": {
          [Op.like]: "%" + params.searchText + "%",
        },
      },
      {
        "$credential.username$": {
          [Op.like]: "%" + params.searchText + "%",
        },
      },
    ];
  }
  whereClause["$credential.role$"] = params.role;

  return await systemUser.findAll({
    where: whereClause,
    include: [
      {
        model: credential,
      },
    ],
    raw: true,
    nest: true,
  });
});

exports.createResendMail = asyncHandler(async (params, req = undefined) => {
  const details = await credential.findOne({
    where: {
      id: params.id,
    },
  });
  const resetToken = details.getResetPasswordToken();
  const resetTokenValidation = await credential.update(
    {
      passwordResetToken: resetToken.resetPasswordToken,
      passwordResetExpires: resetToken.resetPasswordExpire,
    },
    {
      where: {
        id: details.id,
      },
    }
  );
  const resultSystemUser = await this.findOne(params);
  const systemUser = resultSystemUser.get({ plain: true });
  const baseUrl =
    systemUser.portalUrl && systemUser.portalUrl.trim() !== "" ? systemUser.portalUrl : `${req.protocol}://${req.get("host")}`;

  const resetUrl = `${baseUrl}/system/reset/${resetToken.resetPasswordToken}`;
  // const message = `Set a new password for your peko account before login.\n\n
  // \n If above button is not working, then click below link: \n\n \n <br>
  // ${resetUrl}`;
  const message = `Please create a new password for your Peko account before logging in.\n\n
    \n If the button above is unresponsive, you may click on the link below.\n\n \n <br>
    ${resetUrl}`;
  let filePath, webUrl;
  let environment = process.env.NODE_ENV;
  if (environment === "production") {
    filePath = "http://162.243.172.106:4444/assets/images/logo/logo.png";
    webUrl = "http://uat.kash31.com";
  } else {
    filePath = "http://162.243.172.106:4444/assets/images/logo/logo.png";
    webUrl = "http://uat.kash31.com";
  }

  const to = details.email; // Set recipient email address
  const subject = "Set New Password"; // Set email subject
  const body = setNewPasswordTemplate({ resetUrl, message });
  // Call email function to send email with payment details in the body
  emailer.email(to, subject, body, function () {
    console.log("Email sent to " + to);
  });
  return resetTokenValidation;
});

//function for fetching partner details and assets
exports.fetchPartnerDetails = asyncHandler(async (credentialId) => {
  let result = null;
  if (credentialId) {
      try {
          result = await systemUser.findOne({
                where: {
                    credentialId
                },
                attributes: ['assets', 'branding', 'sharePercentage', 'gatewayCharge', 'state'],
                nest: true,
                raw: true
            });
          if (!result) {
              customLog(null, 'warn', {
                  message: 'fetchPartnerDetails: no systemUser row found for credentialId, falling back to default branding',
                  credentialId,
              });
          }
      } catch (error) {
          customLog(null, 'error', {
              message: 'fetchPartnerDetails: partner branding lookup failed, falling back to default branding',
              credentialId,
              error: error?.message,
          });
      }
  }

  return {
      logo: result?.assets?.logo || partnerLogos[0]?.logo,
      baseUrl: result?.assets?.baseUrl || partnerLogos[0]?.baseUrl,
      branding: result?.branding || partnerLogos[0]?.branding,
      sharePercentage: result?.sharePercentage,
      gatewayCharge: result?.gatewayCharge,
      state: result?.state,
  };
})