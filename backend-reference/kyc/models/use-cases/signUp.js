/* eslint-disable no-unused-vars */
const signUp = require('./../entities/signUp')
const Package = require('./../entities/package')
const Otp = require('../entities/otp')
const sequelize = require('../../configs/database/index')
const {
  Op
} = require("sequelize");
const corporateUser = require('./../entities/corporateUser')
const credential = require('./../entities/credential')
const asyncHandler = require('./../../middlewares/async')
const wallet = require("../entities/wallet");
const {
  passwordCreatedSuccessfullyTemplate,
  accountCreatedSuccessTemplate
} = require('../../utils/emailTemplates')
const emailer = require('../../utils/emailer');
const crypto = require('crypto');
const {
  authenticator
} = require('otplib');

exports.create = async (params) => {
  const details = await signUp.create(params)
  return details
}
exports.updateDetails = asyncHandler(async (params, data) => {
  return await signUp.update(data, {
    where: {
      id: params.id
    }
  })
})
exports.findOne = asyncHandler(async (params) => {
  return await signUp.findOne({
    where: {
      id: params.id
    }
  })
})

exports.findByAnyField = asyncHandler(async (query) => {
  return await corporateUser.findOne({
    where: query
  })
})

exports.findUsername = asyncHandler(async (params) => {
  const results = await credential.findOne({
    where: {
      username: params
    }
  });
  return results;
});

exports.findAllPendingRequest = asyncHandler(async () => {

  return await signUp.count({
    where: {
      status: 'PENDING'
    }
  })

})
exports.Delete = asyncHandler(async (params) => {
  return await signUp.destroy({
    where: {
      id: params.id
    }
  })
})

exports.createOtp = asyncHandler(async (body) => {
  console.log("Create OTP HASH: ", body.pin)
  let details;
  const isMobileAvailable = await Otp.findOne({
    where: {
      mobile: body.mobile
    }
  })

  if (isMobileAvailable) {
    //update record
    if (body.verification === 'mobile') {
      details = await Otp.update({
        pin: body.pin,
        used: 0
      }, {
        where: {
          mobile: body.mobile
        }
      })
    } else if (body.verification === 'email') {
      details = await Otp.update({
        emailOtp: body.emailOtp,
        used: 0
      }, {
        where: {
          mobile: body.mobile
        }
      })
    } else {
      details = await Otp.update({
        pin: body.pin,
        emailOtp: body.emailOtp,
        used: 0
      }, {
        where: {
          mobile: body.mobile
        }
      })
    }
  } else {
    //create new record
    details = await Otp.create(body);
  }
  return details
})
/*
exports.createOtp = asyncHandler(async (body) => {
  console.log("Create OTP HASH: ", body.pin);
  const isMobileAvailable = await Otp.findOne({
    where: {
      mobile: body.mobile
    }
  });

  // Set OTP expiration time to 2 minutes from now
  const expirationTime = new Date(Date.now() + 120000); // 2 minutes

  if (isMobileAvailable) {
    // Update record
    const updatedDetails = await Otp.update({
      pin: body.pin,
      used: 0,
      expirationTime: expirationTime
    }, {
      where: {
        mobile: body.mobile
      }
    });

    // Set timeout to automatically delete the OTP after 2 minutes
    setTimeout(async () => {
      await Otp.destroy({
        where: {
          mobile: body.mobile
        }
      });
    }, 120000);

    return updatedDetails;
  } else {
    // Create new record
    const newDetails = await Otp.create({
      ...body,
      expirationTime: expirationTime
    });

    // Set timeout to automatically delete the OTP after 2 minutes
    setTimeout(async () => {
      await Otp.destroy({
        where: {
          mobile: body.mobile
        }
      });
    }, 120000);

    return newDetails;
  }
});
*/

// Verify TOTP token
exports.authVerification = asyncHandler(async (userId, token) => {
  const user = await corporateUser.findOne({
    where: {
      credentialId: userId
    }
  });
  const totpSecret = user.totpSecret;
  if (!user) {
    return false
  } else if (!totpSecret) {
    return false
  } else {
    const valid = authenticator.check(token, totpSecret);
    if (valid) {
      return ({
        "valid": true
      });
    } else {
      return false
    }
  }
});

exports.otpVerification = asyncHandler(async (otp, emailOtp, mobileNo) => {

  let otpDetail = await Otp.findOne({
    where: {
      mobile: mobileNo,
      used: 0
    }
  })
  console.log("V", otpDetail)
  if (!otpDetail) {
    return false;
  }


  if (!(await otpDetail.validatePin(otp))) {
    return false;
  }

  if (!(await otpDetail.validateEmail(emailOtp))) {
    return false;
  }

  const OtpVerified = await Otp.update({
    used: 1
  }, {
    where: {
      mobile: mobileNo,
      createdAt: {
        [Op.lte]: new Date(otpDetail.createdAt.getTime() + 20000)
      }
    }
  });

  if (OtpVerified[0] == 1) {
    return true;
  }
  return false;
})




// eslint-disable-next-line no-unused-vars
exports.Update = asyncHandler(async (params, requestData, req = undefined) => {

  let transaction = await sequelize.transaction();
 try {
   // let data = await signUp.findOne({
  //   where: {
  //     id: params.id
  //   },
  //   raw: true
  // })
  // if (!data) return false
  // // if (requestData.status == 'APPROVED') {
  // await signUp.update({
  //   status: requestData.status
  // }, {
  //   where: {
  //     id: params.id
  //   },
  //   transaction
  // })

  let password = requestData.password
  requestData.password = await credential.hashPassword(password)

  const details = await credential.create({
    ...requestData,
    role: 'CORPORATE'
  }, {
    transaction: transaction
  })

  await wallet.create({
    credentialId: details.id
  }, {
    transaction: transaction
  })
  const packageBasic = await Package.findOne({
    where: {
      packageName: "Basic"
    },
    transaction,
    attributes: ['id'],
    raw: true
  })
  console.log("next create user!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
  const user = await corporateUser.create({
    ...requestData,
    mobileNo: requestData.mobileNo,
    email: requestData.email,
    credentialId: details.id,
    registeredBy: null,
    packageId: packageBasic ? packageBasic.id : null,
    website: requestData.website,
    contactPersonEmail: requestData.contactPersonEmail,
    contactPersonPhone: requestData.contactPersonNumber

  }, {
    transaction: transaction
  })

  console.log(user, "user created!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
  ////Get reset token
  // const resetToken = details.getResetPasswordToken();
  // const resetTokenValidation = credential.update({
  //   passwordResetToken: resetToken.resetPasswordToken,
  //   passwordResetExpires: resetToken.resetPasswordExpire
  // }, {
  //   where: {
  //     role: 'CORPORATE',
  //     id: details.id
  //   },
  // })
  // // //Create reset url
  // const resetUrl = `${req.protocol}://${req.get('host')}/system/reset/${resetToken.resetPasswordToken}`
  // //let resetUrl = 'https://sitae.peko.one/system/login'

  await transaction.commit();


  let emailBody = await accountCreatedSuccessTemplate(requestData.name, requestData.username, requestData.email)
  emailer.email(requestData.email, 'Account Created Successfully', emailBody)
  console.log(user, "after saving user and sending email-----~~~~~~~~~~~~~");

  return user
 } catch (error) {
  if (transaction) await transaction.rollback();
    console.error("Error updating corporate user:", error);
    return false;
 }
})

exports.passwordResetLink = asyncHandler(async (params, req = undefined) => {
  let data = await signUp.findOne({
    where: {
      id: params.id
    },
    raw: true
  })
  if (!data) return false
  const user = await corporateUser.findOne({
    where: {
      email: data.email
    },
    raw: true
  })
  if (!user)
    return false;
  const userCredentials = await credential.findOne({
    where: {
      id: user.credentialId
    },
    raw: true
  })

  if (!userCredentials) return false;

  //Generate the token
  const resetToken = crypto.randomBytes(20).toString('hex')

  //Hash token and set to resetPasswordToken field
  const resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex')

  //Set the expire
  const resetPasswordExpire = Date.now() + 10 * 60 * 1000;

  const resetTokenValidation = await credential.update({
    passwordResetToken: resetPasswordToken,
    passwordResetExpires: resetPasswordExpire
  }, {
    where: {
      role: 'CORPORATE',
      id: userCredentials.id
    }
  })
  if (!resetTokenValidation) {
    return false;
  }
  //Create reset url
  let newMessage = 'Click below to reset your password.'
  let headMessage = 'Password Reset'
  if (req.body.val == 'createNewPassword') {
    newMessage = 'Click below to create new password'
    headMessage = 'New Password'
  }
  const resetUrl = `${req.protocol}://${req.get('host')}/system/reset/${resetPasswordToken}`
  const message = `Set a new password for your peko account before login.\n\n\n If above button is not working, then click below link: \n\n\n ${resetUrl}`;
  let filePath, webUrl
  // eslint-disable-next-line no-undef
  let environment = process.env.NODE_ENV
  if (environment === 'production') {
    filePath = 'http://162.243.172.106:4444/assets/images/logo/logo.png'
    webUrl = 'http://uat.kash31.com'
  } else {
    filePath = 'http://162.243.172.106:4444/assets/images/logo/logo.png'
    webUrl = 'http://uat.kash31.com'
  }
  let emailBody = await passwordCreatedSuccessfullyTemplate(data, resetUrl)
  emailer.email(data.email, 'Set New Password', emailBody)

  return user
})

exports.Delete = asyncHandler(async (params) => {
  return await signUp.destroy({
    where: {
      id: params.id
    }
  })
})
exports.findAllandCount = asyncHandler(async (params) => {
  let {
    start,
    length,
    draw,
    searchText,
    order,
    column,
    selectStatus
  } = params;
  const sortableColumns = [
    'username',
    'name',
    'mobileNo',
    'email',
    'status',
  ];
  // Convert column index to column name
  if (column >= 0 && column < sortableColumns.length) {
    column = sortableColumns[column];
    console.log("column selected", column)
  } else {
    column = 'createdAt'; // Default column name if invalid index is provided
  }

  let whereClause = {
    [Op.or]: [{
      id: {
        [Op.like]: '%' + searchText + '%'
      }
    }, {
      username: {
        [Op.like]: '%' + searchText + '%'
      }
    }, {
      name: {
        [Op.like]: '%' + searchText + '%'
      }
    }, {
      email: {
        [Op.like]: '%' + searchText + '%'
      }
    }, {
      mobileNo: {
        [Op.like]: '%' + searchText + '%'
      }
    }, {
      businessRegNo: {
        [Op.like]: '%' + searchText + '%'
      }
    }, {
      contactPersonName: {
        [Op.like]: '%' + searchText + '%'
      }
    }, {
      contactPersonNumber: {
        [Op.like]: '%' + searchText + '%'
      }
    }, {
      address: {
        [Op.like]: '%' + searchText + '%'
      }
    }, {
      city: {
        [Op.like]: '%' + searchText + '%'
      }
    }]
  };

  if (selectStatus !== undefined) {
    whereClause.status = selectStatus;
  }

  return await signUp.findAndCountAll({
    where: whereClause,
    order: [
      [column, order]
    ],
    limit: length,
    raw: true,
    offset: start
  });
});
exports.getExcel = asyncHandler(async (params) => {
  let data = await signUp.findAll({
    attributes: ['id', 'username', 'name', 'email', 'mobileNo', 'businessRegNo', 'contactPersonName',
      'contactPersonNumber', 'address', 'city', 'status', 'firstName', 'lastName', 'designation'
    ],
    order: [
      ['createdAt', 'DESC']
    ],
    raw: true

  })
  let finalData = []
  data.forEach(function (limitData) {
    finalData.push({
      'ID': limitData.id,
      'Account ID': limitData.username ? limitData.username : 'Not Available',
      'First Name': limitData.firstName ? limitData.firstName : 'Not Available',
      'Last Name': limitData.lastName ? limitData.lastName : 'Not Available',
      'Corporate Name': limitData.name ? limitData.name : 'Not Available',
      'Mobile Number': limitData.mobileNo ? limitData.mobileNo : 'Not Available',
      'Designation': limitData.designation ? limitData.designation : 'Not Available',
      'Email ID': limitData.email ? limitData.email : 'Not Available',
      //'Business RegNo': limitData.businessRegNo ? limitData.businessRegNo : 'Not Available',
      //'contactPersonName': limitData.contactPersonName ? limitData.contactPersonName : 'Not Available',
      //'contactPersonNumber': limitData.contactPersonNumber ? limitData.contactPersonNumber : 'Not Available',
      'Status': limitData.status ? limitData.status : 'Not Available'
    })
  })
  return finalData
})
exports.signUpCount = asyncHandler(async (params) => {
  //  return await signUp.count({})
  try {
    const count = await corporateUser.count({});
    console.log("-----------------Count---------------", count)
    return count;
  } catch (err) {
    console.error(err);
    throw new Error('Failed to get sign-up count');
  }
})
exports.find = asyncHandler(async (params) => {
  return await corporateUser.findOne({
    where: {
      email: params.email
    }
  })
})